import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Review } from "../models/Review.js";
import { Teacher } from "../models/Teacher.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { buildTeacherBusyBookingFilter } from "../utils/teacherAvailability.js";
import {
  listMentorsDirectory,
  mapTeacherDoc,
  recommendMentorsByProblem
} from "../services/teacherDiscovery.service.js";
import { MANUAL_TEACHER_STATUSES, setManualTeacherStatus } from "../services/teacherStatus.service.js";
import { getFreeMessageWindowEndsAt, refreshFreeMessageWindow } from "../utils/freeMessageWindow.js";

const FREE_MESSAGES_BEFORE_PAYMENT = 6;
const CHAT_LOCK_MESSAGE = "Free message limit reached. Book session to continue.";

const parseStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const getActiveTeacherByProfileId = async (profileId) => {
  if (!mongoose.Types.ObjectId.isValid(profileId)) {
    throw new ApiError(404, "Teacher not found");
  }

  const teacher = await Teacher.findById(profileId).populate({
    path: "user_id",
    match: { role: "teacher", is_active: true },
    select: "name email avatar_url role is_active"
  });

  if (!teacher || !teacher.user_id || teacher.user_id.role !== "teacher") {
    throw new ApiError(404, "Teacher not found");
  }

  return teacher;
};

const getTeacherProfileByUserId = async (teacherUserId) => {
  const teacher = await Teacher.findOne({ user_id: teacherUserId }).populate({
    path: "user_id",
    match: { role: "teacher", is_active: true },
    select: "name email avatar_url role is_active"
  });

  if (!teacher || !teacher.user_id) {
    throw new ApiError(404, "Teacher profile not found");
  }

  return teacher;
};

const hasPaidAccess = async ({ studentId, teacherUserId }) => {
  const paidBooking = await Booking.findOne({
    student_id: studentId,
    teacher_id: teacherUserId,
    status: { $in: ["paid", "completed"] }
  }).select("_id");

  return Boolean(paidBooking);
};

const buildMessagingMeta = ({ freeSentCount, isPaid }) => {
  if (isPaid) {
    return {
      paidUnlocked: true,
      freeLimit: FREE_MESSAGES_BEFORE_PAYMENT,
      freeMessagesSent: freeSentCount,
      remainingFreeMessages: 0,
      canSendMessage: true,
      lockMessage: CHAT_LOCK_MESSAGE
    };
  }

  const remaining = Math.max(FREE_MESSAGES_BEFORE_PAYMENT - freeSentCount, 0);
  return {
    paidUnlocked: false,
    freeLimit: FREE_MESSAGES_BEFORE_PAYMENT,
    freeMessagesSent: freeSentCount,
    remainingFreeMessages: remaining,
    canSendMessage: remaining > 0,
    lockMessage: CHAT_LOCK_MESSAGE
  };
};

const buildConversationMessagingMeta = (conversation, isPaid = Boolean(conversation?.isPaid)) => {
  refreshFreeMessageWindow(conversation);
  return {
    ...buildMessagingMeta({
      freeSentCount: conversation?.studentFreeMessageCount || 0,
      isPaid
    }),
    freeWindowEndsAt: getFreeMessageWindowEndsAt(conversation)
  };
};

const toMessagePayload = (item) => ({
  id: item._id.toString(),
  senderId: item.senderId.toString(),
  senderRole: item.senderRole,
  text: item.text,
  message: item.text,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt
});

const touchPaidState = async ({ conversation, studentId, teacherUserId }) => {
  if (!conversation) {
    const paidUnlocked = await hasPaidAccess({ studentId, teacherUserId });
    return { isPaid: paidUnlocked, conversation: null };
  }

  if (conversation.isPaid) {
    return { isPaid: true, conversation };
  }

  const previousCount = conversation.studentFreeMessageCount;
  const previousWindowStartedAt = conversation.studentFreeMessageWindowStartedAt
    ? new Date(conversation.studentFreeMessageWindowStartedAt).getTime()
    : null;
  refreshFreeMessageWindow(conversation);
  const nextWindowStartedAt = conversation.studentFreeMessageWindowStartedAt
    ? new Date(conversation.studentFreeMessageWindowStartedAt).getTime()
    : null;
  if (
    previousCount !== conversation.studentFreeMessageCount ||
    previousWindowStartedAt !== nextWindowStartedAt
  ) {
    await conversation.save();
  }

  const paidUnlocked = await hasPaidAccess({ studentId, teacherUserId });
  if (paidUnlocked) {
    conversation.isPaid = true;
    await conversation.save();
    return { isPaid: true, conversation };
  }

  return { isPaid: false, conversation };
};

export const listTeachers = async (req, res, next) => {
  try {
    const teachers = await listMentorsDirectory(req.query);
    return res.json({ success: true, teachers: teachers.map(mapTeacherDoc) });
  } catch (error) {
    return next(error);
  }
};

export const listAllMentors = async (req, res, next) => {
  try {
    const teachers = await listMentorsDirectory({});
    return res.json({
      success: true,
      total: teachers.length,
      teachers: teachers.map(mapTeacherDoc)
    });
  } catch (error) {
    return next(error);
  }
};

export const recommendTeachers = async (req, res, next) => {
  try {
    const { problem, subject, topic, budget, language, classLevel, extraContext, limit } = req.body;
    const normalizedProblem = String(problem || "").trim();
    const normalizedContext = String(extraContext || "").trim();
    const filterPrompt = [subject, topic, budget, language, classLevel, normalizedProblem, normalizedContext].filter(Boolean).join(" ");

    if (filterPrompt.trim().length < 3) {
      throw new ApiError(400, "Please add a subject, topic, or learning problem.");
    }

    const recommendation = await recommendMentorsByProblem({
      problem: filterPrompt,
      filters: { subject, topic, budget, language, classLevel, extraContext: normalizedContext || normalizedProblem },
      limit
    });

    return res.json({
      success: true,
      message: "Recommendations generated successfully",
      mentors: recommendation.teachers.map((teacher) => ({
        mentorId: teacher.id,
        name: teacher.name,
        score: teacher.ai?.score || 0,
        matchPercentage: teacher.ai?.matchPercentage || 0,
        outOfBudget: Boolean(teacher.ai?.outOfBudget),
        mentorPrice: teacher.ai?.mentorPrice || teacher.pricePerSession || 0,
        matchedReasons: teacher.ai?.reasons || []
      })),
      ...recommendation
    });
  } catch (error) {
    return next(error);
  }
};

export const getTeacherById = async (req, res, next) => {
  try {
    const teacher = await getActiveTeacherByProfileId(req.params.id);

    const reviews = await Review.find({ teacher_id: teacher.user_id._id })
      .populate("student_id", "name")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({
      success: true,
      teacher: mapTeacherDoc(teacher),
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        rating: r.rating,
        review: r.review,
        created_at: r.createdAt,
        student_name: r.student_id?.name || "Student"
      }))
    });
  } catch (error) {
    return next(error);
  }
};

export const listMyIntroMessages = async (req, res, next) => {
  try {
    const teacher = await getActiveTeacherByProfileId(req.params.id);
    const studentId = req.user.id;
    let conversation = await Conversation.findOne({
      studentId,
      teacherId: teacher.user_id._id
    });

    const paidState = await touchPaidState({
      conversation,
      studentId,
      teacherUserId: teacher.user_id._id
    });
    conversation = paidState.conversation;
    const isPaid = paidState.isPaid;

    const messages = conversation
      ? await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(200)
      : [];
    return res.json({
      success: true,
      conversationId: conversation?._id?.toString() || null,
      messages: messages.map(toMessagePayload),
      meta: {
        ...buildConversationMessagingMeta(conversation, isPaid),
        unreadFromTeacherCount: 0
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const sendIntroMessage = async (req, res, next) => {
  try {
    const teacher = await getActiveTeacherByProfileId(req.params.id);
    const studentId = req.user.id;
    const message = String(req.body?.message || "").trim();

    if (!message) {
      throw new ApiError(400, "Message cannot be empty.");
    }

    if (message.length > 600) {
      throw new ApiError(400, "Message should be 600 characters or fewer.");
    }

    let conversation = await Conversation.findOne({
      studentId,
      teacherId: teacher.user_id._id
    });
    if (!conversation) {
      const paidUnlocked = await hasPaidAccess({ studentId, teacherUserId: teacher.user_id._id });
      conversation = await Conversation.create({
        studentId,
        teacherId: teacher.user_id._id,
        isPaid: paidUnlocked,
        studentFreeMessageCount: 0,
        studentFreeMessageWindowStartedAt: paidUnlocked ? null : new Date()
      });
    } else if (!conversation.isPaid) {
      const paidUnlocked = await hasPaidAccess({ studentId, teacherUserId: teacher.user_id._id });
      if (paidUnlocked) {
        conversation.isPaid = true;
      }
    }

    refreshFreeMessageWindow(conversation);

    if (!conversation.isPaid && conversation.studentFreeMessageCount >= FREE_MESSAGES_BEFORE_PAYMENT) {
      throw new ApiError(402, CHAT_LOCK_MESSAGE);
    }

    const entry = await Message.create({
      conversationId: conversation._id,
      senderId: studentId,
      senderRole: "student",
      text: message
    });

    if (!conversation.isPaid) {
      conversation.studentFreeMessageCount += 1;
    }
    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(201).json({
      success: true,
      message: "Message sent",
      conversationId: conversation._id.toString(),
      entry: toMessagePayload(entry),
      meta: buildConversationMessagingMeta(conversation)
    });
  } catch (error) {
    return next(error);
  }
};

export const listTeacherIntroConversations = async (req, res, next) => {
  try {
    const teacher = await getTeacherProfileByUserId(req.user.id);
    const conversationDocs = await Conversation.find({
      teacherId: teacher.user_id._id
    })
      .populate("studentId", "name avatar_url email role is_active")
      .sort({ updatedAt: -1 });

    const conversationIds = conversationDocs.map((item) => item._id);
    const latestMessages = conversationIds.length
      ? await Message.aggregate([
          { $match: { conversationId: { $in: conversationIds } } },
          { $sort: { createdAt: -1 } },
          {
            $group: {
              _id: "$conversationId",
              text: { $first: "$text" },
              senderRole: { $first: "$senderRole" },
              createdAt: { $first: "$createdAt" }
            }
          }
        ])
      : [];

    const latestByConversationId = new Map(
      latestMessages.map((item) => [item._id.toString(), item])
    );

    await Promise.all(
      conversationDocs.map(async (item) => {
        if (item.isPaid) return;
        const previousCount = item.studentFreeMessageCount;
        const previousWindowStartedAt = item.studentFreeMessageWindowStartedAt
          ? new Date(item.studentFreeMessageWindowStartedAt).getTime()
          : null;
        refreshFreeMessageWindow(item);
        const nextWindowStartedAt = item.studentFreeMessageWindowStartedAt
          ? new Date(item.studentFreeMessageWindowStartedAt).getTime()
          : null;
        if (
          previousCount !== item.studentFreeMessageCount ||
          previousWindowStartedAt !== nextWindowStartedAt
        ) {
          await item.save();
        }
      })
    );

    const conversations = conversationDocs
      .map((item) => {
        const student = item.studentId;
        if (!student || student.role !== "student" || !student.is_active) {
          return null;
        }

        const latest = latestByConversationId.get(item._id.toString());
        return {
          conversationId: item._id.toString(),
          studentId: student._id.toString(),
          studentName: student.name || "Student",
          studentAvatarUrl: student.avatar_url || null,
          lastMessage: latest?.text || "No messages yet",
          lastMessageRole: latest?.senderRole || "student",
          lastMessageAt: latest?.createdAt || item.createdAt,
          unreadCount: 0,
          freeMessagesSent: item.studentFreeMessageCount || 0,
          freeLimit: FREE_MESSAGES_BEFORE_PAYMENT,
          remainingFreeMessages: item.isPaid ? 0 : Math.max(FREE_MESSAGES_BEFORE_PAYMENT - (item.studentFreeMessageCount || 0), 0),
          freeWindowEndsAt: getFreeMessageWindowEndsAt(item),
          isPaid: item.isPaid
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      totalUnread: 0,
      conversations
    });
  } catch (error) {
    return next(error);
  }
};

export const listTeacherIntroMessages = async (req, res, next) => {
  try {
    const teacher = await getTeacherProfileByUserId(req.user.id);
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ApiError(404, "Student not found");
    }

    const student = await User.findById(studentId).select("name email avatar_url role is_active");
    if (!student || student.role !== "student" || !student.is_active) {
      throw new ApiError(404, "Student not found");
    }

    let conversation = await Conversation.findOne({
      studentId,
      teacherId: teacher.user_id._id
    });
    const paidState = await touchPaidState({
      conversation,
      studentId,
      teacherUserId: teacher.user_id._id
    });
    conversation = paidState.conversation;
    const isPaid = paidState.isPaid;

    if (!conversation) {
      return res.json({
        success: true,
        student: {
          id: student._id.toString(),
          name: student.name || "Student",
          email: student.email || "",
          avatarUrl: student.avatar_url || null
        },
        conversationId: null,
        messages: [],
        meta: {
          ...buildConversationMessagingMeta(conversation, isPaid),
          unreadFromStudentCount: 0
        }
      });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 }).limit(300);

    return res.json({
      success: true,
      student: {
        id: student._id.toString(),
        name: student.name || "Student",
        email: student.email || "",
        avatarUrl: student.avatar_url || null
      },
      conversationId: conversation._id.toString(),
      messages: messages.map(toMessagePayload),
      meta: {
        ...buildConversationMessagingMeta(conversation, conversation.isPaid || isPaid),
        unreadFromStudentCount: 0
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const sendTeacherIntroMessage = async (req, res, next) => {
  try {
    const teacher = await getTeacherProfileByUserId(req.user.id);
    const { studentId } = req.params;
    const message = String(req.body?.message || "").trim();

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ApiError(404, "Student not found");
    }

    if (!message) {
      throw new ApiError(400, "Message cannot be empty.");
    }
    if (message.length > 600) {
      throw new ApiError(400, "Message should be 600 characters or fewer.");
    }

    const student = await User.findById(studentId).select("role is_active");
    if (!student || student.role !== "student" || !student.is_active) {
      throw new ApiError(404, "Student not found");
    }

    let conversation = await Conversation.findOne({
      studentId,
      teacherId: teacher.user_id._id
    });
    const paidUnlocked = conversation?.isPaid || (await hasPaidAccess({ studentId, teacherUserId: teacher.user_id._id }));

    if (!conversation && !paidUnlocked) {
      throw new ApiError(409, "Student has not started a conversation yet.");
    }

    if (!conversation) {
      conversation = await Conversation.create({
        studentId,
        teacherId: teacher.user_id._id,
        isPaid: true,
        studentFreeMessageCount: FREE_MESSAGES_BEFORE_PAYMENT
      });
    } else if (paidUnlocked && !conversation.isPaid) {
      conversation.isPaid = true;
    }

    const entry = await Message.create({
      conversationId: conversation._id,
      senderId: teacher.user_id._id,
      senderRole: "teacher",
      text: message
    });
    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(201).json({
      success: true,
      message: "Reply sent",
      conversationId: conversation._id.toString(),
      entry: toMessagePayload(entry),
      meta: buildConversationMessagingMeta(conversation)
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyTeacherProfile = async (req, res, next) => {
  try {
    const teacher = await Teacher.findOne({ user_id: req.user.id }).populate({
      path: "user_id",
      match: { role: "teacher", is_active: true },
      select: "name email avatar_url role"
    });

    if (!teacher || !teacher.user_id || teacher.user_id.role !== "teacher") {
      throw new ApiError(404, "Teacher profile not found");
    }

    return res.json({ success: true, teacher: mapTeacherDoc(teacher) });
  } catch (error) {
    return next(error);
  }
};

export const updateTeacherProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      bio,
      subjects,
      topics,
      qualifications,
      certificates,
      experience,
      yearsExperience,
      languages,
      classLevels,
      tags,
      category,
      price15,
      price30,
      price45,
      price60,
      profileImage,
      availability
    } = req.body;

    const normalizedSubjects = subjects === undefined ? undefined : parseStringArray(subjects);
    const normalizedTopics = topics === undefined ? undefined : parseStringArray(topics);
    const normalizedLanguages = languages === undefined ? undefined : parseStringArray(languages);
    const normalizedClassLevels = classLevels === undefined ? undefined : parseStringArray(classLevels);
    const normalizedTags = tags === undefined ? undefined : parseStringArray(tags);
    const normalizedProfileImage = profileImage === undefined ? undefined : String(profileImage).trim();
    const normalizedCertificates = certificates === undefined ? undefined : parseStringArray(certificates);
    const needsApprovalReview =
      certificates !== undefined ||
      bio !== undefined ||
      subjects !== undefined ||
      topics !== undefined ||
      classLevels !== undefined ||
      tags !== undefined ||
      qualifications !== undefined;
    if (availability !== undefined && !MANUAL_TEACHER_STATUSES.includes(availability)) {
      throw new ApiError(400, "Invalid availability state");
    }

    const teacher = await Teacher.findOneAndUpdate(
      { user_id: userId },
      {
        ...(bio !== undefined ? { bio } : {}),
        ...(subjects !== undefined ? { subjects: normalizedSubjects } : {}),
        ...(topics !== undefined ? { topics: normalizedTopics } : {}),
        ...(qualifications !== undefined ? { qualifications } : {}),
        ...(certificates !== undefined ? { certificates: normalizedCertificates } : {}),
        ...(experience !== undefined ? { experience, yearsExperience: yearsExperience ?? experience } : {}),
        ...(yearsExperience !== undefined && experience === undefined ? { yearsExperience } : {}),
        ...(languages !== undefined ? { languages: normalizedLanguages } : {}),
        ...(classLevels !== undefined ? { classLevels: normalizedClassLevels } : {}),
        ...(tags !== undefined ? { tags: normalizedTags } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(price15 !== undefined ? { price_15: price15, pricePerSession: price30 ?? price15 } : {}),
        ...(price30 !== undefined ? { price_30: price30, pricePerSession: price30 } : {}),
        ...(price45 !== undefined ? { price_45: price45 } : {}),
        ...(price60 !== undefined ? { price_60: price60 } : {}),
        ...(profileImage !== undefined ? { profileImage: normalizedProfileImage } : {}),
        ...(availability !== undefined ? { availability } : {}),
        ...(needsApprovalReview
          ? { approvalStatus: "pending", is_verified: false, adminFeedback: "" }
          : {})
      },
      { new: true }
    );

    if (!teacher) {
      throw new ApiError(404, "Teacher profile not found");
    }

    const populatedTeacher = await teacher.populate("user_id", "name email avatar_url role");

    if (profileImage !== undefined) {
      await User.findByIdAndUpdate(userId, { avatar_url: normalizedProfileImage || null }, { new: false });
    }
    if (needsApprovalReview) {
      await User.findByIdAndUpdate(userId, { isVerifiedTeacher: false, adminApprovedAt: null }, { new: false });
    }

    return res.json({ success: true, teacher: mapTeacherDoc(populatedTeacher) });
  } catch (error) {
    return next(error);
  }
};

export const updateAvailability = async (req, res, next) => {
  try {
    let { availability } = req.body;

    if (!MANUAL_TEACHER_STATUSES.includes(availability)) {
      throw new ApiError(400, "Invalid availability state");
    }

    const activeBooking = await Booking.findOne(buildTeacherBusyBookingFilter(req.user.id)).select("_id");

    if (activeBooking) {
      availability = "busy";
    }

    const teacher = await setManualTeacherStatus(req.user.id, availability);

    if (!teacher) {
      throw new ApiError(404, "Teacher profile not found");
    }

    return res.json({
      success: true,
      availability: teacher.availability,
      lockedBySystem: Boolean(activeBooking),
      message: activeBooking ? "Status kept busy because a paid session is active." : "Availability updated."
    });
  } catch (error) {
    return next(error);
  }
};
