import { Router } from "express";
import authRoutes from "./auth.routes.js";
import teacherRoutes from "./teacher.routes.js";
import bookingRoutes from "./booking.routes.js";
import paymentRoutes from "./payment.routes.js";
import reviewRoutes from "./review.routes.js";
import sessionRoutes from "./session.routes.js";
import adminRoutes from "./admin.routes.js";
import messageRoutes from "./message.routes.js";
import notificationRoutes from "./notification.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "DoubtBridge API is healthy" });
});

router.use("/auth", authRoutes);
router.use("/teachers", teacherRoutes);
router.use("/teacher", teacherRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/sessions", sessionRoutes);
router.use("/admin", adminRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);

export default router;
