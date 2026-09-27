import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      default: "Untitled Resume",
      trim: true,
      maxlength: 160,
    },

    template: {
      type: String,
      enum: [
        "executive",
        "modern",
        "minimal",
        "corporate",
        "creative",
        "ats",
        "tech",
        "elegant",
      ],
      default: "executive",
    },

    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Index
|--------------------------------------------------------------------------
*/

resumeSchema.index({
  user: 1,
  updatedAt: -1,
});

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;