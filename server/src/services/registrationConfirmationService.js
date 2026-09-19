import EventRegistration from "../models/EventRegistration.js";
import Payment from "../models/Payment.js";
import createRegistrationConfirmationEmail from "../emails/registrationConfirmationEmail.js";
import sendEmail from "./emailService.js";
import getParticipantSchedule from "./participantScheduleService.js";

const buildVenueText = (venue) => {
  if (!venue) {
    return "To be announced";
  }

  return [
    venue.name,
    venue.address,
    venue.city,
    venue.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const sendRegistrationConfirmation = async ({
  registrationId,
  paymentId,
}) => {
  const registration =
    await EventRegistration.findById(
      registrationId,
    )
      .populate({
        path: "participant",
        select: "name email",
      })
      .populate({
        path: "event",
        select: [
          "title",
          "slug",
          "startDate",
          "endDate",
          "venue",
        ].join(" "),
      });

  if (!registration) {
    throw new Error(
      "The registration could not be found for confirmation email delivery.",
    );
  }

  if (!registration.participant?.email) {
    throw new Error(
      "The registered participant does not have an email address.",
    );
  }

  if (!registration.event) {
    throw new Error(
      "The event linked to the registration could not be found.",
    );
  }

  const payment = await Payment.findOne({
    _id: paymentId,
    registration: registration._id,
  }).lean();

  if (!payment) {
    throw new Error(
      "The payment could not be found for confirmation email delivery.",
    );
  }

  if (
    registration.status !== "confirmed" ||
    registration.paymentStatus !== "paid" ||
    payment.status !== "paid"
  ) {
    throw new Error(
      "Only confirmed paid registrations can receive a confirmation email.",
    );
  }

  const sessions =
    await getParticipantSchedule({
      registration,
    });

  const clientUrl =
    process.env.CLIENT_URL?.replace(
      /\/+$/,
      "",
    ) || "http://localhost:5173";

  const email =
    createRegistrationConfirmationEmail({
      participant: {
        name: registration.participant.name,
        email:
          registration.participant.email,
      },

      event: {
        title: registration.event.title,
        startDate:
          registration.event.startDate,
        endDate: registration.event.endDate,
        venue: buildVenueText(
          registration.event.venue,
        ),
      },

      registration: {
        _id: registration._id,
        status: registration.status,
      },

      payment: {
        amountInCentavos:
          payment.amountInCentavos,
        currency: payment.currency,
        status: payment.status,
        providerReference:
          payment.providerReference,
      },

      sessions,

      dashboardUrl: `${clientUrl}/dashboard`,
    });

  const result = await sendEmail(email);

  return {
    ...result,
    participantEmail:
      registration.participant.email,
    registrationId:
      registration._id.toString(),
    paymentId: payment._id.toString(),
  };
};

export default sendRegistrationConfirmation;