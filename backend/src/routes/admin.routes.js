import { Router } from "express";
import {
  approveTeacher,
  blockUser,
  forceEndLiveClass,
  getDashboardStats,
  listBookings,
  listLiveClasses,
  listPayments,
  listStudents,
  listTeachers,
  listUsers,
  refundBooking,
  rejectTeacher,
  suspendTeacher,
  unblockUser
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/dashboard", getDashboardStats);
router.get("/stats", getDashboardStats);
router.get("/users", listUsers);
router.get("/students", listStudents);
router.get("/teachers", listTeachers);
router.get("/bookings", listBookings);
router.get("/payments", listPayments);
router.get("/live-classes", listLiveClasses);

router.patch("/teacher/:id/approve", approveTeacher);
router.patch("/teacher/:id/reject", rejectTeacher);
router.patch("/teacher/:id/suspend", suspendTeacher);
router.patch("/teachers/:id/verify", approveTeacher);
router.patch("/user/:id/block", blockUser);
router.patch("/user/:id/unblock", unblockUser);

router.post("/refund/:bookingId", refundBooking);
router.patch("/live-classes/:bookingId/end", forceEndLiveClass);

export default router;
