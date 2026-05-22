import mongoose from "mongoose";

import { Booking } from "../models/Booking.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Notification } from "../models/Notification.js";
import { Teacher } from "../models/Teacher.js";
import { User } from "../models/User.js";

import { createNotification } from "../services/notification.service.js";

import { ApiError } from "../utils/ApiError.js";
import { getFreeMessageWindowEndsAt, refreshFreeMessageWindow } from "../utils/freeMessageWindow.js";

const FREE_MESSAGES_LIMIT = 6;

const LOCK_MESSAGE =
  "Free message limit reached. Book session to continue.";
const TEACHER_TRY_LATER_MESSAGE =
  "This teacher is busy or offline right now. Please try later.";

const getActiveTeacherByProfileId = async (
  teacherProfileId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      teacherProfileId
    )
  ) {
    throw new ApiError(404, "Teacher not found");
  }

  const teacher = await Teacher.findById(
    teacherProfileId
  ).populate({
    path: "user_id",
    match: {
      role: "teacher",
      is_active: true
    },
    select:
      "name avatar_url role is_active"
  });

  if (!teacher || !teacher.user_id) {
    throw new ApiError(404, "Teacher not found");
  }

  return teacher;
};

const buildMeta = (conversation) => {
  refreshFreeMessageWindow(conversation);

  const paidUnlocked = Boolean(
    conversation?.isPaid
  );

  const freeMessagesSent = Number(
    conversation?.studentFreeMessageCount || 0
  );

  const remainingFreeMessages =
    paidUnlocked
      ? 0
      : Math.max(
          FREE_MESSAGES_LIMIT -
            freeMessagesSent,
          0
        );

  return {
    paidUnlocked,

    freeLimit: FREE_MESSAGES_LIMIT,

    freeMessagesSent,

    remainingFreeMessages,

    canSendMessage:
      paidUnlocked ||
      remainingFreeMessages > 0,

    freeWindowEndsAt:
      getFreeMessageWindowEndsAt(conversation),

    lockMessage: LOCK_MESSAGE
  };
};

const toMessagePayload = async (item) => {
  const sender = await User.findById(
    item.senderId
  ).select("name role avatar_url");

  return {
    id: item._id.toString(),

    conversationId:
      item.conversationId.toString(),

    senderId: item.senderId.toString(),

    senderRole:
      sender?.role || item.senderRole,

    senderName:
      sender?.name || "User",

    senderAvatar:
      sender?.avatar_url || null,

    text: item.text,

    message: item.text,

    createdAt: item.createdAt,

    updatedAt: item.updatedAt
  };
};

const findActivePaidBooking = async ({
  studentId,
  teacherId
}) => {
  const now = new Date();

  return Booking.findOne({
    student_id: studentId,

    teacher_id: teacherId,

    is_paid: true,

    session_status: {
      $in: ["live", "scheduled"]
    },

    $or: [
      { expires_at: null },
      { expires_at: { $gt: now } }
    ]
  }).sort({
    expires_at: -1,
    createdAt: -1
  });
};

const syncConversationPaymentState =
  async (conversation) => {
    if (!conversation) return null;

    let shouldSaveConversation =
      false;
    const previousCount =
      conversation.studentFreeMessageCount;
    const previousWindowStartedAt =
      conversation.studentFreeMessageWindowStartedAt
        ? new Date(
            conversation.studentFreeMessageWindowStartedAt
          ).getTime()
        : null;

    refreshFreeMessageWindow(conversation);

    const nextWindowStartedAt =
      conversation.studentFreeMessageWindowStartedAt
        ? new Date(
            conversation.studentFreeMessageWindowStartedAt
          ).getTime()
        : null;

    if (
      previousCount !==
        conversation.studentFreeMessageCount ||
      previousWindowStartedAt !==
        nextWindowStartedAt
    ) {
      shouldSaveConversation = true;
    }

    if (conversation.activeBookingId) {
      const booking =
        await Booking.findById(
          conversation.activeBookingId
        ).select(
          "student_id teacher_id is_paid session_status expires_at status duration"
        );

      if (!booking) {
        conversation.isPaid = false;

        conversation.activeBookingId =
          null;

        shouldSaveConversation = true;
      } else {
        const now = Date.now();

        const expiresAt =
          booking.expires_at
            ? new Date(
                booking.expires_at
              ).getTime()
            : null;

        const reachedExpiry =
          Boolean(
            expiresAt && now >= expiresAt
          );

        if (
          reachedExpiry &&
          booking.session_status !==
            "expired"
        ) {
          booking.session_status =
            "expired";

          await booking.save();

          await Promise.all([
            createNotification({
              userId:
                booking.student_id.toString(),

              type: "session",

              title: "Session expired",

              message:
                "Session expired. Extend your session to continue learning.",

              actionUrl: "/messages"
            }),

            createNotification({
              userId:
                booking.teacher_id.toString(),

              type: "session",

              title: "Session expired",

              message:
                "This live session has expired.",

              actionUrl: "/messages"
            })
          ]);
        }

        const hasAccess =
          booking.is_paid &&
          booking.session_status !==
            "expired" &&
          booking.session_status !==
            "cancelled" &&
          booking.status !==
            "cancelled" &&
          (!expiresAt ||
            now < expiresAt);

        if (hasAccess) {
          if (!conversation.isPaid) {
            conversation.isPaid = true;

            shouldSaveConversation =
              true;
          }
        } else {
          conversation.isPaid = false;

          conversation.activeBookingId =
            null;

          shouldSaveConversation = true;
        }
      }
    }

    if (shouldSaveConversation) {
      await conversation.save();
    }

    return conversation;
  };

const validateConversationAccess = (
  conversation,
  user
) => {
  const isStudentSide =
    conversation.studentId.toString() ===
    user.id;

  const isTeacherSide =
    conversation.teacherId.toString() ===
    user.id;

  if (
    !isStudentSide &&
    !isTeacherSide
  ) {
    throw new ApiError(
      403,
      "You do not have access to this conversation."
    );
  }

  return {
    isStudentSide,
    isTeacherSide
  };
};

export const startConversation = async (
  req,
  res,
  next
) => {
  try {
    if (req.user.role !== "student") {
      throw new ApiError(
        403,
        "Only students can start Ask Before Booking chats."
      );
    }

    const teacherProfileId = String(
      req.body?.teacherProfileId || ""
    ).trim();

    const teacher =
      await getActiveTeacherByProfileId(
        teacherProfileId
      );

    const studentId = req.user.id;

    const teacherUserId =
      teacher.user_id._id.toString();

    const activeBooking =
      await findActivePaidBooking({
        studentId,
        teacherId: teacherUserId
      });

    if (teacher.availability !== "online" && !activeBooking) {
      throw new ApiError(409, TEACHER_TRY_LATER_MESSAGE);
    }

    let conversation =
      await Conversation.findOne({
        studentId,
        teacherId: teacherUserId
      });

    if (!conversation) {
      conversation =
        await Conversation.create({
          studentId,

          teacherId: teacherUserId,

          isPaid:
            Boolean(activeBooking),

          activeBookingId:
            activeBooking?._id || null,

          studentFreeMessageCount: 0
        });
    }

    await syncConversationPaymentState(
      conversation
    );

    return res.status(200).json({
      success: true,

      conversation: {
        id: conversation._id.toString(),

        teacherProfileId:
          teacher._id.toString(),

        counterpartName:
          teacher.user_id.name ||
          "Mentor",

        counterpartAvatarUrl:
          teacher.profileImage ||
          teacher.user_id.avatar_url ||
          null
      },

      meta: buildMeta(conversation)
    });
  } catch (error) {
    return next(error);
  }
};

export const listMyConversations =
  async (req, res, next) => {
    try {
      const filter =
        req.user.role === "teacher"
          ? {
              teacherId: req.user.id
            }
          : {
              studentId: req.user.id
            };

      const conversations =
        await Conversation.find(filter)
          .populate(
            "studentId",
            "name avatar_url role is_active"
          )
          .populate(
            "teacherId",
            "name avatar_url role is_active"
          )
          .sort({
            updatedAt: -1
          });

      const teacherUserIds = conversations
        .map((item) => item.teacherId?._id)
        .filter(Boolean);

      const teacherProfiles = teacherUserIds.length
        ? await Teacher.find({
            user_id: { $in: teacherUserIds }
          }).select("user_id profileImage availability")
        : [];

      const teacherProfileByUserId = new Map(
        teacherProfiles.map((profile) => [
          profile.user_id.toString(),
          profile
        ])
      );

      const payload = [];

      for (const item of conversations) {
        await syncConversationPaymentState(
          item
        );

        const student =
          item.studentId;

        const teacher =
          item.teacherId;

        if (!student || !teacher)
          continue;

        const isTeacherView =
          req.user.role === "teacher";

        const counterpart =
          isTeacherView
            ? student
            : teacher;

        const teacherProfile =
          teacherProfileByUserId.get(
            teacher._id.toString()
          );

        const latestMessage =
          await Message.findOne({
            conversationId: item._id
          }).sort({
            createdAt: -1
          });

        payload.push({
          id: item._id.toString(),

          conversationId:
            item._id.toString(),

          studentId:
            student._id.toString(),

          teacherId:
            teacher._id.toString(),

          teacherProfileId:
            teacherProfile?._id?.toString() ||
            null,

          counterpartName:
            counterpart.name,

          counterpartRole:
            counterpart.role,

          counterpartAvatarUrl:
            (isTeacherView
              ? counterpart.avatar_url
              : teacherProfile?.profileImage ||
                counterpart.avatar_url) ||
            null,

          teacherAvailability:
            teacherProfile?.availability ||
            "offline",

          latestMessage:
            latestMessage?.text || "",

          latestMessageAt:
            latestMessage?.createdAt ||
            item.updatedAt,

          latestMessageRole:
            latestMessage?.senderRole ||
            null,

          isPaid: Boolean(item.isPaid),

          activeBookingId:
            item.activeBookingId?.toString() ||
            null,

          ...buildMeta(item)
        });
      }

      return res.json({
        success: true,
        conversations: payload
      });
    } catch (error) {
      return next(error);
    }
  };

export const getConversationMessages =
  async (req, res, next) => {
    try {
      const { conversationId } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          conversationId
        )
      ) {
        throw new ApiError(
          404,
          "Conversation not found"
        );
      }

      const conversation =
        await Conversation.findById(
          conversationId
        );

      if (!conversation) {
        throw new ApiError(
          404,
          "Conversation not found"
        );
      }

      validateConversationAccess(
        conversation,
        req.user
      );

      await syncConversationPaymentState(
        conversation
      );

      const messages =
        await Message.find({
          conversationId
        }).sort({
          createdAt: 1
        });

      const formattedMessages =
        await Promise.all(
          messages.map((msg) =>
            toMessagePayload(msg)
          )
        );

      await Notification.updateMany(
        {
          userId: req.user.id,
          type: "message",
          isRead: false,
          actionUrl: {
            $regex: `[?&]conversationId=${conversation._id.toString()}($|&)`
          }
        },
        { $set: { isRead: true } }
      );

      return res.json({
        success: true,

        conversation: {
          id: conversation._id.toString(),

          studentId:
            conversation.studentId.toString(),

          teacherId:
            conversation.teacherId.toString(),

          activeBookingId:
            conversation.activeBookingId?.toString() ||
            null,

          isPaid: Boolean(
            conversation.isPaid
          )
        },

        messages:
          formattedMessages,

        meta: buildMeta(conversation)
      });
    } catch (error) {
      return next(error);
    }
  };

export const sendConversationMessage =
  async (req, res, next) => {
    try {
      const { conversationId } =
        req.params;

      const text = String(
        req.body?.text ||
          req.body?.message ||
          ""
      ).trim();

      if (
        !mongoose.Types.ObjectId.isValid(
          conversationId
        )
      ) {
        throw new ApiError(
          404,
          "Conversation not found"
        );
      }

      if (!text) {
        throw new ApiError(
          400,
          "Message cannot be empty."
        );
      }

      const conversation =
        await Conversation.findById(
          conversationId
        );

      if (!conversation) {
        throw new ApiError(
          404,
          "Conversation not found"
        );
      }

      const {
        isStudentSide,
        isTeacherSide
      } = validateConversationAccess(
        conversation,
        req.user
      );

      await syncConversationPaymentState(
        conversation
      );

      if (isStudentSide && !conversation.isPaid) {
        const teacherProfile = await Teacher.findOne({
          user_id: conversation.teacherId
        }).select("availability");

        if (!teacherProfile || teacherProfile.availability !== "online") {
          throw new ApiError(409, TEACHER_TRY_LATER_MESSAGE);
        }
      }

      if (
        isStudentSide &&
        !conversation.isPaid &&
        conversation.studentFreeMessageCount >=
          FREE_MESSAGES_LIMIT
      ) {
        throw new ApiError(
          402,
          LOCK_MESSAGE
        );
      }

      const senderRole =
        isTeacherSide
          ? "teacher"
          : "student";

      const entry =
        await Message.create({
          conversationId:
            conversation._id,

          senderId: req.user.id,

          senderRole,

          text
        });

      if (
        senderRole === "student" &&
        !conversation.isPaid
      ) {
        conversation.studentFreeMessageCount += 1;
      }

      conversation.updatedAt =
        new Date();

      await conversation.save();

      const receiverId =
        senderRole === "teacher"
          ? conversation.studentId.toString()
          : conversation.teacherId.toString();

      await createNotification({
        userId: receiverId,

        type: "message",

        title:
          senderRole === "student"
            ? `New message from ${req.user.name}`
            : `Teacher replied: ${req.user.name}`,

        message:
          text.length > 100
            ? `${text.slice(0, 100)}...`
            : text,

        actionUrl: `/messages?conversationId=${conversation._id.toString()}`
      });

      const formattedEntry =
        await toMessagePayload(entry);

      return res.status(201).json({
        success: true,

        entry: formattedEntry,

        meta: buildMeta(conversation)
      });
    } catch (error) {
      return next(error);
    }
  };
