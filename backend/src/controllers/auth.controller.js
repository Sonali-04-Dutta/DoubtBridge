import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { getFirebaseAuth } from "../config/firebaseAdmin.js";
import { User } from "../models/User.js";
import { Teacher } from "../models/Teacher.js";
import { ApiError } from "../utils/ApiError.js";

const signToken = (userId) => jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  avatar_url: user.avatar_url
});

const ensureTeacherProfile = async (userId) => {
  try {
    await Teacher.updateOne({ user_id: userId }, { $setOnInsert: { user_id: userId } }, { upsert: true });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }
};

export const signup = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.validated.body;

    const existing = await User.findOne({ email: email.toLowerCase() }).select("_id");
    if (existing) {
      throw new ApiError(409, "Email already exists");
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role
    });

    if (role === "teacher") {
      await ensureTeacherProfile(user._id);
    }

    const token = signToken(user._id.toString());

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "name email role password avatar_url is_active isBlocked"
    );

    if (!user || !user.is_active || user.isBlocked) {
      throw new ApiError(401, "Invalid credentials");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new ApiError(401, "Invalid credentials");
    }

    const token = signToken(user._id.toString());

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
};

export const loginWithGoogle = async (req, res, next) => {
  try {
    const { idToken, role = "student" } = req.validated.body;
    const firebaseAuth = getFirebaseAuth();
    const decoded = await firebaseAuth.verifyIdToken(idToken);

    const email = String(decoded.email || "").toLowerCase().trim();
    if (!email) {
      throw new ApiError(400, "Google account does not have a valid email");
    }

    const name = String(decoded.name || email.split("@")[0] || "DoubtBridge User").trim();
    const avatarUrl = decoded.picture || null;
    const requestedRole = role === "teacher" ? "teacher" : "student";
    let created = false;
    let rolePreserved = false;

    let user = await User.findOne({ email }).select("name email role avatar_url is_active isBlocked");
    if (!user) {
      user = await User.create({
        name,
        email,
        password: await bcrypt.hash(`google-${decoded.uid}-${Date.now()}`, 10),
        role: requestedRole,
        avatar_url: avatarUrl
      });
      created = true;

      if (user.role === "teacher") {
        await ensureTeacherProfile(user._id);
      }
    } else if (user.role !== requestedRole) {
      rolePreserved = true;
    }

    if (user.role === "teacher") {
      await ensureTeacherProfile(user._id);
    }

    if (!user.is_active || user.isBlocked) {
      throw new ApiError(403, "Your account is inactive. Please contact support.");
    }

    if (!user.avatar_url && avatarUrl) {
      user.avatar_url = avatarUrl;
      await user.save();
    }

    const token = signToken(user._id.toString());

    return res.status(created ? 201 : 200).json({
      success: true,
      message: rolePreserved
        ? `Login successful. Existing ${user.role} role was preserved.`
        : created
          ? "Google account linked successfully"
          : "Login successful",
      token,
      user: sanitizeUser(user),
      isNewUser: created,
      rolePreserved
    });
  } catch (error) {
    if (error.code?.startsWith("auth/")) {
      return next(new ApiError(401, "Google authentication failed. Please try again."));
    }
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const user = await User.findOne({ email: email.toLowerCase() }).select("_id is_active");

    if (!user || !user.is_active) {
      throw new ApiError(404, "No active account found with this email");
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(user._id, { password: hashed });

    return res.json({
      success: true,
      message: "Password updated successfully. Please log in with your new password."
    });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    return res.json({ success: true, user: req.user });
  } catch (error) {
    return next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const name = req.body?.name === undefined ? undefined : String(req.body.name).trim();
    const avatarUrl = req.body?.avatar_url === undefined ? undefined : String(req.body.avatar_url).trim();

    if (name !== undefined && name.length < 2) {
      throw new ApiError(400, "Name must be at least 2 characters.");
    }

    if (avatarUrl && avatarUrl.length > 2_000_000) {
      throw new ApiError(413, "Profile image is too large.");
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name !== undefined ? { name } : {}),
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl || null } : {})
      },
      { new: true }
    ).select("name email role avatar_url is_active isBlocked");

    if (!user || !user.is_active || user.isBlocked) {
      throw new ApiError(404, "User not found");
    }

    if (user.role === "teacher" && avatarUrl !== undefined) {
      await Teacher.findOneAndUpdate({ user_id: user._id }, { profileImage: avatarUrl || "" }, { upsert: false });
    }

    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
};
