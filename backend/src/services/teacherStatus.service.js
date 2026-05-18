import { Teacher } from "../models/Teacher.js";
import { Booking } from "../models/Booking.js";
import { emitToAll } from "../socket/realtime.js";
import { buildTeacherBusyBookingFilter } from "../utils/teacherAvailability.js";

export const TEACHER_STATUSES = [
  "online",
  "offline",
  "busy",
  "in_session",
  "away",
  "not_accepting_sessions"
];

export const MANUAL_TEACHER_STATUSES = ["online", "busy", "away", "not_accepting_sessions"];

const eventByStatus = {
  online: "teacher:online",
  offline: "teacher:offline",
  busy: "teacher:busy",
  in_session: "teacher:in-session",
  away: "teacher:away",
  not_accepting_sessions: "teacher:busy"
};

const publicStatusPayload = (teacher) => ({
  teacherId: teacher._id.toString(),
  userId: teacher.user_id.toString(),
  status: teacher.status || teacher.availability || "offline",
  availability: teacher.availability || teacher.status || "offline",
  manualStatus: teacher.manualStatus || null,
  lastSeen: teacher.lastSeen,
  isInSession: Boolean(teacher.isInSession),
  currentSessionId: teacher.currentSessionId?.toString?.() || null
});

export const emitTeacherStatus = (teacher) => {
  if (!teacher) return;
  const payload = publicStatusPayload(teacher);
  emitToAll("teacher:status-updated", payload);
  emitToAll(eventByStatus[payload.status] || "teacher:status-updated", payload);
  emitToAll("teacher:presence", { userId: payload.userId, status: payload.status });
};

export const setTeacherStatus = async (teacherUserId, status, extra = {}) => {
  if (!TEACHER_STATUSES.includes(status)) return null;
  const currentTeacher = await Teacher.findOne({ user_id: teacherUserId }).select("isInSession currentSessionId");
  const activeBooking = await Booking.findOne(buildTeacherBusyBookingFilter(teacherUserId)).select("_id session_status");
  const guardedStatus = currentTeacher?.isInSession || activeBooking?.session_status === "live"
    ? "in_session"
    : activeBooking && status === "online"
      ? "busy"
      : status;

  const teacher = await Teacher.findOneAndUpdate(
    { user_id: teacherUserId },
    {
      status: guardedStatus,
      availability: guardedStatus,
      lastSeen: new Date(),
      ...extra
    },
    { new: true }
  );

  emitTeacherStatus(teacher);
  return teacher;
};

export const setManualTeacherStatus = async (teacherUserId, manualStatus) => {
  if (!MANUAL_TEACHER_STATUSES.includes(manualStatus)) return null;

  const teacher = await Teacher.findOne({ user_id: teacherUserId });
  if (!teacher) return null;

  teacher.manualStatus = manualStatus;
  const activeBooking = await Booking.findOne(buildTeacherBusyBookingFilter(teacherUserId)).select("_id session_status");
  const nextStatus = teacher.isInSession || activeBooking?.session_status === "live"
    ? "in_session"
    : activeBooking
      ? "busy"
      : manualStatus;
  teacher.status = nextStatus;
  teacher.availability = nextStatus;
  teacher.lastSeen = new Date();
  await teacher.save();
  emitTeacherStatus(teacher);
  return teacher;
};

export const markTeacherConnected = async ({ teacherUserId, socketId }) => {
  const teacher = await Teacher.findOne({ user_id: teacherUserId });
  if (!teacher) return null;

  const activeBooking = await Booking.findOne(buildTeacherBusyBookingFilter(teacherUserId)).select("_id session_status");
  const nextStatus = teacher.isInSession || activeBooking?.session_status === "live"
    ? "in_session"
    : activeBooking
      ? "busy"
      : teacher.manualStatus || "online";

  teacher.status = nextStatus;
  teacher.availability = nextStatus;
  teacher.socketId = socketId;
  teacher.lastSeen = new Date();
  await teacher.save();
  emitTeacherStatus(teacher);
  return teacher;
};

export const markTeacherDisconnected = async (teacherUserId) =>
  setTeacherStatus(teacherUserId, "offline", {
    socketId: null,
    isInSession: false,
    currentSessionId: null
  });

export const markTeacherInSession = async (teacherUserId, bookingId) =>
  setTeacherStatus(teacherUserId, "in_session", {
    isInSession: true,
    currentSessionId: bookingId
  });

export const restoreTeacherAfterSession = async (teacherUserId, isConnected = false) => {
  const teacher = await Teacher.findOne({ user_id: teacherUserId });
  if (!teacher) return null;

  const nextStatus = isConnected ? teacher.manualStatus || "online" : "offline";
  teacher.status = nextStatus;
  teacher.availability = nextStatus;
  teacher.isInSession = false;
  teacher.currentSessionId = null;
  teacher.lastSeen = new Date();
  await teacher.save();
  emitTeacherStatus(teacher);
  return teacher;
};
