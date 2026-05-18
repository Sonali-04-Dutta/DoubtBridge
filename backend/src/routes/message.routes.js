import { Router } from "express";
import {
  getConversationMessages,
  listMyConversations,
  sendConversationMessage,
  startConversation
} from "../controllers/message.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/conversations", requireAuth, allowRoles("student", "teacher"), listMyConversations);
router.post("/start", requireAuth, allowRoles("student"), startConversation);
router.get("/conversations/:conversationId", requireAuth, allowRoles("student", "teacher"), getConversationMessages);
router.post("/conversations/:conversationId", requireAuth, allowRoles("student", "teacher"), sendConversationMessage);

export default router;
