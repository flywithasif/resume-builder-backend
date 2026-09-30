import OpenAI from "openai";

/*
|--------------------------------------------------------------------------
| OpenAI Client
|--------------------------------------------------------------------------
*/

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn(
    "OPENAI_API_KEY is not configured.",
  );
}

const openai = new OpenAI({
  apiKey,
});

/*
|--------------------------------------------------------------------------
| AI Model
|--------------------------------------------------------------------------
*/

const MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-5-mini";

/*
|--------------------------------------------------------------------------
| Resume Schema
|--------------------------------------------------------------------------
*/

const resumeSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    personal: {
      type: "object",
      additionalProperties: false,

      properties: {
        firstName: {
          type: "string",
        },

        lastName: {
          type: "string",
        },

        title: {
          type: "string",
        },

        email: {
          type: "string",
        },

        phone: {
          type: "string",
        },

        location: {
          type: "string",
        },

        website: {
          type: "string",
        },
      },

      required: [
        "firstName",
        "lastName",
        "title",
        "email",
        "phone",
        "location",
        "website",
      ],
    },

    summary: {
      type: "string",
    },

    experience: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          id: {
            type: "string",
          },

          company: {
            type: "string",
          },

          position: {
            type: "string",
          },

          location: {
            type: "string",
          },

          startDate: {
            type: "string",
          },

          endDate: {
            type: "string",
          },

          description: {
            type: "string",
          },
        },

        required: [
          "id",
          "company",
          "position",
          "location",
          "startDate",
          "endDate",
          "description",
        ],
      },
    },

    education: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          id: {
            type: "string",
          },

          school: {
            type: "string",
          },

          degree: {
            type: "string",
          },

          location: {
            type: "string",
          },

          startDate: {
            type: "string",
          },

          endDate: {
            type: "string",
          },
        },

        required: [
          "id",
          "school",
          "degree",
          "location",
          "startDate",
          "endDate",
        ],
      },
    },

    skills: {
      type: "array",

      items: {
        type: "string",
      },
    },

    projects: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          id: {
            type: "string",
          },

          name: {
            type: "string",
          },

          link: {
            type: "string",
          },

          description: {
            type: "string",
          },
        },

        required: [
          "id",
          "name",
          "link",
          "description",
        ],
      },
    },

    certifications: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          id: {
            type: "string",
          },

          name: {
            type: "string",
          },

          issuer: {
            type: "string",
          },

          year: {
            type: "string",
          },
        },

        required: [
          "id",
          "name",
          "issuer",
          "year",
        ],
      },
    },

    languages: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          id: {
            type: "string",
          },

          name: {
            type: "string",
          },

          level: {
            type: "string",
          },
        },

        required: [
          "id",
          "name",
          "level",
        ],
      },
    },
  },

  required: [
    "personal",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
  ],
};

/*
|--------------------------------------------------------------------------
| Cover Letter Schema
|--------------------------------------------------------------------------
*/

const coverLetterSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    fullName: {
      type: "string",
    },

    position: {
      type: "string",
    },

    company: {
      type: "string",
    },

    hiringManager: {
      type: "string",
    },

    companyAddress: {
      type: "string",
    },

    date: {
      type: "string",
    },

    email: {
      type: "string",
    },

    phone: {
      type: "string",
    },

    location: {
      type: "string",
    },

    greeting: {
      type: "string",
    },

    opening: {
      type: "string",
    },

    body: {
      type: "string",
    },

    secondBody: {
      type: "string",
    },

    closing: {
      type: "string",
    },

    signOff: {
      type: "string",
    },
  },

  required: [
    "fullName",
    "position",
    "company",
    "hiringManager",
    "companyAddress",
    "date",
    "email",
    "phone",
    "location",
    "greeting",
    "opening",
    "body",
    "secondBody",
    "closing",
    "signOff",
  ],
};

/*
|--------------------------------------------------------------------------
| Analyze Document
|--------------------------------------------------------------------------
*/

export async function analyzeDocument(
  text,
  documentType,
) {
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured on the backend.",
    );
  }

  if (!text?.trim()) {
    throw new Error(
      "No readable text was found in the document.",
    );
  }

  /*
  |--------------------------------------------------------------------
  | Prevent excessively large requests
  |--------------------------------------------------------------------
  */

  const MAX_TEXT_LENGTH = 60000;

  const documentText =
    text.length > MAX_TEXT_LENGTH
      ? text.slice(0, MAX_TEXT_LENGTH)
      : text;

  const isResume =
    documentType === "resume";

  const schema = isResume
    ? resumeSchema
    : coverLetterSchema;

  const systemPrompt = isResume
    ? `
You are a professional resume information extraction system.

Extract ONLY information that is actually present in the provided resume.

Rules:
- Never invent information.
- Never guess missing information.
- Keep missing string fields empty.
- Keep missing arrays empty.
- Preserve the meaning of the original information.
- Do not add achievements, companies, skills, dates, education, or other information that is not present.
- Return only the requested JSON structure.
- IDs may be generated as simple strings for extracted array items.
`
    : `
You are a professional cover-letter information extraction system.

Extract ONLY information that is actually present in the provided cover letter.

Rules:
- Never invent information.
- Never guess missing information.
- Keep missing string fields empty.
- Preserve the meaning of the original text.
- Do not rewrite or improve the content.
- Return only the requested JSON structure.
`;

  const response =
    await openai.responses.create({
      model: MODEL,

      input: [
        {
          role: "system",
          content: systemPrompt,
        },

        {
          role: "user",
          content: `
Extract the information from this document.

Document type:
${documentType}

Document text:

${documentText}
`,
        },
      ],

      text: {
        format: {
          type: "json_schema",
          name: isResume
            ? "resume_import"
            : "cover_letter_import",
          strict: true,
          schema,
        },
      },
    });

  const outputText =
    response.output_text?.trim();

  if (!outputText) {
    throw new Error(
      "AI did not return any extracted information.",
    );
  }

  try {
    return JSON.parse(outputText);
  } catch (error) {
    console.error(
      "AI JSON Parse Error:",
      error,
    );

    throw new Error(
      "AI returned an invalid document structure.",
    );
  }
}