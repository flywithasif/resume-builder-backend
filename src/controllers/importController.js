import {
  analyzeDocument,
} from "../utils/aiDocumentParser.js";

import {
  extractDocumentText,
} from "../utils/documentParser.js";

/*
|--------------------------------------------------------------------------
| Import Resume
|--------------------------------------------------------------------------
*/

export const importResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF or DOCX resume.",
      });
    }

    const extractedText =
      await extractDocumentText(req.file);

    if (!extractedText?.trim()) {
      return res.status(422).json({
        success: false,
        message:
          "Could not extract readable text from this document.",
      });
    }

    const data = await analyzeDocument(
      extractedText,
      "resume",
    );

    return res.status(200).json({
      success: true,
      message:
        "Resume imported successfully.",
      documentType: "resume",
      data,
      extractedCharacters:
        extractedText.length,
    });
  } catch (error) {
    console.error(
      "Resume Import Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to import resume.",
    });
  }
};

/*
|--------------------------------------------------------------------------
| Import Cover Letter
|--------------------------------------------------------------------------
*/

export const importCoverLetter = async (
  req,
  res,
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload a PDF or DOCX cover letter.",
      });
    }

    const extractedText =
      await extractDocumentText(req.file);

    if (!extractedText?.trim()) {
      return res.status(422).json({
        success: false,
        message:
          "Could not extract readable text from this document.",
      });
    }

    const data = await analyzeDocument(
      extractedText,
      "coverLetter",
    );

    return res.status(200).json({
      success: true,
      message:
        "Cover letter imported successfully.",
      documentType: "coverLetter",
      data,
      extractedCharacters:
        extractedText.length,
    });
  } catch (error) {
    console.error(
      "Cover Letter Import Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to import cover letter.",
    });
  }
};