import fs from "node:fs/promises";
import path from "node:path";

import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import Payment from "../models/Payment.js";

const formatPayment = (payment) => ({
  id: payment._id,
  participant: payment.participant,
  event: payment.event,
  registration: payment.registration,
  amountInCentavos: payment.amountInCentavos,
  currency: payment.currency,
  method: payment.method,
  provider: payment.provider,
  providerReference: payment.providerReference,
  status: payment.status,
  proofOfPayment: payment.proofOfPayment,
  paidAt: payment.paidAt,
  failedAt: payment.failedAt,
  cancelledAt: payment.cancelledAt,
  refundedAt: payment.refundedAt,
  failureReason: payment.failureReason,
  refundReason: payment.refundReason,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const formatValidationErrors = (error) =>
  Object.fromEntries(
    Object.entries(error.errors).map(
      ([field, validationError]) => [
        field,
        validationError.message,
      ],
    ),
  );

export const createOrGetParticipantPayment = async (
  request,
  response,
) => {
  try {
    const normalizedSlug = request.params.slug
      .trim()
      .toLowerCase();

    const event = await Event.findOne({
      slug: normalizedSlug,
      isPublished: true,
      status: {
        $ne: "cancelled",
      },
    })
      .select(
        "_id title slug registrationFee",
      )
      .lean();

    if (!event) {
      response.status(404).json({
        message: "Event not found.",
        code: "EVENT_NOT_FOUND",
      });

      return;
    }

    const registration =
      await EventRegistration.findOne({
        participant: request.user._id,
        event: event._id,
      });

    if (!registration) {
      response.status(404).json({
        message:
          "No event registration was found.",
        code: "REGISTRATION_NOT_FOUND",
      });

      return;
    }

    const allowedRegistrationStatuses = [
      "pending-payment",
      "confirmed",
    ];

    if (
      !allowedRegistrationStatuses.includes(
        registration.status,
      )
    ) {
      response.status(409).json({
        message:
          "Submit the event registration before creating a payment record.",
        code: "REGISTRATION_NOT_SUBMITTED",
      });

      return;
    }

    const existingPayment =
      await Payment.findOne({
        registration: registration._id,
      });

    if (existingPayment) {
      response.status(200).json({
        message:
          "Payment record retrieved successfully.",
        created: false,
        payment: formatPayment(existingPayment),
        event: {
          id: event._id,
          title: event.title,
          slug: event.slug,
        },
      });

      return;
    }

    const payment = await Payment.create({
      participant: request.user._id,
      event: event._id,
      registration: registration._id,
      amountInCentavos:
        event.registrationFee.amountInCentavos,
      currency:
        event.registrationFee.currency,
      status: "pending",
    });

    response.status(201).json({
      message:
        "Payment record created successfully.",
      created: true,
      payment: formatPayment(payment),
      event: {
        id: event._id,
        title: event.title,
        slug: event.slug,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      try {
        const normalizedSlug = request.params.slug
          .trim()
          .toLowerCase();

        const event = await Event.findOne({
          slug: normalizedSlug,
          isPublished: true,
          status: {
            $ne: "cancelled",
          },
        })
          .select("_id title slug")
          .lean();

        const registration =
          await EventRegistration.findOne({
            participant: request.user._id,
            event: event?._id,
          }).lean();

        const payment = await Payment.findOne({
          registration: registration?._id,
        });

        if (event && registration && payment) {
          response.status(200).json({
            message:
              "Payment record retrieved successfully.",
            created: false,
            payment: formatPayment(payment),
            event: {
              id: event._id,
              title: event.title,
              slug: event.slug,
            },
          });

          return;
        }
      } catch (lookupError) {
        console.error(
          "Unable to retrieve duplicate payment record:",
        );
        console.error(lookupError.message);
      }
    }

    if (error.name === "ValidationError") {
      response.status(400).json({
        message:
          "Review the payment information.",
        errors:
          formatValidationErrors(error),
      });

      return;
    }

    console.error(
      "Unable to create or retrieve payment:",
    );
    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to prepare the payment at this time.",
    });
  }
};

export const selectParticipantPaymentMethod = async (
  request,
  response,
) => {
  try {
    const normalizedSlug = request.params.slug
      .trim()
      .toLowerCase();

    const { method } = request.body;

    const supportedMethods = [
      "gcash",
      "card",
      "bank-transfer",
    ];

    if (!supportedMethods.includes(method)) {
      response.status(400).json({
        message:
          "Select a supported payment method.",
        code: "INVALID_PAYMENT_METHOD",
        supportedMethods,
      });

      return;
    }

    const event = await Event.findOne({
      slug: normalizedSlug,
      isPublished: true,
      status: {
        $ne: "cancelled",
      },
    })
      .select("_id title slug")
      .lean();

    if (!event) {
      response.status(404).json({
        message: "Event not found.",
        code: "EVENT_NOT_FOUND",
      });

      return;
    }

    const registration =
      await EventRegistration.findOne({
        participant: request.user._id,
        event: event._id,
      })
        .select("_id status")
        .lean();

    if (!registration) {
      response.status(404).json({
        message:
          "No event registration was found.",
        code: "REGISTRATION_NOT_FOUND",
      });

      return;
    }

    if (
      ![
        "pending-payment",
        "confirmed",
      ].includes(registration.status)
    ) {
      response.status(409).json({
        message:
          "Submit the event registration before selecting a payment method.",
        code: "REGISTRATION_NOT_SUBMITTED",
      });

      return;
    }

    const payment = await Payment.findOne({
      registration: registration._id,
      participant: request.user._id,
      event: event._id,
    });

    if (!payment) {
      response.status(404).json({
        message:
          "Prepare the payment record before selecting a payment method.",
        code: "PAYMENT_NOT_FOUND",
      });

      return;
    }

    if (payment.status === "paid") {
      response.status(409).json({
        message:
          "The payment has already been completed.",
        code: "PAYMENT_ALREADY_PAID",
      });

      return;
    }

    if (
      [
        "cancelled",
        "refunded",
      ].includes(payment.status)
    ) {
      response.status(409).json({
        message:
          "The payment method cannot be changed for this payment.",
        code: "PAYMENT_NOT_EDITABLE",
      });

      return;
    }

    const provider =
      method === "bank-transfer"
        ? "manual"
        : "paymongo";

    payment.method = method;
    payment.provider = provider;

    await payment.save();

    response.status(200).json({
      message:
        "Payment method selected successfully.",
      payment: formatPayment(payment),
      event: {
        id: event._id,
        title: event.title,
        slug: event.slug,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      response.status(400).json({
        message:
          "Review the payment information.",
        errors:
          formatValidationErrors(error),
      });

      return;
    }

    console.error(
      "Unable to select payment method:",
    );
    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to select the payment method at this time.",
    });
  }
};

export const initiateParticipantBankTransfer = async (
  request,
  response,
) => {
  try {
    const normalizedSlug = request.params.slug
      .trim()
      .toLowerCase();

    const event = await Event.findOne({
      slug: normalizedSlug,
      isPublished: true,
      status: {
        $ne: "cancelled",
      },
    })
      .select("_id title slug")
      .lean();

    if (!event) {
      response.status(404).json({
        message: "Event not found.",
        code: "EVENT_NOT_FOUND",
      });

      return;
    }

    const registration =
      await EventRegistration.findOne({
        participant: request.user._id,
        event: event._id,
      })
        .select("_id status")
        .lean();

    if (!registration) {
      response.status(404).json({
        message:
          "No event registration was found.",
        code: "REGISTRATION_NOT_FOUND",
      });

      return;
    }

    if (
      ![
        "pending-payment",
        "confirmed",
      ].includes(registration.status)
    ) {
      response.status(409).json({
        message:
          "Submit the event registration before initiating a bank transfer.",
        code: "REGISTRATION_NOT_SUBMITTED",
      });

      return;
    }

    const payment = await Payment.findOne({
      registration: registration._id,
      participant: request.user._id,
      event: event._id,
    });

    if (!payment) {
      response.status(404).json({
        message:
          "Prepare the payment record before initiating a bank transfer.",
        code: "PAYMENT_NOT_FOUND",
      });

      return;
    }

    if (
      payment.method !== "bank-transfer" ||
      payment.provider !== "manual"
    ) {
      response.status(409).json({
        message:
          "Select bank transfer as your payment method before continuing.",
        code: "BANK_TRANSFER_NOT_SELECTED",
      });

      return;
    }

    if (payment.status === "paid") {
      response.status(409).json({
        message:
          "The payment has already been completed.",
        code: "PAYMENT_ALREADY_PAID",
      });

      return;
    }

    if (
      [
        "cancelled",
        "refunded",
      ].includes(payment.status)
    ) {
      response.status(409).json({
        message:
          "Bank transfer cannot be initiated for this payment.",
        code: "PAYMENT_NOT_EDITABLE",
      });

      return;
    }

    const bankTransferDetails = {
      bankName:
        process.env.BANK_TRANSFER_BANK_NAME,
      accountName:
        process.env.BANK_TRANSFER_ACCOUNT_NAME,
      accountNumber:
        process.env
          .BANK_TRANSFER_ACCOUNT_NUMBER,
      instructions:
        process.env
          .BANK_TRANSFER_INSTRUCTIONS,
    };

    const hasMissingConfiguration =
      Object.values(bankTransferDetails).some(
        (value) => !value?.trim(),
      );

    if (hasMissingConfiguration) {
      console.error(
        "Bank-transfer configuration is incomplete.",
      );

      response.status(503).json({
        message:
          "Bank-transfer instructions are temporarily unavailable.",
        code:
          "BANK_TRANSFER_CONFIGURATION_MISSING",
      });

      return;
    }

    if (!payment.providerReference) {
      payment.providerReference =
        `BANK-${payment._id
          .toString()
          .toUpperCase()}`;
    }

    if (payment.status === "pending") {
      payment.status = "processing";
    }

    await payment.save();

    response.status(200).json({
      message:
        "Bank transfer initiated successfully.",
      payment: formatPayment(payment),
      event: {
        id: event._id,
        title: event.title,
        slug: event.slug,
      },
      bankTransfer: {
        ...bankTransferDetails,
        transferReference:
          payment.providerReference,
        amountInCentavos:
          payment.amountInCentavos,
        currency: payment.currency,
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      response.status(400).json({
        message:
          "Review the payment information.",
        errors:
          formatValidationErrors(error),
      });

      return;
    }

    console.error(
      "Unable to initiate bank transfer:",
    );
    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to initiate the bank transfer at this time.",
    });
  }
};

export const uploadParticipantPaymentProof = async (
  request,
  response,
) => {
  const removeUploadedFile = async () => {
    if (!request.file?.path) {
      return;
    }

    try {
      await fs.unlink(request.file.path);
    } catch (error) {
      if (error.code !== "ENOENT") {
        console.error(
          "Unable to remove unused payment proof:",
        );
        console.error(error.message);
      }
    }
  };

  try {
    const normalizedSlug = request.params.slug
      .trim()
      .toLowerCase();

    if (!request.file) {
      response.status(400).json({
        message:
          "Select a JPG, PNG, or PDF receipt to upload.",
        code: "PAYMENT_PROOF_REQUIRED",
      });

      return;
    }

    const event = await Event.findOne({
      slug: normalizedSlug,
      isPublished: true,
      status: {
        $ne: "cancelled",
      },
    })
      .select("_id title slug")
      .lean();

    if (!event) {
      await removeUploadedFile();

      response.status(404).json({
        message: "Event not found.",
        code: "EVENT_NOT_FOUND",
      });

      return;
    }

    const registration =
      await EventRegistration.findOne({
        participant: request.user._id,
        event: event._id,
      })
        .select("_id status")
        .lean();

    if (!registration) {
      await removeUploadedFile();

      response.status(404).json({
        message:
          "No event registration was found.",
        code: "REGISTRATION_NOT_FOUND",
      });

      return;
    }

    if (
      ![
        "pending-payment",
        "confirmed",
      ].includes(registration.status)
    ) {
      await removeUploadedFile();

      response.status(409).json({
        message:
          "Submit the event registration before uploading a receipt.",
        code: "REGISTRATION_NOT_SUBMITTED",
      });

      return;
    }

    const payment = await Payment.findOne({
      registration: registration._id,
      participant: request.user._id,
      event: event._id,
    });

    if (!payment) {
      await removeUploadedFile();

      response.status(404).json({
        message:
          "Prepare the payment record before uploading a receipt.",
        code: "PAYMENT_NOT_FOUND",
      });

      return;
    }

    if (
      payment.method !== "bank-transfer" ||
      payment.provider !== "manual"
    ) {
      await removeUploadedFile();

      response.status(409).json({
        message:
          "A receipt can only be uploaded for a bank-transfer payment.",
        code: "BANK_TRANSFER_NOT_SELECTED",
      });

      return;
    }

    if (payment.status === "paid") {
      await removeUploadedFile();

      response.status(409).json({
        message:
          "The payment has already been completed.",
        code: "PAYMENT_ALREADY_PAID",
      });

      return;
    }

    if (
      [
        "cancelled",
        "refunded",
      ].includes(payment.status)
    ) {
      await removeUploadedFile();

      response.status(409).json({
        message:
          "A receipt cannot be uploaded for this payment.",
        code: "PAYMENT_NOT_EDITABLE",
      });

      return;
    }

    const previousFilePath =
      payment.proofOfPayment?.filePath;

    payment.proofOfPayment = {
      originalName: request.file.originalname,
      storedName: request.file.filename,
      filePath: path.relative(
        process.cwd(),
        request.file.path,
      ),
      mimeType: request.file.mimetype,
      sizeInBytes: request.file.size,
      uploadedAt: new Date(),
      reviewStatus: "pending-review",
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
    };

    payment.status = "processing";

    await payment.save();

    if (previousFilePath) {
      try {
        const resolvedPreviousFilePath =
          path.resolve(
            process.cwd(),
            previousFilePath,
          );

        if (
          resolvedPreviousFilePath !==
          path.resolve(request.file.path)
        ) {
          await fs.unlink(
            resolvedPreviousFilePath,
          );
        }
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error(
            "Unable to remove previous payment proof:",
          );
          console.error(error.message);
        }
      }
    }

    response.status(200).json({
      message:
        "Proof of payment uploaded successfully.",
      payment: formatPayment(payment),
      event: {
        id: event._id,
        title: event.title,
        slug: event.slug,
      },
    });
  } catch (error) {
    await removeUploadedFile();

    if (error.name === "ValidationError") {
      response.status(400).json({
        message:
          "Review the proof-of-payment information.",
        errors:
          formatValidationErrors(error),
      });

      return;
    }

    console.error(
      "Unable to upload proof of payment:",
    );
    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to upload the proof of payment at this time.",
    });
  }
};