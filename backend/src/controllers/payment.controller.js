import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Conversation } from "../models/Conversation.js";
import { Payment } from "../models/Payment.js";
import { Session } from "../models/Session.js";
import { Teacher } from "../models/Teacher.js";
import { createNotification } from "../services/notification.service.js";
import { emitToBooking, emitToUser } from "../socket/realtime.js";
import { ApiError } from "../utils/ApiError.js";
import { assertRazorpayTestMode, getRazorpayKeyId, razorpay, verifyRazorpaySignature } from "../services/razorpay.js";
import { buildTeacherBusyBookingFilter } from "../utils/teacherAvailability.js";
import { refundNoShowBookingById } from "../services/paymentRefund.service.js";

const TEACHER_TRY_LATER_MESSAGE = "This teacher is not available right now. Please try later.";
const TEACHER_JOIN_WINDOW_MINUTES = 10;

const getExtensionAmount = async (booking, minutes) => {
  const teacher = await Teacher.findOne({ user_id: booking.teacher_id }).select("price_15 price_30 price_45");
  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found");
  }

  return minutes === 45 ? teacher.price_45 : minutes === 30 ? teacher.price_30 : teacher.price_15;
};

const ensureTeacherCanTakePayment = async (booking, { requireOnline = true } = {}) => {
  const teacherProfile = await Teacher.findOne({ user_id: booking.teacher_id }).select("availability status");
  if (!teacherProfile || (requireOnline && teacherProfile.availability !== "online")) {
    throw new ApiError(409, TEACHER_TRY_LATER_MESSAGE);
  }

  const competingBooking = await Booking.findOne(buildTeacherBusyBookingFilter(booking.teacher_id, booking._id)).select("_id");

  if (competingBooking) {
    throw new ApiError(409, TEACHER_TRY_LATER_MESSAGE);
  }
};

export const createPaymentOrder = async (req, res, next) => {
  try {
    assertRazorpayTestMode();

    const { bookingId, amount, purpose = "booking", extensionMinutes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new ApiError(404, "Booking not found");
    }

    const booking = await Booking.findOne({ _id: bookingId, student_id: req.user.id });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    const isExtension = purpose === "extension";
    const minutes = Number(extensionMinutes || 15);

    if (isExtension && ![15, 30, 45].includes(minutes)) {
      throw new ApiError(400, "Extension must be 15, 30, or 45 minutes.");
    }

    if (!isExtension && booking.status !== "accepted" && booking.status !== "pending") {
      throw new ApiError(409, "Booking is not payable in current state");
    }

    if (!isExtension) {
      await ensureTeacherCanTakePayment(booking);
    } else if (booking.status !== "paid" || booking.session_status !== "live") {
      throw new ApiError(409, "Extension is available only during a live session.");
    }

    const payableAmount = Number(isExtension ? await getExtensionAmount(booking, minutes) : booking.amount);
    const requestedAmount = Number(amount || payableAmount);

    if (!Number.isFinite(requestedAmount) || requestedAmount !== payableAmount) {
      throw new ApiError(400, "Payment amount does not match booking amount.");
    }

    // Payment flow step 1: create a Razorpay TEST MODE order and keep the order id locally.
    const order = await razorpay.orders.create({
      amount: payableAmount * 100,
      currency: "INR",
      receipt: `${isExtension ? "extend" : "booking"}_${booking._id.toString()}`,
      notes: {
        bookingId: booking._id.toString(),
        studentId: req.user.id,
        purpose,
        extensionMinutes: minutes,
        mode: "test",
        allowedMethods: "upi,netbanking,card,wallet"
      }
    });

    await Payment.create({
      booking_id: booking._id,
      razorpay_order_id: order.id,
      amount: payableAmount,
      purpose: isExtension ? "extension" : "booking",
      extension_minutes: isExtension ? minutes : 0,
      status: "created"
    });

    if (!isExtension) {
      booking.razorpay_order_id = order.id;
      booking.payment_status = "created";
      await booking.save();
    }

    return res.json({
      success: true,
      mode: "test",
      keyId: getRazorpayKeyId(),
      payableAmount,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (error) {
    if (error.message?.startsWith("Razorpay test keys")) {
      return next(new ApiError(500, error.message));
    }
    return next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    assertRazorpayTestMode();

    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature, purpose = "booking", extensionMinutes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new ApiError(404, "Booking not found");
    }

    const booking = await Booking.findOne({ _id: bookingId, student_id: req.user.id });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    const isExtension = purpose === "extension";
    const minutes = Number(extensionMinutes || 15);

    if (isExtension && ![15, 30, 45].includes(minutes)) {
      throw new ApiError(400, "Extension must be 15, 30, or 45 minutes.");
    }

    if (!isExtension) {
      await ensureTeacherCanTakePayment(booking, { requireOnline: false });
    } else if (booking.status !== "paid" || booking.session_status !== "live") {
      throw new ApiError(409, "Extension is available only during a live session.");
    }

    // Payment flow step 2: verify Razorpay's HMAC signature before unlocking paid features.
    const verified = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!verified) {
      throw new ApiError(400, "Payment signature verification failed");
    }

    const payment = await Payment.findOne({
      booking_id: booking._id,
      razorpay_order_id,
      purpose: isExtension ? "extension" : "booking"
    }).sort({ createdAt: -1 });
    if (!payment) {
      throw new ApiError(404, "Payment order not found. Please create a Razorpay order first.");
    }

    const alreadyAppliedPayment = payment?.status === "paid";
    payment.razorpay_payment_id = razorpay_payment_id;
    payment.razorpay_signature = razorpay_signature;

    const amountInPaise = Math.round(Number(payment.amount || booking.amount || 0) * 100);
    const gatewayPayment = await razorpay.payments.fetch(razorpay_payment_id);
    if (gatewayPayment?.status === "authorized") {
      // Capture before marking paid so future automatic refunds can be issued reliably.
      await razorpay.payments.capture(razorpay_payment_id, amountInPaise, "INR");
    }

    payment.status = "paid";
    await payment.save();

    if (isExtension) {
      const extensionAmount = payment?.amount || (await getExtensionAmount(booking, minutes));
      if (alreadyAppliedPayment) {
        return res.json({
          success: true,
          booking,
          extension: {
            minutes,
            amount: extensionAmount,
            expires_at: booking.expires_at
          }
        });
      }

      const baseTime = booking.expires_at && new Date(booking.expires_at).getTime() > Date.now()
        ? new Date(booking.expires_at).getTime()
        : Date.now();
      booking.expires_at = new Date(baseTime + minutes * 60 * 1000);
      booking.duration = Number(booking.duration || 0) + minutes;
      booking.amount = Number(booking.amount || 0) + Number(extensionAmount || 0);
      booking.extended_minutes = Number(booking.extended_minutes || 0) + minutes;
      booking.extension_amount = Number(booking.extension_amount || 0) + Number(extensionAmount || 0);
      await booking.save();
      await Session.findOneAndUpdate(
        { booking_id: booking._id },
        { $set: { expires_at: booking.expires_at, status: "live", duration: booking.duration }, $inc: { extended_minutes: minutes } },
        { upsert: false }
      );

      await Promise.all([
        createNotification({
          userId: booking.student_id.toString(),
          type: "session",
          title: "Session extended",
          message: `Your session was extended by ${minutes} minutes.`,
          actionUrl: `/live-class/${booking._id.toString()}`
        }),
        createNotification({
          userId: booking.teacher_id.toString(),
          type: "session",
          title: "Session extended",
          message: `The current session was extended by ${minutes} minutes.`,
          actionUrl: `/live-class/${booking._id.toString()}`
        })
      ]);

      emitToBooking(booking._id.toString(), "session:extended", {
        bookingId: booking._id.toString(),
        minutes,
        expiresAt: booking.expires_at,
        sessionStatus: booking.session_status
      });

      return res.json({
        success: true,
        booking,
        extension: {
          minutes,
          amount: extensionAmount,
          expires_at: booking.expires_at
        }
      });
    }

    booking.status = "paid";
    booking.is_paid = true;
    booking.payment_status = "paid";
    booking.razorpay_order_id = razorpay_order_id;
    booking.razorpay_payment_id = razorpay_payment_id;
    booking.paymentId = razorpay_payment_id;
    booking.session_status = "scheduled";
    booking.scheduled_at = new Date();
    booking.join_deadline_at = new Date(Date.now() + TEACHER_JOIN_WINDOW_MINUTES * 60 * 1000);
    booking.student_joined_at = null;
    booking.teacher_joined_at = null;
    booking.actual_started_at = null;
    booking.sessionStartedAt = null;
    booking.sessionEndedAt = null;
    booking.sessionDuration = booking.duration;
    booking.liveRoomId = booking.session_room;
    booking.expires_at = null;
    await booking.save();
    await Session.findOneAndUpdate(
      { booking_id: booking._id },
      {
        $set: {
          booking_id: booking._id,
          student_id: booking.student_id,
          teacher_id: booking.teacher_id,
          status: "scheduled",
          room: booking.session_room,
          duration: booking.duration,
          join_deadline_at: booking.join_deadline_at,
          student_joined_at: null,
          teacher_joined_at: null,
          started_at: null,
          expires_at: null
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    await Teacher.findOneAndUpdate({ user_id: booking.teacher_id }, { availability: "busy" });

    await Conversation.updateMany(
      {
        studentId: booking.student_id,
        teacherId: booking.teacher_id
      },
      {
        $set: { isPaid: true, activeBookingId: booking._id }
      }
    );

    await Promise.all([
      createNotification({
        userId: booking.student_id.toString(),
        type: "payment",
        title: "Booking confirmed",
        message: "Payment received. Unlimited chat is unlocked and your session is ready.",
        actionUrl: `/live-class/${booking._id.toString()}`
      }),
      createNotification({
        userId: booking.teacher_id.toString(),
        type: "booking",
        title: "New paid booking received",
        message: "New paid booking received. Your live session link is ready.",
        actionUrl: `/live-class/${booking._id.toString()}`
      })
    ]);
    emitToUser(booking.teacher_id.toString(), "booking:created", {
      bookingId: booking._id.toString(),
      studentId: booking.student_id.toString(),
      teacherId: booking.teacher_id.toString(),
      amount: booking.amount,
      duration: booking.duration,
      paymentStatus: booking.payment_status,
      sessionStatus: booking.session_status,
      actionUrl: `/live-class/${booking._id.toString()}`
    });
    emitToUser(booking.student_id.toString(), "payment:success", {
      bookingId: booking._id.toString(),
      studentId: booking.student_id.toString(),
      teacherId: booking.teacher_id.toString(),
      amount: booking.amount,
      duration: booking.duration,
      paymentStatus: booking.payment_status,
      sessionStatus: booking.session_status,
      actionUrl: `/live-class/${booking._id.toString()}`
    });
    emitToUser(booking.teacher_id.toString(), "payment:success", {
      bookingId: booking._id.toString(),
      studentId: booking.student_id.toString(),
      teacherId: booking.teacher_id.toString(),
      amount: booking.amount,
      duration: booking.duration,
      paymentStatus: booking.payment_status,
      sessionStatus: booking.session_status,
      actionUrl: `/live-class/${booking._id.toString()}`
    });
    emitToBooking(booking._id.toString(), "payment:success", {
      bookingId: booking._id.toString(),
      paymentStatus: booking.payment_status,
      sessionStatus: booking.session_status,
      joinDeadlineAt: booking.join_deadline_at
    });
    emitToBooking(booking._id.toString(), "session:ready", {
      bookingId: booking._id.toString(),
      joinDeadlineAt: booking.join_deadline_at,
      sessionStatus: booking.session_status
    });

    return res.json({ success: true, booking });
  } catch (error) {
    if (error.message?.startsWith("Razorpay test keys")) {
      return next(new ApiError(500, error.message));
    }
    return next(error);
  }
};

export const refundPayment = async (req, res, next) => {
  try {
    assertRazorpayTestMode();

    const { bookingId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new ApiError(404, "Booking not found");
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ student_id: req.user.id }, { teacher_id: req.user.id }]
    });

    if (!booking && req.user.role !== "admin") {
      throw new ApiError(404, "Booking not found");
    }

    const result = await refundNoShowBookingById({
      bookingId,
      actorId: req.user.id
    });

    return res.json({
      success: true,
      alreadyRefunded: result.alreadyRefunded,
      refundId: result.refund?.id || result.booking.razorpay_refund_id,
      booking: result.booking
    });
  } catch (error) {
    if (error.message?.startsWith("Razorpay test keys")) {
      return next(new ApiError(500, error.message));
    }
    return next(error);
  }
};
