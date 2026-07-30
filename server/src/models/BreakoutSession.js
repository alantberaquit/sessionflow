import mongoose from "mongoose";

const speakerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Speaker name is required"],
      trim: true,
      minlength: [
        2,
        "Speaker name must contain at least 2 characters",
      ],
      maxlength: [
        120,
        "Speaker name cannot exceed 120 characters",
      ],
    },

    jobTitle: {
      type: String,
      trim: true,
      maxlength: [
        120,
        "Speaker job title cannot exceed 120 characters",
      ],
      default: "",
    },

    organization: {
      type: String,
      trim: true,
      maxlength: [
        150,
        "Speaker organization cannot exceed 150 characters",
      ],
      default: "",
    },
  },
  {
    _id: false,
  },
);

const breakoutSessionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },

    breakoutBlock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BreakoutBlock",
      required: [
        true,
        "Breakout block reference is required",
      ],
      index: true,
    },

    title: {
      type: String,
      required: [
        true,
        "Breakout session title is required",
      ],
      trim: true,
      minlength: [
        3,
        "Breakout session title must contain at least 3 characters",
      ],
      maxlength: [
        180,
        "Breakout session title cannot exceed 180 characters",
      ],
    },

    description: {
      type: String,
      required: [
        true,
        "Breakout session description is required",
      ],
      trim: true,
      minlength: [
        10,
        "Breakout session description must contain at least 10 characters",
      ],
      maxlength: [
        2000,
        "Breakout session description cannot exceed 2000 characters",
      ],
    },

    room: {
      type: String,
      required: [
        true,
        "Breakout session room is required",
      ],
      trim: true,
      minlength: [
        2,
        "Breakout session room must contain at least 2 characters",
      ],
      maxlength: [
        120,
        "Breakout session room cannot exceed 120 characters",
      ],
    },

    speakers: {
      type: [speakerSchema],
      validate: {
        validator(speakers) {
          return speakers.length > 0;
        },
        message:
          "At least one breakout-session speaker is required",
      },
    },

    capacity: {
      type: Number,
      required: [
        true,
        "Breakout session capacity is required",
      ],
      min: [
        1,
        "Breakout session capacity must be at least 1",
      ],
      max: [
        10000,
        "Breakout session capacity cannot exceed 10000",
      ],
    },

    displayOrder: {
      type: Number,
      required: [
        true,
        "Breakout session display order is required",
      ],
      min: [
        1,
        "Breakout session display order must be at least 1",
      ],
      max: [
        1000,
        "Breakout session display order cannot exceed 1000",
      ],
    },

    status: {
      type: String,
      enum: {
        values: [
          "available",
          "full",
          "closed",
          "ongoing",
          "completed",
          "cancelled",
        ],
        message:
          "{VALUE} is not a supported breakout-session status",
      },
      default: "available",
    },
  },
  {
    timestamps: true,
  },
);

breakoutSessionSchema.index({
  event: 1,
  breakoutBlock: 1,
});

breakoutSessionSchema.index(
  {
    breakoutBlock: 1,
    displayOrder: 1,
  },
  {
    unique: true,
  },
);

const BreakoutSession = mongoose.model(
  "BreakoutSession",
  breakoutSessionSchema,
);

export default BreakoutSession;