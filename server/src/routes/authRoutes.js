import express from "express";

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from "../controllers/authController.js";
import authenticateUser from "../middleware/authenticateUser.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get(
  "/me",
  authenticateUser,
  getCurrentUser,
);

export default router;