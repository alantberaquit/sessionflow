import nodemailer from "nodemailer";

const createTestEmailAccount = async () => {
  try {
    const account =
      await nodemailer.createTestAccount();

    console.log("\nDevelopment email account created.\n");

    console.log(`EMAIL_HOST=${account.smtp.host}`);
    console.log(`EMAIL_PORT=${account.smtp.port}`);
    console.log(
      `EMAIL_SECURE=${account.smtp.secure}`,
    );
    console.log(`EMAIL_USER=${account.user}`);
    console.log(`EMAIL_PASSWORD=${account.pass}`);
    console.log(
      "EMAIL_FROM_NAME=SessionFlow",
    );
    console.log(
      `EMAIL_FROM_ADDRESS=${account.user}`,
    );
  } catch (error) {
    console.error(
      "Unable to create the development email account:",
      error.message,
    );

    process.exit(1);
  }
};

createTestEmailAccount();