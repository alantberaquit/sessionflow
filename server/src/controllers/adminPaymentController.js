import fs from "node:fs/promises";
import path from "node:path";

import mongoose from "mongoose";

import { uploadDirectory } from "../middleware/uploadPaymentProof.js";
import EventRegistration from "../models/EventRegistration.js";
import Payment from "../models/Payment.js";
import sendRegistrationConfirmation from "../services/registrationConfirmationService.js";

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
  refundReference: payment.refundReference,
  refundReason: payment.refundReason,
  refundNotes: payment.refundNotes,
  refundedBy: payment.refundedBy,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
});

const formatRegistration = (
  registration,
) => ({
  id: registration._id,
  participant: registration.participant,
  event: registration.event,
  status: registration.status,
  paymentStatus:
    registration.paymentStatus,
  submittedAt: registration.submittedAt,
  confirmedAt: registration.confirmedAt,
  cancelledAt: registration.cancelledAt,
  createdAt: registration.createdAt,
  updatedAt: registration.updatedAt,
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

const createControllerError = (
  message,
  statusCode,
  code,
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

export const getPendingPaymentReviews =
  async (request, response) => {
    try {
      const payments = await Payment.find({
        method: "bank-transfer",
        provider: "manual",
        status: "processing",
        "proofOfPayment.reviewStatus":
          "pending-review",
      })
        .populate({
          path: "participant",
          select: "name email role",
        })
        .populate({
          path: "event",
          select:
            "title slug startDate endDate",
        })
        .populate({
          path: "registration",
          select: [
            "status",
            "paymentStatus",
            "submittedAt",
            "confirmedAt",
            "cancelledAt",
            "createdAt",
            "updatedAt",
          ].join(" "),
        })
        .sort({
          "proofOfPayment.uploadedAt": 1,
          createdAt: 1,
        })
        .lean();

      const pendingReviews = payments.map(
        (payment) => ({
          id: payment._id,

          participant: payment.participant
            ? {
                id:
                  payment.participant._id,
                name:
                  payment.participant.name,
                email:
                  payment.participant.email,
              }
            : null,

          event: payment.event
            ? {
                id: payment.event._id,
                title: payment.event.title,
                slug: payment.event.slug,
                startDate:
                  payment.event.startDate,
                endDate:
                  payment.event.endDate,
              }
            : null,

          registration:
            payment.registration
              ? {
                  id:
                    payment.registration
                      ._id,
                  status:
                    payment.registration
                      .status,
                  paymentStatus:
                    payment.registration
                      .paymentStatus,
                  submittedAt:
                    payment.registration
                      .submittedAt,
                  confirmedAt:
                    payment.registration
                      .confirmedAt,
                  cancelledAt:
                    payment.registration
                      .cancelledAt,
                  createdAt:
                    payment.registration
                      .createdAt,
                  updatedAt:
                    payment.registration
                      .updatedAt,
                }
              : null,

          amountInCentavos:
            payment.amountInCentavos,

          currency: payment.currency,

          method: payment.method,

          provider: payment.provider,

          providerReference:
            payment.providerReference,

          status: payment.status,

          proofOfPayment: {
            originalName:
              payment.proofOfPayment
                ?.originalName,

            storedName:
              payment.proofOfPayment
                ?.storedName,

            mimeType:
              payment.proofOfPayment
                ?.mimeType,

            sizeInBytes:
              payment.proofOfPayment
                ?.sizeInBytes,

            uploadedAt:
              payment.proofOfPayment
                ?.uploadedAt,

            reviewStatus:
              payment.proofOfPayment
                ?.reviewStatus,
          },

          createdAt: payment.createdAt,

          updatedAt: payment.updatedAt,
        }),
      );

      response.status(200).json({
        message:
          "Pending payment reviews retrieved successfully.",
        count: pendingReviews.length,
        payments: pendingReviews,
      });
    } catch (error) {
      console.error(
        "Unable to retrieve pending payment reviews:",
      );
      console.error(error.message);

      response.status(500).json({
        message:
          "Unable to retrieve pending payment reviews at this time.",
      });
    }
  };

export const getPaymentProofFile = async (
  request,
  response,
) => {
  try {
    const { paymentId } = request.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        paymentId,
      )
    ) {
      response.status(400).json({
        message:
          "The payment identifier is invalid.",
        code: "INVALID_PAYMENT_ID",
      });

      return;
    }

    const payment = await Payment.findById(
      paymentId,
    )
      .select(
        "method provider proofOfPayment",
      )
      .lean();

    if (!payment) {
      response.status(404).json({
        message: "Payment not found.",
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
          "This payment does not contain a manual bank-transfer receipt.",
        code:
          "PAYMENT_NOT_MANUAL_BANK_TRANSFER",
      });

      return;
    }

    const storedName =
      payment.proofOfPayment?.storedName;

    if (!storedName) {
      response.status(404).json({
        message:
          "No proof-of-payment file was found.",
        code: "PAYMENT_PROOF_NOT_FOUND",
      });

      return;
    }

    const resolvedUploadDirectory =
      path.resolve(uploadDirectory);

    const resolvedFilePath = path.resolve(
      resolvedUploadDirectory,
      storedName,
    );

    const isInsideUploadDirectory =
      resolvedFilePath.startsWith(
        `${resolvedUploadDirectory}${path.sep}`,
      );

    if (!isInsideUploadDirectory) {
      response.status(400).json({
        message:
          "The proof-of-payment file path is invalid.",
        code:
          "PAYMENT_PROOF_PATH_INVALID",
      });

      return;
    }

    try {
      await fs.access(resolvedFilePath);
    } catch {
      response.status(404).json({
        message:
          "The proof-of-payment file is unavailable.",
        code:
          "PAYMENT_PROOF_FILE_MISSING",
      });

      return;
    }

    response.setHeader(
      "Content-Type",
      payment.proofOfPayment.mimeType ||
        "application/octet-stream",
    );

    response.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(
        payment.proofOfPayment
          .originalName || storedName,
      )}"`,
    );

    response.sendFile(resolvedFilePath);
  } catch (error) {
    console.error(
      "Unable to retrieve proof of payment:",
    );
    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to retrieve the proof of payment at this time.",
    });
  }
};

export const reviewPaymentProof = async (
  request,
  response,
) => {
  const databaseSession =
    await mongoose.startSession();

  try {
    const { paymentId } = request.params;

    const {
      decision,
      rejectionReason,
    } = request.body;

    if (
      !mongoose.Types.ObjectId.isValid(
        paymentId,
      )
    ) {
      response.status(400).json({
        message:
          "The payment identifier is invalid.",
        code: "INVALID_PAYMENT_ID",
      });

      return;
    }

    const supportedDecisions = [
      "approve",
      "reject",
    ];

    if (
      !supportedDecisions.includes(decision)
    ) {
      response.status(400).json({
        message:
          "Choose approve or reject as the review decision.",
        code: "INVALID_REVIEW_DECISION",
        supportedDecisions,
      });

      return;
    }

    const normalizedRejectionReason =
      typeof rejectionReason === "string"
        ? rejectionReason.trim()
        : "";

    if (
      decision === "reject" &&
      normalizedRejectionReason.length < 10
    ) {
      response.status(400).json({
        message:
          "Provide a clear rejection reason containing at least 10 characters.",
        code:
          "REJECTION_REASON_REQUIRED",
      });

      return;
    }

    let reviewedPayment;
    let updatedRegistration;
    let confirmationEmail = null;

    await databaseSession.withTransaction(
      async () => {
        const payment =
          await Payment.findById(
            paymentId,
          ).session(databaseSession);

        if (!payment) {
          throw createControllerError(
            "Payment not found.",
            404,
            "PAYMENT_NOT_FOUND",
          );
        }

        if (
          payment.method !==
            "bank-transfer" ||
          payment.provider !== "manual"
        ) {
          throw createControllerError(
            "Only manual bank-transfer payments can be reviewed through this endpoint.",
            409,
            "PAYMENT_NOT_MANUAL_BANK_TRANSFER",
          );
        }

        if (
          payment.proofOfPayment
            ?.reviewStatus ===
          "not-submitted"
        ) {
          throw createControllerError(
            "No proof of payment has been submitted.",
            409,
            "PAYMENT_PROOF_NOT_SUBMITTED",
          );
        }

        if (
          !payment.proofOfPayment
            ?.storedName ||
          !payment.proofOfPayment
            ?.filePath
        ) {
          throw createControllerError(
            "The proof-of-payment record is incomplete.",
            409,
            "PAYMENT_PROOF_INCOMPLETE",
          );
        }

        if (
          [
            "cancelled",
            "refunded",
          ].includes(payment.status)
        ) {
          throw createControllerError(
            "This payment can no longer be reviewed.",
            409,
            "PAYMENT_NOT_REVIEWABLE",
          );
        }

        const registration =
          await EventRegistration.findById(
            payment.registration,
          ).session(databaseSession);

        if (!registration) {
          throw createControllerError(
            "The registration linked to this payment was not found.",
            404,
            "REGISTRATION_NOT_FOUND",
          );
        }

        const reviewedAt = new Date();

        payment.proofOfPayment.reviewedAt =
          reviewedAt;

        payment.proofOfPayment.reviewedBy =
          request.user._id;

        if (decision === "approve") {
          payment.proofOfPayment.reviewStatus =
            "approved";

          payment.proofOfPayment.rejectionReason =
            null;

          payment.status = "paid";

          payment.paidAt =
            payment.paidAt || reviewedAt;

          payment.failureReason = null;
          payment.failedAt = null;
          payment.cancelledAt = null;

          registration.status =
            "confirmed";

          registration.paymentStatus =
            "paid";

          registration.confirmedAt =
            registration.confirmedAt ||
            reviewedAt;

          registration.cancelledAt = null;
        } else {
          payment.proofOfPayment.reviewStatus =
            "rejected";

          payment.proofOfPayment.rejectionReason =
            normalizedRejectionReason;

          payment.status = "processing";
          payment.paidAt = null;

          registration.status =
            "pending-payment";

          registration.paymentStatus =
            "pending";

          registration.confirmedAt = null;
        }

        await payment.save({
          session: databaseSession,
        });

        await registration.save({
          session: databaseSession,
        });

        reviewedPayment = payment;
        updatedRegistration =
          registration;
      },
    );

    /*
     * Email delivery happens only after the
     * transaction has committed successfully.
     *
     * An email failure must not reverse a valid
     * payment approval.
     */
    if (decision === "approve") {
      try {
        confirmationEmail =
          await sendRegistrationConfirmation({
            registrationId:
              updatedRegistration._id,
            paymentId:
              reviewedPayment._id,
          });

        console.log(
          `Registration confirmation email processed for ${confirmationEmail.participantEmail}.`,
        );

        if (
          confirmationEmail.previewUrl
        ) {
          console.log(
            "Confirmation email preview:",
            confirmationEmail.previewUrl,
          );
        }
      } catch (emailError) {
        console.error(
          "Payment was approved, but the registration confirmation email could not be sent:",
        );

        console.error(
          emailError.message,
        );

        confirmationEmail = {
          sent: false,
          skipped: false,
          failed: true,
          reason:
            "email-delivery-failed",
        };
      }
    }

    response.status(200).json({
      message:
        decision === "approve"
          ? "Proof of payment approved successfully."
          : "Proof of payment rejected successfully.",

      payment:
        formatPayment(reviewedPayment),

      registration:
        formatRegistration(
          updatedRegistration,
        ),

      confirmationEmail:
        decision === "approve"
          ? confirmationEmail
          : null,
    });
  } catch (error) {
    if (
      error.statusCode &&
      error.code
    ) {
      response
        .status(error.statusCode)
        .json({
          message: error.message,
          code: error.code,
        });

      return;
    }

    if (
      error.name === "ValidationError"
    ) {
      response.status(400).json({
        message:
          "Review the payment-review information.",
        errors:
          formatValidationErrors(error),
      });

      return;
    }

    console.error(
      "Unable to review proof of payment:",
    );

    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to review the proof of payment at this time.",
    });
  } finally {
    await databaseSession.endSession();
  }
};

export const resendRegistrationConfirmation =
  async (request, response) => {
    try {
      const { registrationId } =
        request.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          registrationId,
        )
      ) {
        response.status(400).json({
          message:
            "The registration identifier is invalid.",
          code: "INVALID_REGISTRATION_ID",
        });

        return;
      }

      const registration =
        await EventRegistration.findById(
          registrationId,
        )
          .select(
            "_id status paymentStatus",
          )
          .lean();

      if (!registration) {
        response.status(404).json({
          message:
            "Registration not found.",
          code: "REGISTRATION_NOT_FOUND",
        });

        return;
      }

      if (
        registration.status !==
          "confirmed" ||
        registration.paymentStatus !==
          "paid"
      ) {
        response.status(409).json({
          message:
            "Only confirmed paid registrations can receive a confirmation email.",
          code:
            "REGISTRATION_NOT_CONFIRMED_PAID",
        });

        return;
      }

      const payment = await Payment.findOne({
        registration: registration._id,
        status: "paid",
      })
        .select("_id")
        .lean();

      if (!payment) {
        response.status(404).json({
          message:
            "No paid payment was found for this registration.",
          code: "PAID_PAYMENT_NOT_FOUND",
        });

        return;
      }

      const confirmationEmail =
        await sendRegistrationConfirmation({
          registrationId:
            registration._id,
          paymentId: payment._id,
        });

      console.log(
        `Registration confirmation email resent to ${confirmationEmail.participantEmail}.`,
      );

      if (confirmationEmail.previewUrl) {
        console.log(
          "Resent confirmation email preview:",
          confirmationEmail.previewUrl,
        );
      }

      response.status(200).json({
        message:
          "Registration confirmation email resent successfully.",
        confirmationEmail,
      });
    } catch (error) {
      console.error(
        "Unable to resend the registration confirmation email:",
      );

      console.error(error.message);

      response.status(500).json({
        message:
          "Unable to resend the registration confirmation email at this time.",
        code:
          "CONFIRMATION_EMAIL_RESEND_FAILED",
      });
    }
  };

export const getPaidRegistrations =
  async (request, response) => {
    try {
      const paidPayments =
        await Payment.find({
          status: "paid",
        })
          .populate({
            path: "participant",
            select: "name email",
          })
          .populate({
            path: "event",
            select:
              "title slug startDate endDate",
          })
          .populate({
            path: "registration",
            select: [
              "status",
              "paymentStatus",
              "submittedAt",
              "confirmedAt",
              "cancelledAt",
              "createdAt",
              "updatedAt",
            ].join(" "),
            match: {
              status: "confirmed",
              paymentStatus: "paid",
            },
          })
          .sort({
            paidAt: -1,
            updatedAt: -1,
          })
          .lean();

      const registrations =
        paidPayments
          .filter(
            (payment) =>
              payment.registration,
          )
          .map((payment) => ({
            participant:
              payment.participant
                ? {
                    id:
                      payment.participant
                        ._id,
                    name:
                      payment.participant
                        .name,
                    email:
                      payment.participant
                        .email,
                  }
                : null,

            event: payment.event
              ? {
                  id: payment.event._id,
                  title:
                    payment.event.title,
                  slug:
                    payment.event.slug,
                  startDate:
                    payment.event
                      .startDate,
                  endDate:
                    payment.event.endDate,
                }
              : null,

            registration: {
              id:
                payment.registration._id,
              status:
                payment.registration
                  .status,
              paymentStatus:
                payment.registration
                  .paymentStatus,
              submittedAt:
                payment.registration
                  .submittedAt,
              confirmedAt:
                payment.registration
                  .confirmedAt,
              cancelledAt:
                payment.registration
                  .cancelledAt,
              createdAt:
                payment.registration
                  .createdAt,
              updatedAt:
                payment.registration
                  .updatedAt,
            },

            payment: {
              id: payment._id,
              status: payment.status,
              amountInCentavos:
                payment.amountInCentavos,
              currency:
                payment.currency,
              method: payment.method,
              provider:
                payment.provider,
              providerReference:
                payment.providerReference,
              paidAt: payment.paidAt,
              createdAt:
                payment.createdAt,
              updatedAt:
                payment.updatedAt,
            },
          }));

      response.status(200).json({
        message:
          "Paid registrations retrieved successfully.",
        count: registrations.length,
        registrations,
      });
    } catch (error) {
      console.error(
        "Unable to retrieve paid registrations:",
      );
      console.error(error.message);

      response.status(500).json({
        message:
          "Unable to retrieve paid registrations at this time.",
      });
    }
  };

export const cancelAndRefundRegistration =
  async (request, response) => {
    const databaseSession =
      await mongoose.startSession();

    try {
      const { registrationId } =
        request.params;

      const {
        refundReference,
        refundReason,
        refundNotes,
      } = request.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          registrationId,
        )
      ) {
        response.status(400).json({
          message:
            "The registration identifier is invalid.",
          code:
            "INVALID_REGISTRATION_ID",
        });

        return;
      }

      const normalizedRefundReference =
        typeof refundReference === "string"
          ? refundReference.trim()
          : "";

      const normalizedRefundReason =
        typeof refundReason === "string"
          ? refundReason.trim()
          : "";

      const normalizedRefundNotes =
        typeof refundNotes === "string"
          ? refundNotes.trim()
          : "";

      if (!normalizedRefundReference) {
        response.status(400).json({
          message:
            "Refund reference is required.",
          code:
            "REFUND_REFERENCE_REQUIRED",
          errors: {
            refundReference:
              "Refund reference is required.",
          },
        });

        return;
      }

      if (
        normalizedRefundReference.length >
        200
      ) {
        response.status(400).json({
          message:
            "Refund reference must not exceed 200 characters.",
          code:
            "REFUND_REFERENCE_TOO_LONG",
          errors: {
            refundReference:
              "Refund reference must not exceed 200 characters.",
          },
        });

        return;
      }

      if (
        normalizedRefundReason.length < 10
      ) {
        response.status(400).json({
          message:
            "Refund reason must contain at least 10 characters.",
          code:
            "REFUND_REASON_REQUIRED",
          errors: {
            refundReason:
              "Refund reason must contain at least 10 characters.",
          },
        });

        return;
      }

      if (
        normalizedRefundReason.length >
        500
      ) {
        response.status(400).json({
          message:
            "Refund reason must not exceed 500 characters.",
          code:
            "REFUND_REASON_TOO_LONG",
          errors: {
            refundReason:
              "Refund reason must not exceed 500 characters.",
          },
        });

        return;
      }

      if (
        normalizedRefundNotes.length >
        1000
      ) {
        response.status(400).json({
          message:
            "Refund notes must not exceed 1000 characters.",
          code:
            "REFUND_NOTES_TOO_LONG",
          errors: {
            refundNotes:
              "Refund notes must not exceed 1000 characters.",
          },
        });

        return;
      }

      let refundedPayment;
      let cancelledRegistration;

      await databaseSession.withTransaction(
        async () => {
          const registration =
            await EventRegistration.findById(
              registrationId,
            ).session(databaseSession);

          if (!registration) {
            throw createControllerError(
              "Registration not found.",
              404,
              "REGISTRATION_NOT_FOUND",
            );
          }

          const payment =
            await Payment.findOne({
              registration:
                registration._id,
            }).session(databaseSession);

          if (!payment) {
            throw createControllerError(
              "The payment linked to this registration was not found.",
              404,
              "PAYMENT_NOT_FOUND",
            );
          }

          if (
            payment.status ===
              "refunded" ||
            registration.paymentStatus ===
              "refunded"
          ) {
            throw createControllerError(
              "This registration has already been refunded.",
              409,
              "REGISTRATION_ALREADY_REFUNDED",
            );
          }

          if (
            registration.status !==
              "confirmed" ||
            registration.paymentStatus !==
              "paid" ||
            payment.status !== "paid"
          ) {
            throw createControllerError(
              "Only confirmed paid registrations can be cancelled and refunded.",
              409,
              "REGISTRATION_NOT_REFUNDABLE",
            );
          }

          const refundedAt = new Date();

          registration.status =
            "cancelled";

          registration.paymentStatus =
            "refunded";

          registration.cancelledAt =
            registration.cancelledAt ||
            refundedAt;

          registration.confirmedAt = null;

          payment.status = "refunded";
          payment.refundedAt = refundedAt;

          payment.refundReference =
            normalizedRefundReference;

          payment.refundReason =
            normalizedRefundReason;

          payment.refundNotes =
            normalizedRefundNotes || null;

          payment.refundedBy =
            request.user._id;

          await payment.save({
            session: databaseSession,
          });

          await registration.save({
            session: databaseSession,
          });

          refundedPayment = payment;

          cancelledRegistration =
            registration;
        },
      );

      response.status(200).json({
        message:
          "Registration cancelled and payment refunded successfully.",

        registration:
          formatRegistration(
            cancelledRegistration,
          ),

        payment:
          formatPayment(refundedPayment),
      });
    } catch (error) {
      if (
        error.statusCode &&
        error.code
      ) {
        response
          .status(error.statusCode)
          .json({
            message: error.message,
            code: error.code,
          });

        return;
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        response.status(400).json({
          message:
            "Review the refund information.",
          errors:
            formatValidationErrors(error),
        });

        return;
      }

      console.error(
        "Unable to cancel and refund registration:",
      );
      console.error(error.message);

      response.status(500).json({
        message:
          "Unable to cancel and refund the registration at this time.",
      });
    } finally {
      await databaseSession.endSession();
    }
  };

export const getRefundedRegistrations =
  async (request, response) => {
    try {
      const refundedPayments =
        await Payment.find({
          status: "refunded",
        })
          .populate({
            path: "participant",
            select: "name email",
          })
          .populate({
            path: "event",
            select:
              "title slug startDate endDate",
          })
          .populate({
            path: "registration",
            select: [
              "status",
              "paymentStatus",
              "submittedAt",
              "confirmedAt",
              "cancelledAt",
              "createdAt",
              "updatedAt",
            ].join(" "),
            match: {
              status: "cancelled",
              paymentStatus: "refunded",
            },
          })
          .populate({
            path: "refundedBy",
            select: "name email",
          })
          .sort({
            refundedAt: -1,
            updatedAt: -1,
          })
          .lean();

      const registrations =
        refundedPayments
          .filter(
            (payment) =>
              payment.registration,
          )
          .map((payment) => ({
            participant:
              payment.participant
                ? {
                    id:
                      payment.participant
                        ._id,
                    name:
                      payment.participant
                        .name,
                    email:
                      payment.participant
                        .email,
                  }
                : null,

            event: payment.event
              ? {
                  id: payment.event._id,
                  title:
                    payment.event.title,
                  slug:
                    payment.event.slug,
                  startDate:
                    payment.event
                      .startDate,
                  endDate:
                    payment.event.endDate,
                }
              : null,

            registration: {
              id:
                payment.registration._id,

              status:
                payment.registration
                  .status,

              paymentStatus:
                payment.registration
                  .paymentStatus,

              submittedAt:
                payment.registration
                  .submittedAt,

              confirmedAt:
                payment.registration
                  .confirmedAt,

              cancelledAt:
                payment.registration
                  .cancelledAt,

              createdAt:
                payment.registration
                  .createdAt,

              updatedAt:
                payment.registration
                  .updatedAt,
            },

            payment: {
              id: payment._id,

              status: payment.status,

              amountInCentavos:
                payment.amountInCentavos,

              currency:
                payment.currency,

              method: payment.method,

              provider:
                payment.provider,

              providerReference:
                payment.providerReference,

              paidAt: payment.paidAt,

              refundedAt:
                payment.refundedAt,

              refundReference:
                payment.refundReference,

              refundReason:
                payment.refundReason,

              refundNotes:
                payment.refundNotes,

              createdAt:
                payment.createdAt,

              updatedAt:
                payment.updatedAt,
            },

            refundedBy:
              payment.refundedBy
                ? {
                    id:
                      payment.refundedBy
                        ._id,
                    name:
                      payment.refundedBy
                        .name,
                    email:
                      payment.refundedBy
                        .email,
                  }
                : null,
          }));

      response.status(200).json({
        message:
          "Refunded registrations retrieved successfully.",
        count: registrations.length,
        registrations,
      });
    } catch (error) {
      console.error(
        "Unable to retrieve refunded registrations:",
      );
      console.error(error.message);

      response.status(500).json({
        message:
          "Unable to retrieve refunded registrations at this time.",
      });
    }
  };