import mongoose from "mongoose";

import BreakoutBlock from "../models/BreakoutBlock.js";
import BreakoutSession from "../models/BreakoutSession.js";
import Event from "../models/Event.js";
import EventRegistration from "../models/EventRegistration.js";
import ParticipantProfile from "../models/ParticipantProfile.js";

const EDITABLE_REGISTRATION_STATUSES = [
  "draft",
  "pending-payment",
];

const formatRegistration = (registration) => ({
  id: registration._id,
  participant: registration.participant,
  event: registration.event,
  breakoutSelections:
    registration.breakoutSelections.map(
      (selection) => ({
        breakoutBlock:
          selection.breakoutBlock,
        breakoutSession:
          selection.breakoutSession,
      }),
    ),
  status: registration.status,
  paymentStatus:
    registration.paymentStatus,
  submittedAt: registration.submittedAt,
  confirmedAt: registration.confirmedAt,
  cancelledAt: registration.cancelledAt,
  createdAt: registration.createdAt,
  updatedAt: registration.updatedAt,
});

const isParticipantProfileComplete = (
  profile,
) =>
  Boolean(
    profile?.organization &&
      profile?.jobTitle &&
      profile?.contactNumber,
  );

const validateSelectionShape = (
  selections,
) => {
  const errors = {};

  if (!Array.isArray(selections)) {
    errors.breakoutSelections =
      "Breakout selections must be an array.";

    return errors;
  }

  for (
    let index = 0;
    index < selections.length;
    index += 1
  ) {
    const selection = selections[index];

    if (
      !selection ||
      typeof selection !== "object" ||
      Array.isArray(selection)
    ) {
      errors.breakoutSelections =
        "Each breakout selection must be an object.";

      return errors;
    }

    if (
      !mongoose.isValidObjectId(
        selection.breakoutBlock,
      )
    ) {
      errors.breakoutSelections =
        `Selection ${
          index + 1
        } has an invalid breakout block.`;

      return errors;
    }

    if (
      !mongoose.isValidObjectId(
        selection.breakoutSession,
      )
    ) {
      errors.breakoutSelections =
        `Selection ${
          index + 1
        } has an invalid breakout session.`;

      return errors;
    }
  }

  const blockIds = selections.map(
    (selection) =>
      selection.breakoutBlock.toString(),
  );

  const sessionIds = selections.map(
    (selection) =>
      selection.breakoutSession.toString(),
  );

  if (
    new Set(blockIds).size !==
    blockIds.length
  ) {
    errors.breakoutSelections =
      "Only one breakout session may be selected from each breakout block.";
  }

  if (
    new Set(sessionIds).size !==
    sessionIds.length
  ) {
    errors.breakoutSelections =
      "The same breakout session cannot be selected more than once.";
  }

  return errors;
};

const validateSelectionRelationships = async (
  eventId,
  selections,
) => {
  if (selections.length === 0) {
    return null;
  }

  const blockIds = selections.map(
    (selection) =>
      selection.breakoutBlock,
  );

  const sessionIds = selections.map(
    (selection) =>
      selection.breakoutSession,
  );

  const [blocks, sessions] =
    await Promise.all([
      BreakoutBlock.find({
        _id: {
          $in: blockIds,
        },
        event: eventId,
        status: {
          $ne: "cancelled",
        },
      })
        .select(
          "_id minimumSelections maximumSelections status",
        )
        .lean(),

      BreakoutSession.find({
        _id: {
          $in: sessionIds,
        },
        event: eventId,
        status: {
          $nin: [
            "cancelled",
            "closed",
          ],
        },
      })
        .select(
          "_id breakoutBlock status capacity",
        )
        .lean(),
    ]);

  const blockMap = new Map(
    blocks.map((block) => [
      block._id.toString(),
      block,
    ]),
  );

  const sessionMap = new Map(
    sessions.map((session) => [
      session._id.toString(),
      session,
    ]),
  );

  for (const selection of selections) {
    const blockId =
      selection.breakoutBlock.toString();

    const sessionId =
      selection.breakoutSession.toString();

    const block = blockMap.get(blockId);
    const session =
      sessionMap.get(sessionId);

    if (!block) {
      return "One or more selected breakout blocks do not belong to this event or are unavailable.";
    }

    if (!session) {
      return "One or more selected breakout sessions do not belong to this event or are unavailable.";
    }

    if (
      session.breakoutBlock.toString() !==
      blockId
    ) {
      return "A selected breakout session does not belong to its submitted breakout block.";
    }

    if (session.status === "full") {
      return "One or more selected breakout sessions are already full.";
    }
  }

  return null;
};

const validateRequiredSelections = async (
  eventId,
  selections,
) => {
  const breakoutBlocks =
    await BreakoutBlock.find({
      event: eventId,
      status: {
        $nin: [
          "cancelled",
          "completed",
        ],
      },
    })
      .select(
        "_id minimumSelections maximumSelections",
      )
      .lean();

  const selectionCountsByBlock =
    new Map();

  selections.forEach((selection) => {
    const blockId =
      selection.breakoutBlock.toString();

    selectionCountsByBlock.set(
      blockId,
      (selectionCountsByBlock.get(
        blockId,
      ) || 0) + 1,
    );
  });

  for (const block of breakoutBlocks) {
    const blockId =
      block._id.toString();

    const selectedCount =
      selectionCountsByBlock.get(
        blockId,
      ) || 0;

    if (
      selectedCount <
      block.minimumSelections
    ) {
      return {
        message:
          "Complete all required breakout selections.",
        code: "INCOMPLETE_SELECTIONS",
        error:
          "One or more required breakout blocks do not have enough selected sessions.",
      };
    }

    if (
      selectedCount >
      block.maximumSelections
    ) {
      return {
        message:
          "One or more breakout blocks have too many selected sessions.",
        code: "TOO_MANY_SELECTIONS",
        error:
          "Review your breakout session selections.",
      };
    }
  }

  return null;
};

const getSelectionEditPermission = ({
  registration,
  event,
  currentDate = new Date(),
}) => {
  if (!event) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The event connected to this registration is unavailable.",
      code: "EVENT_UNAVAILABLE",
    };
  }

  if (
    registration.status ===
    "cancelled"
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "Cancelled registrations can no longer be edited.",
      code: "REGISTRATION_CANCELLED",
    };
  }

  if (
    registration.status ===
    "confirmed"
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "Confirmed registrations can no longer be edited.",
      code: "REGISTRATION_CONFIRMED",
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
      code:
        "REGISTRATION_NOT_EDITABLE",
    };
  }

  if (
    event.status !==
    "registration-open"
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The event is not currently accepting registration changes.",
      code:
        "EVENT_NOT_ACCEPTING_CHANGES",
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
    currentDate <
      registrationOpensAt
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The registration period has not opened yet.",
      code:
        "REGISTRATION_NOT_OPEN",
    };
  }

  if (
    registrationClosesAt &&
    currentDate >=
      registrationClosesAt
  ) {
    return {
      canEditBreakoutSelections: false,
      editRestrictionReason:
        "The registration period has closed.",
      code: "REGISTRATION_CLOSED",
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
      code: "EVENT_ALREADY_STARTED",
    };
  }

  return {
    canEditBreakoutSelections: true,
    editRestrictionReason: null,
    code: null,
  };
};

export const getParticipantRegistration =
  async (request, response) => {
    try {
      const normalizedSlug =
        request.params.slug
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
        });

        return;
      }

      const registration =
        await EventRegistration.findOne({
          participant:
            request.user._id,
          event: event._id,
        }).lean();

      if (!registration) {
        response.status(200).json({
          registration: null,
          hasRegistration: false,
          event: {
            id: event._id,
            title: event.title,
            slug: event.slug,
          },
        });

        return;
      }

      response.status(200).json({
        registration:
          formatRegistration(
            registration,
          ),
        hasRegistration: true,
        event: {
          id: event._id,
          title: event.title,
          slug: event.slug,
        },
      });
    } catch (error) {
      console.error(
        "Unable to retrieve participant registration:",
      );
      console.error(error.message);

      response.status(500).json({
        message:
          "Unable to retrieve the registration at this time.",
      });
    }
  };

export const saveRegistrationDraft =
  async (request, response) => {
    try {
      const normalizedSlug =
        request.params.slug
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
        });

        return;
      }

      const participantProfile =
        await ParticipantProfile.findOne({
          user: request.user._id,
        })
          .select(
            "organization jobTitle contactNumber",
          )
          .lean();

      if (
        !isParticipantProfileComplete(
          participantProfile,
        )
      ) {
        response.status(403).json({
          message:
            "Complete your participant profile before registering for an event.",
          code: "PROFILE_INCOMPLETE",
        });

        return;
      }

      const selections =
        request.body
          .breakoutSelections ?? [];

      const validationErrors =
        validateSelectionShape(
          selections,
        );

      if (
        Object.keys(
          validationErrors,
        ).length > 0
      ) {
        response.status(400).json({
          message:
            "Review the submitted breakout selections.",
          errors: validationErrors,
        });

        return;
      }

      const relationshipError =
        await validateSelectionRelationships(
          event._id,
          selections,
        );

      if (relationshipError) {
        response.status(400).json({
          message: relationshipError,
          errors: {
            breakoutSelections:
              relationshipError,
          },
        });

        return;
      }

      const normalizedSelections =
        selections.map((selection) => ({
          breakoutBlock:
            selection.breakoutBlock,
          breakoutSession:
            selection.breakoutSession,
        }));

      let registration =
        await EventRegistration.findOne({
          participant:
            request.user._id,
          event: event._id,
        });

      let statusCode = 200;
      let message =
        "Registration draft updated successfully.";

      if (!registration) {
        registration =
          new EventRegistration({
            participant:
              request.user._id,
            event: event._id,
            breakoutSelections:
              normalizedSelections,
            status: "draft",
            paymentStatus: "pending",
          });

        statusCode = 201;
        message =
          "Registration draft created successfully.";
      } else {
        registration.breakoutSelections =
          normalizedSelections;
        registration.status = "draft";
        registration.paymentStatus =
          "pending";
        registration.submittedAt = null;
        registration.confirmedAt = null;
        registration.cancelledAt = null;
      }

      await registration.save();

      response.status(statusCode).json({
        message,
        registration:
          formatRegistration(
            registration,
          ),
        event: {
          id: event._id,
          title: event.title,
          slug: event.slug,
        },
      });
    } catch (error) {
      if (error?.code === 11000) {
        response.status(409).json({
          message:
            "A registration already exists for this participant and event.",
        });

        return;
      }

      if (
        error.name ===
        "ValidationError"
      ) {
        const errors =
          Object.fromEntries(
            Object.entries(
              error.errors,
            ).map(
              ([
                field,
                validationError,
              ]) => [
                field,
                validationError.message,
              ],
            ),
          );

        response.status(400).json({
          message:
            "Review the registration information.",
          errors,
        });

        return;
      }

      console.error(
        "Unable to save registration draft:",
      );
      console.error(error.message);

      response.status(500).json({
        message:
          "Unable to save the registration draft at this time.",
      });
    }
  };

export const submitRegistration = async (
  request,
  response,
) => {
  try {
    const normalizedSlug =
      request.params.slug
        .trim()
        .toLowerCase();

    const event = await Event.findOne({
      slug: normalizedSlug,
      isPublished: true,
      status: "registration-open",
    })
      .select(
        "_id title slug registrationPeriod",
      )
      .lean();

    if (!event) {
      response.status(404).json({
        message:
          "Event not found or registration is not open.",
      });

      return;
    }

    const now = new Date();

    const registrationOpensAt =
      new Date(
        event.registrationPeriod.opensAt,
      );

    const registrationClosesAt =
      new Date(
        event.registrationPeriod.closesAt,
      );

    if (
      now < registrationOpensAt ||
      now > registrationClosesAt
    ) {
      response.status(400).json({
        message:
          "Registration is not currently available for this event.",
        code: "REGISTRATION_CLOSED",
      });

      return;
    }

    const participantProfile =
      await ParticipantProfile.findOne({
        user: request.user._id,
      })
        .select(
          "organization jobTitle contactNumber",
        )
        .lean();

    if (
      !isParticipantProfileComplete(
        participantProfile,
      )
    ) {
      response.status(403).json({
        message:
          "Complete your participant profile before submitting your registration.",
        code: "PROFILE_INCOMPLETE",
      });

      return;
    }

    const registration =
      await EventRegistration.findOne({
        participant:
          request.user._id,
        event: event._id,
      });

    if (!registration) {
      response.status(404).json({
        message:
          "No registration draft was found for this event.",
        code:
          "REGISTRATION_NOT_FOUND",
      });

      return;
    }

    const requiredSelectionError =
      await validateRequiredSelections(
        event._id,
        registration.breakoutSelections ||
          [],
      );

    if (requiredSelectionError) {
      response.status(400).json({
        message:
          requiredSelectionError.message,
        code: requiredSelectionError.code,
        errors: {
          breakoutSelections:
            requiredSelectionError.error,
        },
      });

      return;
    }

    const relationshipError =
      await validateSelectionRelationships(
        event._id,
        registration.breakoutSelections ||
          [],
      );

    if (relationshipError) {
      response.status(400).json({
        message: relationshipError,
        errors: {
          breakoutSelections:
            relationshipError,
        },
      });

      return;
    }

    registration.status =
      "pending-payment";
    registration.paymentStatus =
      "pending";
    registration.submittedAt =
      new Date();
    registration.confirmedAt = null;
    registration.cancelledAt = null;

    await registration.save();

    response.status(200).json({
      message:
        "Registration submitted successfully.",
      registration:
        formatRegistration(registration),
      event: {
        id: event._id,
        title: event.title,
        slug: event.slug,
      },
    });
  } catch (error) {
    if (
      error.name ===
      "ValidationError"
    ) {
      const errors =
        Object.fromEntries(
          Object.entries(
            error.errors,
          ).map(
            ([
              field,
              validationError,
            ]) => [
              field,
              validationError.message,
            ],
          ),
        );

      response.status(400).json({
        message:
          "Review the registration information.",
        errors,
      });

      return;
    }

    console.error(
      "Unable to submit registration:",
    );
    console.error(error.message);

    response.status(500).json({
      message:
        "Unable to submit the registration at this time.",
    });
  }
};

export const updateParticipantBreakoutSelections =
  async (request, response) => {
    try {
      const { registrationId } =
        request.params;

      if (
        !mongoose.isValidObjectId(
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

      const registration =
        await EventRegistration.findOne({
          _id: registrationId,
          participant:
            request.user._id,
        });

      if (!registration) {
        response.status(404).json({
          message:
            "Registration not found.",
          code:
            "REGISTRATION_NOT_FOUND",
        });

        return;
      }

      const event = await Event.findById(
        registration.event,
      )
        .select(
          [
            "_id",
            "title",
            "slug",
            "startDate",
            "registrationPeriod",
            "status",
            "isPublished",
          ].join(" "),
        )
        .lean();

      if (!event) {
        response.status(404).json({
          message:
            "The event connected to this registration was not found.",
          code: "EVENT_NOT_FOUND",
        });

        return;
      }

      const editPermission =
        getSelectionEditPermission({
          registration,
          event,
        });

      if (
        !editPermission
          .canEditBreakoutSelections
      ) {
        response.status(409).json({
          message:
            editPermission.editRestrictionReason,
          code: editPermission.code,
          canEditBreakoutSelections:
            false,
          editRestrictionReason:
            editPermission.editRestrictionReason,
        });

        return;
      }

      const selections =
        request.body
          ?.breakoutSelections;

      const validationErrors =
        validateSelectionShape(
          selections,
        );

      if (
        Object.keys(
          validationErrors,
        ).length > 0
      ) {
        response.status(400).json({
          message:
            "Review the submitted breakout selections.",
          code:
            "INVALID_BREAKOUT_SELECTIONS",
          errors: validationErrors,
        });

        return;
      }

      const requiredSelectionError =
        await validateRequiredSelections(
          event._id,
          selections,
        );

      if (requiredSelectionError) {
        response.status(400).json({
          message:
            requiredSelectionError.message,
          code:
            requiredSelectionError.code,
          errors: {
            breakoutSelections:
              requiredSelectionError.error,
          },
        });

        return;
      }

      const relationshipError =
        await validateSelectionRelationships(
          event._id,
          selections,
        );

      if (relationshipError) {
        response.status(400).json({
          message: relationshipError,
          code:
            "INVALID_SELECTION_RELATIONSHIP",
          errors: {
            breakoutSelections:
              relationshipError,
          },
        });

        return;
      }

      registration.breakoutSelections =
        selections.map(
          (selection) => ({
            breakoutBlock:
              selection.breakoutBlock,
            breakoutSession:
              selection.breakoutSession,
          }),
        );

      await registration.save();

      response.status(200).json({
        message:
          "Breakout selections updated successfully.",
        registration:
          formatRegistration(
            registration,
          ),
        event: {
          id: event._id,
          title: event.title,
          slug: event.slug,
        },
        canEditBreakoutSelections: true,
        editRestrictionReason: null,
      });
    } catch (error) {
      if (
        error.name ===
        "ValidationError"
      ) {
        const errors =
          Object.fromEntries(
            Object.entries(
              error.errors,
            ).map(
              ([
                field,
                validationError,
              ]) => [
                field,
                validationError.message,
              ],
            ),
          );

        response.status(400).json({
          message:
            "Review the breakout selections.",
          errors,
        });

        return;
      }

      console.error(
        "Unable to update participant breakout selections:",
      );
      console.error(error.message);

      response.status(500).json({
        message:
          "Unable to update the breakout selections at this time.",
      });
    }
  };