import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import multer from "multer";

const currentFilePath = fileURLToPath(
  import.meta.url,
);

const currentDirectory = path.dirname(
  currentFilePath,
);

const uploadDirectory = path.resolve(
  currentDirectory,
  "../../uploads/payment-proofs",
);

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const allowedExtensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".pdf",
];

const storage = multer.diskStorage({
  destination: (
    request,
    file,
    callback,
  ) => {
    callback(null, uploadDirectory);
  },

  filename: (
    request,
    file,
    callback,
  ) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const uniqueSuffix = [
      Date.now(),
      Math.round(Math.random() * 1e9),
    ].join("-");

    callback(
      null,
      `payment-proof-${uniqueSuffix}${extension}`,
    );
  },
});

const fileFilter = (
  request,
  file,
  callback,
) => {
  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const hasAllowedMimeType =
    allowedMimeTypes.includes(file.mimetype);

  const hasAllowedExtension =
    allowedExtensions.includes(extension);

  if (
    hasAllowedMimeType &&
    hasAllowedExtension
  ) {
    callback(null, true);

    return;
  }

  const error = new Error(
    "Upload a JPG, PNG, or PDF receipt.",
  );

  error.code = "INVALID_PAYMENT_PROOF_TYPE";

  callback(error);
};

const uploadPaymentProof = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});

export {
  uploadDirectory,
};

export default uploadPaymentProof;