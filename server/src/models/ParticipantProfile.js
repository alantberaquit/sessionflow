import mongoose from "mongoose";

const participantProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      unique: true,
      index: true,
    },

    organization: {
      type: String,
      required: [true, "Organization is required"],
      trim: true,
      minlength: [
        2,
        "Organization must contain at least 2 characters",
      ],
      maxlength: [
        150,
        "Organization cannot exceed 150 characters",
      ],
    },

    jobTitle: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      minlength: [
        2,
        "Job title must contain at least 2 characters",
      ],
      maxlength: [
        100,
        "Job title cannot exceed 100 characters",
      ],
    },

    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      maxlength: [
        30,
        "Contact number cannot exceed 30 characters",
      ],
      match: [
        /^\+?[0-9\s().-]{7,30}$/,
        "Please provide a valid contact number",
      ],
    },
  },
  {
    timestamps: true,
  },
);

const ParticipantProfile = mongoose.model(
  "ParticipantProfile",
  participantProfileSchema,
);

export default ParticipantProfile;