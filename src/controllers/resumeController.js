import Resume from "../models/Resume.js";

import {
  calculateResumeProgress,
  makeResumeTitle,
} from "../utils/resume.js";

/*
|--------------------------------------------------------------------------
| Allowed Templates
|--------------------------------------------------------------------------
*/

const allowedTemplates = new Set([
  "executive",
  "modern",
  "minimal",
  "corporate",
  "creative",
  "ats",
  "tech",
  "elegant",
]);

function cleanTemplate(template) {
  if (allowedTemplates.has(template)) {
    return template;
  }

  return "executive";
}

/*
|--------------------------------------------------------------------------
| CREATE RESUME
|--------------------------------------------------------------------------
*/

export async function createResume(req, res) {
  const data = req.body?.data || {};

  const template = cleanTemplate(
    req.body?.template
  );

  const title =
    req.body?.title?.trim() ||
    makeResumeTitle(data);

  const resume = await Resume.create({
    user: req.user._id,
    title,
    template,
    progress: calculateResumeProgress(data),
    data,
  });

  return res.status(201).json({
    success: true,
    message: "Resume created successfully.",
    resume,
  });
}

/*
|--------------------------------------------------------------------------
| GET ALL USER RESUMES
|--------------------------------------------------------------------------
*/

export async function getResumes(req, res) {
  const resumes = await Resume.find({
    user: req.user._id,
  })
    .sort({
      updatedAt: -1,
    })
    .lean();

  return res.json({
    success: true,
    resumes,
  });
}

/*
|--------------------------------------------------------------------------
| GET SINGLE RESUME
|--------------------------------------------------------------------------
*/

export async function getResume(req, res) {
  const resume = await Resume.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();

  if (!resume) {
    return res.status(404).json({
      success: false,
      message: "Resume not found.",
    });
  }

  return res.json({
    success: true,
    resume,
  });
}

/*
|--------------------------------------------------------------------------
| UPDATE RESUME
|--------------------------------------------------------------------------
*/

export async function updateResume(req, res) {
  const existingResume = await Resume.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!existingResume) {
    return res.status(404).json({
      success: false,
      message: "Resume not found.",
    });
  }

  const data =
    req.body?.data ?? existingResume.data;

  const template = cleanTemplate(
    req.body?.template ??
      existingResume.template
  );

  const title =
    req.body?.title?.trim() ||
    makeResumeTitle(data) ||
    existingResume.title;

  /*
  |--------------------------------------------------------------------------
  | Update
  |--------------------------------------------------------------------------
  */

  existingResume.data = data;
  existingResume.template = template;
  existingResume.title = title;

  existingResume.progress =
    calculateResumeProgress(data);

  await existingResume.save();

  return res.json({
    success: true,
    message: "Resume updated successfully.",
    resume: existingResume,
  });
}

/*
|--------------------------------------------------------------------------
| DELETE RESUME
|--------------------------------------------------------------------------
*/

export async function deleteResume(req, res) {
  const result = await Resume.deleteOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!result.deletedCount) {
    return res.status(404).json({
      success: false,
      message: "Resume not found.",
    });
  }

  return res.json({
    success: true,
    message: "Resume deleted successfully.",
  });
}

/*
|--------------------------------------------------------------------------
| DUPLICATE RESUME
|--------------------------------------------------------------------------
*/

export async function duplicateResume(req, res) {
  const sourceResume = await Resume.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();

  if (!sourceResume) {
    return res.status(404).json({
      success: false,
      message: "Resume not found.",
    });
  }

  const duplicate = await Resume.create({
    user: req.user._id,
    title: `${sourceResume.title} Copy`,
    template: sourceResume.template,
    progress: sourceResume.progress,
    data: sourceResume.data,
  });

  return res.status(201).json({
    success: true,
    message: "Resume duplicated successfully.",
    resume: duplicate,
  });
}