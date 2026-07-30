import mongoose from "mongoose";

const connectDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in the environment variables");
  }

  await mongoose.connect(mongoUri);

  console.log("MongoDB connected successfully");
};

export default connectDatabase;