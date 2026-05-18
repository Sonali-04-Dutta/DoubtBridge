import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    teacher_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    review: { type: String, default: "" }
  },
  { timestamps: true }
);

reviewSchema.index({ student_id: 1, teacher_id: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);