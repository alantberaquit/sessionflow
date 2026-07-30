import app from "./app.js";
import connectDatabase from "./config/database.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
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