import { Router } from "express";
import {
  createBooking,
  getBookingById,
  listMyBookings,
  markBookingCompleted,
  respondBooking
} from "../controllers/booking.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, allowRoles("student"), createBooking);
router.get("/my", requireAuth, listMyBookings);
router.get("/:bookingId", requireAuth, getBookingById);
router.patch("/:bookingId/respond", requireAuth, allowRoles("teacher"), respondBooking);
router.patch("/:bookingId/complete", requireAuth, markBookingCompleted);

export default router;
