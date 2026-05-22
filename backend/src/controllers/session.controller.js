import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Conversation } from "../models/Conversation.js";
import { Session } from "../models/Session.js";
import { Teacher } from "../models/Teacher.js";
import { createNotification } from "../services/notification.service.js";
import { refundPaidBooking } from "../services/paymentRefund.service.js";
import { emitToBooking } from "../socket/realtime.js";
import { getTeacherSocketCount, noteTeacherInSession } from "../socket/socket.js";
import { env } from "../config/env.js";
import { generateZegoToken04 } from "../utils/zegoToken.js";

const TEACHER_JOIN_WINDOW_MINUTES = 10;
const ZEGO_TOKEN_TTL_SECONDS = 2 * 60 * 60;
const getPostSessionAvailability = (teacherUserId) =>
  getTeacherSocketCount(teacherUserId) > 0 ? "online" : "offline";

const buildZegoSessionPayload = ({ booking, req, appId }) => {
  const zegoUserId = req.user.id;
  const zegoUserName = `${req.user.name || req.user.role} (${req.user.role})`;
  const zegoToken = generateZegoToken04({
    appId,
    userId: zegoUserId,
    serverSecret: env.zegoServerSecret,
    effectiveTimeInSeconds: ZEGO_TOKEN_TTL_SECONDS,
    payload: JSON.stringify({
      room_id: booking.session_room,
      privilege: {
        1: 1,
        2: 1
      },
      stream_id_list: null
    })
  });

  return {
    provider: "zegocloud",
    zego: {
      appId,
      token: zegoToken,
      userId: zegoUserId,
      userName: zegoUserName,
      tokenExpiresIn: ZEGO_TOKEN_TTL_SECONDS
    },
    token: zegoToken
  };
};

const expireSessionIfNeeded = async (booking) => {
  if (!booking.expires_at) return booking;
  if (!["live", "scheduled"].includes(booking.session_status)) return booking;
  const now = Date.now();
  const expiryMs = new Date(booking.expires_at).getTime();
  if (now < expiryMs) return booking;

  if (booking.session_status !== "expired") {
    booking.session_status = "expired";
    await booking.save();
    await Session.findOneAndUpdate(
      { booking_id: booking._id },
      { status: "expired", expires_at: booking.expires_at, ended_at: new Date() },
      { upsert: false }
    );

    await Conversation.updateMany(
      {
        studentId: booking.student_id,
        teacherId: booking.teacher_id,
        activeBookingId: booking._id
      },
      {
        $set: { isPaid: false, activeBookingId: null }
      }
    );

    await Promise.all([
      Teacher.findOneAndUpdate(
        { user_id: booking.teacher_id },
        { availability: getPostSessionAvailability(booking.teacher_id) }
      ),
      createNotification({
        userId: booking.student_id.toString(),
        type: "session",
        title: "Session expired",
        message: "Session expired. Extend your session to continue learning.",
        actionUrl: `/live-class/${booking._id.toString()}`
      }),
      createNotification({
        userId: booking.teacher_id.toString(),
        type: "session",
        title: "Session expired",
        message: "This live session has expired.",
        actionUrl: `/live-class/${booking._id.toString()}`
      })
    ]);
  }

  return booking;
};

const expireJoinWindowIfNeeded = async (booking) => {
  if (booking.session_status !== "scheduled" || !booking.join_deadline_at) return booking;
  if (new Date(booking.join_deadline_at).getTime() > Date.now()) return booking;
  if (booking.teacher_joined_at) return booking;

  const result = await refundPaidBooking({ booking, reason: "teacher_no_show" });
  return result.booking;
};

export const createSessionToken = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const shouldJoin = req.body?.join !== false;
    const appId = Number(env.zegoAppId || req.body?.appId);

    if (!env.zegoServerSecret) {
      return res.status(503).json({
        success: false,
        message: "ZEGOCLOUD ServerSecret is not configured on the server."
      });
    }

    if (!Number.isFinite(appId) || appId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ZEGOCLOUD AppID is required."
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    let booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ teacher_id: req.user.id }, { student_id: req.user.id }]
    }).select("session_room duration status teacher_id student_id session_status expires_at is_paid join_deadline_at student_joined_at teacher_joined_at student_left_at actual_started_at");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (!["paid", "completed"].includes(booking.status)) {
      return res.status(402).json({
        success: false,
        message: "Please complete payment to access the live session."
      });
    }

    booking = await expireJoinWindowIfNeeded(booking);
    booking = await expireSessionIfNeeded(booking);

    if (booking.session_status === "expired") {
      return res.status(410).json({
        success: false,
        message: "This session was cancelled because the mentor did not join within the protected 10-minute window."
      });
    }

    const now = new Date();
    const isStudent = booking.student_id.toString() === req.user.id;
    const isTeacher = booking.teacher_id.toString() === req.user.id;
    let didStartSession = false;

    if (booking.status === "paid" && booking.session_status === "scheduled") {
      if (!booking.join_deadline_at) {
        booking.join_deadline_at = new Date(Date.now() + TEACHER_JOIN_WINDOW_MINUTES * 60 * 1000);
      }

      if (shouldJoin && isStudent && !booking.student_joined_at) {
        booking.student_joined_at = now;
        booking.studentJoinedAt = now;
      }
      if (shouldJoin && isTeacher && !booking.teacher_joined_at) {
        booking.teacher_joined_at = now;
        booking.teacherJoinedAt = now;
      }

      const bothJoined = Boolean(booking.student_joined_at && booking.teacher_joined_at);
      if (!bothJoined) {
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
              student_joined_at: booking.student_joined_at,
              teacher_joined_at: booking.teacher_joined_at
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        const zegoPayload = buildZegoSessionPayload({ booking, req, appId });

        return res.json({
          success: true,
          session: {
            bookingId: booking._id.toString(),
            room: booking.session_room,
            duration: booking.duration,
            status: booking.status,
            sessionStatus: booking.session_status,
            joinDeadlineAt: booking.join_deadline_at,
            studentJoinedAt: booking.student_joined_at,
            teacherJoinedAt: booking.teacher_joined_at,
            studentLeftAt: booking.student_left_at,
            expiresAt: null,
            isPaid: booking.is_paid,
            ...zegoPayload
          }
        });
      }

      booking.session_status = "live";
      booking.actual_started_at = booking.actual_started_at || now;
      booking.sessionStartedAt = booking.sessionStartedAt || booking.actual_started_at;
      booking.sessionDuration = booking.sessionDuration || booking.duration;
      booking.liveRoomId = booking.liveRoomId || booking.session_room;
      booking.expires_at = new Date(Date.now() + booking.duration * 60 * 1000);
      didStartSession = true;
    }

    if (booking.status === "paid" && booking.session_status === "live") {
      const shouldNotifyStart = didStartSession;
      if (!booking.actual_started_at) {
        booking.actual_started_at = now;
      }
      if (!booking.expires_at) {
        booking.expires_at = new Date(Date.now() + booking.duration * 60 * 1000);
      }
      await booking.save();
      await Session.findOneAndUpdate(
        { booking_id: booking._id },
        {
          $set: {
            booking_id: booking._id,
            student_id: booking.student_id,
            teacher_id: booking.teacher_id,
            status: "live",
            room: booking.session_room,
            duration: booking.duration,
            join_deadline_at: booking.join_deadline_at,
            student_joined_at: booking.student_joined_at,
            teacher_joined_at: booking.teacher_joined_at,
            expires_at: booking.expires_at
          },
          ...(shouldNotifyStart ? { $setOnInsert: { started_at: booking.actual_started_at || new Date() } } : {})
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await Teacher.findOneAndUpdate({ user_id: booking.teacher_id }, { availability: "busy" });
      await noteTeacherInSession(booking.teacher_id, booking._id);

      await Conversation.updateMany(
        {
          studentId: booking.student_id,
          teacherId: booking.teacher_id
        },
        {
          $set: { isPaid: true, activeBookingId: booking._id }
        }
      );

      if (shouldNotifyStart) {
        await Promise.all([
          createNotification({
            userId: booking.student_id.toString(),
            type: "session",
            title: "Session starting now",
            message: "Your live doubt-solving session has started.",
            actionUrl: `/live-class/${booking._id.toString()}`
          }),
          createNotification({
            userId: booking.teacher_id.toString(),
            type: "session",
            title: "Session starting now",
            message: "A paid student session is live now.",
            actionUrl: `/live-class/${booking._id.toString()}`
          })
        ]);
      }
      if (shouldNotifyStart) {
        emitToBooking(booking._id.toString(), "session:start", {
          bookingId: booking._id.toString(),
          sessionStatus: booking.session_status,
          startedAt: booking.actual_started_at,
          expiresAt: booking.expires_at,
          teacherJoinedAt: booking.teacher_joined_at,
          studentJoinedAt: booking.student_joined_at
        });
      }
    }

    const zegoPayload = buildZegoSessionPayload({ booking, req, appId });

    return res.json({
      success: true,
      session: {
        bookingId: booking._id.toString(),
        room: booking.session_room,
        duration: booking.duration,
        status: booking.status,
        sessionStatus: booking.session_status,
        joinDeadlineAt: booking.join_deadline_at,
        studentJoinedAt: booking.student_joined_at,
        teacherJoinedAt: booking.teacher_joined_at,
        studentLeftAt: booking.student_left_at,
        actualStartedAt: booking.actual_started_at,
        expiresAt: booking.expires_at,
        isPaid: booking.is_paid,
        ...zegoPayload
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const extendSession = async (req, res, next) => {
  try {
    return res.status(402).json({
      success: false,
      message: "Please complete extension payment before adding time."
    });
    const { bookingId } = req.params;
    const minutes = Number(req.body?.minutes || 15);

    if (![15, 30].includes(minutes)) {
      return res.status(400).json({ success: false, message: "Extension must be 15 or 30 minutes." });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      $or: [{ teacher_id: req.user.id }, { student_id: req.user.id }]
    }).select("session_room duration status teacher_id student_id session_status expires_at is_paid");

    if (!booking || !booking.is_paid) {
      return res.status(404).json({ success: false, message: "Paid booking not found" });
    }

    const baseTime = booking.expires_at && new Date(booking.expires_at).getTime() > Date.now()
      ? new Date(booking.expires_at).getTime()
      : Date.now();

    booking.session_status = "live";
    booking.status = "paid";
    booking.expires_at = new Date(baseTime + minutes * 60 * 1000);
    await booking.save();
    await Session.findOneAndUpdate(
      { booking_id: booking._id },
      {
        $set: {
          booking_id: booking._id,
          student_id: booking.student_id,
          teacher_id: booking.teacher_id,
          status: "live",
          room: booking.session_room,
          duration: booking.duration,
          expires_at: booking.expires_at
        },
        $inc: { extended_minutes: minutes }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await Promise.all([
      Teacher.findOneAndUpdate({ user_id: booking.teacher_id }, { availability: "busy" }),
      Conversation.updateMany(
        { studentId: booking.student_id, teacherId: booking.teacher_id },
        { $set: { isPaid: true, activeBookingId: booking._id } }
      ),
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

    return res.json({
      success: true,
      session: {
        bookingId: booking._id.toString(),
        room: booking.session_room,
        duration: booking.duration,
        status: booking.status,
        sessionStatus: booking.session_status,
        expiresAt: booking.expires_at,
        isPaid: booking.is_paid,
        provider: "webrtc",
        token: `demo-token-${booking._id.toString()}-${req.user.id}`
      }
    });
  } catch (error) {
    return next(error);
  }
};
