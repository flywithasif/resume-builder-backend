export function calculateResumeProgress(resume = {}) {
  const checks = [
    Boolean(
      resume.personal?.firstName &&
        resume.personal?.lastName &&
        resume.personal?.email &&
        resume.personal?.title
    ),

    Boolean(resume.summary?.trim()),

    Array.isArray(resume.experience) &&
      resume.experience.length > 0,

    Array.isArray(resume.education) &&
      resume.education.length > 0,

    Array.isArray(resume.skills) &&
      resume.skills.filter(Boolean).length >= 3,

    Array.isArray(resume.projects) &&
      resume.projects.length > 0,

    Array.isArray(resume.certifications) &&
      resume.certifications.length > 0,

    Array.isArray(resume.languages) &&
      resume.languages.length > 0,
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round((completed / checks.length) * 100);
}

export function makeResumeTitle(resume = {}) {
  const firstName = resume.personal?.firstName?.trim();
  const lastName = resume.personal?.lastName?.trim();
  const title = resume.personal?.title?.trim();

  const name = [firstName, lastName]
    .filter(Boolean)
    .join(" ");

  if (name && title) {
    return `${name} — ${title}`;
  }

  if (name) {
    return `${name} Resume`;
  }

  if (title) {
    return `${title} Resume`;
  }

  return "Untitled Resume";
}