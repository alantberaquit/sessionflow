import express from "express";

import {
  getPublishedEventBySlug,
  getPublishedEvents,
} from "../controllers/eventController.js";
import {
  getParticipantRegistration,
  saveRegistrationDraft,
  submitRegistration,
} from "../controllers/registrationController.js";
import authenticateUser from "../middleware/authenticateUser.js";

const router = express.Router();

router.get("/", getPublishedEvents);

router
  .route("/:slug/registration")
  .get(
    authenticateUser,
    getParticipantRegistration,
  )
  .put(
    authenticateUser,
    saveRegistrationDraft,
  );

router.post(
  "/:slug/registration/submit",
  authenticateUser,
  submitRegistration,
);

router.get(
  "/:slug",
  getPublishedEventBySlug,
);

export default router;