import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileImage,
  FileText,
  LoaderCircle,
  RefreshCw,
  SearchCheck,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Link,
  useNavigate,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;

const formatMoney = (
  amountInCentavos,
  currency = "PHP",
) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountInCentavos / 100);

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));
};

const formatFileSize = (sizeInBytes) => {
  if (!sizeInBytes) {
    return "Unknown size";
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${Math.ceil(sizeInBytes / 1024)} KB`;
  }

  return `${(
    sizeInBytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
};

const AdminPaymentReviewsPage = () => {
  const navigate = useNavigate();

  const {
    token,
    user,
    endSession,
  } = useAuth();

  const [payments, setPayments] = useState([]);
  const [selectedPaymentId, setSelectedPaymentId] =
    useState("");

  const [proofUrl, setProofUrl] = useState("");
  const [proofType, setProofType] = useState("");

  const [decision, setDecision] = useState("");
  const [rejectionReason, setRejectionReason] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(true);
  const [isLoadingProof, setIsLoadingProof] =
    useState(false);
  const [isReviewing, setIsReviewing] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");
  const [proofError, setProofError] =
    useState("");
  const [reviewError, setReviewError] =
    useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const selectedPayment =
    payments.find(
      (payment) =>
        payment.id === selectedPaymentId,
    ) || null;

  const handleInvalidSession = useCallback(() => {
    endSession();

    navigate("/login", {
      replace: true,
      state: {
        from: "/admin/payments",
      },
    });
  }, [endSession, navigate]);

  const clearProofPreview = useCallback(() => {
    setProofUrl((currentProofUrl) => {
      if (currentProofUrl) {
        URL.revokeObjectURL(currentProofUrl);
      }

      return "";
    });

    setProofType("");
    setProofError("");
  }, []);

  const loadPendingReviews = useCallback(async () => {
    if (!API_URL || !token) {
      setErrorMessage(
        "The admin payment API configuration is incomplete.",
      );
      setIsLoading(false);

      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/payments/pending-review`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const responseData = await response.json();

      if (response.status === 401) {
        handleInvalidSession();
        return;
      }

      if (response.status === 403) {
        setErrorMessage(
          "Administrator access is required to review payments.",
        );

        return;
      }

      if (!response.ok) {
        setErrorMessage(
          responseData.message ||
            "Unable to load pending payment reviews.",
        );

        return;
      }

      const retrievedPayments =
        responseData.payments || [];

      setPayments(retrievedPayments);

      setSelectedPaymentId(
        (currentPaymentId) => {
          const stillExists =
            retrievedPayments.some(
              (payment) =>
                payment.id ===
                currentPaymentId,
            );

          if (stillExists) {
            return currentPaymentId;
          }

          return (
            retrievedPayments[0]?.id || ""
          );
        },
      );
    } catch (error) {
      console.error(
        "Unable to load pending payment reviews:",
      );
      console.error(error.message);

      setErrorMessage(
        "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [handleInvalidSession, token]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      loadPendingReviews();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadPendingReviews]);

  useEffect(() => {
    return () => {
      if (proofUrl) {
        URL.revokeObjectURL(proofUrl);
      }
    };
  }, [proofUrl]);

  const handleRefresh = async () => {
    setSuccessMessage("");
    clearProofPreview();
    await loadPendingReviews();
  };

  const handleSelectPayment = (paymentId) => {
    clearProofPreview();

    setSelectedPaymentId(paymentId);
    setDecision("");
    setRejectionReason("");
    setReviewError("");
    setSuccessMessage("");
  };

  const handleLoadProof = async () => {
    if (!selectedPayment) {
      return;
    }

    setIsLoadingProof(true);
    setProofError("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/payments/${encodeURIComponent(
          selectedPayment.id,
        )}/proof`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        handleInvalidSession();
        return;
      }

      if (response.status === 403) {
        setProofError(
          "Administrator access is required.",
        );

        return;
      }

      if (!response.ok) {
        const responseData =
          await response.json();

        setProofError(
          responseData.message ||
            "Unable to load the receipt.",
        );

        return;
      }

      const fileBlob = await response.blob();
      const newProofUrl =
        URL.createObjectURL(fileBlob);

      setProofUrl((currentProofUrl) => {
        if (currentProofUrl) {
          URL.revokeObjectURL(
            currentProofUrl,
          );
        }

        return newProofUrl;
      });

      setProofType(
        response.headers.get("Content-Type") ||
          fileBlob.type,
      );
    } catch (error) {
      console.error(
        "Unable to load proof of payment:",
      );
      console.error(error.message);

      setProofError(
        "Unable to connect to the server while loading the receipt.",
      );
    } finally {
      setIsLoadingProof(false);
    }
  };

  const handleDecisionChange = (
    nextDecision,
  ) => {
    setDecision(nextDecision);
    setReviewError("");
    setSuccessMessage("");

    if (nextDecision === "approve") {
      setRejectionReason("");
    }
  };

  const handleReview = async () => {
    if (!selectedPayment) {
      return;
    }

    if (
      !["approve", "reject"].includes(
        decision,
      )
    ) {
      setReviewError(
        "Choose whether to approve or reject the receipt.",
      );

      return;
    }

    const normalizedRejectionReason =
      rejectionReason.trim();

    if (
      decision === "reject" &&
      normalizedRejectionReason.length < 10
    ) {
      setReviewError(
        "Provide a rejection reason containing at least 10 characters.",
      );

      return;
    }

    setIsReviewing(true);
    setReviewError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/admin/payments/${encodeURIComponent(
          selectedPayment.id,
        )}/review`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            ...(decision === "reject"
              ? {
                  rejectionReason:
                    normalizedRejectionReason,
                }
              : {}),
          }),
        },
      );

      const responseData = await response.json();

      if (response.status === 401) {
        handleInvalidSession();
        return;
      }

      if (response.status === 403) {
        setReviewError(
          "Administrator access is required.",
        );

        return;
      }

      if (!response.ok) {
        setReviewError(
          responseData.message ||
            "Unable to review the receipt.",
        );

        return;
      }

      const reviewedPaymentId =
        selectedPayment.id;

      const remainingPayments =
        payments.filter(
          (payment) =>
            payment.id !==
            reviewedPaymentId,
        );

      clearProofPreview();

      setPayments(remainingPayments);
      setSelectedPaymentId(
        remainingPayments[0]?.id || "",
      );
      setDecision("");
      setRejectionReason("");
      setSuccessMessage(
        responseData.message,
      );
    } catch (error) {
      console.error(
        "Unable to review payment:",
      );
      console.error(error.message);

      setReviewError(
        "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsReviewing(false);
    }
  };

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <div
          className="flex items-center gap-3 text-slate-600"
          role="status"
        >
          <LoaderCircle
            className="h-6 w-6 animate-spin text-blue-600"
            aria-hidden="true"
          />

          <span className="font-semibold">
            Loading pending reviews...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
            to="/dashboard"
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            Back to dashboard
          </Link>

          <div className="text-sm">
            <p className="font-semibold text-slate-950">
              {user?.name || "Administrator"}
            </p>

            <p className="text-slate-500">
              Administrator
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              Administration
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Payment receipt reviews
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Review uploaded bank-transfer receipts
              and approve or reject each payment.
            </p>
          </div>

          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className="h-4 w-4"
              aria-hidden="true"
            />
            Refresh list
          </button>
        </div>

        {errorMessage && (
          <div
            className="mt-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
            role="alert"
          >
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />

            <p className="font-semibold">
              {errorMessage}
            </p>
          </div>
        )}

        {successMessage && (
          <div
            className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700"
            role="status"
          >
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />

            <p className="font-semibold">
              {successMessage}
            </p>
          </div>
        )}

        {!errorMessage &&
          payments.length === 0 && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <SearchCheck
                  className="h-7 w-7"
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-950">
                No receipts awaiting review
              </h2>

              <p className="mt-2 text-slate-600">
                New bank-transfer receipts will
                appear here after participants upload
                them.
              </p>
            </section>
          )}

        {!errorMessage &&
          payments.length > 0 && (
            <div className="mt-8 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="space-y-3">
                {payments.map((payment) => {
                  const isSelected =
                    payment.id ===
                    selectedPaymentId;

                  return (
                    <button
                      key={payment.id}
                      className={`w-full rounded-2xl border p-5 text-left transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                      type="button"
                      onClick={() =>
                        handleSelectPayment(
                          payment.id,
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-bold text-slate-950">
                            {payment.participant
                              ?.name ||
                              "Unknown participant"}
                          </p>

                          <p className="mt-1 truncate text-sm text-slate-500">
                            {payment.participant
                              ?.email ||
                              "No email"}
                          </p>
                        </div>

                        <Clock3
                          className="h-5 w-5 shrink-0 text-amber-600"
                          aria-hidden="true"
                        />
                      </div>

                      <p className="mt-4 line-clamp-2 text-sm font-semibold text-slate-700">
                        {payment.event?.title ||
                          "Unknown event"}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="font-bold text-slate-950">
                          {formatMoney(
                            payment.amountInCentavos,
                            payment.currency,
                          )}
                        </span>

                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                          Pending review
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        Uploaded{" "}
                        {formatDateTime(
                          payment.proofOfPayment
                            ?.uploadedAt,
                        )}
                      </p>
                    </button>
                  );
                })}
              </aside>

              {selectedPayment && (
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <header className="border-b border-slate-200 p-6 sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
                          Receipt review
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-slate-950">
                          {selectedPayment
                            .participant?.name ||
                            "Unknown participant"}
                        </h2>

                        <p className="mt-1 text-slate-500">
                          {selectedPayment
                            .participant?.email ||
                            "No email available"}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800">
                        Pending review
                      </span>
                    </div>
                  </header>

                  <div className="p-6 sm:p-8">
                    <dl className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-semibold text-slate-500">
                          Event
                        </dt>

                        <dd className="mt-1 font-bold text-slate-950">
                          {selectedPayment.event
                            ?.title ||
                            "Unknown event"}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-semibold text-slate-500">
                          Amount
                        </dt>

                        <dd className="mt-1 font-bold text-slate-950">
                          {formatMoney(
                            selectedPayment
                              .amountInCentavos,
                            selectedPayment.currency,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-semibold text-slate-500">
                          Transfer reference
                        </dt>

                        <dd className="mt-1 break-all font-mono font-bold text-slate-950">
                          {selectedPayment.providerReference ||
                            "Not available"}
                        </dd>
                      </div>

                      <div>
                        <dt className="text-sm font-semibold text-slate-500">
                          Uploaded
                        </dt>

                        <dd className="mt-1 font-semibold text-slate-950">
                          {formatDateTime(
                            selectedPayment
                              .proofOfPayment
                              ?.uploadedAt,
                          )}
                        </dd>
                      </div>
                    </dl>

                    <section className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
                            {selectedPayment
                              .proofOfPayment
                              ?.mimeType ===
                            "application/pdf" ? (
                              <FileText
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            ) : (
                              <FileImage
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="break-all font-bold text-slate-950">
                              {selectedPayment
                                .proofOfPayment
                                ?.originalName ||
                                "Receipt file"}
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {formatFileSize(
                                selectedPayment
                                  .proofOfPayment
                                  ?.sizeInBytes,
                              )}
                            </p>
                          </div>
                        </div>

                        <button
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                          type="button"
                          onClick={handleLoadProof}
                          disabled={isLoadingProof}
                        >
                          {isLoadingProof ? (
                            <LoaderCircle
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <ExternalLink
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )}

                          {proofUrl
                            ? "Reload receipt"
                            : "View receipt"}
                        </button>
                      </div>

                      {proofError && (
                        <p
                          className="mt-4 text-sm font-semibold text-red-700"
                          role="alert"
                        >
                          {proofError}
                        </p>
                      )}

                      {proofUrl && (
                        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                          {proofType.includes(
                            "application/pdf",
                          ) ? (
                            <iframe
                              className="h-[600px] w-full"
                              src={proofUrl}
                              title="Payment receipt PDF"
                            />
                          ) : (
                            <img
                              className="max-h-[700px] w-full object-contain"
                              src={proofUrl}
                              alt="Uploaded payment receipt"
                            />
                          )}
                        </div>
                      )}
                    </section>

                    <section className="mt-8 border-t border-slate-200 pt-7">
                      <h3 className="text-xl font-bold text-slate-950">
                        Review decision
                      </h3>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <button
                          className={`flex items-center gap-3 rounded-2xl border p-5 text-left transition ${
                            decision === "approve"
                              ? "border-emerald-600 bg-emerald-50 ring-2 ring-emerald-100"
                              : "border-slate-200 hover:border-emerald-300"
                          }`}
                          type="button"
                          onClick={() =>
                            handleDecisionChange(
                              "approve",
                            )
                          }
                          disabled={isReviewing}
                        >
                          <CheckCircle2
                            className="h-6 w-6 shrink-0 text-emerald-600"
                            aria-hidden="true"
                          />

                          <div>
                            <p className="font-bold text-slate-950">
                              Approve
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              Mark payment as paid and
                              confirm registration.
                            </p>
                          </div>
                        </button>

                        <button
                          className={`flex items-center gap-3 rounded-2xl border p-5 text-left transition ${
                            decision === "reject"
                              ? "border-red-600 bg-red-50 ring-2 ring-red-100"
                              : "border-slate-200 hover:border-red-300"
                          }`}
                          type="button"
                          onClick={() =>
                            handleDecisionChange(
                              "reject",
                            )
                          }
                          disabled={isReviewing}
                        >
                          <XCircle
                            className="h-6 w-6 shrink-0 text-red-600"
                            aria-hidden="true"
                          />

                          <div>
                            <p className="font-bold text-slate-950">
                              Reject
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              Keep payment pending and
                              request another receipt.
                            </p>
                          </div>
                        </button>
                      </div>

                      {decision === "reject" && (
                        <div className="mt-5">
                          <label
                            className="block text-sm font-bold text-slate-700"
                            htmlFor="rejection-reason"
                          >
                            Rejection reason
                          </label>

                          <textarea
                            className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            id="rejection-reason"
                            value={rejectionReason}
                            onChange={(event) =>
                              setRejectionReason(
                                event.target.value,
                              )
                            }
                            placeholder="Explain what is missing or unclear in the receipt."
                            maxLength={500}
                            disabled={isReviewing}
                          />

                          <p className="mt-2 text-sm text-slate-500">
                            At least 10 characters are
                            required.
                          </p>
                        </div>
                      )}

                      {reviewError && (
                        <div
                          className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
                          role="alert"
                        >
                          <AlertCircle
                            className="mt-0.5 h-5 w-5 shrink-0"
                            aria-hidden="true"
                          />

                          <p className="text-sm font-semibold">
                            {reviewError}
                          </p>
                        </div>
                      )}

                      <button
                        className={`mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
                          decision === "reject"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                        type="button"
                        onClick={handleReview}
                        disabled={
                          isReviewing ||
                          !decision
                        }
                      >
                        {isReviewing ? (
                          <>
                            <LoaderCircle
                              className="h-5 w-5 animate-spin"
                              aria-hidden="true"
                            />
                            Saving review...
                          </>
                        ) : decision ===
                          "reject" ? (
                          <>
                            <XCircle
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                            Reject receipt
                          </>
                        ) : (
                          <>
                            <CheckCircle2
                              className="h-5 w-5"
                              aria-hidden="true"
                            />
                            Approve receipt
                          </>
                        )}
                      </button>
                    </section>
                  </div>
                </section>
              )}
            </div>
          )}
      </section>
    </main>
  );
};

export default AdminPaymentReviewsPage;