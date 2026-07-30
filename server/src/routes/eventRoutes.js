import express from "express";

import {
  getPublishedEventBySlug,
  getPublishedEvents,
} from "../controllers/eventController.js";

const router = express.Router();

router.get("/", getPublishedEvents);

router.get("/:slug", getPublishedEventBySlug);

export default router;