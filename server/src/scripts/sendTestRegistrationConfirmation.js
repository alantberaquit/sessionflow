import "dotenv/config";

import createRegistrationConfirmationEmail from "../emails/registrationConfirmationEmail.js";
import sendEmail from "../services/emailService.js";

const sendTestRegistrationConfirmation =
  async () => {
    try {
      const email =
        createRegistrationConfirmationEmail({
          participant: {
            name: "Test Participant",
            email: process.env.EMAIL_USER,
          },

          event: {
            title:
              "Digital Learning & Innovation Summit 2026",
            startDate:
              "2026-10-15T00:00:00.000Z",
            endDate:
              "2026-10-16T00:00:00.000Z",
            venue:
              "Innovation Convention Center, Manila",
          },

          registration: {
            _id:
              "REGISTRATION-TEST-001",
            registrationReference:
              "SF-2026-0001",
            status: "confirmed",
          },

          payment: {
            amountInCentavos: 350000,
            currency: "PHP",
            status: "paid",
            providerReference:
              "PAYMENT-TEST-001",
          },

          sessions: [
            {
              title:
                "Opening Plenary: The Future of Digital Learning",
              startTime:
                "2026-10-15T01:00:00.000Z",
              endTime:
                "2026-10-15T02:30:00.000Z",
              venue: "Grand Ballroom",
            },
            {
              title:
                "Designing Effective Microlearning Experiences",
              startTime:
                "2026-10-15T03:00:00.000Z",
              endTime:
                "2026-10-15T04:30:00.000Z",
              venue: "Workshop Room A",
            },
            {
              title:
                "Practical AI for Curriculum Developers",
              startTime:
                "2026-10-16T01:00:00.000Z",
              endTime:
                "2026-10-16T02:30:00.000Z",
              venue: "Workshop Room B",
            },
          ],

          dashboardUrl: `${
            process.env.CLIENT_URL ??
            "http://localhost:5173"
          }/dashboard`,
        });

      const result = await sendEmail(email);

      console.log(
        "Registration confirmation email result:",
        result,
      );

      if (result.previewUrl) {
        console.log(
          "\nPreview URL:",
          result.previewUrl,
        );
      }
    } catch (error) {
      console.error(
        "Unable to send the test registration confirmation:",
        error.message,
      );

      process.exit(1);
    }
  };

sendTestRegistrationConfirmation();