import nodemailer from "nodemailer";

import {
  emailTransporter,
  isEmailConfigured,
} from "../config/email.js";

const getEmailFrom = () => {
  const name =
    process.env.EMAIL_FROM_NAME?.trim() ||
    "SessionFlow";

  const address =
    process.env.EMAIL_FROM_ADDRESS?.trim() ||
    "no-reply@sessionflow.test";

  return {
    name,
    address,
  };
};

const sendEmail = async ({
  to,
  subject,
  text,
  html,
}) => {
  if (!to) {
    throw new Error(
      "An email recipient is required.",
    );
  }

  if (!subject) {
    throw new Error(
      "An email subject is required.",
    );
  }

  if (!text && !html) {
    throw new Error(
      "Email text or HTML content is required.",
    );
  }

  if (!isEmailConfigured() || !emailTransporter) {
    console.warn(
      `Email skipped because SMTP is not configured. Recipient: ${to}`,
    );

    return {
      sent: false,
      skipped: true,
      reason: "email-not-configured",
      previewUrl: null,
    };
  }

  const result =
    await emailTransporter.sendMail({
      from: getEmailFrom(),
      to,
      subject,
      text,
      html,
    });

  return {
    sent: true,
    skipped: false,
    messageId: result.messageId,
    accepted: result.accepted,
    rejected: result.rejected,
    previewUrl:
      nodemailer.getTestMessageUrl(result) ||
      null,
  };
};

export default sendEmail;