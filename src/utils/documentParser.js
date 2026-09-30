import mammoth from "mammoth";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

/*
|--------------------------------------------------------------------------
| Extract PDF Text
|--------------------------------------------------------------------------
*/

async function extractPdfText(buffer) {
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  });

  const pdf = await loadingTask.promise;

  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);

    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item) => item.str || "")
      .join(" ");

    pages.push(pageText);
  }

  return pages.join("\n\n").trim();
}

/*
|--------------------------------------------------------------------------
| Extract DOCX Text
|--------------------------------------------------------------------------
*/

async function extractDocxText(buffer) {
  const result = await mammoth.extractRawText({
    buffer,
  });

  return result?.value || "";
}

/*
|--------------------------------------------------------------------------
| Main Document Parser
|--------------------------------------------------------------------------
*/

export async function extractDocumentText(file) {
  if (!file?.buffer) {
    throw new Error("No document was uploaded.");
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

  throw new Error("Only PDF and DOCX files are supported.");
}