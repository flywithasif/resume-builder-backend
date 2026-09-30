import mammoth from "mammoth";
import * as pdfModule from "pdf-parse";

/*
|--------------------------------------------------------------------------
| Extract PDF Text
|--------------------------------------------------------------------------
*/

async function extractPdfText(buffer) {
  /*
  |--------------------------------------------------------------------
  | Older pdf-parse versions
  |--------------------------------------------------------------------
  */

  if (typeof pdfModule.default === "function") {
    const result = await pdfModule.default(buffer);

    return result?.text || "";
  }

  /*
  |--------------------------------------------------------------------
  | Newer pdf-parse versions
  |--------------------------------------------------------------------
  */

  if (typeof pdfModule.PDFParse === "function") {
    const parser = new pdfModule.PDFParse({
      data: buffer,
    });

    const result = await parser.getText();

    if (typeof parser.destroy === "function") {
      await parser.destroy();
    }

    return result?.text || "";
  }

  throw new Error(
    "Unsupported pdf-parse version.",
  );
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

  if (mimeType === "application/pdf") {
    return extractPdfText(file.buffer);
  }

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