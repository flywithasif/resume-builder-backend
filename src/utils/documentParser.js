import mammoth from "mammoth";

/*
|--------------------------------------------------------------------------
| Extract PDF Text
|--------------------------------------------------------------------------
|
| IMPORTANT:
| pdf-parse is loaded lazily inside the PDF function.
| This prevents the Vercel serverless function from crashing during
| startup when PDF dependencies are not needed.
|
|--------------------------------------------------------------------------
*/

async function extractPdfText(buffer) {
  try {
    /*
    |--------------------------------------------------------------------------
    | Load pdf-parse only when a PDF is actually uploaded
    |--------------------------------------------------------------------------
    */

    const pdfModule = await import("pdf-parse");

    /*
    |--------------------------------------------------------------------------
    | Newer pdf-parse versions
    |--------------------------------------------------------------------------
    */

    if (typeof pdfModule.PDFParse === "function") {
      const parser = new pdfModule.PDFParse({
        data: buffer,
      });

      try {
        const result = await parser.getText();

        return result?.text || "";
      } finally {
        if (typeof parser.destroy === "function") {
          await parser.destroy();
        }
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Older pdf-parse versions
    |--------------------------------------------------------------------------
    */

    if (typeof pdfModule.default === "function") {
      const result = await pdfModule.default(buffer);

      return result?.text || "";
    }

    throw new Error(
      "Unsupported pdf-parse version.",
    );
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