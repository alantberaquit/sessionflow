import express from "express";

import {
  cancelParticipantRegistration,
  getParticipantProfile,
  getParticipantRegistrations,
  saveParticipantProfile,
} from "../controllers/profileController.js";
import {
  updateParticipantBreakoutSelections,
} from "../controllers/registrationController.js";
import authenticateUser from "../middleware/authenticateUser.js";

const router = express.Router();

router.use(authenticateUser);

router.get(
  "/registrations",
  getParticipantRegistrations,
);

router.put(
  "/registrations/:registrationId/breakout-selections",
  updateParticipantBreakoutSelections,
);

router.patch(
  "/registrations/:registrationId/cancel",
  cancelParticipantRegistration,
);

router.get("/", getParticipantProfile);

router.put("/", saveParticipantProfile);

export default router;