import mongoose from "mongoose";

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Venue name is required"],
      trim: true,
      minlength: [
        2,
        "Venue name must contain at least 2 characters",
      ],
      maxlength: [
        150,
        "Venue name cannot exceed 150 characters",
      ],
    },

    address: {
      type: String,
      required: [true, "Venue address is required"],
      trim: true,
      minlength: [
        5,
        "Venue address must contain at least 5 characters",
      ],
      maxlength: [
        300,
        "Venue address cannot exceed 300 characters",
      ],
    },

    city: {
      type: String,
      required: [true, "Venue city is required"],
      trim: true,
      maxlength: [
        100,
        "Venue city cannot exceed 100 characters",
      ],
    },

    country: {
      type: String,
      required: [true, "Venue country is required"],
      trim: true,
      maxlength: [
        100,
        "Venue country cannot exceed 100 characters",
      ],
    },
  },
  {
    _id: false,
  },
);

const registrationPeriodSchema = new mongoose.Schema(
  {
    opensAt: {
      type: Date,
      required: [true, "Registration opening date is required"],
    },

    closesAt: {
      type: Date,
      required: [true, "Registration closing date is required"],
    },
  },
  {
    _id: false,
  },
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      minlength: [
        5,
        "Event title must contain at least 5 characters",
      ],
      maxlength: [
        180,
        "Event title cannot exceed 180 characters",
      ],
    },

    slug: {
      type: String,
      required: [true, "Event slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [
        200,
        "Event slug cannot exceed 200 characters",
      ],
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Event slug must use lowercase letters, numbers, and hyphens",
      ],
    },

    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      minlength: [
        20,
        "Event description must contain at least 20 characters",
      ],
      maxlength: [
        3000,
        "Event description cannot exceed 3000 characters",
      ],
    },

    startDate: {
      type: Date,
      required: [true, "Event start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "Event end date is required"],
    },

    venue: {
      type: venueSchema,
      required: [true, "Venue information is required"],
    },

    registrationPeriod: {
      type: registrationPeriodSchema,
      required: [
        true,
        "Registration period is required",
      ],
    },

    capacity: {
      type: Number,
      required: [true, "Event capacity is required"],
      min: [1, "Event capacity must be at least 1"],
      max: [
        100000,
        "Event capacity cannot exceed 100000",
      ],
    },

    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "registration-open",
          "registration-closed",
          "ongoing",
          "completed",
          "cancelled",
        ],
        message: "{VALUE} is not a supported event status",
      },
      default: "draft",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

eventSchema.pre("validate", function validateEventDates() {
  if (
    this.startDate &&
    this.endDate &&
    this.endDate <= this.startDate
  ) {
    this.invalidate(
      "endDate",
      "Event end date must be after the start date",
    );
  }

  const opensAt =
    this.registrationPeriod?.opensAt;

  const closesAt =
    this.registrationPeriod?.closesAt;

  if (
    opensAt &&
    closesAt &&
    closesAt <= opensAt
  ) {
    this.invalidate(
      "registrationPeriod.closesAt",
      "Registration closing date must be after the opening date",
    );
  }

  if (
    closesAt &&
    this.startDate &&
    closesAt > this.startDate
  ) {
    this.invalidate(
      "registrationPeriod.closesAt",
      "Registration must close on or before the event starts",
    );
  }
});

const Event = mongoose.model("Event", eventSchema);

export default Event;