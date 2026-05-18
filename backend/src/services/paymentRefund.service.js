import { Booking } from "../models/Booking.js";
import { Conversation } from "../models/Conversation.js";
import { Payment } from "../models/Payment.js";
import { Session } from "../models/Session.js";
import { razorpay } from "./razorpay.js";
import { createNotification } from "./notification.service.js";
import { emitToBooking, emitToUser } from "../socket/realtime.js";
import { getTeacherSocketCount } from "../socket/socket.js";
import { restoreTeacherAfterSession } from "./teacherStatus.service.js";
import { ApiError } from "../utils/ApiError.js";

const refundMessage =
  "Your payment has been safely refunded because the mentor could not join the session.";

export const refundPaidBooking = async ({ booking, reason = "teacher_no_show", actorId = null } = {}) => {
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (booking.refund_status === "refunded" || booking.payment_status === "refunded") {
    return { booking, alreadyRefunded: true };
  }

  const payment = await Payment.findOne({
    booking_id: booking._id,
    purpose: "booking",
    status: "paid"
  }).sort({ createdAt: -1 });

  const paymentId = payment?.razorpay_payment_id || booking.razorpay_payment_id;
  if (!paymentId) {
    throw new ApiError(409, "No Razorpay payment found for refund.");
  }

  booking.refund_status = "pending";
  await booking.save();

  try {
    const refundAmount = Number(payment?.amount || booking.amount || 0);
    const amountInPaise = Math.round(refundAmount * 100);

    // Razorpay refunds must be created against the captured payment id.
    // In test mode, this creates a real test refund and returns refund.id.
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      notes: {
        bookingId: booking._id.toString(),
        reason,
        actorId: actorId || "system"
      }
    });

    booking.status = "refunded";
    booking.session_status = "refunded";
    booking.payment_status = "refunded";
    booking.is_paid = false;
    booking.refund_status = "refunded";
    booking.refundStatus = "refunded";
    booking.refund_amount = refundAmount;
    booking.razorpay_refund_id = refund.id;
    booking.refundId = refund.id;
    booking.refunded_at = new Date();
    booking.sessionEndedAt = booking.refunded_at;
    booking.expires_at = new Date();
    await booking.save();

    payment.status = "refunded";
    payment.razorpay_refund_id = refund.id;
    payment.refund_amount = refundAmount;
    payment.refund_status = refund.status || "processed";
    payment.refund_created_at = refund.created_at ? new Date(refund.created_at * 1000) : new Date();
    payment.refunded_at = booking.refunded_at;
    await payment.save();

    await Promise.all([
      Session.findOneAndUpdate(
        { booking_id: booking._id },
        {
          status: "refunded",
          ended_at: new Date(),
          expires_at: booking.expires_at
        },
        { upsert: false }
      ),
      restoreTeacherAfterSession(booking.teacher_id, getTeacherSocketCount(booking.teacher_id) > 0),
      Conversation.updateMany(
        { studentId: booking.student_id, teacherId: booking.teacher_id, activeBookingId: booking._id },
        { $set: { isPaid: false, activeBookingId: null } }
      ),
      createNotification({
        userId: booking.student_id.toString(),
        type: "payment",
        title: "Payment safely refunded",
        message: refundMessage,
        actionUrl: "/student"
      }),
      createNotification({
        userId: booking.teacher_id.toString(),
        type: "session",
        title: "Session cancelled",
        message: "The paid session was cancelled because you did not join within the allowed time.",
        actionUrl: "/teacher/history"
      })
    ]);

    const payload = {
      bookingId: booking._id.toString(),
      studentId: booking.student_id.toString(),
      teacherId: booking.teacher_id.toString(),
      amount: refundAmount,
      razorpayPaymentId: paymentId,
      razorpayRefundId: refund.id,
      paymentStatus: booking.payment_status,
      sessionStatus: booking.session_status,
      refundStatus: booking.refund_status,
      refundCreatedAt: payment.refund_created_at,
      reason,
      message: "Teacher could not join. Amount refunded automatically."
    };

    emitToBooking(booking._id.toString(), "payment:refund", payload);
    emitToBooking(booking._id.toString(), "session:refund", payload);
    emitToUser(booking.student_id.toString(), "payment:refund", payload);
    emitToUser(booking.teacher_id.toString(), "payment:refund", payload);
    emitToUser(booking.student_id.toString(), "session:refund", payload);
    emitToUser(booking.student_id.toString(), "teacher:no_show", payload);
    emitToUser(booking.teacher_id.toString(), "teacher:no_show", payload);

    return { booking, payment, refund, alreadyRefunded: false };
  } catch (error) {
    booking.refund_status = "failed";
    await booking.save();
    if (payment) {
      payment.status = "refund_failed";
      await payment.save();
    }
    throw error;
  }
};

export const refundNoShowBookingById = async ({ bookingId, actorId = null } = {}) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return refundPaidBooking({ booking, reason: "teacher_no_show", actorId });
};

export const processTeacherNoShows = async () => {
  const now = new Date();
  const bookings = await Booking.find({
    status: "paid",
    payment_status: "paid",
    session_status: "scheduled",
    join_deadline_at: { $lte: now },
    teacher_joined_at: null,
    refund_status: { $ne: "refunded" }
  }).limit(25);

  const results = [];
  for (const booking of bookings) {
    try {
      results.push(await refundPaidBooking({ booking, reason: "teacher_no_show" }));
    } catch (error) {
      results.push({ booking, error });
    }
  }

  return results;
};
