import mongoose from "mongoose";

const breakoutBlockSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Breakout block title is required"],
      trim: true,
      minlength: [
        3,
        "Breakout block title must contain at least 3 characters",
      ],
      maxlength: [
        150,
        "Breakout block title cannot exceed 150 characters",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Breakout block description cannot exceed 500 characters",
      ],
      default: "",
    },

    startsAt: {
      type: Date,
      required: [
        true,
        "Breakout block start time is required",
      ],
      index: true,
    },

    endsAt: {
      type: Date,
      required: [
        true,
        "Breakout block end time is required",
      ],
    },

    displayOrder: {
      type: Number,
      required: [
        true,
        "Breakout block display order is required",
      ],
      min: [
        1,
        "Breakout block display order must be at least 1",
      ],
      max: [
        1000,
        "Breakout block display order cannot exceed 1000",
      ],
    },

    minimumSelections: {
      type: Number,
      default: 1,
      min: [
        0,
        "Minimum selections cannot be negative",
      ],
      max: [
        20,
        "Minimum selections cannot exceed 20",
      ],
    },

    maximumSelections: {
      type: Number,
      default: 1,
      min: [
        1,
        "Maximum selections must be at least 1",
      ],
      max: [
        20,
        "Maximum selections cannot exceed 20",
      ],
    },

    status: {
      type: String,
      enum: {
        values: [
          "scheduled",
          "selection-open",
          "selection-closed",
          "ongoing",
          "completed",
          "cancelled",
        ],
        message:
          "{VALUE} is not a supported breakout-block status",
      },
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  },
);

breakoutBlockSchema.pre(
  "validate",
  function validateBreakoutBlock() {
    if (
      this.startsAt &&
      this.endsAt &&
      this.endsAt <= this.startsAt
    ) {
      this.invalidate(
        "endsAt",
        "Breakout block end time must be after the start time",
      );
    }

    if (
      Number.isFinite(this.minimumSelections) &&
      Number.isFinite(this.maximumSelections) &&
      this.minimumSelections > this.maximumSelections
    ) {
      this.invalidate(
        "maximumSelections",
        "Maximum selections must be greater than or equal to minimum selections",
      );
    }
  },
);

breakoutBlockSchema.index({
  event: 1,
  startsAt: 1,
});

breakoutBlockSchema.index(
  {
    event: 1,
    displayOrder: 1,
  },
  {
    unique: true,
  },
);

const BreakoutBlock = mongoose.model(
  "BreakoutBlock",
  breakoutBlockSchema,
);

export default BreakoutBlock;