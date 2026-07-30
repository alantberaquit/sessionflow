import express from "express";

import {
  getParticipantProfile,
  saveParticipantProfile,
} from "../controllers/profileController.js";
import authenticateUser from "../middleware/authenticateUser.js";

const router = express.Router();

router.use(authenticateUser);

router.get("/", getParticipantProfile);
router.put("/", saveParticipantProfile);

export default router;