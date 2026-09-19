import cors from "cors";
import express from "express";

import adminRoutes from "./routes/adminRoutes.js";
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

app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/profile", profileRoutes);

/*
 * Multer and proof-of-payment upload errors
 */
app.use(
  (
    error,
    _request,
    response,
    next,
  ) => {
    if (error?.name === "MulterError") {
      if (error.code === "LIMIT_FILE_SIZE") {
        response.status(400).json({
          message:
            "The receipt must not exceed 5 MB.",
          code: "PAYMENT_PROOF_TOO_LARGE",
        });

        return;
      }

      if (
        error.code === "LIMIT_FILE_COUNT"
      ) {
        response.status(400).json({
          message:
            "Only one receipt may be uploaded.",
          code:
            "PAYMENT_PROOF_FILE_LIMIT",
        });

        return;
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        response.status(400).json({
          message:
            "Upload the receipt using the receipt field.",
          code:
            "PAYMENT_PROOF_FIELD_INVALID",
        });

        return;
      }

      response.status(400).json({
        message:
          "Unable to process the uploaded receipt.",
        code: error.code,
      });

      return;
    }

    if (
      error?.code ===
      "INVALID_PAYMENT_PROOF_TYPE"
    ) {
      response.status(400).json({
        message: error.message,
        code: error.code,
      });

      return;
    }

    next(error);
  },
);

/*
 * General error handler
 */
app.use(
  (
    error,
    _request,
    response,
    _next,
  ) => {
    console.error(
      "Unhandled application error:",
    );
    console.error(error);

    response.status(500).json({
      message:
        "An unexpected server error occurred.",
    });
  },
);

export default app;