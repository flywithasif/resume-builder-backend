import crypto from "crypto";

import bcrypt from "bcryptjs";

import User from "../models/User.js";

import { signToken } from "../utils/jwt.js";

import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/email.js";

/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const defaultSettings = {
  theme: "light",
  defaultTemplate: "executive",
  accent: "champagne",

  compactMode: false,
  reducedMotion: false,

  autosave: true,
  autosaveInterval: "30",
  showCompletionTips: true,
  spellcheck: true,
  showPageBreaks: true,

  emailNotifications: true,
  resumeReminders: true,
  securityAlerts: true,
  productUpdates: false,

  profileVisibility: "private",
  analytics: false,
};

/* =========================================================
   CONSTANTS
========================================================= */

const OTP_EXPIRY_MINUTES = Number(
  process.env.OTP_EXPIRES_MINUTES || 10,
);

const OTP_EXPIRY_MS =
  OTP_EXPIRY_MINUTES * 60 * 1000;

/* =========================================================
   HELPERS
========================================================= */

function getPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    emailVerified: Boolean(user.emailVerified),

    settings: {
      ...defaultSettings,
      ...(user.settings || {}),
    },
  };
}

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function normalizePhone(phone) {
  let value = String(phone || "")
    .trim()
    .replace(/[\s()-]/g, "");

  if (value.startsWith("+91")) {
    value = value.slice(3);
  }

  if (value.startsWith("91") && value.length === 12) {
    value = value.slice(2);
  }

  if (!/^\d{10}$/.test(value)) {
    return "";
  }

  return `+91${value}`;
}

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

async function verifyOtp(otp, hash) {
  if (!otp || !hash) {
    return false;
  }

  return bcrypt.compare(otp, hash);
}

/* =========================================================
   REGISTER
========================================================= */

export async function register(req, res) {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, mobile number, password and confirm password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const normalizedEmail =
      normalizeEmail(email);

    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit Indian mobile number.",
      });
    }

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      if (!existingEmail.emailVerified) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email exists but is not verified. Please verify your email or request a new OTP.",
          emailVerificationRequired: true,
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const existingPhone = await User.findOne({
      phone: normalizedPhone,
    });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this mobile number already exists.",
      });
    }

    const otp = generateOtp();

    const emailOtpHash =
      await hashOtp(otp);

    const emailOtpExpiresAt =
      new Date(Date.now() + OTP_EXPIRY_MS);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password,

      emailVerified: false,

      emailOtpHash,
      emailOtpExpiresAt,

      settings: defaultSettings,
    });

    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      await User.findByIdAndDelete(user._id);

      console.error(
        "Registration email error:",
        emailError,
      );

      return res.status(503).json({
        success: false,
        message:
          "Unable to send verification email. Please try again later.",
      });
    }

    res.status(201).json({
      success: true,

      message:
        "Account created. Please verify your email using the OTP sent to your email address.",

      emailVerificationRequired: true,

      email: user.email,
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while creating your account.",
    });
  }
}

/* =========================================================
   VERIFY EMAIL OTP
========================================================= */

export async function verifyEmail(req, res) {
  try {
    const {
      email,
      otp,
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailOtpHash +emailOtpExpiresAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (user.emailVerified) {
      return res.json({
        success: true,
        message: "Email is already verified.",
      });
    }

    if (
      !user.emailOtpExpiresAt ||
      user.emailOtpExpiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    const validOtp = await verifyOtp(
      String(otp).trim(),
      user.emailOtpHash,
    );

    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    user.emailVerified = true;

    user.emailOtpHash = "";
    user.emailOtpExpiresAt = null;

    await user.save();

    const token = signToken(
      user._id.toString(),
    );

    res.json({
      success: true,

      message:
        "Email verified successfully.",

      token,

      user: getPublicUser(user),
    });
  } catch (error) {
    console.error(
      "Verify email error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while verifying your email.",
    });
  }
}

/* =========================================================
   RESEND EMAIL OTP
========================================================= */

export async function resendEmailOtp(req, res) {
  try {
    const {
      email,
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+emailOtpHash +emailOtpExpiresAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const otp = generateOtp();

    user.emailOtpHash =
      await hashOtp(otp);

    user.emailOtpExpiresAt =
      new Date(Date.now() + OTP_EXPIRY_MS);

    await user.save();

    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      console.error(
        "Resend OTP email error:",
        emailError,
      );

      return res.status(503).json({
        success: false,
        message:
          "Unable to send OTP email. Please try again later.",
      });
    }

    res.json({
      success: true,
      message:
        "A new verification OTP has been sent to your email.",
    });
  } catch (error) {
    console.error(
      "Resend email OTP error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while resending the OTP.",
    });
  }
}

/* =========================================================
   LOGIN
   Email + Password
   OR
   Mobile + Password
========================================================= */

export async function login(req, res) {
  try {
    const {
      email,
      phone,
      password,
    } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    let user;

    if (email?.trim()) {
      user = await User.findOne({
        email: normalizeEmail(email),
      }).select(
        "+password",
      );
    } else if (phone?.trim()) {
      const normalizedPhone =
        normalizePhone(phone);

      if (!normalizedPhone) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid 10-digit mobile number.",
        });
      }

      user = await User.findOne({
        phone: normalizedPhone,
      }).select(
        "+password",
      );
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Email or mobile number is required.",
      });
    }

    if (
      !user ||
      !(await user.comparePassword(password))
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email/mobile number or password.",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in.",
        emailVerificationRequired: true,
        email: user.email,
      });
    }

    const token = signToken(
      user._id.toString(),
    );

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: getPublicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while logging in.",
    });
  }
}

/* =========================================================
   FORGOT PASSWORD
========================================================= */

export async function forgotPassword(req, res) {
  try {
    const {
      email,
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+resetOtpHash +resetOtpExpiresAt +resetOtpVerifiedUntil",
    );

    /*
      We intentionally use the same success response
      whether or not the email exists.
      This prevents account enumeration.
    */

    if (!user) {
      return res.json({
        success: true,
        message:
          "If an account exists with this email, a password reset OTP has been sent.",
      });
    }

    if (!user.emailVerified) {
      return res.status(400).json({
        success: false,
        message:
          "Please verify your email before resetting your password.",
        emailVerificationRequired: true,
      });
    }

    const otp = generateOtp();

    user.resetOtpHash =
      await hashOtp(otp);

    user.resetOtpExpiresAt =
      new Date(Date.now() + OTP_EXPIRY_MS);

    user.resetOtpVerifiedUntil = null;

    await user.save();

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (emailError) {
      console.error(
        "Password reset email error:",
        emailError,
      );

      user.resetOtpHash = "";
      user.resetOtpExpiresAt = null;

      await user.save();

      return res.status(503).json({
        success: false,
        message:
          "Unable to send reset email. Please try again later.",
      });
    }

    res.json({
      success: true,
      message:
        "If an account exists with this email, a password reset OTP has been sent.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong. Please try again later.",
    });
  }
}

/* =========================================================
   VERIFY RESET OTP
========================================================= */

export async function verifyResetOtp(req, res) {
  try {
    const {
      email,
      otp,
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email and OTP are required.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+resetOtpHash +resetOtpExpiresAt +resetOtpVerifiedUntil",
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    if (
      !user.resetOtpExpiresAt ||
      user.resetOtpExpiresAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    const validOtp = await verifyOtp(
      String(otp).trim(),
      user.resetOtpHash,
    );

    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    user.resetOtpVerifiedUntil =
      new Date(Date.now() + 15 * 60 * 1000);

    user.resetOtpHash = "";
    user.resetOtpExpiresAt = null;

    await user.save();

    res.json({
      success: true,
      message:
        "OTP verified. You can now create a new password.",
    });
  } catch (error) {
    console.error(
      "Verify reset OTP error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while verifying the OTP.",
    });
  }
}

/* =========================================================
   RESET PASSWORD
========================================================= */

export async function resetPassword(req, res) {
  try {
    const {
      email,
      newPassword,
      confirmPassword,
    } = req.body;

    const normalizedEmail =
      normalizeEmail(email);

    if (
      !normalizedEmail ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email, new password and confirm password are required.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Passwords do not match.",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      "+password +resetOtpVerifiedUntil",
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Unable to reset password.",
      });
    }

    if (
      !user.resetOtpVerifiedUntil ||
      user.resetOtpVerifiedUntil < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset verification has expired. Please request a new OTP.",
      });
    }

    const samePassword =
      await user.comparePassword(
        newPassword,
      );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your old password.",
      });
    }

    user.password = newPassword;
    user.resetOtpVerifiedUntil = null;

    await user.save();

    res.json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error,
    );

    res.status(500).json({
      success: false,
      message:
        "Something went wrong while resetting your password.",
    });
  }
}

/* =========================================================
   GET CURRENT USER
========================================================= */

export async function me(req, res) {
  const user = await User.findById(
    req.user._id,
  ).lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message:
        "User account not found.",
    });
  }

  res.json({
    success: true,
    user: getPublicUser(user),
  });
}

/* =========================================================
   UPDATE PROFILE
========================================================= */

export async function updateProfile(
  req,
  res,
) {
  const {
    name,
    email,
    phone,
  } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Name is required.",
    });
  }

  if (!email?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const normalizedEmail =
    normalizeEmail(email);

  const normalizedPhone =
    phone ? normalizePhone(phone) : "";

  if (phone && !normalizedPhone) {
    return res.status(400).json({
      success: false,
      message:
        "Please enter a valid 10-digit Indian mobile number.",
    });
  }

  const existingUser =
    await User.findOne({
      email: normalizedEmail,
      _id: {
        $ne: req.user._id,
      },
    });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message:
        "An account with this email already exists.",
    });
  }

  if (normalizedPhone) {
    const existingPhone =
      await User.findOne({
        phone: normalizedPhone,
        _id: {
          $ne: req.user._id,
        },
      });

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this mobile number already exists.",
      });
    }
  }

  const user =
    await User.findById(
      req.user._id,
    );

  if (!user) {
    return res.status(404).json({
      success: false,
      message:
        "User account not found.",
    });
  }

  const emailChanged =
    user.email !== normalizedEmail;

  user.name = name.trim();
  user.email = normalizedEmail;
  user.phone = normalizedPhone;

  if (emailChanged) {
    user.emailVerified = false;

    const otp = generateOtp();

    user.emailOtpHash =
      await hashOtp(otp);

    user.emailOtpExpiresAt =
      new Date(Date.now() + OTP_EXPIRY_MS);

    await user.save();

    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        otp,
      });
    } catch (error) {
      console.error(
        "Profile email verification error:",
        error,
      );
    }
  } else {
    await user.save();
  }

  res.json({
    success: true,

    message: emailChanged
      ? "Profile updated. Please verify your new email address."
      : "Profile updated successfully.",

    emailVerificationRequired:
      emailChanged,

    user: getPublicUser(user),
  });
}

/* =========================================================
   CHANGE PASSWORD
========================================================= */

export async function changePassword(
  req,
  res,
) {
  const {
    currentPassword,
    newPassword,
    confirmPassword,
  } = req.body;

  if (
    !currentPassword ||
    !newPassword
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Current password and new password are required.",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message:
        "New password must be at least 8 characters.",
    });
  }

  if (
    confirmPassword &&
    newPassword !== confirmPassword
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Passwords do not match.",
    });
  }

  if (
    currentPassword === newPassword
  ) {
    return res.status(400).json({
      success: false,
      message:
        "New password must be different from your current password.",
    });
  }

  const user =
    await User.findById(
      req.user._id,
    ).select("+password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message:
        "User account not found.",
    });
  }

  const passwordMatch =
    await user.comparePassword(
      currentPassword,
    );

  if (!passwordMatch) {
    return res.status(401).json({
      success: false,
      message:
        "Current password is incorrect.",
    });
  }

  user.password = newPassword;

  await user.save();

  res.json({
    success: true,
    message:
      "Password updated successfully.",
  });
}

/* =========================================================
   GET SETTINGS
========================================================= */

export async function getSettings(
  req,
  res,
) {
  const user =
    await User.findById(
      req.user._id,
    ).lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message:
        "User account not found.",
    });
  }

  res.json({
    success: true,

    settings: {
      ...defaultSettings,
      ...(user.settings || {}),
    },
  });
}

/* =========================================================
   UPDATE SETTINGS
========================================================= */

export async function updateSettings(
  req,
  res,
) {
  const incomingSettings =
    req.body?.settings;

  if (
    !incomingSettings ||
    typeof incomingSettings !==
      "object" ||
    Array.isArray(incomingSettings)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Valid settings object is required.",
    });
  }

  const user =
    await User.findById(
      req.user._id,
    );

  if (!user) {
    return res.status(404).json({
      success: false,
      message:
        "User account not found.",
    });
  }

  const nextSettings = {
    ...defaultSettings,
    ...(user.settings || {}),
    ...incomingSettings,
  };

  user.settings = nextSettings;

  await user.save();

  res.json({
    success: true,

    message:
      "Settings updated successfully.",

    settings: nextSettings,
  });
}