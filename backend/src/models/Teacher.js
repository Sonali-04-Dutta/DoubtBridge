import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    bio: { type: String, default: "" },
    subjects: { type: [String], default: [] },
    topics: { type: [String], default: [] },
    qualifications: { type: String, default: "" },
    certificates: { type: [String], default: [] },
    experience: { type: Number, default: 0 },
    yearsExperience: { type: Number, default: 0 },
    languages: { type: [String], default: [] },
    classLevels: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    pricePerSession: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    price_15: { type: Number, default: 99 },
    price_30: { type: Number, default: 179 },
    price_45: { type: Number, default: 259 },
    price_60: { type: Number, default: 329 },
    category: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    availability: {
      type: String,
      enum: ["online", "offline", "busy", "in_session", "away", "not_accepting_sessions"],
      default: "offline",
      index: true
    },
    status: {
      type: String,
      enum: ["online", "offline", "busy", "in_session", "away", "not_accepting_sessions"],
      default: "offline",
      index: true
    },
    manualStatus: {
      type: String,
      enum: ["online", "busy", "away", "not_accepting_sessions", null],
      default: null
    },
    lastSeen: { type: Date, default: null },
    socketId: { type: String, default: null },
    isInSession: { type: Boolean, default: false, index: true },
    currentSessionId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    rating: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    is_verified: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
      index: true
    },
    adminFeedback: { type: String, default: "" },
    reviewedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

teacherSchema.index({ subjects: 1, topics: 1, languages: 1, classLevels: 1, approvalStatus: 1, is_verified: 1 });
teacherSchema.index({ tags: 1 });
teacherSchema.index({
  subjects: "text",
  topics: "text",
  tags: "text",
  bio: "text",
  category: "text",
  qualifications: "text"
});

export const Teacher = mongoose.model("Teacher", teacherSchema);
