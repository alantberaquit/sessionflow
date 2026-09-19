import mongoose from "mongoose";

const proofOfPaymentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      trim: true,
      default: null,
    },

    storedName: {
      type: String,
      trim: true,
      default: null,
    },

    filePath: {
      type: String,
      trim: true,
      default: null,
    },

    mimeType: {
      type: String,
      trim: true,
      default: null,
    },

    sizeInBytes: {
      type: Number,
      min: 0,
      default: null,
    },

    uploadedAt: {
      type: Date,
      default: null,
    },

    reviewStatus: {
      type: String,
      enum: [
        "not-submitted",
        "pending-review",
        "approved",
        "rejected",
      ],
      default: "not-submitted",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const paymentSchema = new mongoose.Schema(
  {
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventRegistration",
      required: true,
      unique: true,
      index: true,
    },

    amountInCentavos: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message:
          "Payment amount must be stored as a whole number of centavos.",
      },
    },

    currency: {
      type: String,
      enum: ["PHP"],
      default: "PHP",
      required: true,
    },

    method: {
      type: String,
      enum: [
        "gcash",
        "card",
        "bank-transfer",
        "manual",
      ],
      default: null,
    },

    provider: {
      type: String,
      enum: ["paymongo", "manual"],
      default: null,
    },

    providerReference: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "paid",
        "failed",
        "cancelled",
        "refunded",
      ],
      default: "pending",
      required: true,
      index: true,
    },

    proofOfPayment: {
      type: proofOfPaymentSchema,
      default: () => ({
        reviewStatus: "not-submitted",
      }),
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    refundReference: {
      type: String,
      trim: true,
      maxlength: 200,
      default: null,
    },

    refundNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    failureReason: {
      type: String,
      trim: true,
      default: null,
    },

    refundReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

paymentSchema.pre(
  "validate",
  function validatePaymentLifecycle() {
    if (
      this.status === "paid" &&
      !this.paidAt
    ) {
      this.paidAt = new Date();
    }

    if (
      this.status === "failed" &&
      !this.failedAt
    ) {
      this.failedAt = new Date();
    }

    if (
      this.status === "cancelled" &&
      !this.cancelledAt
    ) {
      this.cancelledAt = new Date();
    }

    if (
      this.status === "refunded" &&
      !this.refundedAt
    ) {
      this.refundedAt = new Date();
    }

    if (
      this.status === "refunded" &&
      !this.refundedBy
    ) {
      this.invalidate(
        "refundedBy",
        "The administrator who processed the refund is required.",
      );
    }

    if (
      this.status === "refunded" &&
      !this.refundReference
    ) {
      this.invalidate(
        "refundReference",
        "A refund reference is required for refunded payments.",
      );
    }

    if (this.status !== "refunded") {
      this.refundedAt = null;
      this.refundReference = null;
      this.refundNotes = null;
      this.refundedBy = null;
      this.refundReason = null;
    }

    if (
      this.proofOfPayment?.reviewStatus ===
        "pending-review" &&
      !this.proofOfPayment.uploadedAt
    ) {
      this.proofOfPayment.uploadedAt =
        new Date();
    }

    if (
      [
        "approved",
        "rejected",
      ].includes(
        this.proofOfPayment?.reviewStatus,
      ) &&
      !this.proofOfPayment.reviewedAt
    ) {
      this.proofOfPayment.reviewedAt =
        new Date();
    }

    if (
      this.proofOfPayment?.reviewStatus !==
      "rejected"
    ) {
      this.proofOfPayment.rejectionReason =
        null;
    }
  },
);

const Payment = mongoose.model(
  "Payment",
  paymentSchema,
);

export default Payment;