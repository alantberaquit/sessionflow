import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  History,
  LoaderCircle,
  Mail,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  UserRound,
  X,
} from "lucide-react";
import {
  Link,
  useNavigate,
} from "react-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import useAuth from "../hooks/useAuth.js";

const API_URL =
  import.meta.env.VITE_API_URL ??
  "http://localhost:5000";

const initialRefundForm = {
  refundReference: "",
  reason: "",
  internalNotes: "",
};

const formatCurrency = (
  amountInCentavos,
  currency = "PHP",
) => {
  const amount =
    Number(amountInCentavos ?? 0) / 100;

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
  }).format(amount);
};

const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getErrorMessage = async (
  response,
  fallbackMessage,
) => {
  try {
    const result = await response.json();

    return (
      result.message ??
      result.error ??
      fallbackMessage
    );
  } catch {
    return fallbackMessage;
  }
};

const AdminRefundsPage = () => {
  const navigate = useNavigate();

  const {
    token,
    endSession,
  } = useAuth();

  const [registrations, setRegistrations] =
    useState([]);

  const [
    selectedRegistrationId,
    setSelectedRegistrationId,
  ] = useState("");

  const [refundForm, setRefundForm] =
    useState(initialRefundForm);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    resendingRegistrationId,
    setResendingRegistrationId,
  ] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [successType, setSuccessType] =
    useState("");

  const selectedRecord = useMemo(
    () =>
      registrations.find(
        (record) =>
          record.registration?.id ===
          selectedRegistrationId,
      ) ?? null,
    [
      registrations,
      selectedRegistrationId,
    ],
  );

  const handleUnauthorizedResponse =
    useCallback(() => {
      endSession?.();

      navigate("/login", {
        replace: true,
        state: {
          from: "/admin/refunds",
        },
      });
    }, [endSession, navigate]);

  const loadRegistrations =
    useCallback(async () => {
      if (!token) {
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      setSuccessType("");

      try {
        const response = await fetch(
          `${API_URL}/api/admin/registrations/paid`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (response.status === 401) {
          handleUnauthorizedResponse();
          return;
        }

        if (response.status === 403) {
          navigate("/dashboard", {
            replace: true,
            state: {
              message:
                "Administrator access is required.",
            },
          });

          return;
        }

        if (!response.ok) {
          throw new Error(
            await getErrorMessage(
              response,
              "Unable to load paid registrations.",
            ),
          );
        }

        const result = await response.json();

        const records =
          result.registrations ?? [];

        setRegistrations(records);

        setSelectedRegistrationId(
          (currentId) => {
            const currentStillExists =
              records.some(
                (record) =>
                  record.registration?.id ===
                  currentId,
              );

            return currentStillExists
              ? currentId
              : "";
          },
        );
      } catch (error) {
        setErrorMessage(
          error.message ||
            "Unable to load paid registrations.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      handleUnauthorizedResponse,
      navigate,
      token,
    ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        loadRegistrations();
      },
      0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadRegistrations]);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
    setSuccessType("");
  };

  const handleSelectRegistration = (
    registrationId,
  ) => {
    setSelectedRegistrationId(
      registrationId,
    );

    setRefundForm(initialRefundForm);
    clearMessages();
  };

  const handleCloseForm = () => {
    setSelectedRegistrationId("");
    setRefundForm(initialRefundForm);
    clearMessages();
  };

  const handleResendConfirmation = async (
    registrationId,
    participantName,
  ) => {
    const confirmed = window.confirm(
      `Resend the registration confirmation email to ${participantName}?`,
    );

    if (!confirmed) {
      return;
    }

    setResendingRegistrationId(
      registrationId,
    );

    clearMessages();

    try {
      const response = await fetch(
        `${API_URL}/api/admin/registrations/${registrationId}/resend-confirmation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      if (response.status === 403) {
        navigate("/dashboard", {
          replace: true,
          state: {
            message:
              "Administrator access is required.",
          },
        });

        return;
      }

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Unable to resend the registration confirmation email.",
          ),
        );
      }

      const result = await response.json();

      setSuccessMessage(
        result.message ??
          `Registration confirmation email resent to ${participantName}.`,
      );

      setSuccessType("email");

      if (
        result.confirmationEmail?.previewUrl
      ) {
        window.open(
          result.confirmationEmail.previewUrl,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Unable to resend the registration confirmation email.",
      );
    } finally {
      setResendingRegistrationId("");
    }
  };

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setRefundForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    clearMessages();
  };

  const validateRefundForm = () => {
    const refundReference =
      refundForm.refundReference.trim();

    const reason =
      refundForm.reason.trim();

    const internalNotes =
      refundForm.internalNotes.trim();

    if (!refundReference) {
      return "Enter the refund reference.";
    }

    if (refundReference.length > 200) {
      return "The refund reference must not exceed 200 characters.";
    }

    if (reason.length < 10) {
      return "Enter a refund reason containing at least 10 characters.";
    }

    if (reason.length > 500) {
      return "The refund reason must not exceed 500 characters.";
    }

    if (internalNotes.length > 1000) {
      return "Internal notes must not exceed 1,000 characters.";
    }

    return "";
  };

  const handleSubmitRefund = async (
    event,
  ) => {
    event.preventDefault();

    if (!selectedRecord) {
      setErrorMessage(
        "Select a paid registration first.",
      );

      return;
    }

    const validationMessage =
      validateRefundForm();

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const participantName =
      selectedRecord.participant?.name ??
      selectedRecord.participant
        ?.fullName ??
      "this participant";

    const confirmed = window.confirm(
      `Cancel ${participantName}'s registration and mark the payment as refunded?\n\nThis action cannot be undone from this page.`,
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    clearMessages();

    try {
      const registrationId =
        selectedRecord.registration?.id;

      const response = await fetch(
        `${API_URL}/api/admin/registrations/${registrationId}/cancel-and-refund`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            refundReference:
              refundForm.refundReference.trim(),
            reason:
              refundForm.reason.trim(),
            internalNotes:
              refundForm.internalNotes.trim(),
          }),
        },
      );

      if (response.status === 401) {
        handleUnauthorizedResponse();
        return;
      }

      if (response.status === 403) {
        navigate("/dashboard", {
          replace: true,
          state: {
            message:
              "Administrator access is required.",
          },
        });

        return;
      }

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(
            response,
            "Unable to cancel and refund this registration.",
          ),
        );
      }

      setRegistrations(
        (currentRegistrations) =>
          currentRegistrations.filter(
            (record) =>
              record.registration?.id !==
              registrationId,
          ),
      );

      setSelectedRegistrationId("");
      setRefundForm(initialRefundForm);

      setSuccessMessage(
        `${participantName}'s registration was cancelled and the payment was marked as refunded.`,
      );

      setSuccessType("refund");
    } catch (error) {
      setErrorMessage(
        error.message ||
          "Unable to cancel and refund this registration.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 text-slate-950 sm:px-8 lg:px-10 lg:py-10">
      <section className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-blue-600">
            Administration
          </p>

          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Cancellations and refunds
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Review confirmed paid
            registrations that require
            administrator-assisted
            cancellation and refund
            processing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/admin/refunds/history"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
          >
            <History
              className="h-4 w-4"
              aria-hidden="true"
            />

            Refund history
          </Link>

          <button
            type="button"
            onClick={loadRegistrations}
            disabled={
              isLoading || isSubmitting
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoading
                  ? "animate-spin"
                  : ""
              }`}
              aria-hidden="true"
            />

            Refresh list
          </button>
        </div>
      </section>

      {errorMessage && (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
          role="alert"
        >
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />

          <p className="font-medium">
            {errorMessage}
          </p>
        </div>
      )}

      {successMessage && (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800"
          role="status"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0"
            aria-hidden="true"
          />

          <div>
            <p className="font-semibold">
              {successType === "email"
                ? "Confirmation email sent"
                : "Refund completed"}
            </p>

            <p className="mt-1">
              {successMessage}
            </p>

            {successType === "refund" && (
              <Link
                to="/admin/refunds/history"
                className="mt-3 inline-flex items-center gap-2 font-semibold text-emerald-900 underline decoration-emerald-400 underline-offset-4"
              >
                <History
                  className="h-4 w-4"
                  aria-hidden="true"
                />

                View refund history
              </Link>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <section className="grid min-h-64 place-items-center rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div
            className="text-center"
            role="status"
          >
            <LoaderCircle
              className="mx-auto h-9 w-9 animate-spin text-blue-600"
              aria-hidden="true"
            />

            <p className="mt-4 font-semibold text-slate-700">
              Loading paid registrations...
            </p>
          </div>
        </section>
      ) : registrations.length === 0 ? (
        <section className="grid min-h-64 place-items-center rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="max-w-xl">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-100 text-blue-600">
              <RotateCcw
                className="h-7 w-7"
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              No paid registrations available
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Confirmed paid registrations
              will appear here when they are
              eligible for
              administrator-assisted
              cancellation and refund.
            </p>

            <Link
              to="/admin/refunds/history"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              <History
                className="h-4 w-4"
                aria-hidden="true"
              />

              View completed refunds
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black text-slate-950">
                Paid registrations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a registration to begin
                the cancellation and refund
                process.
              </p>
            </div>

            <div className="space-y-4">
              {registrations.map(
                (record) => {
                  const registration =
                    record.registration ?? {};

                  const participant =
                    record.participant ?? {};

                  const event =
                    record.event ?? {};

                  const payment =
                    record.payment ?? {};

                  const isSelected =
                    registration.id ===
                    selectedRegistrationId;

                  return (
                    <button
                      key={registration.id}
                      type="button"
                      onClick={() =>
                        handleSelectRegistration(
                          registration.id,
                        )
                      }
                      className={`w-full rounded-2xl border p-5 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-lg font-bold text-slate-950">
                            {participant.name ??
                              participant.fullName ??
                              "Unnamed participant"}
                          </p>

                          <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                            <Mail
                              className="h-4 w-4"
                              aria-hidden="true"
                            />

                            {participant.email ??
                              "No email available"}
                          </p>
                        </div>

                        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                          Paid
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <p className="flex items-start gap-2">
                          <CalendarDays
                            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />

                          <span>
                            <span className="block font-semibold text-slate-800">
                              Event
                            </span>

                            {event.title ??
                              "Event title unavailable"}
                          </span>
                        </p>

                        <p className="flex items-start gap-2">
                          <Banknote
                            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />

                          <span>
                            <span className="block font-semibold text-slate-800">
                              Amount paid
                            </span>

                            {formatCurrency(
                              payment.amountInCentavos,
                              payment.currency,
                            )}
                          </span>
                        </p>

                        <p className="flex items-start gap-2">
                          <ReceiptText
                            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />

                          <span>
                            <span className="block font-semibold text-slate-800">
                              Payment reference
                            </span>

                            {payment.providerReference ??
                              payment.reference ??
                              "Not available"}
                          </span>
                        </p>

                        <p className="flex items-start gap-2">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />

                          <span>
                            <span className="block font-semibold text-slate-800">
                              Confirmed
                            </span>

                            {formatDate(
                              registration.confirmedAt,
                            )}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </section>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            {selectedRecord ? (
              <form
                onSubmit={handleSubmitRefund}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                      Refund request
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-slate-950">
                      Cancel and refund
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleCloseForm}
                    disabled={isSubmitting}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Close refund form"
                  >
                    <X
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </button>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                  <p className="flex items-center gap-2 font-bold text-slate-950">
                    <UserRound
                      className="h-4 w-4 text-blue-600"
                      aria-hidden="true"
                    />

                    {selectedRecord.participant
                      ?.name ??
                      selectedRecord.participant
                        ?.fullName ??
                      "Unnamed participant"}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {selectedRecord.event
                      ?.title ??
                      "Event title unavailable"}
                  </p>

                  <p className="mt-3 text-lg font-black text-slate-950">
                    {formatCurrency(
                      selectedRecord.payment
                        ?.amountInCentavos,
                      selectedRecord.payment
                        ?.currency,
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleResendConfirmation(
                      selectedRecord.registration
                        ?.id,
                      selectedRecord.participant
                        ?.name ??
                        selectedRecord.participant
                          ?.fullName ??
                        "this participant",
                    )
                  }
                  disabled={
                    isSubmitting ||
                    resendingRegistrationId ===
                      selectedRecord.registration
                        ?.id
                  }
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resendingRegistrationId ===
                  selectedRecord.registration
                    ?.id ? (
                    <>
                      <LoaderCircle
                        className="h-5 w-5 animate-spin"
                        aria-hidden="true"
                      />

                      Resending confirmation...
                    </>
                  ) : (
                    <>
                      <Mail
                        className="h-5 w-5"
                        aria-hidden="true"
                      />

                      Resend confirmation email
                    </>
                  )}
                </button>

                <div className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor="refundReference"
                      className="block text-sm font-bold text-slate-800"
                    >
                      Refund reference
                    </label>

                    <p className="mt-1 text-sm text-slate-500">
                      Enter the bank, gateway,
                      or internal reference for
                      the completed refund.
                    </p>

                    <input
                      id="refundReference"
                      name="refundReference"
                      type="text"
                      value={
                        refundForm.refundReference
                      }
                      onChange={handleInputChange}
                      maxLength={200}
                      disabled={isSubmitting}
                      placeholder="Example: RFND-2026-0001"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="reason"
                      className="block text-sm font-bold text-slate-800"
                    >
                      Cancellation and refund
                      reason
                    </label>

                    <p className="mt-1 text-sm text-slate-500">
                      Provide a clear
                      participant-facing reason.
                    </p>

                    <textarea
                      id="reason"
                      name="reason"
                      value={refundForm.reason}
                      onChange={handleInputChange}
                      minLength={10}
                      maxLength={500}
                      rows={4}
                      disabled={isSubmitting}
                      placeholder="Explain why the registration is being cancelled and refunded."
                      className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      required
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {refundForm.reason.length}
                      /500
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="internalNotes"
                      className="block text-sm font-bold text-slate-800"
                    >
                      Internal notes
                    </label>

                    <p className="mt-1 text-sm text-slate-500">
                      Optional notes for
                      administrators. These are
                      not intended for the
                      participant.
                    </p>

                    <textarea
                      id="internalNotes"
                      name="internalNotes"
                      value={
                        refundForm.internalNotes
                      }
                      onChange={handleInputChange}
                      maxLength={1000}
                      rows={4}
                      disabled={isSubmitting}
                      placeholder="Add supporting details, approvals, or follow-up actions."
                      className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />

                    <p className="mt-1 text-right text-xs text-slate-400">
                      {
                        refundForm.internalNotes
                          .length
                      }
                      /1000
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-bold text-amber-900">
                    This action updates both
                    records
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    The registration will be
                    cancelled and the associated
                    payment will be marked as
                    refunded.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3.5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle
                        className="h-5 w-5 animate-spin"
                        aria-hidden="true"
                      />

                      Processing refund...
                    </>
                  ) : (
                    <>
                      <RotateCcw
                        className="h-5 w-5"
                        aria-hidden="true"
                      />

                      Cancel registration and
                      refund
                    </>
                  )}
                </button>
              </form>
            ) : (
              <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                  <ReceiptText
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                </div>

                <h2 className="mt-4 text-xl font-black text-slate-950">
                  Select a registration
                </h2>

                <p className="mt-2 leading-6 text-slate-600">
                  Choose a paid registration
                  from the list to review its
                  details and process the
                  cancellation and refund.
                </p>
              </section>
            )}
          </aside>
        </div>
      )}
    </main>
  );
};

export default AdminRefundsPage;