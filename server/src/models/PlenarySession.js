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

const plenarySessionSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Plenary session title is required"],
      trim: true,
      minlength: [
        3,
        "Plenary session title must contain at least 3 characters",
      ],
      maxlength: [
        180,
        "Plenary session title cannot exceed 180 characters",
      ],
    },

    description: {
      type: String,
      required: [
        true,
        "Plenary session description is required",
      ],
      trim: true,
      minlength: [
        10,
        "Plenary session description must contain at least 10 characters",
      ],
      maxlength: [
        2000,
        "Plenary session description cannot exceed 2000 characters",
      ],
    },

    startsAt: {
      type: Date,
      required: [true, "Session start time is required"],
      index: true,
    },

    endsAt: {
      type: Date,
      required: [true, "Session end time is required"],
    },

    room: {
      type: String,
      required: [true, "Session room is required"],
      trim: true,
      minlength: [
        2,
        "Session room must contain at least 2 characters",
      ],
      maxlength: [
        120,
        "Session room cannot exceed 120 characters",
      ],
    },

    speakers: {
      type: [speakerSchema],
      validate: {
        validator(speakers) {
          return speakers.length > 0;
        },
        message:
          "At least one plenary-session speaker is required",
      },
    },

    displayOrder: {
      type: Number,
      required: [true, "Display order is required"],
      min: [1, "Display order must be at least 1"],
      max: [
        1000,
        "Display order cannot exceed 1000",
      ],
    },

    isRequired: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: {
        values: [
          "scheduled",
          "ongoing",
          "completed",
          "cancelled",
        ],
        message:
          "{VALUE} is not a supported plenary-session status",
      },
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  },
);

plenarySessionSchema.pre(
  "validate",
  function validateSessionDates() {
    if (
      this.startsAt &&
      this.endsAt &&
      this.endsAt <= this.startsAt
    ) {
      this.invalidate(
        "endsAt",
        "Session end time must be after the start time",
      );
    }
  },
);

plenarySessionSchema.index({
  event: 1,
  startsAt: 1,
});

plenarySessionSchema.index(
  {
    event: 1,
    displayOrder: 1,
  },
  {
    unique: true,
  },
);

const PlenarySession = mongoose.model(
  "PlenarySession",
  plenarySessionSchema,
);

export default PlenarySession;