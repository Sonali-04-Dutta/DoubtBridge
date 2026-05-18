import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Payment } from "../models/Payment.js";
import { Session } from "../models/Session.js";
import { Teacher } from "../models/Teacher.js";
import { User } from "../models/User.js";
import { finishBookingSession } from "../services/liveSession.service.js";
import { createNotification } from "../services/notification.service.js";
import { refundPaidBooking } from "../services/paymentRefund.service.js";
import { ApiError } from "../utils/ApiError.js";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const userProjection = "name email role avatar_url is_active isBlocked isVerifiedTeacher adminApprovedAt createdAt updatedAt";

const serializeUser = (user, profile = null) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar_url: user.avatar_url || null,
  is_active: user.is_active,
  isBlocked: Boolean(user.isBlocked),
  isVerifiedTeacher: Boolean(user.isVerifiedTeacher || profile?.is_verified),
  adminApprovedAt: user.adminApprovedAt || null,
  createdAt: user.createdAt,
  profile: profile
    ? {
        id: profile._id.toString(),
        bio: profile.bio,
        subjects: profile.subjects || [],
        qualifications: profile.qualifications || "",
        certificates: profile.certificates || [],
        experience: profile.experience || 0,
        languages: profile.languages || [],
        category: profile.category || "",
        price_15: profile.price_15,
        price_30: profile.price_30,
        price_45: profile.price_45,
        price_60: profile.price_60,
        availability: profile.availability,
        status: profile.status,
        is_verified: Boolean(profile.is_verified),
        approvalStatus: profile.approvalStatus || (profile.is_verified ? "approved" : "pending"),
        adminFeedback: profile.adminFeedback || "",
        rating: profile.rating || 0,
        rating_count: profile.rating_count || 0
      }
    : null
});

const serializeBooking = (booking) => ({
  id: booking._id.toString(),
  student_id: booking.student_id?._id?.toString() || booking.student_id?.toString(),
  teacher_id: booking.teacher_id?._id?.toString() || booking.teacher_id?.toString(),
  student_name: booking.student_id?.name || "Student",
  teacher_name: booking.teacher_id?.name || "Teacher",
  duration: booking.duration,
  amount: booking.amount,
  payment_status: booking.payment_status,
  status: booking.status,
  session_status: booking.session_status,
  refund_status: booking.refund_status,
  refund_amount: booking.refund_amount || 0,
  razorpay_order_id: booking.razorpay_order_id,
  razorpay_payment_id: booking.razorpay_payment_id,
  razorpay_refund_id: booking.razorpay_refund_id,
  session_room: booking.session_room,
  actual_started_at: booking.actual_started_at,
  expires_at: booking.expires_at,
  createdAt: booking.createdAt,
  updatedAt: booking.updatedAt
});

export const getDashboardStats = async (_req, res, next) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalBookings,
      earnings,
      refunds,
      activeLiveClasses,
      recentBookings
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
      User.countDocuments({ role: "admin" }),
      Booking.countDocuments({}),
      Payment.aggregate([{ $match: { status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Payment.aggregate([
        { $match: { $or: [{ status: "refunded" }, { refund_status: { $nin: ["none", null, ""] } }] } },
        { $group: { _id: null, total: { $sum: "$refund_amount" }, count: { $sum: 1 } } }
      ]),
      Booking.countDocuments({ session_status: "live" }),
      Booking.find({})
        .populate("student_id", "name")
        .populate("teacher_id", "name")
        .sort({ createdAt: -1 })
        .limit(6)
    ]);

    return res.json({
      success: true,
      dashboard: {
        totalStudents,
        totalTeachers,
        totalAdmins,
        totalBookings,
        totalEarnings: earnings[0]?.total || 0,
        totalRefunds: refunds[0]?.total || 0,
        refundCount: refunds[0]?.count || 0,
        activeLiveClasses,
        recentBookings: recentBookings.map(serializeBooking)
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const listStudents = async (_req, res, next) => {
  try {
    const students = await User.find({ role: "student" }).select(userProjection).sort({ createdAt: -1 });
    return res.json({ success: true, students: students.map((user) => serializeUser(user)) });
  } catch (error) {
    return next(error);
  }
};

export const listTeachers = async (_req, res, next) => {
  try {
    const teachers = await User.find({ role: "teacher" }).select(userProjection).sort({ createdAt: -1 });
    const profiles = await Teacher.find({ user_id: { $in: teachers.map((teacher) => teacher._id) } });
    const profileMap = new Map(profiles.map((profile) => [profile.user_id.toString(), profile]));

    return res.json({
      success: true,
      teachers: teachers.map((teacher) => serializeUser(teacher, profileMap.get(teacher._id.toString())))
    });
  } catch (error) {
    return next(error);
  }
};

export const listUsers = async (_req, res, next) => {
  try {
    const users = await User.find({}).select(userProjection).sort({ createdAt: -1 });
    return res.json({ success: true, users: users.map((user) => serializeUser(user)) });
  } catch (error) {
    return next(error);
  }
};

export const listBookings = async (_req, res, next) => {
  try {
    const bookings = await Booking.find({})
      .populate("student_id", "name email")
      .populate("teacher_id", "name email")
      .sort({ createdAt: -1 })
      .limit(250);

    return res.json({ success: true, bookings: bookings.map(serializeBooking) });
  } catch (error) {
    return next(error);
  }
};

export const listPayments = async (_req, res, next) => {
  try {
    const payments = await Payment.find({})
      .populate({
        path: "booking_id",
        select: "student_id teacher_id status payment_status refund_status",
        populate: [
          { path: "student_id", select: "name email" },
          { path: "teacher_id", select: "name email" }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(250);

    return res.json({
      success: true,
      payments: payments.map((payment) => ({
        id: payment._id.toString(),
        booking_id: payment.booking_id?._id?.toString() || payment.booking_id?.toString(),
        student_name: payment.booking_id?.student_id?.name || "Student",
        teacher_name: payment.booking_id?.teacher_id?.name || "Teacher",
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_refund_id: payment.razorpay_refund_id,
        amount: payment.amount,
        purpose: payment.purpose,
        status: payment.status,
        refund_status: payment.refund_status,
        refund_amount: payment.refund_amount || 0,
        createdAt: payment.createdAt,
        refunded_at: payment.refunded_at
      }))
    });
  } catch (error) {
    return next(error);
  }
};

export const listLiveClasses = async (_req, res, next) => {
  try {
    const liveClasses = await Booking.find({ session_status: { $in: ["scheduled", "live"] }, status: "paid" })
      .populate("student_id", "name email")
      .populate("teacher_id", "name email")
      .sort({ actual_started_at: -1, createdAt: -1 })
      .limit(100);

    return res.json({ success: true, liveClasses: liveClasses.map(serializeBooking) });
  } catch (error) {
    return next(error);
  }
};

export const approveTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw new ApiError(404, "Teacher not found");

    const user = await User.findOneAndUpdate(
      { _id: id, role: "teacher" },
      { isVerifiedTeacher: true, adminApprovedAt: new Date() },
      { new: true }
    ).select(userProjection);
    if (!user) throw new ApiError(404, "Teacher not found");

    const profile = await Teacher.findOneAndUpdate(
      { user_id: user._id },
      { is_verified: true, approvalStatus: "approved", adminFeedback: "", reviewedAt: new Date() },
      { new: true, upsert: true }
    );
    await createNotification({
      userId: user._id.toString(),
      type: "system",
      title: "Teacher profile approved",
      message: "Your DoubtBridge mentor profile has been approved.",
      actionUrl: "/teacher"
    });

    return res.json({ success: true, teacher: serializeUser(user, profile) });
  } catch (error) {
    return next(error);
  }
};

export const rejectTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw new ApiError(404, "Teacher not found");

    const user = await User.findOneAndUpdate(
      { _id: id, role: "teacher" },
      { isVerifiedTeacher: false, adminApprovedAt: null },
      { new: true }
    ).select(userProjection);
    if (!user) throw new ApiError(404, "Teacher not found");

    const feedback = String(req.body?.reason || req.body?.feedback || "").trim();
    const profile = await Teacher.findOneAndUpdate(
      { user_id: user._id },
      { is_verified: false, approvalStatus: "rejected", adminFeedback: feedback, reviewedAt: new Date() },
      { new: true }
    );
    await createNotification({
      userId: user._id.toString(),
      type: "system",
      title: "Teacher profile needs review",
      message: feedback || "Your mentor profile was not approved yet. Please update your details and contact support.",
      actionUrl: "/teacher/profile"
    });

    return res.json({ success: true, teacher: serializeUser(user, profile) });
  } catch (error) {
    return next(error);
  }
};

export const suspendTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw new ApiError(404, "Teacher not found");

    const feedback = String(req.body?.reason || req.body?.feedback || "Teacher account suspended by admin.").trim();
    const user = await User.findOneAndUpdate(
      { _id: id, role: "teacher" },
      { isVerifiedTeacher: false, isBlocked: true, is_active: false },
      { new: true }
    ).select(userProjection);
    if (!user) throw new ApiError(404, "Teacher not found");

    const profile = await Teacher.findOneAndUpdate(
      { user_id: user._id },
      { is_verified: false, approvalStatus: "suspended", adminFeedback: feedback, reviewedAt: new Date(), availability: "offline" },
      { new: true }
    );

    await createNotification({
      userId: user._id.toString(),
      type: "system",
      title: "Teacher account suspended",
      message: feedback,
      actionUrl: "/teacher/profile"
    });

    return res.json({ success: true, teacher: serializeUser(user, profile) });
  } catch (error) {
    return next(error);
  }
};

export const blockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw new ApiError(404, "User not found");
    if (id === req.user.id) throw new ApiError(400, "Admins cannot block their own account.");

    const user = await User.findByIdAndUpdate(id, { isBlocked: true, is_active: false }, { new: true }).select(userProjection);
    if (!user) throw new ApiError(404, "User not found");

    return res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const unblockUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) throw new ApiError(404, "User not found");

    const user = await User.findByIdAndUpdate(id, { isBlocked: false, is_active: true }, { new: true }).select(userProjection);
    if (!user) throw new ApiError(404, "User not found");

    return res.json({ success: true, user: serializeUser(user) });
  } catch (error) {
    return next(error);
  }
};

export const refundBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    if (!isValidId(bookingId)) throw new ApiError(404, "Booking not found");

    const booking = await Booking.findById(bookingId);
    if (!booking) throw new ApiError(404, "Booking not found");

    const result = await refundPaidBooking({ booking, reason: "admin_manual_refund", actorId: req.user.id });
    await createNotification({
      userId: booking.student_id.toString(),
      type: "payment",
      title: "Refund processed",
      message: "An admin has processed your refund. The amount will reflect as per Razorpay timelines.",
      actionUrl: "/student"
    });

    return res.json({
      success: true,
      booking: serializeBooking(result.booking),
      refund: result.refund || null,
      alreadyRefunded: Boolean(result.alreadyRefunded)
    });
  } catch (error) {
    return next(error);
  }
};

export const forceEndLiveClass = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    if (!isValidId(bookingId)) throw new ApiError(404, "Live class not found");

    const booking = await Booking.findById(bookingId);
    if (!booking || !["scheduled", "live"].includes(booking.session_status)) {
      throw new ApiError(404, "Live class not found");
    }

    const ended = await finishBookingSession({ booking, finalStatus: "completed", endedBy: req.user.id });
    await Promise.all([
      Session.findOneAndUpdate({ booking_id: booking._id }, { status: "completed", ended_at: new Date() }),
      createNotification({
        userId: booking.student_id.toString(),
        type: "session",
        title: "Live class ended",
        message: "This live class was ended by DoubtBridge admin support.",
        actionUrl: "/student"
      }),
      createNotification({
        userId: booking.teacher_id.toString(),
        type: "session",
        title: "Live class ended",
        message: "This live class was ended by DoubtBridge admin support.",
        actionUrl: "/teacher/history"
      })
    ]);

    return res.json({ success: true, booking: serializeBooking(ended) });
  } catch (error) {
    return next(error);
  }
};
