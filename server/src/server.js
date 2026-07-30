import app from "./app.js";
import connectDatabase from "./config/database.js";

const PORT = process.env.PORT || 5001;

const validateEnvironment = () => {
  const requiredVariables = [
    "MONGODB_URI",
    "CLIENT_URL",
    "JWT_SECRET",
  ];

  const missingVariables = requiredVariables.filter(
    (variableName) => !process.env[variableName],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVariables.join(", ")}`,
    );
  }
};

const startServer = async () => {
  try {
    validateEnvironment();

    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`SessionFlow server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start SessionFlow server:");
    console.error(error.message);
    process.exit(1);
  }
};

startServer();