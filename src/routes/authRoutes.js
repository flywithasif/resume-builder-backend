import { Router } from "express";

import {
  changePassword,
  getSettings,
  login,
  me,
  register,
  updateProfile,
  updateSettings,
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
  "/login",
  login,
);

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