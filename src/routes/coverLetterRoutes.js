import { Router } from "express";

import {
  createCoverLetter,
  deleteCoverLetter,
  duplicateCoverLetter,
  getCoverLetter,
  getCoverLetters,
  updateCoverLetter,
} from "../controllers/coverLetterController.js";

import { protect } from "../middleware/auth.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| All Cover Letter Routes Require Authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Create Cover Letter
|--------------------------------------------------------------------------
*/

router.post("/", createCoverLetter);

/*
|--------------------------------------------------------------------------
| Get All Cover Letters
|--------------------------------------------------------------------------
*/

router.get("/", getCoverLetters);

/*
|--------------------------------------------------------------------------
| Get Single Cover Letter
|--------------------------------------------------------------------------
*/

router.get("/:id", getCoverLetter);

/*
|--------------------------------------------------------------------------
| Update Cover Letter
|--------------------------------------------------------------------------
*/

router.put("/:id", updateCoverLetter);

/*
|--------------------------------------------------------------------------
| Delete Cover Letter
|--------------------------------------------------------------------------
*/

router.delete("/:id", deleteCoverLetter);

/*
|--------------------------------------------------------------------------
| Duplicate Cover Letter
|--------------------------------------------------------------------------
*/

router.post("/:id/duplicate", duplicateCoverLetter);

export default router;