import mongoose from "mongoose";

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [
        true,
        "A venue name is required.",
      ],
      trim: true,
      maxlength: [
        150,
        "The venue name cannot exceed 150 characters.",
      ],
    },

    address: {
      type: String,
      required: [
        true,
        "A venue address is required.",
      ],
      trim: true,
      maxlength: [
        300,
        "The venue address cannot exceed 300 characters.",
      ],
    },

    city: {
      type: String,
      required: [
        true,
        "A venue city is required.",
      ],
      trim: true,
      maxlength: [
        100,
        "The venue city cannot exceed 100 characters.",
      ],
    },

    country: {
      type: String,
      required: [
        true,
        "A venue country is required.",
      ],
      trim: true,
      default: "Philippines",
      maxlength: [
        100,
        "The venue country cannot exceed 100 characters.",
      ],
    },
  },
  {
    _id: false,
  },
);

const registrationPeriodSchema =
  new mongoose.Schema(
    {
      opensAt: {
        type: Date,
        required: [
          true,
          "A registration opening date is required.",
        ],
      },

      closesAt: {
        type: Date,
        required: [
          true,
          "A registration closing date is required.",
        ],
      },
    },
    {
      _id: false,
    },
  );

const registrationFeeSchema =
  new mongoose.Schema(
    {
      amountInCentavos: {
        type: Number,
        required: [
          true,
          "A registration fee is required.",
        ],
        min: [
          0,
          "The registration fee cannot be negative.",
        ],
        validate: {
          validator: Number.isInteger,
          message:
            "The registration fee must be stored as a whole number of centavos.",
        },
      },

      currency: {
        type: String,
        required: [
          true,
          "A registration-fee currency is required.",
        ],
        enum: {
          values: ["PHP"],
          message:
            "{VALUE} is not a supported currency.",
        },
        default: "PHP",
        uppercase: true,
        trim: true,
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
      required: [
        true,
        "An event title is required.",
      ],
      trim: true,
      maxlength: [
        200,
        "The event title cannot exceed 200 characters.",
      ],
    },

    slug: {
      type: String,
      required: [
        true,
        "An event slug is required.",
      ],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "The event slug may only contain lowercase letters, numbers, and hyphens.",
      ],
    },

    summary: {
      type: String,
      required: [
        true,
        "An event summary is required.",
      ],
      trim: true,
      maxlength: [
        500,
        "The event summary cannot exceed 500 characters.",
      ],
    },

    description: {
      type: String,
      required: [
        true,
        "An event description is required.",
      ],
      trim: true,
      maxlength: [
        5000,
        "The event description cannot exceed 5,000 characters.",
      ],
    },

    startDate: {
      type: Date,
      required: [
        true,
        "An event start date is required.",
      ],
    },

    endDate: {
      type: Date,
      required: [
        true,
        "An event end date is required.",
      ],
    },

    venue: {
      type: venueSchema,
      required: [
        true,
        "Event venue information is required.",
      ],
    },

    registrationPeriod: {
      type: registrationPeriodSchema,
      required: [
        true,
        "A registration period is required.",
      ],
    },

    registrationFee: {
      type: registrationFeeSchema,
      required: [
        true,
        "A registration fee is required.",
      ],
    },

    capacity: {
      type: Number,
      required: [
        true,
        "An event capacity is required.",
      ],
      min: [
        1,
        "The event capacity must be at least 1.",
      ],
      validate: {
        validator: Number.isInteger,
        message:
          "The event capacity must be a whole number.",
      },
    },

    status: {
      type: String,
      required: true,
      enum: {
        values: [
          "draft",
          "upcoming",
          "registration-open",
          "registration-closed",
          "ongoing",
          "completed",
          "cancelled",
        ],
        message:
          "{VALUE} is not a valid event status.",
      },
      default: "draft",
    },

    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

eventSchema.index({
  status: 1,
  isPublished: 1,
  startDate: 1,
});

eventSchema.index({
  "registrationPeriod.opensAt": 1,
  "registrationPeriod.closesAt": 1,
});

eventSchema.pre(
  "validate",
  function validateEventDates() {
    if (
      this.startDate &&
      this.endDate &&
      this.endDate <= this.startDate
    ) {
      this.invalidate(
        "endDate",
        "The event end date must be later than the start date.",
      );
    }

    if (
      this.registrationPeriod?.opensAt &&
      this.registrationPeriod?.closesAt &&
      this.registrationPeriod.closesAt <=
        this.registrationPeriod.opensAt
    ) {
      this.invalidate(
        "registrationPeriod.closesAt",
        "The registration closing date must be later than the opening date.",
      );
    }

    if (
      this.registrationPeriod?.closesAt &&
      this.startDate &&
      this.registrationPeriod.closesAt >
        this.startDate
    ) {
      this.invalidate(
        "registrationPeriod.closesAt",
        "Registration must close on or before the event begins.",
      );
    }
  },
);

const Event = mongoose.model(
  "Event",
  eventSchema,
);

export default Event;