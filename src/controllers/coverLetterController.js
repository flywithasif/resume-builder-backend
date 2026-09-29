import CoverLetter from "../models/CoverLetter.js";

const allowedTemplates = new Set([
  "modern",
  "professional",
  "minimal",
  "executive",
  "elegant",
  "classic",
]);

function cleanTemplate(template) {
  return allowedTemplates.has(template) ? template : "modern";
}

function makeCoverLetterTitle(data = {}) {
  const position = String(data.position || "").trim();
  const company = String(data.company || "").trim();

  if (position && company) {
    return `${position} - ${company}`;
  }

  if (position) {
    return position;
  }

  return "My Cover Letter";
}

export async function createCoverLetter(req, res) {
  const data = req.body?.data || {};

  const coverLetter = await CoverLetter.create({
    user: req.user._id,
    title:
      req.body?.title?.trim() ||
      makeCoverLetterTitle(data),
    template: cleanTemplate(req.body?.template),
    data,
  });

  res.status(201).json({
    success: true,
    message: "Cover letter created successfully.",
    coverLetter,
  });
}

export async function getCoverLetters(req, res) {
  const coverLetters = await CoverLetter.find({
    user: req.user._id,
  })
    .sort({ updatedAt: -1 })
    .lean();

  res.json({
    success: true,
    coverLetters,
  });
}

export async function getCoverLetter(req, res) {
  const coverLetter = await CoverLetter.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();

  if (!coverLetter) {
    return res.status(404).json({
      success: false,
      message: "Cover letter not found.",
    });
  }

  res.json({
    success: true,
    coverLetter,
  });
}

export async function updateCoverLetter(req, res) {
  const existing = await CoverLetter.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Cover letter not found.",
    });
  }

  const data = req.body?.data ?? existing.data;

  existing.data = data;

  existing.template = cleanTemplate(
    req.body?.template ?? existing.template,
  );

  existing.title =
    req.body?.title?.trim() ||
    makeCoverLetterTitle(data) ||
    existing.title;

  await existing.save();

  res.json({
    success: true,
    message: "Cover letter updated successfully.",
    coverLetter: existing,
  });
}

export async function deleteCoverLetter(req, res) {
  const result = await CoverLetter.deleteOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!result.deletedCount) {
    return res.status(404).json({
      success: false,
      message: "Cover letter not found.",
    });
  }

  res.json({
    success: true,
    message: "Cover letter deleted successfully.",
  });
}

export async function duplicateCoverLetter(req, res) {
  const source = await CoverLetter.findOne({
    _id: req.params.id,
    user: req.user._id,
  }).lean();

  if (!source) {
    return res.status(404).json({
      success: false,
      message: "Cover letter not found.",
    });
  }

  const copy = await CoverLetter.create({
    user: req.user._id,
    title: `${source.title} Copy`,
    template: cleanTemplate(source.template),
    data: source.data,
  });

  res.status(201).json({
    success: true,
    message: "Cover letter duplicated successfully.",
    coverLetter: copy,
  });
}