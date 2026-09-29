import mongoose from "mongoose";

const coverLetterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "My Cover Letter",
      trim: true,
      maxlength: 160,
    },

    template: {
      type: String,
      enum: [
        "modern",
        "professional",
        "minimal",
        "executive",
        "elegant",
        "classic",
      ],
      default: "modern",
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

coverLetterSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("CoverLetter", coverLetterSchema);