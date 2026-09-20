import express from "express";

import {
  cancelAndRefundRegistration,
  getPaidRegistrations,
  getPaymentProofFile,
  getPendingPaymentReviews,
  getRefundedRegistrations,
  resendRegistrationConfirmation,
  reviewPaymentProof,
} from "../controllers/adminPaymentController.js";
import {
  createAdminEvent,
  createBreakoutBlock,
  createBreakoutSession,
  createPlenarySession,
  deleteBreakoutBlock,
  deleteBreakoutSession,
  deletePlenarySession,
  getAdminEvent,
  listAdminEvents,
  updateAdminEvent,
  updateBreakoutBlock,
  updateBreakoutSession,
  updatePlenarySession,
} from "../controllers/adminEventController.js";

import authenticateUser from "../middleware/authenticateUser.js";
import authorizeAdmin from "../middleware/authorizeAdmin.js";

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeAdmin);

router.get("/events", listAdminEvents);
router.post("/events", createAdminEvent);
router.get("/events/:eventId", getAdminEvent);
router.put("/events/:eventId", updateAdminEvent);
router.post("/events/:eventId/plenary-sessions", createPlenarySession);
router.put("/events/:eventId/plenary-sessions/:sessionId", updatePlenarySession);
router.delete("/events/:eventId/plenary-sessions/:sessionId", deletePlenarySession);
router.post("/events/:eventId/breakout-blocks", createBreakoutBlock);
router.put("/events/:eventId/breakout-blocks/:blockId", updateBreakoutBlock);
router.delete("/events/:eventId/breakout-blocks/:blockId", deleteBreakoutBlock);
router.post("/events/:eventId/breakout-blocks/:blockId/sessions", createBreakoutSession);
router.put("/events/:eventId/breakout-blocks/:blockId/sessions/:sessionId", updateBreakoutSession);
router.delete("/events/:eventId/breakout-blocks/:blockId/sessions/:sessionId", deleteBreakoutSession);

router.get(
  "/payments/pending-review",
  getPendingPaymentReviews,
);

router.get(
  "/payments/:paymentId/proof",
  getPaymentProofFile,
);

router.patch(
  "/payments/:paymentId/review",
  reviewPaymentProof,
);

router.get(
  "/registrations/paid",
  getPaidRegistrations,
);

router.post(
  "/registrations/:registrationId/resend-confirmation",
  resendRegistrationConfirmation,
);

router.get(
  "/registrations/refunded",
  getRefundedRegistrations,
);

router.patch(
  "/registrations/:registrationId/cancel-and-refund",
  cancelAndRefundRegistration,
);

export default router;
