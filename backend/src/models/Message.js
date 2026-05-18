import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    senderRole: { type: String, enum: ["student", "teacher"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 600 }
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
