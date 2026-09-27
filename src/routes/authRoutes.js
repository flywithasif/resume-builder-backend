import { Router } from "express";

import {
  login,
  me,
  register,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

router.post("/register", register);

router.post("/login", login);

/*
|--------------------------------------------------------------------------
| Protected Route
|--------------------------------------------------------------------------
*/

router.get("/me", protect, me);

export default router;