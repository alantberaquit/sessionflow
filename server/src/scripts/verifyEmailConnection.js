import "dotenv/config";

import {
  emailTransporter,
  isEmailConfigured,
} from "../config/email.js";

const verifyEmailConnection = async () => {
  if (!isEmailConfigured() || !emailTransporter) {
    console.error(
      "Email is not configured. Check the EMAIL_* values in server/.env.",
    );

    process.exit(1);
  }

  try {
    await emailTransporter.verify();

    console.log(
      "Email connection verified successfully.",
    );
  } catch (error) {
    console.error(
      "Unable to verify the email connection:",
      error.message,
    );

    process.exit(1);
  }
};

verifyEmailConnection();