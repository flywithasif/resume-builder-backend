import { Router } from "express";

import {
  importCoverLetter,
  importResume,
} from "../controllers/importController.js";

import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Resume Import
|--------------------------------------------------------------------------
*/

router.post(
  "/resume",
  upload.single("file"),
  importResume,
);

/*
|--------------------------------------------------------------------------
| Cover Letter Import
|--------------------------------------------------------------------------
*/

router.post(
  "/cover-letter",
  upload.single("file"),
  importCoverLetter,
);

export default router;