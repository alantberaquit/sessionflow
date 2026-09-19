import mongoose from "mongoose";

const breakoutSelectionSchema = new mongoose.Schema(
  {
    breakoutBlock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BreakoutBlock",
      required: [
        true,
        "Breakout block reference is required",
      ],
    },

    breakoutSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BreakoutSession",
      required: [
        true,
        "Breakout session reference is required",
      ],
    },
  },
  {
    _id: false,
  },
);

const eventRegistrationSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [
        true,
        "Participant reference is required",
      ],
      index: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event reference is required"],
      index: true,
    },

    breakoutSelections: {
      type: [breakoutSelectionSchema],
      default: [],
    },

    status: {
      type: String,
      enum: {
        values: [
          "draft",
          "pending-payment",
          "confirmed",
          "cancelled",
        ],
        message:
          "{VALUE} is not a supported registration status",
      },
      default: "draft",
      index: true,
    },

paymentStatus: {
  type: String,
  enum: {
    values: [
      "not-required",
      "pending",
      "paid",
      "failed",
      "cancelled",
      "refunded",
    ],
    message:
      "{VALUE} is not a supported payment status",
  },
  default: "pending",
},

    submittedAt: {
      type: Date,
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

eventRegistrationSchema.pre(
  "validate",
  function validateBreakoutSelections() {
    const selections = this.breakoutSelections || [];

    const blockIds = selections.map((selection) =>
      selection.breakoutBlock?.toString(),
    );

    const sessionIds = selections.map((selection) =>
      selection.breakoutSession?.toString(),
    );

    const validBlockIds = blockIds.filter(Boolean);
    const validSessionIds = sessionIds.filter(Boolean);

    const uniqueBlockIds = new Set(validBlockIds);
    const uniqueSessionIds = new Set(validSessionIds);

    if (uniqueBlockIds.size !== validBlockIds.length) {
      this.invalidate(
        "breakoutSelections",
        "Only one breakout session may be selected from each breakout block",
      );
    }

    if (
      uniqueSessionIds.size !== validSessionIds.length
    ) {
      this.invalidate(
        "breakoutSelections",
        "The same breakout session cannot be selected more than once",
      );
    }
  },
);

eventRegistrationSchema.index(
  {
    participant: 1,
    event: 1,
  },
  {
    unique: true,
  },
);

eventRegistrationSchema.index({
  event: 1,
  status: 1,
});

eventRegistrationSchema.index({
  "breakoutSelections.breakoutSession": 1,
  status: 1,
});

const EventRegistration = mongoose.model(
  "EventRegistration",
  eventRegistrationSchema,
);

export default EventRegistration;