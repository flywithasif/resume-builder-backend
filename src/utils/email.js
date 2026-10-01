/* =========================================================
   BREVO EMAIL SERVICE

   Used for:
   - Email verification OTP
   - Forgot password OTP
========================================================= */

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

/* =========================================================
   BREVO CONFIG
========================================================= */

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  const senderName =
    process.env.BREVO_SENDER_NAME?.trim() || "Resume Builder";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is missing.");
  }

  if (!senderEmail) {
    throw new Error("BREVO_SENDER_EMAIL is missing.");
  }

  if (!isValidEmail(senderEmail)) {
    throw new Error("BREVO_SENDER_EMAIL is not valid.");
  }

  return {
    apiKey,
    senderEmail,
    senderName,
  };
}

/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* =========================================================
   GENERIC EMAIL SENDER
========================================================= */

async function sendEmail({
  to,
  name,
  subject,
  htmlContent,
  textContent,
}) {
  const {
    apiKey,
    senderEmail,
    senderName,
  } = getBrevoConfig();

  const recipientEmail = String(to || "")
    .trim()
    .toLowerCase();

  const recipientName = String(name || "").trim();

  if (!recipientEmail) {
    throw new Error("Recipient email is missing.");
  }

  if (!isValidEmail(recipientEmail)) {
    throw new Error(
      `Recipient email is not valid: ${recipientEmail}`,
    );
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",

    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },

    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },

      to: [
        {
          email: recipientEmail,
          ...(recipientName
            ? { name: recipientName }
            : {}),
        },
      ],

      subject,
      htmlContent,
      textContent,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Brevo email error:", data);

    throw new Error(
      data?.message ||
        "Unable to send email. Please try again later.",
    );
  }

  return data;
}

/* =========================================================
   EMAIL VERIFICATION OTP
========================================================= */

export async function sendVerificationEmail({
  email,
  name,
  otp,
}) {
  return sendEmail({
    to: email,
    name,

    subject: "Verify your Resume Builder account",

    htmlContent: `
      <div
        style="
          margin:0;
          padding:40px 20px;
          background:#f7f7f5;
          font-family:Arial,Helvetica,sans-serif;
        "
      >
        <div
          style="
            max-width:520px;
            margin:0 auto;
            background:#ffffff;
            border:1px solid #e7e5e4;
            border-radius:16px;
            padding:36px;
          "
        >
          <h1
            style="
              margin:0 0 10px;
              color:#18181b;
              font-size:24px;
            "
          >
            Verify your email
          </h1>

          <p
            style="
              margin:0 0 24px;
              color:#52525b;
              font-size:15px;
              line-height:1.6;
            "
          >
            Hi ${escapeHtml(name || "there")},
            use the OTP below to verify your Resume Builder account.
          </p>

          <div
            style="
              margin:24px 0;
              padding:18px;
              text-align:center;
              background:#fafaf9;
              border:1px solid #e7e5e4;
              border-radius:12px;
            "
          >
            <div
              style="
                color:#71717a;
                font-size:12px;
                margin-bottom:8px;
                text-transform:uppercase;
                letter-spacing:1px;
              "
            >
              Verification Code
            </div>

            <div
              style="
                color:#18181b;
                font-size:32px;
                font-weight:700;
                letter-spacing:8px;
              "
            >
              ${otp}
            </div>
          </div>

          <p
            style="
              color:#71717a;
              font-size:13px;
              line-height:1.6;
            "
          >
            This OTP expires in 10 minutes.
            If you did not create this account, you can safely ignore
            this email.
          </p>

          <div
            style="
              margin-top:28px;
              padding-top:20px;
              border-top:1px solid #e7e5e4;
              color:#a1a1aa;
              font-size:12px;
            "
          >
            Resume Builder
          </div>
        </div>
      </div>
    `,

    textContent: `
Hi ${name || "there"},

Your Resume Builder verification code is:

${otp}

This OTP expires in 10 minutes.

If you did not create this account, please ignore this email.

Resume Builder
    `.trim(),
  });
}

/* =========================================================
   FORGOT PASSWORD OTP
========================================================= */

export async function sendPasswordResetEmail({
  email,
  name,
  otp,
}) {
  return sendEmail({
    to: email,
    name,

    subject: "Reset your Resume Builder password",

    htmlContent: `
      <div
        style="
          margin:0;
          padding:40px 20px;
          background:#f7f7f5;
          font-family:Arial,Helvetica,sans-serif;
        "
      >
        <div
          style="
            max-width:520px;
            margin:0 auto;
            background:#ffffff;
            border:1px solid #e7e5e4;
            border-radius:16px;
            padding:36px;
          "
        >
          <h1
            style="
              margin:0 0 10px;
              color:#18181b;
              font-size:24px;
            "
          >
            Reset your password
          </h1>

          <p
            style="
              margin:0 0 24px;
              color:#52525b;
              font-size:15px;
              line-height:1.6;
            "
          >
            Hi ${escapeHtml(name || "there")},
            we received a request to reset your password.
          </p>

          <div
            style="
              margin:24px 0;
              padding:18px;
              text-align:center;
              background:#fafaf9;
              border:1px solid #e7e5e4;
              border-radius:12px;
            "
          >
            <div
              style="
                color:#71717a;
                font-size:12px;
                margin-bottom:8px;
                text-transform:uppercase;
                letter-spacing:1px;
              "
            >
              Reset Code
            </div>

            <div
              style="
                color:#18181b;
                font-size:32px;
                font-weight:700;
                letter-spacing:8px;
              "
            >
              ${otp}
            </div>
          </div>

          <p
            style="
              color:#71717a;
              font-size:13px;
              line-height:1.6;
            "
          >
            This OTP expires in 10 minutes.
            If you did not request a password reset,
            you can safely ignore this email.
          </p>

          <div
            style="
              margin-top:28px;
              padding-top:20px;
              border-top:1px solid #e7e5e4;
              color:#a1a1aa;
              font-size:12px;
            "
          >
            Resume Builder
          </div>
        </div>
      </div>
    `,

    textContent: `
Hi ${name || "there"},

Your Resume Builder password reset code is:

${otp}

This OTP expires in 10 minutes.

If you did not request a password reset, please ignore this email.

Resume Builder
    `.trim(),
  });
}

/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}