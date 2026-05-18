import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Payment } from "../models/Payment.js";
import { Teacher } from "../models/Teacher.js";
import { createNotification } from "../services/notification.service.js";
import { refundPaidBooking } from "../services/paymentRefund.service.js";
import { ApiError } from "../utils/ApiError.js";
import { buildTeacherBusyBookingFilter } from "../utils/teacherAvailability.js";
import { finishBookingSession } from "../services/liveSession.service.js";

const buildRoomCode = (bookingId) => `doubtbridge-room-${bookingId}`;
const TEACHER_TRY_LATER_MESSAGE = "This teacher is not available right now. Please try later.";

const getPaidExtensionTotals = async (bookingIds) => {
  if (!bookingIds.length) return new Map();

  const totals = await Payment.aggregate([
    {
      $match: {
        booking_id: { $in: bookingIds },
        purpose: "extension",
        status: "paid"
      }
    },
    {
      $group: {
        _id: "$booking_id",
        minutes: { $sum: "$extension_minutes" },
        amount: { $sum: "$amount" }
      }
    }
  ]);

  return new Map(
    totals.map((item) => [
      item._id.toString(),
      {
        minutes: Number(item.minutes || 0),
        amount: Number(item.amount || 0)
      }
    ])
  );
};

const getBookingDisplayTotals = (booking, paidExtensionTotals) => {
  const paidExtensionMinutes = Number(paidExtensionTotals?.minutes || 0);
  const paidExtensionAmount = Number(paidExtensionTotals?.amount || 0);
  const storedExtensionMinutes = Number(booking.extended_minutes || 0);
  const storedExtensionAmount = Number(booking.extension_amount || 0);
  const extensionMinutes = Math.max(storedExtensionMinutes, paidExtensionMinutes);
  const extensionAmount = Math.max(storedExtensionAmount, paidExtensionAmount);

  return {
    duration: Number(booking.duration || 0) + Math.max(0, extensionMinutes - storedExtensionMinutes),
    amount: Number(booking.amount || 0) + Math.max(0, extensionAmount - storedExtensionAmount),
    extended_minutes: extensionMinutes,
    extension_amount: extensionAmount
  };
};

const hasActiveTeacherBooking = async (teacherUserId, excludeBookingId = null) => {
  const activeBooking = await Booking.findOne(buildTeacherBusyBookingFilter(teacherUserId, excludeBookingId)).select("_id");
  return Boolean(activeBooking);
};

const expireJoinWindowIfNeeded = async (booking) => {
  if (booking.session_status !== "scheduled" || !booking.join_deadline_at) return booking;
  if (new Date(booking.join_deadline_at).getTime() > Date.now()) return booking;
  if (booking.teacher_joined_at) return booking;

  const result = await refundPaidBooking({ booking, reason: "teacher_no_show" });

  return result.booking;
};

export const createBooking = async (req, res, next) => {
  try {
    const { teacherId, duration } = req.body;

    if (![15, 30, 45, 60].includes(duration)) {
      throw new ApiError(400, "Duration must be 15, 30, 45, or 60");
    }

    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      throw new ApiError(404, "Teacher not found");
    }

    const teacher = await Teacher.findOne({ _id: teacherId, availability: "online" });
    if (!teacher) {
      const existingTeacher = await Teacher.findById(teacherId).select("_id availability");
      if (!existingTeacher) {
        throw new ApiError(404, "Teacher not found");
      }
      throw new ApiError(409, TEACHER_TRY_LATER_MESSAGE);
    }

    const alreadyBooked = await hasActiveTeacherBooking(teacher.user_id);
    if (alreadyBooked) {
      throw new ApiError(409, TEACHER_TRY_LATER_MESSAGE);
    }

    const amount = duration === 15 ? teacher.price_15 : duration === 30 ? teacher.price_30 : duration === 45 ? teacher.price_45 : teacher.price_60;

    const booking = await Booking.create({
      student_id: req.user.id,
      teacher_id: teacher.user_id,
      duration,
      amount,
      status: "pending",
      is_paid: false,
      session_status: "pending",
      expires_at: null,
      session_room: ""
    });

    booking.session_room = buildRoomCode(booking._id.toString());
    booking.liveRoomId = booking.session_room;
    booking.sessionDuration = duration;
    await booking.save();

    await createNotification({
      userId: teacher.user_id.toString(),
      type: "booking",
      title: `New booking request from ${req.user.name}`,
      message: `${duration} min session request. Review and respond.`,
      actionUrl: "/teacher/requests"
    });

    return res.status(201).json({
      success: true,
      message: "Booking request created",
      booking: {
        id: booking._id.toString(),
        student_id: booking.student_id.toString(),
        teacher_id: booking.teacher_id.toString(),
        duration: booking.duration,
        amount: booking.amount,
        extended_minutes: booking.extended_minutes || 0,
        extension_amount: booking.extension_amount || 0,
        payment_status: booking.payment_status,
        razorpay_order_id: booking.razorpay_order_id,
        razorpay_payment_id: booking.razorpay_payment_id,
        razorpay_refund_id: booking.razorpay_refund_id,
        status: booking.status,
        is_paid: booking.is_paid,
        session_status: booking.session_status,
        expires_at: booking.expires_at,
        join_deadline_at: booking.join_deadline_at,
        student_joined_at: booking.student_joined_at,
        teacher_joined_at: booking.teacher_joined_at,
        actual_started_at: booking.actual_started_at,
        session_room: booking.session_room,
        created_at: booking.createdAt,
        updated_at: booking.updatedAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const listMyBookings = async (req, res, next) => {
  try {
    const isTeacher = req.user.role === "teacher";
    const filter = isTeacher ? { teacher_id: req.user.id } : { student_id: req.user.id };

    const bookings = await Booking.find(filter)
      .populate("student_id", "name")
      .populate("teacher_id", "name")
      .sort({ createdAt: -1 });

    for (const booking of bookings) {
      await expireJoinWindowIfNeeded(booking);
    }

    const teacherUserIds = [
      ...new Set(
        bookings
          .map((item) => (item.teacher_id?._id ? item.teacher_id._id.toString() : String(item.teacher_id)))
          .filter(Boolean)
      )
    ];
    const teacherProfiles = teacherUserIds.length
      ? await Teacher.find({ user_id: { $in: teacherUserIds } }).select("_id user_id price_15 price_30 price_45 price_60")
      : [];
    const teacherProfileByUserId = new Map(
      teacherProfiles.map((item) => [item.user_id.toString(), item])
    );
    const extensionTotalByBookingId = await getPaidExtensionTotals(bookings.map((booking) => booking._id));

    return res.json({
      success: true,
      bookings: bookings.map((booking) => {
        const teacherUserId = booking.teacher_id?._id ? booking.teacher_id._id.toString() : String(booking.teacher_id);
        const teacherProfile = teacherProfileByUserId.get(teacherUserId);
        const displayTotals = getBookingDisplayTotals(booking, extensionTotalByBookingId.get(booking._id.toString()));

        return {
          id: booking._id.toString(),
          student_id: booking.student_id?._id ? booking.student_id._id.toString() : String(booking.student_id),
          teacher_id: teacherUserId,
          teacher_profile_id: teacherProfile?._id?.toString() || null,
          extension_prices: {
            15: teacherProfile?.price_15 || 0,
            30: teacherProfile?.price_30 || 0,
            45: teacherProfile?.price_45 || 0
          },
          duration: displayTotals.duration,
          amount: displayTotals.amount,
          extended_minutes: displayTotals.extended_minutes,
          extension_amount: displayTotals.extension_amount,
          payment_status: booking.payment_status,
          razorpay_order_id: booking.razorpay_order_id,
          razorpay_payment_id: booking.razorpay_payment_id,
          razorpay_refund_id: booking.razorpay_refund_id,
          status: booking.status,
          is_paid: booking.is_paid,
          session_status: booking.session_status,
          expires_at: booking.expires_at,
          join_deadline_at: booking.join_deadline_at,
          student_joined_at: booking.student_joined_at,
          teacher_joined_at: booking.teacher_joined_at,
          actual_started_at: booking.actual_started_at,
          refund_status: booking.refund_status,
          refund_amount: booking.refund_amount,
          refunded_at: booking.refunded_at,
          session_room: booking.session_room,
          created_at: booking.createdAt,
          updated_at: booking.updatedAt,
          student_name: booking.student_id?.name || "Student",
          teacher_name: booking.teacher_id?.name || "Teacher"
        };
      })
    });
  } catch (error) {
    return next(error);
  }
};

export const getBookingById = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new ApiError(404, "Booking not found");
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ teacher_id: req.user.id }, { student_id: req.user.id }]
    })
      .populate("student_id", "name avatar_url")
      .populate("teacher_id", "name avatar_url");

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    await expireJoinWindowIfNeeded(booking);

    const teacherProfile = await Teacher.findOne({ user_id: booking.teacher_id?._id || booking.teacher_id }).select("_id price_15 price_30 price_45 price_60");
    const extensionTotalByBookingId = await getPaidExtensionTotals([booking._id]);
    const displayTotals = getBookingDisplayTotals(booking, extensionTotalByBookingId.get(booking._id.toString()));

    return res.json({
      success: true,
      booking: {
        id: booking._id.toString(),
        student_id: booking.student_id?._id ? booking.student_id._id.toString() : String(booking.student_id),
        teacher_id: booking.teacher_id?._id ? booking.teacher_id._id.toString() : String(booking.teacher_id),
        teacher_profile_id: teacherProfile?._id ? teacherProfile._id.toString() : null,
        student_name: booking.student_id?.name || "Student",
        teacher_name: booking.teacher_id?.name || "Teacher",
        student_avatar_url: booking.student_id?.avatar_url || null,
        teacher_avatar_url: booking.teacher_id?.avatar_url || null,
        duration: displayTotals.duration,
        amount: displayTotals.amount,
        extended_minutes: displayTotals.extended_minutes,
        extension_amount: displayTotals.extension_amount,
        payment_status: booking.payment_status,
        razorpay_order_id: booking.razorpay_order_id,
        razorpay_payment_id: booking.razorpay_payment_id,
        razorpay_refund_id: booking.razorpay_refund_id,
        extension_prices: {
          15: teacherProfile?.price_15 || 0,
          30: teacherProfile?.price_30 || 0,
          45: teacherProfile?.price_45 || 0
        },
        status: booking.status,
        is_paid: booking.is_paid,
        session_status: booking.session_status,
        expires_at: booking.expires_at,
        join_deadline_at: booking.join_deadline_at,
        student_joined_at: booking.student_joined_at,
        teacher_joined_at: booking.teacher_joined_at,
        actual_started_at: booking.actual_started_at,
        refund_status: booking.refund_status,
        refund_amount: booking.refund_amount,
        refunded_at: booking.refunded_at,
        session_room: booking.session_room,
        created_at: booking.createdAt,
        updated_at: booking.updatedAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const respondBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { action } = req.body;

    if (!["accepted", "rejected"].includes(action)) {
      throw new ApiError(400, "Action must be accepted or rejected");
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new ApiError(404, "Booking not found or already handled");
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, teacher_id: req.user.id, status: "pending" },
      { status: action, session_status: action === "accepted" ? "scheduled" : "cancelled" },
      { new: true }
    );

    if (!booking) {
      throw new ApiError(404, "Booking not found or already handled");
    }

    await createNotification({
      userId: booking.student_id.toString(),
      type: "booking",
      title: action === "accepted" ? "Booking accepted" : "Booking rejected",
      message:
        action === "accepted"
          ? "Your mentor accepted the booking. You can proceed with payment."
          : "Your mentor rejected this booking request.",
      actionUrl: action === "accepted" ? `/student/payment/${booking._id.toString()}` : "/student"
    });

    return res.json({ success: true, booking });
  } catch (error) {
    return next(error);
  }
};

export const markBookingCompleted = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new ApiError(404, "Booking not found");
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ teacher_id: req.user.id }, { student_id: req.user.id }]
    });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    await finishBookingSession({ booking, finalStatus: "completed", endedBy: req.user.id });

    return res.json({ success: true, booking });
  } catch (error) {
    return next(error);
  }
};
