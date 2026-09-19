import mongoose from "mongoose";

import EventRegistration from "../models/EventRegistration.js";
import ParticipantProfile from "../models/ParticipantProfile.js";
import Payment from "../models/Payment.js";

const CONTACT_NUMBER_PATTERN =
  /^\+?[0-9\s().-]{7,30}$/;

const EDITABLE_REGISTRATION_STATUSES = [
  "draft",
  "pending-payment",
];

const buildSafeProfile = (profile) => ({
  id: profile._id,
  organization: profile.organization,
  jobTitle: profile.jobTitle,
  contactNumber: profile.contactNumber,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const buildSafeEvent = (event) => {
  if (!event) {
    return null;
  }

  return {
    id: event._id,
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    startDate: event.startDate,
    endDate: event.endDate,
    venue: {
      name: event.venue?.name || "",
      address: event.venue?.address || "",
      city: event.venue?.city || "",
      country: event.venue?.country || "",
    },
    registrationPeriod: {
      opensAt:
        event.registrationPeriod?.opensAt ||
        null,
      closesAt:
        event.registrationPeriod?.closesAt ||
        null,
    },
    registrationFee: {
      amountInCentavos:
        event.registrationFee
          ?.amountInCentavos ?? 0,
      currency:
        event.registrationFee?.currency ||
        "PHP",
    },
    status: event.status,
  };
};

const buildSafeBreakoutBlock = (
  breakoutBlock,
) => {
  if (!breakoutBlock) {
    return null;
  }

  if (!breakoutBlock._id) {
    return {
      id: breakoutBlock,
    };
  }

  return {
    id: breakoutBlock._id,
    title: breakoutBlock.title,
    description:
      breakoutBlock.description || "",
    startsAt: breakoutBlock.startsAt,
    endsAt: breakoutBlock.endsAt,
    displayOrder:
      breakoutBlock.displayOrder,
    minimumSelections:
      breakoutBlock.minimumSelections,
    maximumSelections:
      breakoutBlock.maximumSelections,
    status: breakoutBlock.status,
  };
};

const buildSafeSpeakers = (
  speakers = [],
) =>
  speakers.map((speaker) => ({
    name: speaker.name,
    jobTitle: speaker.jobTitle || "",
    organization:
      speaker.organization || "",
  }));

const buildSafeBreakoutSession = (
  breakoutSession,
) => {
  if (!breakoutSession) {
    return null;
  }

  if (!breakoutSession._id) {
    return {
      id: breakoutSession,
    };
  }

  return {
    id: breakoutSession._id,
    title: breakoutSession.title,
    description:
      breakoutSession.description,
    room: breakoutSession.room,
    speakers: buildSafeSpeakers(
      breakoutSession.speakers,
    ),
    capacity: breakoutSession.capacity,
    displayOrder:
      breakoutSession.displayOrder,
    status: breakoutSession.status,
  };
};

const buildSafeBreakoutSelections = (
  breakoutSelections = [],
) =>
  breakoutSelections
    .map((selection) => ({
      breakoutBlock:
        buildSafeBreakoutBlock(
          selection.breakoutBlock,
        ),
      breakoutSession:
        buildSafeBreakoutSession(
          selection.breakoutSession,
        ),
    }))
    .sort((firstSelection, secondSelection) => {
      const firstOrder =
        firstSelection.breakoutBlock
          ?.displayOrder ?? 0;

      const secondOrder =
        secondSelection.breakoutBlock
          ?.displayOrder ?? 0;

      return firstOrder - secondOrder;
    });

const buildSafePayment = (payment) => {
  if (!payment) {
    return null;
  }

  return {
    id: payment._id,
    amountInCentavos:
      payment.amountInCentavos,
    currency: payment.currency,
    method: payment.method,
    provider: payment.provider,
    providerReference:
      payment.providerReference,
    status: payment.status,
    paidAt: payment.paidAt,
    proofOfPayment: {
      originalName:
        payment.proofOfPayment
          ?.originalName || null,
      mimeType:
        payment.proofOfPayment
          ?.mimeType || null,
      sizeInBytes:
        payment.proofOfPayment
          ?.sizeInBytes ?? null,
      uploadedAt:
        payment.proofOfPayment
          ?.uploadedAt || null,
      reviewStatus:
        payment.proofOfPayment
          ?.reviewStatus ||
        "not-submitted",
      reviewedAt:
        payment.proofOfPayment
          ?.reviewedAt || null,
      rejectionReason:
        payment.proofOfPayment
          ?.rejectionReason || null,
    },
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
};

const getBreakoutSelectionEditPermission = ({
  registration,
  event,
  currentDate = new Date(),
}) => {
  if (!event) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The event connected to this registration is unavailable.",
    };
  }

  if (registration.status === "cancelled") {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "Cancelled registrations can no longer be edited.",
    };
  }

  if (registration.status === "confirmed") {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "Confirmed registrations can no longer be edited.",
    };
  }

  if (
    !EDITABLE_REGISTRATION_STATUSES.includes(
      registration.status,
    )
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "This registration is not currently editable.",
    };
  }

  if (
    event.status !== "registration-open"
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The event is not currently accepting registration changes.",
    };
  }

  const registrationOpensAt =
    event.registrationPeriod?.opensAt
      ? new Date(
          event.registrationPeriod.opensAt,
        )
      : null;

  const registrationClosesAt =
    event.registrationPeriod?.closesAt
      ? new Date(
          event.registrationPeriod.closesAt,
        )
      : null;

  const eventStartsAt = event.startDate
    ? new Date(event.startDate)
    : null;

  if (
    registrationOpensAt &&
    currentDate < registrationOpensAt
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The registration period has not opened yet.",
    };
  }

  if (
    registrationClosesAt &&
    currentDate >= registrationClosesAt
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The registration period has closed.",
    };
  }

  if (
    eventStartsAt &&
    currentDate >= eventStartsAt
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The event has already started.",
    };
  }

  return {
    canEditBreakoutSelections: true,
    editRestrictionReason: null,
  };
};

const getRegistrationCancellationPermission = ({
  registration,
  event,
  payment,
  currentDate = new Date(),
}) => {
  if (!event) {
    return {
      canCancelRegistration: false,
      cancellationRestrictionReason:
        "The event connected to this registration is unavailable.",
    };
  }

  if (registration.status === "cancelled") {
    return {
      canCancelRegistration: false,
      cancellationRestrictionReason:
        "This registration has already been cancelled.",
    };
  }

  const paymentStatus =
    payment?.status ||
    registration.paymentStatus;

  const requiresAdministratorAssistance =
    registration.status === "confirmed" ||
    ["paid", "refunded"].includes(
      paymentStatus,
    );

  if (requiresAdministratorAssistance) {
    return {
      canCancelRegistration: false,
      cancellationRestrictionReason:
        "Paid registrations require administrator assistance for cancellation and refund processing.",
    };
  }

  const eventStartsAt = event.startDate
    ? new Date(event.startDate)
    : null;

  if (
    eventStartsAt &&
    currentDate >= eventStartsAt
  ) {
    return {
      canCancelRegistration: false,
      cancellationRestrictionReason:
        "This registration can no longer be cancelled because the event has already started.",
    };
  }

  return {
    canCancelRegistration: true,
    cancellationRestrictionReason: null,
  };
};

const validateProfileData = ({
  organization,
  jobTitle,
  contactNumber,
}) => {
  const errors = {};

  if (!organization) {
    errors.organization =
      "Organization is required";
  } else if (organization.length < 2) {
    errors.organization =
      "Organization must contain at least 2 characters";
  } else if (organization.length > 150) {
    errors.organization =
      "Organization cannot exceed 150 characters";
  }

  if (!jobTitle) {
    errors.jobTitle =
      "Job title is required";
  } else if (jobTitle.length < 2) {
    errors.jobTitle =
      "Job title must contain at least 2 characters";
  } else if (jobTitle.length > 100) {
    errors.jobTitle =
      "Job title cannot exceed 100 characters";
  }

  if (!contactNumber) {
    errors.contactNumber =
      "Contact number is required";
  } else if (contactNumber.length > 30) {
    errors.contactNumber =
      "Contact number cannot exceed 30 characters";
  } else if (
    !CONTACT_NUMBER_PATTERN.test(
      contactNumber,
    )
  ) {
    errors.contactNumber =
      "Please provide a valid contact number";
  }

  return errors;
};

export const getParticipantProfile = async (
  request,
  response,
) => {
  try {
    const profile =
      await ParticipantProfile.findOne({
        user: request.user._id,
      });

    if (!profile) {
      return response.status(200).json({
        profile: null,
        isProfileComplete: false,
      });
    }

    return response.status(200).json({
      profile: buildSafeProfile(profile),
      isProfileComplete: true,
    });
  } catch (error) {
    console.error(
      "Unable to retrieve participant profile:",
    );
    console.error(error.message);

    return response.status(500).json({
      message:
        "Unable to retrieve participant profile",
    });
  }
};

export const getParticipantRegistrations =
  async (
    request,
    response,
  ) => {
    try {
      const registrations =
        await EventRegistration.find({
          participant: request.user._id,
        })
          .populate({
            path: "event",
            select: [
              "title",
              "slug",
              "summary",
              "startDate",
              "endDate",
              "venue",
              "registrationPeriod",
              "registrationFee",
              "status",
            ].join(" "),
          })
          .populate({
            path:
              "breakoutSelections.breakoutBlock",
            select: [
              "title",
              "description",
              "startsAt",
              "endsAt",
              "displayOrder",
              "minimumSelections",
              "maximumSelections",
              "status",
            ].join(" "),
          })
          .populate({
            path:
              "breakoutSelections.breakoutSession",
            select: [
              "title",
              "description",
              "room",
              "speakers",
              "capacity",
              "displayOrder",
              "status",
            ].join(" "),
          })
          .sort({
            createdAt: -1,
          });

      if (registrations.length === 0) {
        return response.status(200).json({
          registrations: [],
        });
      }

      const registrationIds =
        registrations.map(
          (registration) =>
            registration._id,
        );

      const payments = await Payment.find({
        participant: request.user._id,
        registration: {
          $in: registrationIds,
        },
      });

      const paymentsByRegistrationId =
        new Map(
          payments.map((payment) => [
            payment.registration.toString(),
            payment,
          ]),
        );

      const currentDate = new Date();

      const safeRegistrations =
        registrations
          .filter(
            (registration) =>
              registration.event !== null,
          )
          .map((registration) => {
            const payment =
              paymentsByRegistrationId.get(
                registration._id.toString(),
              );

            const editPermission =
              getBreakoutSelectionEditPermission({
                registration,
                event: registration.event,
                currentDate,
              });

            const cancellationPermission =
              getRegistrationCancellationPermission({
                registration,
                event: registration.event,
                payment,
                currentDate,
              });

            return {
              id: registration._id,
              status: registration.status,
              paymentStatus:
                registration.paymentStatus,
              submittedAt:
                registration.submittedAt,
              confirmedAt:
                registration.confirmedAt,
              cancelledAt:
                registration.cancelledAt,
              breakoutSelections:
                buildSafeBreakoutSelections(
                  registration.breakoutSelections,
                ),
              event: buildSafeEvent(
                registration.event,
              ),
              payment:
                buildSafePayment(payment),

              ...editPermission,
              ...cancellationPermission,

              createdAt:
                registration.createdAt,
              updatedAt:
                registration.updatedAt,
            };
          });

      return response.status(200).json({
        registrations:
          safeRegistrations,
      });
    } catch (error) {
      console.error(
        "Unable to retrieve participant registrations:",
      );
      console.error(error.message);

      return response.status(500).json({
        message:
          "Unable to retrieve participant registrations",
      });
    }
  };

export const cancelParticipantRegistration =
  async (request, response) => {
    try {
      const { registrationId } =
        request.params;

      if (
        !mongoose.isValidObjectId(
          registrationId,
        )
      ) {
        return response.status(400).json({
          message:
            "The provided registration ID is invalid.",
          code: "INVALID_REGISTRATION_ID",
        });
      }

      const registration =
        await EventRegistration.findOne({
          _id: registrationId,
          participant: request.user._id,
        }).populate({
          path: "event",
          select:
            "title slug startDate status",
        });

      if (!registration) {
        return response.status(404).json({
          message:
            "Registration not found.",
          code: "REGISTRATION_NOT_FOUND",
        });
      }

      if (!registration.event) {
        return response.status(409).json({
          message:
            "The event connected to this registration is unavailable.",
          code: "EVENT_UNAVAILABLE",
        });
      }

      if (
        registration.status ===
        "cancelled"
      ) {
        return response.status(409).json({
          message:
            "This registration has already been cancelled.",
          code:
            "REGISTRATION_ALREADY_CANCELLED",
        });
      }

      const currentDate = new Date();

      const eventStartsAt =
        registration.event.startDate
          ? new Date(
              registration.event.startDate,
            )
          : null;

      if (
        eventStartsAt &&
        currentDate >= eventStartsAt
      ) {
        return response.status(409).json({
          message:
            "This registration can no longer be cancelled because the event has already started.",
          code: "EVENT_ALREADY_STARTED",
        });
      }

      const payment =
        await Payment.findOne({
          registration: registration._id,
          participant: request.user._id,
        });

      const paymentRequiresAdmin =
        [
          "paid",
          "refunded",
        ].includes(payment?.status) ||
        [
          "paid",
          "refunded",
        ].includes(
          registration.paymentStatus,
        ) ||
        registration.status ===
          "confirmed";

      if (paymentRequiresAdmin) {
        return response.status(409).json({
          message:
            "Paid registrations require administrator assistance for cancellation and refund processing.",
          code:
            "PAID_REGISTRATION_REQUIRES_ADMIN",
        });
      }

      const cancelledAt = new Date();

      registration.status = "cancelled";
      registration.paymentStatus =
        "cancelled";
      registration.cancelledAt =
        cancelledAt;
      registration.confirmedAt = null;

      const saveOperations = [
        registration.save(),
      ];

      if (payment) {
        payment.status = "cancelled";
        payment.cancelledAt =
          cancelledAt;

        saveOperations.push(
          payment.save(),
        );
      }

      await Promise.all(saveOperations);

      return response.status(200).json({
        message:
          "Registration cancelled successfully.",
        registration: {
          id: registration._id,
          status: registration.status,
          paymentStatus:
            registration.paymentStatus,
          submittedAt:
            registration.submittedAt,
          confirmedAt:
            registration.confirmedAt,
          cancelledAt:
            registration.cancelledAt,
          event: {
            id: registration.event._id,
            title:
              registration.event.title,
            slug: registration.event.slug,
            startDate:
              registration.event
                .startDate,
          },
        },
        payment: payment
          ? {
              id: payment._id,
              status: payment.status,
              cancelledAt:
                payment.cancelledAt,
            }
          : null,
      });
    } catch (error) {
      console.error(
        "Unable to cancel participant registration:",
      );

      console.error(error.message);

      return response.status(500).json({
        message:
          "Unable to cancel the registration.",
      });
    }
  };

export const saveParticipantProfile = async (
  request,
  response,
) => {
  try {
    const {
      organization,
      jobTitle,
      contactNumber,
    } = request.body ?? {};

    const normalizedProfileData = {
      organization:
        typeof organization === "string"
          ? organization.trim()
          : "",
      jobTitle:
        typeof jobTitle === "string"
          ? jobTitle.trim()
          : "",
      contactNumber:
        typeof contactNumber === "string"
          ? contactNumber.trim()
          : "",
    };

    const errors = validateProfileData(
      normalizedProfileData,
    );

    if (Object.keys(errors).length > 0) {
      return response.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    const existingProfile =
      await ParticipantProfile.findOne({
        user: request.user._id,
      });

    if (!existingProfile) {
      const profile =
        await ParticipantProfile.create({
          user: request.user._id,
          ...normalizedProfileData,
        });

      return response.status(201).json({
        message:
          "Participant profile created successfully",
        profile: buildSafeProfile(profile),
        isProfileComplete: true,
      });
    }

    existingProfile.organization =
      normalizedProfileData.organization;

    existingProfile.jobTitle =
      normalizedProfileData.jobTitle;

    existingProfile.contactNumber =
      normalizedProfileData.contactNumber;

    await existingProfile.save();

    return response.status(200).json({
      message:
        "Participant profile updated successfully",
      profile: buildSafeProfile(
        existingProfile,
      ),
      isProfileComplete: true,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return response.status(409).json({
        message:
          "A participant profile already exists for this account",
      });
    }

    console.error(
      "Unable to save participant profile:",
    );
    console.error(error.message);

    return response.status(500).json({
      message:
        "Unable to save participant profile",
    });
  }
};