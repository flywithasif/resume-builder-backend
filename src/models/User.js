import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    // Email verification
    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailOtpHash: {
      type: String,
      default: "",
      select: false,
    },

    emailOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    // Forgot password
    resetOtpHash: {
      type: String,
      default: "",
      select: false,
    },

    resetOtpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    resetOtpVerifiedUntil: {
      type: Date,
      default: null,
      select: false,
    },

    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: defaultSettings,
    },
  },
  {
    timestamps: true,
  },
);

/* =========================================================
   PASSWORD HASH
========================================================= */

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

/* =========================================================
   PASSWORD COMPARE
========================================================= */

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);