import mammoth from "mammoth";
import {
  extractText,
  getDocumentProxy,
} from "unpdf";

/*
|--------------------------------------------------------------------------
| Extract PDF Text
|--------------------------------------------------------------------------
*/

async function extractPdfText(buffer) {
  try {
    const pdf = await getDocumentProxy(
      new Uint8Array(buffer),
    );

    const result = await extractText(pdf, {
      mergePages: true,
    });

    return result?.text || "";
  } catch (error) {
    console.error(
      "PDF parsing error:",
      error,
    );

    throw new Error(
      error?.message ||
        "Unable to read the PDF file.",
    );
  }
}

/*
|--------------------------------------------------------------------------
| Extract DOCX Text
|--------------------------------------------------------------------------
*/

async function extractDocxText(buffer) {
  const result =
    await mammoth.extractRawText({
      buffer,
    });

  return result?.value || "";
}

/*
|--------------------------------------------------------------------------
| Main Document Parser
|--------------------------------------------------------------------------
*/

export async function extractDocumentText(
  file,
) {
  if (!file?.buffer) {
    throw new Error(
      "No document was uploaded.",
    );
  }

  const mimeType = file.mimetype;

  /*
  |--------------------------------------------------------------------------
  | PDF
  |--------------------------------------------------------------------------
  */

  if (mimeType === "application/pdf") {
    return extractPdfText(file.buffer);
  }

  /*
  |--------------------------------------------------------------------------
  | DOCX
  |--------------------------------------------------------------------------
  */

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractDocxText(file.buffer);
  }

  throw new Error(
    "Only PDF and DOCX files are supported.",
  );
}