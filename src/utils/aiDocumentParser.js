/*
|--------------------------------------------------------------------------
| Free Local Document Parser
|--------------------------------------------------------------------------
|
| This parser does NOT use OpenAI or any paid API.
|
| Supported:
| - Resume
| - Cover Letter
|
| Input:
| - Extracted plain text from PDF/DOCX
|
| Output:
| - Same structure expected by the frontend Builder
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function cleanText(value = "") {
  return String(value)
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanLine(value = "") {
  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

function createId(prefix, index = 0) {
  return `${prefix}-${Date.now()}-${index}`;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function getLines(text = "") {
  return cleanText(text)
    .split("\n")
    .map((line) => cleanLine(line))
    .filter(Boolean);
}

function getLowerLines(lines = []) {
  return lines.map((line) => line.toLowerCase());
}

function findSectionIndex(lines, patterns) {
  const lowerLines = getLowerLines(lines);

  return lowerLines.findIndex((line) =>
    patterns.some((pattern) => line === pattern || line.startsWith(`${pattern}:`)),
  );
}

function isSectionHeading(line = "") {
  const value = line
    .toLowerCase()
    .replace(/[:\-]/g, "")
    .trim();

  const headings = [
    "summary",
    "professional summary",
    "profile",
    "professional profile",
    "objective",
    "career objective",
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "education",
    "academic background",
    "skills",
    "technical skills",
    "core skills",
    "projects",
    "personal projects",
    "certifications",
    "certificates",
    "languages",
    "language",
  ];

  return headings.includes(value);
}

function getSection(lines, patterns) {
  const startIndex = findSectionIndex(lines, patterns);

  if (startIndex === -1) {
    return [];
  }

  const result = [];

  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (isSectionHeading(lines[index])) {
      break;
    }

    result.push(lines[index]);
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| Personal Information
|--------------------------------------------------------------------------
*/

function extractEmail(text) {
  const match = text.match(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  );

  return match ? match[0] : "";
}

function extractPhone(text) {
  const matches = text.match(
    /(?:\+?\d[\d\s().-]{8,}\d)/g,
  );

  if (!matches?.length) {
    return "";
  }

  const phone = matches.find((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  });

  return phone ? cleanLine(phone) : "";
}

function extractWebsite(text) {
  const match = text.match(
    /(?:https?:\/\/|www\.)[^\s]+/i,
  );

  if (match) {
    return match[0].replace(/[),.;]+$/, "");
  }

  const domainMatch = text.match(
    /\b[a-z0-9-]+\.(?:com|in|org|net|co|io)\b/i,
  );

  return domainMatch ? domainMatch[0] : "";
}

function extractLocation(lines) {
  const locationPatterns = [
    /^location\s*[:\-]\s*(.+)$/i,
    /^address\s*[:\-]\s*(.+)$/i,
    /^city\s*[:\-]\s*(.+)$/i,
  ];

  for (const line of lines) {
    for (const pattern of locationPatterns) {
      const match = line.match(pattern);

      if (match?.[1]) {
        return cleanLine(match[1]);
      }
    }
  }

  return "";
}

function looksLikeName(line = "") {
  if (!line || line.length > 70) {
    return false;
  }

  if (
    line.includes("@") ||
    /\d{4}/.test(line) ||
    /\d{5,}/.test(line)
  ) {
    return false;
  }

  if (isSectionHeading(line)) {
    return false;
  }

  const words = line.split(/\s+/);

  if (words.length < 2 || words.length > 5) {
    return false;
  }

  return words.every((word) =>
    /^[A-Za-zÀ-ÿ.'-]+$/.test(word),
  );
}

function extractName(lines) {
  const emailIndex = lines.findIndex((line) =>
    /@/.test(line),
  );

  /*
  |--------------------------------------------------------------------------
  | First try lines immediately before email
  |--------------------------------------------------------------------------
  */

  if (emailIndex > 0) {
    for (
      let index = emailIndex - 1;
      index >= Math.max(0, emailIndex - 4);
      index -= 1
    ) {
      if (looksLikeName(lines[index])) {
        return lines[index];
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Otherwise inspect the first few lines
  |--------------------------------------------------------------------------
  */

  for (const line of lines.slice(0, 8)) {
    if (looksLikeName(line)) {
      return line;
    }
  }

  return "";
}

function splitName(name = "") {
  const parts = cleanLine(name).split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

/*
|--------------------------------------------------------------------------
| Professional Title
|--------------------------------------------------------------------------
*/

function extractTitle(lines, name) {
  const titlePatterns = [
    /^title\s*[:\-]\s*(.+)$/i,
    /^designation\s*[:\-]\s*(.+)$/i,
    /^role\s*[:\-]\s*(.+)$/i,
    /^position\s*[:\-]\s*(.+)$/i,
  ];

  for (const line of lines) {
    for (const pattern of titlePatterns) {
      const match = line.match(pattern);

      if (match?.[1]) {
        return cleanLine(match[1]);
      }
    }
  }

  const nameIndex = name
    ? lines.findIndex(
        (line) =>
          line.toLowerCase() === name.toLowerCase(),
      )
    : -1;

  if (nameIndex !== -1) {
    const nextLines = lines.slice(
      nameIndex + 1,
      nameIndex + 4,
    );

    for (const line of nextLines) {
      if (
        line.includes("@") ||
        /\d{5,}/.test(line) ||
        /^https?:\/\//i.test(line)
      ) {
        continue;
      }

      if (
        !isSectionHeading(line) &&
        line.length <= 100
      ) {
        return line;
      }
    }
  }

  return "";
}

/*
|--------------------------------------------------------------------------
| Summary
|--------------------------------------------------------------------------
*/

function extractSummary(lines) {
  const section = getSection(lines, [
    "summary",
    "professional summary",
    "profile",
    "professional profile",
    "objective",
    "career objective",
  ]);

  return section.join(" ").trim();
}

/*
|--------------------------------------------------------------------------
| Experience
|--------------------------------------------------------------------------
*/

function looksLikeDateRange(line = "") {
  return (
    /\b(19|20)\d{2}\b/.test(line) ||
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i.test(
      line,
    ) ||
    /\bpresent\b/i.test(line) ||
    /\bcurrent\b/i.test(line)
  );
}

function parseDateRange(line = "") {
  const normalized = line
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  const parts = normalized.split(/\s+-\s+/);

  if (parts.length >= 2) {
    return {
      startDate: cleanLine(parts[0]),
      endDate: cleanLine(parts.slice(1).join(" - ")),
    };
  }

  const yearMatches = normalized.match(
    /\b(?:19|20)\d{2}\b/g,
  );

  if (yearMatches?.length >= 2) {
    return {
      startDate: yearMatches[0],
      endDate: yearMatches[1],
    };
  }

  if (/present|current/i.test(normalized)) {
    const startMatch = normalized.match(
      /\b(?:19|20)\d{2}\b/,
    );

    return {
      startDate: startMatch?.[0] || "",
      endDate: /current/i.test(normalized)
        ? "Current"
        : "Present",
    };
  }

  return {
    startDate: "",
    endDate: "",
  };
}

function parseExperience(lines) {
  const section = getSection(lines, [
    "experience",
    "work experience",
    "professional experience",
    "employment history",
  ]);

  if (!section.length) {
    return [];
  }

  const experiences = [];
  let current = null;

  const flush = () => {
    if (!current) {
      return;
    }

    if (
      current.company ||
      current.position ||
      current.description
    ) {
      experiences.push({
        ...current,
        description: current.description
          .trim(),
      });
    }

    current = null;
  };

  for (const line of section) {
    if (looksLikeDateRange(line)) {
      if (!current) {
        current = {
          company: "",
          position: "",
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        };
      }

      const dates = parseDateRange(line);

      current.startDate = dates.startDate;
      current.endDate = dates.endDate;

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Detect common "Position | Company" patterns
    |--------------------------------------------------------------------------
    */

    if (!current) {
      const separators = line.split(
        /\s+\|\s+|\s+@\s+|\s+at\s+/i,
      );

      if (separators.length >= 2) {
        current = {
          company: cleanLine(separators[1]),
          position: cleanLine(separators[0]),
          location: "",
          startDate: "",
          endDate: "",
          description: "",
        };

        continue;
      }

      current = {
        company: "",
        position: line,
        location: "",
        startDate: "",
        endDate: "",
        description: "",
      };

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Location
    |--------------------------------------------------------------------------
    */

    if (
      !current.location &&
      /^(?:location|based in|city)\s*[:\-]/i.test(
        line,
      )
    ) {
      current.location = cleanLine(
        line.replace(
          /^(?:location|based in|city)\s*[:\-]\s*/i,
          "",
        ),
      );

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Company
    |--------------------------------------------------------------------------
    */

    if (!current.company) {
      current.company = line;
      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Description
    |--------------------------------------------------------------------------
    */

    current.description += `${
      current.description ? " " : ""
    }${line}`;
  }

  flush();

  return experiences.map((item, index) => ({
    id: createId("experience", index),
    company: item.company || "",
    position: item.position || "",
    location: item.location || "",
    startDate: item.startDate || "",
    endDate: item.endDate || "",
    description: item.description || "",
  }));
}

/*
|--------------------------------------------------------------------------
| Education
|--------------------------------------------------------------------------
*/

function parseEducation(lines) {
  const section = getSection(lines, [
    "education",
    "academic background",
  ]);

  if (!section.length) {
    return [];
  }

  const education = [];
  let current = null;

  const flush = () => {
    if (!current) {
      return;
    }

    if (
      current.school ||
      current.degree
    ) {
      education.push({
        ...current,
      });
    }

    current = null;
  };

  for (const line of section) {
    if (looksLikeDateRange(line)) {
      if (!current) {
        current = {
          school: "",
          degree: "",
          location: "",
          startDate: "",
          endDate: "",
        };
      }

      const dates = parseDateRange(line);

      current.startDate = dates.startDate;
      current.endDate = dates.endDate;

      continue;
    }

    if (!current) {
      current = {
        school: line,
        degree: "",
        location: "",
        startDate: "",
        endDate: "",
      };

      continue;
    }

    if (!current.degree) {
      current.degree = line;
      continue;
    }

    if (
      !current.location &&
      /^(?:location|city)\s*[:\-]/i.test(
        line,
      )
    ) {
      current.location = cleanLine(
        line.replace(
          /^(?:location|city)\s*[:\-]\s*/i,
          "",
        ),
      );

      continue;
    }

    if (!current.school) {
      current.school = line;
    }
  }

  flush();

  return education.map((item, index) => ({
    id: createId("education", index),
    school: item.school || "",
    degree: item.degree || "",
    location: item.location || "",
    startDate: item.startDate || "",
    endDate: item.endDate || "",
  }));
}

/*
|--------------------------------------------------------------------------
| Skills
|--------------------------------------------------------------------------
*/

function parseSkills(lines) {
  const section = getSection(lines, [
    "skills",
    "technical skills",
    "core skills",
  ]);

  if (!section.length) {
    return [];
  }

  const skills = [];

  for (const line of section) {
    const values = line
      .split(/[,|•·;]/)
      .map((value) => cleanLine(value))
      .filter(Boolean);

    skills.push(...values);
  }

  return unique(skills);
}

/*
|--------------------------------------------------------------------------
| Projects
|--------------------------------------------------------------------------
*/

function parseProjects(lines) {
  const section = getSection(lines, [
    "projects",
    "personal projects",
  ]);

  if (!section.length) {
    return [];
  }

  const projects = [];
  let current = null;

  const flush = () => {
    if (!current) {
      return;
    }

    if (
      current.name ||
      current.description
    ) {
      projects.push({
        ...current,
      });
    }

    current = null;
  };

  for (const line of section) {
    if (!current) {
      current = {
        name: line,
        link: "",
        description: "",
      };

      continue;
    }

    if (
      !current.link &&
      /(?:https?:\/\/|www\.|\.com|\.in|\.org)/i.test(
        line,
      )
    ) {
      current.link = line;
      continue;
    }

    current.description += `${
      current.description ? " " : ""
    }${line}`;
  }

  flush();

  return projects.map((item, index) => ({
    id: createId("project", index),
    name: item.name || "",
    link: item.link || "",
    description: item.description || "",
  }));
}

/*
|--------------------------------------------------------------------------
| Certifications
|--------------------------------------------------------------------------
*/

function parseCertifications(lines) {
  const section = getSection(lines, [
    "certifications",
    "certificates",
  ]);

  if (!section.length) {
    return [];
  }

  return section.map((line, index) => {
    const yearMatch = line.match(
      /\b(?:19|20)\d{2}\b/,
    );

    const year = yearMatch?.[0] || "";

    const withoutYear = year
      ? line.replace(year, "").trim()
      : line;

    const parts = withoutYear.split(
      /\s+-\s+|\s+\|\s+|,\s*/,
    );

    return {
      id: createId("certification", index),
      name: cleanLine(parts[0] || withoutYear),
      issuer: cleanLine(parts[1] || ""),
      year,
    };
  });
}

/*
|--------------------------------------------------------------------------
| Languages
|--------------------------------------------------------------------------
*/

function parseLanguages(lines) {
  const section = getSection(lines, [
    "languages",
    "language",
  ]);

  if (!section.length) {
    return [];
  }

  const languages = [];

  for (const line of section) {
    const values = line.split(
      /\s*[-|:]\s*/,
    );

    languages.push({
      id: createId(
        "language",
        languages.length,
      ),
      name: cleanLine(values[0] || ""),
      level: cleanLine(
        values.slice(1).join(" - "),
      ),
    });
  }

  return languages.filter(
    (language) => language.name,
  );
}

/*
|--------------------------------------------------------------------------
| Resume Parser
|--------------------------------------------------------------------------
*/

function parseResume(text) {
  const cleanedText = cleanText(text);
  const lines = getLines(cleanedText);

  const fullName = extractName(lines);
  const name = splitName(fullName);

  const email = extractEmail(cleanedText);
  const phone = extractPhone(cleanedText);
  const website = extractWebsite(cleanedText);
  const location = extractLocation(lines);
  const title = extractTitle(
    lines,
    fullName,
  );

  return {
    personal: {
      firstName: name.firstName,
      lastName: name.lastName,
      title,
      email,
      phone,
      location,
      website,
    },

    summary: extractSummary(lines),

    experience: parseExperience(lines),

    education: parseEducation(lines),

    skills: parseSkills(lines),

    projects: parseProjects(lines),

    certifications:
      parseCertifications(lines),

    languages: parseLanguages(lines),
  };
}

/*
|--------------------------------------------------------------------------
| Cover Letter Parser
|--------------------------------------------------------------------------
*/

function extractField(
  lines,
  patterns,
) {
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);

      if (match?.[1]) {
        return cleanLine(match[1]);
      }
    }
  }

  return "";
}

function parseCoverLetter(text) {
  const cleanedText = cleanText(text);
  const lines = getLines(cleanedText);

  const email = extractEmail(cleanedText);
  const phone = extractPhone(cleanedText);
  const location = extractLocation(lines);

  const fullName = extractField(lines, [
    /^name\s*[:\-]\s*(.+)$/i,
    /^from\s*[:\-]\s*(.+)$/i,
  ]);

  const position = extractField(lines, [
    /^position\s*[:\-]\s*(.+)$/i,
    /^role\s*[:\-]\s*(.+)$/i,
    /^job title\s*[:\-]\s*(.+)$/i,
  ]);

  const company = extractField(lines, [
    /^company\s*[:\-]\s*(.+)$/i,
    /^organization\s*[:\-]\s*(.+)$/i,
  ]);

  const hiringManager = extractField(lines, [
    /^hiring manager\s*[:\-]\s*(.+)$/i,
    /^dear\s+(.+)$/i,
  ]);

  const companyAddress = extractField(lines, [
    /^company address\s*[:\-]\s*(.+)$/i,
    /^address\s*[:\-]\s*(.+)$/i,
  ]);

  const date = extractField(lines, [
    /^date\s*[:\-]\s*(.+)$/i,
  ]);

  const greeting = extractField(lines, [
    /^greeting\s*[:\-]\s*(.+)$/i,
  ]);

  const signOff = extractField(lines, [
    /^sign\s*off\s*[:\-]\s*(.+)$/i,
    /^sincerely\s*[,:\-]?\s*(.+)$/i,
    /^regards\s*[,:\-]?\s*(.+)$/i,
  ]);

  const opening = extractField(lines, [
    /^opening\s*[:\-]\s*(.+)$/i,
  ]);

  const body = extractField(lines, [
    /^body\s*[:\-]\s*(.+)$/i,
  ]);

  const secondBody = extractField(lines, [
    /^second body\s*[:\-]\s*(.+)$/i,
  ]);

  const closing = extractField(lines, [
    /^closing\s*[:\-]\s*(.+)$/i,
  ]);

  return {
    fullName,
    position,
    company,
    hiringManager,
    companyAddress,
    date,
    email,
    phone,
    location,
    greeting,
    opening,
    body,
    secondBody,
    closing,
    signOff,
  };
}

/*
|--------------------------------------------------------------------------
| Analyze Document
|--------------------------------------------------------------------------
|
| This function keeps the same API expected by importController.js.
|
|--------------------------------------------------------------------------
*/

export async function analyzeDocument(
  text,
  documentType,
) {
  if (!text?.trim()) {
    throw new Error(
      "No readable text was found in the document.",
    );
  }

  const MAX_TEXT_LENGTH = 60000;

  const documentText =
    text.length > MAX_TEXT_LENGTH
      ? text.slice(0, MAX_TEXT_LENGTH)
      : text;

  if (documentType === "resume") {
    return parseResume(documentText);
  }

  if (
    documentType === "cover-letter" ||
    documentType === "coverLetter"
  ) {
    return parseCoverLetter(documentText);
  }

  throw new Error(
    "Unsupported document type.",
  );
}