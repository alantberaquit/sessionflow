import "dotenv/config";
import nodemailer from "nodemailer";

import sendEmail from "../services/emailService.js";

const sendTestEmail = async () => {
  try {
    const result = await sendEmail({
      to: process.env.EMAIL_USER,
      subject: "SessionFlow email test",
      text:
        "SessionFlow email delivery is configured correctly.",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h1>SessionFlow email test</h1>
          <p>
            SessionFlow email delivery is configured correctly.
          </p>
        </div>
      `,
    });

    console.log("Email result:", result);

    if (result.sent) {
      const previewUrl =
        nodemailer.getTestMessageUrl({
          messageId: result.messageId,
        });

      console.log(
        "Preview URL:",
        previewUrl ?? "Not available",
      );
    }
  } catch (error) {
    console.error(
      "Unable to send the test email:",
      error.message,
    );

    process.exit(1);
  }
};

sendTestEmail();