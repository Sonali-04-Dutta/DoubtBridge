import { Router } from "express";
import { createPaymentOrder, refundPayment, verifyPayment } from "../controllers/payment.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/create-order", requireAuth, allowRoles("student"), createPaymentOrder);
router.post("/order", requireAuth, allowRoles("student"), createPaymentOrder);
router.post("/verify", requireAuth, allowRoles("student"), verifyPayment);
router.post("/refund", requireAuth, allowRoles("student", "teacher", "admin"), refundPayment);

export default router;
