import { Router } from "express";
import { createSessionToken, extendSession } from "../controllers/session.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/token", requireAuth, createSessionToken);
router.post("/zego-token", requireAuth, createSessionToken);
router.patch("/:bookingId/extend", requireAuth, extendSession);

export default router;
