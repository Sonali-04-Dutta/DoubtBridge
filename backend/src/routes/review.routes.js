import { Router } from "express";
import { myReviews, addReview } from "../controllers/review.controller.js";
import { allowRoles, requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/", requireAuth, allowRoles("student"), addReview);
router.get("/my", requireAuth, allowRoles("teacher"), myReviews);

export default router;