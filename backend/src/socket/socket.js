import { Booking } from "../models/Booking.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { setRealtimeServer } from "./realtime.js";
import {
  markTeacherConnected,
  markTeacherDisconnected,
  markTeacherInSession,
  setManualTeacherStatus,
  setTeacherStatus
} from "../services/teacherStatus.service.js";

export const teacherStatusBySocket =
  new Map();

const socketTeacherById = new Map();
const socketUserById = new Map();

export const getTeacherSocketCount = (teacherUserId) => {
  let count = 0;
  for (const userId of socketTeacherById.values()) {
    if (String(userId) === String(teacherUserId)) count += 1;
  }
  return count;
};

const authenticateSocket = async (socket) => {
  const token = socket.handshake.auth?.token;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.userId).select("name email role avatar_url is_active isBlocked");
    if (!user || !user.is_active || user.isBlocked) return null;
    return {
      id: user._id.toString(),
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url
    };
  } catch (_error) {
    return null;
  }
};

const canAccessBooking = async (bookingId, userId) => {
  if (!bookingId || !userId) return null;
  return Booking.findOne({
    _id: bookingId,
    $or: [{ teacher_id: userId }, { student_id: userId }]
  }).select("_id teacher_id student_id session_status expires_at join_deadline_at");
};

export const registerSocketServer = (
  io
) => {
  setRealtimeServer(io);

  io.on("connection", (socket) => {
    console.log(
      "Socket connected:",
      socket.id
    );
    socket.authReady = authenticateSocket(socket).then(async (socketUser) => {
      if (!socketUser) return null;
      socket.user = socketUser;
      socketUserById.set(socket.id, socketUser);
      socket.join(`user:${socketUser.id}`);
      if (socketUser.role === "teacher") {
        socketTeacherById.set(socket.id, String(socketUser.id));
        teacherStatusBySocket.set(String(socketUser.id), "online");
        await markTeacherConnected({ teacherUserId: socketUser.id, socketId: socket.id });
      }
      return socketUser;
    });

    /*
    =====================================
    TEACHER PRESENCE
    =====================================
    */

    socket.on(
      "presence:update",
      async ({ status }) => {
        await socket.authReady;
        if (socket.user?.role !== "teacher") return;
        const teacher = await setManualTeacherStatus(socket.user.id, status);
        if (!teacher) return;
        teacherStatusBySocket.set(String(socket.user.id), teacher.status);
      }
    );

    socket.on("presence:activity", async () => {
      await socket.authReady;
      if (socket.user?.role !== "teacher") return;
      const current = teacherStatusBySocket.get(String(socket.user.id));
      if (current === "away") {
        const teacher = await markTeacherConnected({ teacherUserId: socket.user.id, socketId: socket.id });
        teacherStatusBySocket.set(String(socket.user.id), teacher?.status || "online");
      } else {
        await setTeacherStatus(socket.user.id, current || "online", { socketId: socket.id });
      }
    });

    socket.on("presence:away", async () => {
      await socket.authReady;
      if (socket.user?.role !== "teacher") return;
      const teacher = await setTeacherStatus(socket.user.id, "away", { socketId: socket.id });
      teacherStatusBySocket.set(String(socket.user.id), teacher?.status || "away");
    });

    /*
    =====================================
    USER NOTIFICATION ROOM
    =====================================
    */

    socket.on(
      "join:user",
      async ({ userId }) => {
        await socket.authReady;
        if (!socket.user || String(socket.user.id) !== String(userId)) return;
        socket.join(`user:${socket.user.id}`);
      }
    );

    /*
    =====================================
    BOOKING ROOM
    =====================================
    */

    socket.on(
      "join:booking",
      async ({ bookingId }) => {
        await socket.authReady;
        const booking = await canAccessBooking(bookingId, socket.user?.id);
        if (!booking) {
          socket.emit("session:error", { message: "Unauthorized classroom access." });
          return;
        }
        socket.join(
          `booking:${bookingId}`
        );
        io.to(`booking:${bookingId}`).emit("session:user-joined", {
          bookingId,
          userId: socket.user.id,
          role: socket.user.role,
          joinedAt: new Date().toISOString()
        });
      }
    );

    socket.on("leave:booking", async ({ bookingId }) => {
      await socket.authReady;
      const booking = await canAccessBooking(bookingId, socket.user?.id);
      if (!booking) return;
      if (socket.user?.role === "student" && booking.session_status === "live") {
        await Booking.updateOne(
          { _id: bookingId, student_left_at: null },
          { $set: { student_left_at: new Date() } }
        );
      }
      socket.leave(`booking:${bookingId}`);
      socket.to(`booking:${bookingId}`).emit("session:user-left", {
        bookingId,
        userId: socket.user.id,
        role: socket.user.role,
        leftAt: new Date().toISOString()
      });
    });

    socket.on("session:timer:sync", async ({ bookingId }) => {
      await socket.authReady;
      const booking = await canAccessBooking(bookingId, socket.user?.id);
      if (!booking) return;
      const target = booking.expires_at || booking.join_deadline_at;
      socket.emit("session:timer", {
        bookingId,
        sessionStatus: booking.session_status,
        expiresAt: booking.expires_at,
        joinDeadlineAt: booking.join_deadline_at,
        serverNow: new Date().toISOString(),
        remainingSeconds: target ? Math.max(Math.floor((new Date(target).getTime() - Date.now()) / 1000), 0) : null
      });
    });

    socket.on(
      "chat:message",
      (payload) => {
        if (!payload?.bookingId || !payload?.message) return;
        io.to(
          `booking:${payload.bookingId}`
        ).emit("chat:message", {
          ...payload,
          createdAt:
            new Date().toISOString()
        });
      }
    );

    socket.on(
      "session:extended",
      (payload) => {
        if (!payload?.bookingId || !payload?.expiresAt) return;
        io.to(`booking:${payload.bookingId}`).emit("session:extended", payload);
      }
    );

    /*
    =====================================
    CONVERSATION CHAT
    =====================================
    */

    socket.on(
      "join:conversation",
      ({ conversationId }) => {
        if (!conversationId) return;

        socket.join(
          `conversation:${conversationId}`
        );

        console.log(
          `Joined conversation ${conversationId}`
        );
      }
    );

    socket.on(
      "leave:conversation",
      ({ conversationId }) => {
        if (!conversationId) return;

        socket.leave(
          `conversation:${conversationId}`
        );
      }
    );

    socket.on(
      "conversation:message",
      (payload) => {
        if (!payload?.conversationId) return;

        io.to(
          `conversation:${payload.conversationId}`
        ).emit(
          "conversation:message",
          {
            ...payload,
            createdAt:
              new Date().toISOString()
          }
        );
      }
    );

    /*
    =====================================
    TYPING
    =====================================
    */

    socket.on(
      "conversation:typing",
      (payload) => {
        socket
          .to(
            `conversation:${payload.conversationId}`
          )
          .emit(
            "conversation:typing",
            payload
          );
      }
    );

    /*
    =====================================
    DISCONNECT
    =====================================
    */

    socket.on(
      "disconnect",
      async () => {
        console.log(
          "Socket disconnected:",
          socket.id
        );

        const teacherUserId = socketTeacherById.get(socket.id);
        socketUserById.delete(socket.id);
        socketTeacherById.delete(socket.id);

        if (teacherUserId && getTeacherSocketCount(teacherUserId) === 0) {
          teacherStatusBySocket.set(String(teacherUserId), "offline");
          await markTeacherDisconnected(teacherUserId);
        }
      }
    );
  });
};

export const noteTeacherInSession = async (teacherUserId, bookingId) => {
  teacherStatusBySocket.set(String(teacherUserId), "in_session");
  return markTeacherInSession(teacherUserId, bookingId);
};
