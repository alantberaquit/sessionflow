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

import authenticateUser from "../middleware/authenticateUser.js";
import authorizeAdmin from "../middleware/authorizeAdmin.js";

const router = express.Router();

router.use(authenticateUser);
router.use(authorizeAdmin);

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