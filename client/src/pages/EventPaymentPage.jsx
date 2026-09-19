import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  FileCheck2,
  FileText,
  LoaderCircle,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;

const MAX_RECEIPT_SIZE = 5 * 1024 * 1024;

const allowedReceiptTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const paymentMethods = [
  {
    value: "gcash",
    title: "GCash",
    description:
      "Pay using your GCash mobile wallet.",
    providerLabel: "Processed through PayMongo",
    icon: Smartphone,
  },
  {
    value: "card",
    title: "Credit or debit card",
    description:
      "Pay using a supported Visa or Mastercard.",
    providerLabel: "Processed through PayMongo",
    icon: CreditCard,
  },
  {
    value: "bank-transfer",
    title: "Bank transfer",
    description:
      "Transfer the registration fee manually.",
    providerLabel:
      "Payment will require manual verification",
    icon: Building2,
  },
];

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
    return "";
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
    return "0 KB";
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${Math.ceil(sizeInBytes / 1024)} KB`;
  }

  return `${(
    sizeInBytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
};

const getReviewStatusLabel = (status) => {
  const labels = {
    "not-submitted": "Not submitted",
    "pending-review": "Pending review",
    approved: "Approved",
    rejected: "Rejected",
  };

  return labels[status] || status;
};

const EventPaymentPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const {
    token,
    user,
    endSession,
  } = useAuth();

  const [payment, setPayment] = useState(null);
  const [event, setEvent] = useState(null);

  const [selectedMethod, setSelectedMethod] =
    useState("");

  const [bankTransfer, setBankTransfer] =
    useState(null);

  const [selectedReceipt, setSelectedReceipt] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSavingMethod, setIsSavingMethod] =
    useState(false);

  const [
    isInitiatingBankTransfer,
    setIsInitiatingBankTransfer,
  ] = useState(false);

  const [isUploadingReceipt, setIsUploadingReceipt] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [errorCode, setErrorCode] =
    useState("");

  const [methodError, setMethodError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState(
      typeof location.state?.message === "string"
        ? location.state.message
        : "",
    );

  const [receiptError, setReceiptError] =
    useState("");

  const [receiptSuccess, setReceiptSuccess] =
    useState("");

  const [copiedField, setCopiedField] =
    useState("");

  const handleInvalidSession = useCallback(() => {
    endSession();

    navigate("/login", {
      replace: true,
      state: {
        from: `/events/${slug}/payment`,
      },
    });
  }, [endSession, navigate, slug]);

  const initiateBankTransfer = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) {
        setIsInitiatingBankTransfer(true);
      }

      setMethodError("");

      try {
        const response = await fetch(
          `${API_URL}/api/events/${encodeURIComponent(
            slug,
          )}/payment/bank-transfer`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const responseData = await response.json();

        if (response.status === 401) {
          handleInvalidSession();
          return false;
        }

        if (!response.ok) {
          setMethodError(
            responseData.message ||
              "Unable to prepare the bank-transfer instructions.",
          );

          return false;
        }

        setPayment(responseData.payment);
        setEvent(responseData.event);
        setBankTransfer(responseData.bankTransfer);

        return true;
      } catch (error) {
        console.error(
          "Unable to initiate bank transfer:",
          error.message,
        );

        setMethodError(
          "Unable to connect to the server. Check your connection and try again.",
        );

        return false;
      } finally {
        if (showLoading) {
          setIsInitiatingBankTransfer(false);
        }
      }
    },
    [
      handleInvalidSession,
      slug,
      token,
    ],
  );

  useEffect(() => {
    const abortController = new AbortController();

    const preparePayment = async () => {
      if (!API_URL || !token) {
        setErrorMessage(
          "The payment page cannot be loaded because the application configuration is incomplete.",
        );
        setIsLoading(false);

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/events/${encodeURIComponent(
            slug,
          )}/payment`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: abortController.signal,
          },
        );

        const responseData = await response.json();

        if (response.status === 401) {
          if (!abortController.signal.aborted) {
            handleInvalidSession();
          }

          return;
        }

        if (!response.ok) {
          if (!abortController.signal.aborted) {
            setErrorCode(responseData.code || "");

            setErrorMessage(
              responseData.message ||
                "Unable to prepare your payment.",
            );
          }

          return;
        }

        if (abortController.signal.aborted) {
          return;
        }

        setPayment(responseData.payment);
        setEvent(responseData.event);

        setSelectedMethod(
          responseData.payment.method || "",
        );

        if (
          responseData.payment.method ===
            "bank-transfer" &&
          responseData.payment.status ===
            "processing"
        ) {
          await initiateBankTransfer({
            showLoading: false,
          });
        }
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error(
          "Unable to prepare payment:",
          error.message,
        );

        setErrorMessage(
          "Unable to connect to the server. Check your connection and try again.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    preparePayment();

    return () => {
      abortController.abort();
    };
  }, [
    handleInvalidSession,
    initiateBankTransfer,
    slug,
    token,
  ]);

  const handleMethodChange = (method) => {
    if (
      isSavingMethod ||
      isInitiatingBankTransfer ||
      isUploadingReceipt ||
      payment?.status === "paid"
    ) {
      return;
    }

    setSelectedMethod(method);
    setMethodError("");
    setSuccessMessage("");
  };

  const handleSaveMethod = async () => {
    if (!selectedMethod) {
      setMethodError(
        "Select a payment method before continuing.",
      );

      return;
    }

    setIsSavingMethod(true);
    setMethodError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/events/${encodeURIComponent(
          slug,
        )}/payment/method`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: selectedMethod,
          }),
        },
      );

      const responseData = await response.json();

      if (response.status === 401) {
        handleInvalidSession();
        return;
      }

      if (!response.ok) {
        setMethodError(
          responseData.message ||
            "Unable to save the payment method.",
        );

        return;
      }

      setPayment(responseData.payment);

      if (
        responseData.payment.method !==
        "bank-transfer"
      ) {
        setBankTransfer(null);
        setSelectedReceipt(null);
        setReceiptError("");
        setReceiptSuccess("");
      }

      setSuccessMessage(
        "Payment method saved successfully.",
      );
    } catch (error) {
      console.error(
        "Unable to save payment method:",
        error.message,
      );

      setMethodError(
        "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsSavingMethod(false);
    }
  };

  const handleStartBankTransfer = async () => {
    setSuccessMessage("");

    const wasSuccessful =
      await initiateBankTransfer();

    if (wasSuccessful) {
      setSuccessMessage(
        "Bank-transfer instructions are ready.",
      );
    }
  };

  const handleCopy = async (
    value,
    fieldName,
  ) => {
    try {
      await navigator.clipboard.writeText(value);

      setCopiedField(fieldName);

      window.setTimeout(() => {
        setCopiedField("");
      }, 1800);
    } catch (error) {
      console.error(
        "Unable to copy value:",
        error.message,
      );

      setMethodError(
        "Unable to copy the value automatically.",
      );
    }
  };

  const handleReceiptChange = (eventTarget) => {
    const file = eventTarget.files?.[0];

    setReceiptError("");
    setReceiptSuccess("");

    if (!file) {
      setSelectedReceipt(null);
      return;
    }

    if (!allowedReceiptTypes.includes(file.type)) {
      setReceiptError(
        "Select a JPG, PNG, or PDF receipt.",
      );
      setSelectedReceipt(null);
      eventTarget.value = "";

      return;
    }

    if (file.size > MAX_RECEIPT_SIZE) {
      setReceiptError(
        "The receipt must not exceed 5 MB.",
      );
      setSelectedReceipt(null);
      eventTarget.value = "";

      return;
    }

    setSelectedReceipt(file);
  };

  const handleClearReceipt = () => {
    setSelectedReceipt(null);
    setReceiptError("");
    setReceiptSuccess("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedReceipt) {
      setReceiptError(
        "Select a receipt before uploading.",
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      "receipt",
      selectedReceipt,
    );

    setIsUploadingReceipt(true);
    setReceiptError("");
    setReceiptSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/api/events/${encodeURIComponent(
          slug,
        )}/payment/proof`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const responseData = await response.json();

      if (response.status === 401) {
        handleInvalidSession();
        return;
      }

      if (!response.ok) {
        setReceiptError(
          responseData.message ||
            "Unable to upload the receipt.",
        );

        return;
      }

      setPayment(responseData.payment);
      setSelectedReceipt(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setReceiptSuccess(
        "Receipt uploaded successfully and is now pending review.",
      );
    } catch (error) {
      console.error(
        "Unable to upload receipt:",
        error.message,
      );

      setReceiptError(
        "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsUploadingReceipt(false);
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
            Preparing your payment...
          </span>
        </div>
      </main>
    );
  }

  if (errorMessage || !payment || !event) {
    const requiresRegistration =
      errorCode === "REGISTRATION_NOT_FOUND" ||
      errorCode === "REGISTRATION_NOT_SUBMITTED";

    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-12">
        <section
          className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-200/50 sm:p-10"
          role="alert"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-100 text-red-700">
            <AlertCircle
              className="h-7 w-7"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold text-slate-950">
            Payment could not be prepared
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            {errorMessage}
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              to={`/events/${slug}`}
            >
              <ArrowLeft
                className="h-5 w-5"
                aria-hidden="true"
              />
              Event details
            </Link>

            {requiresRegistration && (
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
                to={`/events/${slug}/register`}
              >
                Complete registration
              </Link>
            )}
          </div>
        </section>
      </main>
    );
  }

  const isPaid = payment.status === "paid";

  const hasSavedMethod =
    Boolean(payment.method);

  const hasUnsavedMethodChange =
    selectedMethod !== payment.method;

  const canInitiateBankTransfer =
    payment.method === "bank-transfer" &&
    payment.provider === "manual" &&
    ["pending", "processing"].includes(
      payment.status,
    );

  const proof =
    payment.proofOfPayment || {};

  const proofReviewStatus =
    proof.reviewStatus || "not-submitted";

  const hasUploadedProof =
    proofReviewStatus !== "not-submitted";

  const canUploadProof =
    bankTransfer &&
    payment.method === "bank-transfer" &&
    payment.provider === "manual" &&
    payment.status === "processing" &&
    !["approved"].includes(
      proofReviewStatus,
    );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
              to={`/events/${event.slug}`}
            >
              <ArrowLeft
                className="h-4 w-4"
                aria-hidden="true"
              />
              Back to event
            </Link>

            <div className="text-sm">
              <p className="font-semibold text-slate-950">
                {user.name}
              </p>

              <p className="text-slate-500">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              Registration payment
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Complete your payment
            </h1>

            <p className="mt-4 leading-7 text-slate-600">
              Review the event fee and select how you
              would like to pay.
            </p>
          </div>

          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50">
            <header className="border-b border-slate-200 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                  <ReceiptText
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-600">
                    Payment for
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-950">
                    {event.title}
                  </h2>
                </div>
              </div>
            </header>

            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Registration fee
                  </p>

                  <p className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
                    {formatMoney(
                      payment.amountInCentavos,
                      payment.currency,
                    )}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    One-time participant fee
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-4 py-2 text-sm font-bold capitalize ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-700"
                      : payment.status === "processing"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {payment.status.replace("-", " ")}
                </span>
              </div>

              <dl className="mt-7 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-semibold text-slate-500">
                    Payment reference
                  </dt>

                  <dd className="mt-1 break-all font-semibold text-slate-950">
                    {payment.providerReference ||
                      payment.id}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-semibold text-slate-500">
                    Payment created
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-950">
                    {formatDateTime(payment.createdAt)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-semibold text-slate-500">
                    Saved method
                  </dt>

                  <dd className="mt-1 font-semibold capitalize text-slate-950">
                    {payment.method
                      ? payment.method.replace("-", " ")
                      : "Not selected"}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-semibold text-slate-500">
                    Provider
                  </dt>

                  <dd className="mt-1 font-semibold capitalize text-slate-950">
                    {payment.provider || "Not assigned"}
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {!isPaid && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-8">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-600">
                  Payment method
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  How would you like to pay?
                </h2>

                <p className="mt-2 leading-7 text-slate-600">
                  Select one option. You can change it
                  while the payment remains editable.
                </p>
              </div>

              <div
                className="mt-6 grid gap-4"
                role="radiogroup"
                aria-label="Payment method"
              >
                {paymentMethods.map((method) => {
                  const Icon = method.icon;

                  const isSelected =
                    selectedMethod === method.value;

                  const isSaved =
                    payment.method === method.value;

                  return (
                    <button
                      key={method.value}
                      className={`relative flex w-full items-start gap-4 rounded-2xl border p-5 text-left transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() =>
                        handleMethodChange(
                          method.value,
                        )
                      }
                      disabled={
                        isSavingMethod ||
                        isInitiatingBankTransfer ||
                        isUploadingReceipt
                      }
                    >
                      <div
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-slate-950">
                            {method.title}
                          </h3>

                          {isSaved && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              Saved
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {method.description}
                        </p>

                        <p className="mt-2 text-xs font-semibold text-slate-500">
                          {method.providerLabel}
                        </p>
                      </div>

                      <div
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                          isSelected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white text-transparent"
                        }`}
                      >
                        <Check
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {methodError && (
                <div
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
                  role="alert"
                >
                  <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />

                  <p className="text-sm font-semibold">
                    {methodError}
                  </p>
                </div>
              )}

              {successMessage && (
                <div
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
                  role="status"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />

                  <p className="text-sm font-semibold">
                    {successMessage}
                  </p>
                </div>
              )}

              <button
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                onClick={handleSaveMethod}
                disabled={
                  isSavingMethod ||
                  isInitiatingBankTransfer ||
                  isUploadingReceipt ||
                  !selectedMethod ||
                  (hasSavedMethod &&
                    !hasUnsavedMethodChange)
                }
              >
                {isSavingMethod ? (
                  <>
                    <LoaderCircle
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    Saving payment method...
                  </>
                ) : hasSavedMethod &&
                  !hasUnsavedMethodChange ? (
                  <>
                    <CheckCircle2
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    Payment method saved
                  </>
                ) : (
                  <>
                    <CreditCard
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    Save payment method
                  </>
                )}
              </button>

              {canInitiateBankTransfer && (
                <button
                  className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-600 bg-white px-6 py-3 font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                  type="button"
                  onClick={handleStartBankTransfer}
                  disabled={
                    isSavingMethod ||
                    isInitiatingBankTransfer ||
                    isUploadingReceipt ||
                    hasUnsavedMethodChange
                  }
                >
                  {isInitiatingBankTransfer ? (
                    <>
                      <LoaderCircle
                        className="h-5 w-5 animate-spin"
                        aria-hidden="true"
                      />
                      Preparing instructions...
                    </>
                  ) : (
                    <>
                      <Building2
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                      {bankTransfer
                        ? "Refresh bank-transfer instructions"
                        : "Start bank transfer"}
                    </>
                  )}
                </button>
              )}
            </section>
          )}

          {bankTransfer && !isPaid && (
            <section className="mt-8 overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-lg shadow-blue-100/50">
              <header className="border-b border-blue-100 bg-blue-50 p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
                    <Building2
                      className="h-6 w-6"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-700">
                      Bank-transfer instructions
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Send the exact registration fee
                    </h2>

                    <p className="mt-2 leading-7 text-slate-600">
                      Use the transfer reference below so
                      your payment can be matched to your
                      registration.
                    </p>
                  </div>
                </div>
              </header>

              <div className="p-6 sm:p-8">
                <dl className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-semibold text-slate-500">
                      Bank
                    </dt>

                    <dd className="mt-1 font-bold text-slate-950">
                      {bankTransfer.bankName}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-slate-500">
                      Account name
                    </dt>

                    <dd className="mt-1 font-bold text-slate-950">
                      {bankTransfer.accountName}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-slate-500">
                      Account number
                    </dt>

                    <dd className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-4 py-3">
                      <span className="break-all font-mono font-bold text-slate-950">
                        {bankTransfer.accountNumber}
                      </span>

                      <button
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        type="button"
                        onClick={() =>
                          handleCopy(
                            bankTransfer.accountNumber,
                            "accountNumber",
                          )
                        }
                      >
                        <Copy
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                        {copiedField ===
                        "accountNumber"
                          ? "Copied"
                          : "Copy"}
                      </button>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-semibold text-slate-500">
                      Exact amount
                    </dt>

                    <dd className="mt-2 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-950">
                      {formatMoney(
                        bankTransfer.amountInCentavos,
                        bankTransfer.currency,
                      )}
                    </dd>
                  </div>
                </dl>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-500">
                    Transfer reference
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <span className="break-all font-mono font-bold text-blue-950">
                      {bankTransfer.transferReference}
                    </span>

                    <button
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100"
                      type="button"
                      onClick={() =>
                        handleCopy(
                          bankTransfer.transferReference,
                          "transferReference",
                        )
                      }
                    >
                      <Copy
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      {copiedField ===
                      "transferReference"
                        ? "Copied"
                        : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-bold text-amber-900">
                    Important instructions
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-800">
                    {bankTransfer.instructions}
                  </p>
                </div>
              </div>
            </section>
          )}

          {canUploadProof && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                  <Upload
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.14em] text-violet-700">
                    Proof of payment
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Upload your transfer receipt
                  </h2>

                  <p className="mt-2 leading-7 text-slate-600">
                    Upload a clear JPG, PNG, or PDF file.
                    The maximum file size is 5 MB.
                  </p>
                </div>
              </div>

              {hasUploadedProof && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-slate-700 shadow-sm">
                        <FileCheck2
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="break-all font-bold text-slate-950">
                          {proof.originalName}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatFileSize(
                            proof.sizeInBytes,
                          )}
                          {proof.uploadedAt
                            ? ` • Uploaded ${formatDateTime(
                                proof.uploadedAt,
                              )}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                        proofReviewStatus ===
                        "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : proofReviewStatus ===
                              "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {getReviewStatusLabel(
                        proofReviewStatus,
                      )}
                    </span>
                  </div>

                  {proofReviewStatus ===
                    "pending-review" && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      Your receipt is waiting for manual
                      verification. You may replace it if
                      you uploaded the wrong file.
                    </p>
                  )}

                  {proofReviewStatus === "rejected" && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                      <p className="font-bold">
                        Receipt rejected
                      </p>

                      <p className="mt-1 text-sm leading-6">
                        {proof.rejectionReason ||
                          "Upload a clearer or corrected receipt."}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <label
                  className="block text-sm font-bold text-slate-700"
                  htmlFor="payment-receipt"
                >
                  {hasUploadedProof
                    ? "Replace receipt"
                    : "Select receipt"}
                </label>

                <input
                  ref={fileInputRef}
                  className="sr-only"
                  id="payment-receipt"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={(eventTarget) =>
                    handleReceiptChange(
                      eventTarget.target,
                    )
                  }
                  disabled={isUploadingReceipt}
                />

                {!selectedReceipt ? (
                  <button
                    className="mt-3 flex min-h-36 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={isUploadingReceipt}
                  >
                    <Upload
                      className="h-8 w-8 text-blue-600"
                      aria-hidden="true"
                    />

                    <span className="mt-3 font-bold text-slate-950">
                      Choose a receipt file
                    </span>

                    <span className="mt-1 text-sm text-slate-500">
                      JPG, PNG, or PDF up to 5 MB
                    </span>
                  </button>
                ) : (
                  <div className="mt-3 flex flex-col gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-700 shadow-sm">
                        <FileText
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="break-all font-bold text-slate-950">
                          {selectedReceipt.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatFileSize(
                            selectedReceipt.size,
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                      type="button"
                      onClick={handleClearReceipt}
                      disabled={isUploadingReceipt}
                    >
                      <X
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {receiptError && (
                <div
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
                  role="alert"
                >
                  <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />

                  <p className="text-sm font-semibold">
                    {receiptError}
                  </p>
                </div>
              )}

              {receiptSuccess && (
                <div
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700"
                  role="status"
                >
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />

                  <p className="text-sm font-semibold">
                    {receiptSuccess}
                  </p>
                </div>
              )}

              <button
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                type="button"
                onClick={handleUploadReceipt}
                disabled={
                  !selectedReceipt ||
                  isUploadingReceipt
                }
              >
                {isUploadingReceipt ? (
                  <>
                    <LoaderCircle
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    Uploading receipt...
                  </>
                ) : (
                  <>
                    <Upload
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    {hasUploadedProof
                      ? "Replace uploaded receipt"
                      : "Upload receipt"}
                  </>
                )}
              </button>
            </section>
          )}

          {isPaid && (
            <section className="mt-8 flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
              <CheckCircle2
                className="mt-0.5 h-6 w-6 shrink-0"
                aria-hidden="true"
              />

              <div>
                <h2 className="font-bold">
                  Payment completed
                </h2>

                <p className="mt-1 text-sm leading-6">
                  Your event registration is confirmed.
                </p>
              </div>
            </section>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <ShieldCheck
                className="h-6 w-6 text-blue-600"
                aria-hidden="true"
              />

              <h2 className="mt-4 font-bold text-slate-950">
                Server-calculated amount
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                The official fee comes directly from the
                event record and cannot be changed in the
                browser.
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5">
              <LockKeyhole
                className="h-6 w-6 text-blue-600"
                aria-hidden="true"
              />

              <h2 className="mt-4 font-bold text-slate-950">
                Schedule reserved
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your submitted breakout-session choices
                remain reserved while payment is pending.
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
};

export default EventPaymentPage;
