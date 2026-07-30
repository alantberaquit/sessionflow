import cors from "cors";
import express from "express";

import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();

const clientUrl = process.env.CLIENT_URL;

if (!clientUrl) {
  throw new Error(
    "CLIENT_URL is not defined in the environment variables",
  );
}

app.use(
  cors({
    origin: clientUrl,
  }),
);

app.use(express.json());

app.get("/", (_request, response) => {
  response.status(200).json({
    message: "SessionFlow API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/profile", profileRoutes);

export default app;