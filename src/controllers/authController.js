import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

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
   HELPERS
========================================================= */

function getPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
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

/* =========================================================
   REGISTER
========================================================= */

export async function register(req, res) {
  const {
    name,
    email,
    password,
  } = req.body;

  if (
    !name?.trim() ||
    !email?.trim() ||
    !password
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Name, email and password are required.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters.",
    });
  }

  const normalizedEmail =
    normalizeEmail(email);

  const existing = await User.findOne({
    email: normalizedEmail,
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      message:
        "An account with this email already exists.",
    });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    settings: defaultSettings,
  });

  const token = signToken(
    user._id.toString(),
  );

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    token,
    user: getPublicUser(user),
  });
}

/* =========================================================
   LOGIN
========================================================= */

export async function login(req, res) {
  const {
    email,
    password,
  } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message:
        "Email and password are required.",
    });
  }

  const user = await User.findOne({
    email: normalizeEmail(email),
  }).select("+password");

  if (
    !user ||
    !(await user.comparePassword(password))
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
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
      message: "User account not found.",
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

  const user =
    await User.findById(
      req.user._id,
    );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User account not found.",
    });
  }

  user.name = name.trim();
  user.email = normalizedEmail;
  user.phone = String(
    phone || "",
  ).trim();

  await user.save();

  res.json({
    success: true,
    message:
      "Profile updated successfully.",
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
  } = req.body;

  if (!currentPassword || !newPassword) {
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
      message: "User account not found.",
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
      message: "User account not found.",
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
      message: "User account not found.",
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