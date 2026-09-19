import nodemailer from "nodemailer";

const requiredEmailVariables = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
];

const isEmailConfigured = () =>
  requiredEmailVariables.every(
    (variableName) =>
      process.env[variableName]?.trim(),
  );

const createEmailTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  const port = Number(process.env.EMAIL_PORT);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      "EMAIL_PORT must be a valid positive number.",
    );
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST.trim(),
    port,
    secure:
      process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const emailTransporter =
  createEmailTransporter();

export {
  emailTransporter,
  isEmailConfigured,
};