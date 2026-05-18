import mongoose from "mongoose";
import { Booking } from "../models/Booking.js";
import { Review } from "../models/Review.js";
import { Teacher } from "../models/Teacher.js";
import { ApiError } from "../utils/ApiError.js";

export const addReview = async (req, res, next) => {
  try {
    const { teacherUserId, bookingId, rating, review } = req.body;
    let targetTeacherUserId = teacherUserId;

    if (!targetTeacherUserId && bookingId && mongoose.Types.ObjectId.isValid(bookingId)) {
      const completedBooking = await Booking.findOne({
        _id: bookingId,
        student_id: req.user.id,
        status: "completed"
      }).select("teacher_id");
      targetTeacherUserId = completedBooking?.teacher_id?.toString();
    }

    if (!mongoose.Types.ObjectId.isValid(targetTeacherUserId)) {
      throw new ApiError(400, "Invalid teacher id");
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new ApiError(400, "Rating must be an integer from 1 to 5");
    }

    const booking = await Booking.findOne({
      student_id: req.user.id,
      teacher_id: targetTeacherUserId,
      status: "completed"
    }).select("_id");

    if (!booking) {
      throw new ApiError(403, "You can review after a completed session only");
    }

    const updated = await Review.findOneAndUpdate(
      { student_id: req.user.id, teacher_id: targetTeacherUserId },
      { rating, review: review || "" },
      { new: true, upsert: true }
    );

    const agg = await Review.aggregate([
      { $match: { teacher_id: new mongoose.Types.ObjectId(targetTeacherUserId) } },
      {
        $group: {
          _id: "$teacher_id",
          avgRating: { $avg: "$rating" },
          countRating: { $sum: 1 }
        }
      }
    ]);

    const teacherStats = agg[0] || { avgRating: 0, countRating: 0 };

    await Teacher.findOneAndUpdate(
      { user_id: targetTeacherUserId },
      {
        rating: Number((teacherStats.avgRating || 0).toFixed(1)),
        rating_count: teacherStats.countRating || 0
      }
    );

    return res.status(201).json({ success: true, review: updated });
  } catch (error) {
    return next(error);
  }
};

export const myReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ teacher_id: req.user.id })
      .populate("student_id", "name")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      reviews: reviews.map((review) => ({
        id: review._id.toString(),
        student_id: review.student_id?._id ? review.student_id._id.toString() : String(review.student_id),
        teacher_id: req.user.id,
        rating: review.rating,
        review: review.review,
        created_at: review.createdAt,
        student_name: review.student_id?.name || "Student"
      }))
    });
  } catch (error) {
    return next(error);
  }
};
