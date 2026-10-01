import { Router } from "express";

import {
  changePassword,
  forgotPassword,
  getSettings,
  login,
  me,
  register,
  resendEmailOtp,
  resetPassword,
  updateProfile,
  updateSettings,
  verifyEmail,
  verifyResetOtp,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

const router = Router();

/* =========================================================
   AUTH
========================================================= */

router.post(
  "/register",
  register,
);

router.post(
  "/verify-email",
  verifyEmail,
);

router.post(
  "/resend-email-otp",
  resendEmailOtp,
);

router.post(
  "/login",
  login,
);

/* =========================================================
   FORGOT PASSWORD
========================================================= */

router.post(
  "/forgot-password",
  forgotPassword,
);

router.post(
  "/verify-reset-otp",
  verifyResetOtp,
);

router.post(
  "/reset-password",
  resetPassword,
);

/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  "/me",
  protect,
  me,
);

/* =========================================================
   PROFILE
========================================================= */

router.put(
  "/profile",
  protect,
  updateProfile,
);

/* =========================================================
   PASSWORD
========================================================= */

router.put(
  "/password",
  protect,
  changePassword,
);

/* =========================================================
   SETTINGS
========================================================= */

router.get(
  "/settings",
  protect,
  getSettings,
);

router.put(
  "/settings",
  protect,
  updateSettings,
);

export default router;