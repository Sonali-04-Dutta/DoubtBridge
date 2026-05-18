import { Booking } from "../models/Booking.js";
import { Conversation } from "../models/Conversation.js";
import { Session } from "../models/Session.js";
import { createNotification } from "./notification.service.js";
import { emitToBooking, emitToUser } from "../socket/realtime.js";
import { getTeacherSocketCount } from "../socket/socket.js";
import { restoreTeacherAfterSession } from "./teacherStatus.service.js";

export const finishBookingSession = async ({ booking, endedBy = null, finalStatus = "completed" } = {}) => {
  if (!booking) return null;
  const endedAt = new Date();

  booking.status = finalStatus === "completed" ? "completed" : booking.status;
  booking.session_status = finalStatus;
  booking.sessionEndedAt = endedAt;
  booking.expires_at = booking.expires_at || endedAt;
  await booking.save();

  await Promise.all([
    Session.findOneAndUpdate(
      { booking_id: booking._id },
      { status: finalStatus, ended_at: endedAt, expires_at: booking.expires_at },
      { upsert: false }
    ),
    Conversation.updateMany(
      { studentId: booking.student_id, teacherId: booking.teacher_id, activeBookingId: booking._id },
      { $set: { isPaid: false, activeBookingId: null } }
    ),
    restoreTeacherAfterSession(booking.teacher_id, getTeacherSocketCount(booking.teacher_id) > 0)
  ]);

  const payload = {
    bookingId: booking._id.toString(),
    studentId: booking.student_id.toString(),
    teacherId: booking.teacher_id.toString(),
    sessionStatus: booking.session_status,
    endedAt,
    endedBy
  };

  emitToBooking(booking._id.toString(), "session:end", payload);
  emitToUser(booking.student_id.toString(), "session:end", payload);
  emitToUser(booking.teacher_id.toString(), "session:end", payload);
  return booking;
};

export const processExpiredLiveSessions = async () => {
  const now = new Date();
  const bookings = await Booking.find({
    status: "paid",
    session_status: "live",
    expires_at: { $lte: now }
  }).limit(50);

  const results = [];
  for (const booking of bookings) {
    results.push(await finishBookingSession({ booking, finalStatus: "completed", endedBy: "timer" }));
    await Promise.all([
      createNotification({
        userId: booking.student_id.toString(),
        type: "session",
        title: "Session ended",
        message: "Your live session time has ended.",
        actionUrl: `/live-class/${booking._id.toString()}`
      }),
      createNotification({
        userId: booking.teacher_id.toString(),
        type: "session",
        title: "Session ended",
        message: "The live session time has ended.",
        actionUrl: `/live-class/${booking._id.toString()}`
      })
    ]);
  }
  return results;
};

export const emitLiveSessionTimers = async () => {
  const bookings = await Booking.find({
    session_status: { $in: ["scheduled", "live"] },
    status: "paid"
  })
    .select("_id session_status expires_at join_deadline_at")
    .limit(100);

  const serverNow = new Date();
  for (const booking of bookings) {
    const target = booking.session_status === "scheduled" ? booking.join_deadline_at : booking.expires_at;
    emitToBooking(booking._id.toString(), "session:timer", {
      bookingId: booking._id.toString(),
      sessionStatus: booking.session_status,
      expiresAt: booking.expires_at,
      joinDeadlineAt: booking.join_deadline_at,
      serverNow,
      remainingSeconds: target ? Math.max(Math.floor((new Date(target).getTime() - serverNow.getTime()) / 1000), 0) : null
    });
  }
};
