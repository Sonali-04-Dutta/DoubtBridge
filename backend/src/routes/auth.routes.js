import { Router } from "express";
import { forgotPassword, login, loginWithGoogle, me, signup, updateProfile } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { schemas, validate } from "../middleware/validate.js";

const router = Router();

router.post("/signup", validate(schemas.signup), signup);
router.post("/login", validate(schemas.login), login);
router.post("/google", validate(schemas.googleLogin), loginWithGoogle);
router.post("/forgot-password", validate(schemas.forgotPassword), forgotPassword);
router.get("/me", requireAuth, me);
router.patch("/profile", requireAuth, updateProfile);

export default router;
