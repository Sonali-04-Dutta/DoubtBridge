import { Router } from "express";
import {
  getMyTeacherProfile,
  getTeacherById,
  listAllMentors,
  listMyIntroMessages,
  listTeacherIntroConversations,
  listTeacherIntroMessages,
  listTeachers,
  recommendTeachers,
  sendIntroMessage,
  sendTeacherIntroMessage,
  updateAvailability,
  updateTeacherProfile
} from "../controllers/teacher.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/mentors", listAllMentors);
router.post("/recommendations", requireAuth, allowRoles("student"), recommendTeachers);
router.get("/:id/intro-messages", requireAuth, allowRoles("student"), listMyIntroMessages);
router.post("/:id/intro-messages", requireAuth, allowRoles("student"), sendIntroMessage);
router.get("/intro-conversations", requireAuth, allowRoles("teacher"), listTeacherIntroConversations);
router.get("/intro-conversations/:studentId/messages", requireAuth, allowRoles("teacher"), listTeacherIntroMessages);
router.post("/intro-conversations/:studentId/messages", requireAuth, allowRoles("teacher"), sendTeacherIntroMessage);
router.get("/", listTeachers);
router.get("/profile", requireAuth, allowRoles("teacher"), getMyTeacherProfile);
router.put("/profile", requireAuth, allowRoles("teacher"), updateTeacherProfile);
router.patch("/profile", requireAuth, allowRoles("teacher"), updateTeacherProfile);
router.patch("/availability", requireAuth, allowRoles("teacher"), updateAvailability);
router.get("/:id", getTeacherById);

export default router;
