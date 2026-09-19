import express from "express";

import {
  getPublishedEventBySlug,
  getPublishedEvents,
} from "../controllers/eventController.js";
import {
  createOrGetParticipantPayment,
  initiateParticipantBankTransfer,
  selectParticipantPaymentMethod,
  uploadParticipantPaymentProof,
} from "../controllers/paymentController.js";
import {
  getParticipantRegistration,
  saveRegistrationDraft,
  submitRegistration,
} from "../controllers/registrationController.js";
import authenticateUser from "../middleware/authenticateUser.js";
import uploadPaymentProof from "../middleware/uploadPaymentProof.js";

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

router.post(
  "/:slug/payment",
  authenticateUser,
  createOrGetParticipantPayment,
);

router.patch(
  "/:slug/payment/method",
  authenticateUser,
  selectParticipantPaymentMethod,
);

router.post(
  "/:slug/payment/bank-transfer",
  authenticateUser,
  initiateParticipantBankTransfer,
);

router.post(
  "/:slug/payment/proof",
  authenticateUser,
  uploadPaymentProof.single("receipt"),
  uploadParticipantPaymentProof,
);

router.get(
  "/:slug",
  getPublishedEventBySlug,
);

export default router;