import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  History,
  LoaderCircle,
  LogOut,
  MapPin,
  Mic2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Route,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router";

import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;

const formatDateRange = (
  startDate,
  endDate,
) => {
  if (!startDate || !endDate) {
    return "Schedule unavailable";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const dateFormatter =
    new Intl.DateTimeFormat("en-PH", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    });

  const sameDate =
    start.toDateString() ===
    end.toDateString();

  if (sameDate) {
    return dateFormatter.format(start);
  }

  return `${dateFormatter.format(
    start,
  )} – ${dateFormatter.format(end)}`;
};

const formatAgendaSchedule = (
  startDate,
  endDate,
) => {
  if (!startDate || !endDate) {
    return "Schedule unavailable";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  const dateFormatter =
    new Intl.DateTimeFormat("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    });

  const timeFormatter =
    new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    });

  return `${dateFormatter.format(
    start,
  )} · ${timeFormatter.format(
    start,
  )} – ${timeFormatter.format(end)}`;
};

const formatVenue = (venue) => {
  if (!venue) {
    return "Venue unavailable";
  }

  return [
    venue.name,
    venue.city,
    venue.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const formatStatusLabel = (status) => {
  if (!status) {
    return "Not available";
  }

  return status
    .split("-")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
};

const formatSpeakers = (speakers = []) => {
  if (speakers.length === 0) {
    return "Speaker information unavailable";
  }

  return speakers
    .map((speaker) => {
      const roleDetails = [
        speaker.jobTitle,
        speaker.organization,
      ]
        .filter(Boolean)
        .join(", ");

      if (!roleDetails) {
        return speaker.name;
      }

      return `${speaker.name} — ${roleDetails}`;
    })
    .join("; ");
};

const getRegistrationStatusClasses = (
  status,
) => {
  switch (status) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-800";

    case "pending-payment":
      return "bg-amber-100 text-amber-800";

    case "cancelled":
      return "bg-red-100 text-red-800";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getPaymentStatusClasses = (
  status,
) => {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-800";

    case "processing":
    case "pending":
      return "bg-amber-100 text-amber-800";

    case "failed":
    case "cancelled":
      return "bg-red-100 text-red-800";

    case "refunded":
      return "bg-violet-100 text-violet-800";

    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getProofStatusMessage = (payment) => {
  if (!payment?.method) {
    return {
      title: "Payment method not selected",
      description:
        "Continue to payment to choose how you would like to pay the registration fee.",
      classes:
        "border-teal-200 bg-teal-50 text-teal-800",
      icon: Banknote,
    };
  }

  if (payment.method !== "bank-transfer") {
    return {
      title: "Payment pending",
      description:
        "Continue to payment to complete your selected payment method.",
      classes:
        "border-amber-200 bg-amber-50 text-amber-800",
      icon: Clock3,
    };
  }

  const reviewStatus =
    payment?.proofOfPayment?.reviewStatus;

  switch (reviewStatus) {
    case "pending-review":
      return {
        title: "Receipt awaiting review",
        description:
          "Your payment receipt has been submitted and is waiting for administrator verification.",
        classes:
          "border-amber-200 bg-amber-50 text-amber-800",
        icon: Clock3,
      };

    case "approved":
      return {
        title: "Receipt approved",
        description:
          "Your payment receipt has been verified successfully.",
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        icon: CheckCircle2,
      };

    case "rejected":
      return {
        title: "Receipt rejected",
        description:
          payment.proofOfPayment
            ?.rejectionReason ||
          "The uploaded receipt could not be verified. Please upload another receipt.",
        classes:
          "border-red-200 bg-red-50 text-red-800",
        icon: AlertCircle,
      };

    default:
      return {
        title: "Receipt not submitted",
        description:
          "Complete the bank transfer and upload your transaction receipt for verification.",
        classes:
          "border-slate-200 bg-slate-50 text-slate-700",
        icon: Banknote,
      };
  }
};

const DashboardPage = () => {
  const navigate = useNavigate();

  const {
    user,
    token,
    endSession,
  } = useAuth();

  const [registrations, setRegistrations] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    registrationToCancel,
    setRegistrationToCancel,
  ] = useState(null);

  const [isCancelling, setIsCancelling] =
    useState(false);

  const [
    cancellationError,
    setCancellationError,
  ] = useState("");

  const [
    cancellationSuccess,
    setCancellationSuccess,
  ] = useState("");

  const isAdmin = user?.role === "admin";

  const handleLogout = () => {
    endSession();

    navigate("/login", {
      replace: true,
    });
  };

  const handleInvalidSession =
    useCallback(() => {
      endSession();

      navigate("/login", {
        replace: true,
        state: {
          from: "/dashboard",
        },
      });
    }, [endSession, navigate]);

  const loadRegistrations =
    useCallback(async () => {
      if (!API_URL || !token) {
        setErrorMessage(
          "The registration API configuration is incomplete.",
        );

        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_URL}/api/profile/registrations`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const responseData =
          await response.json();

        if (response.status === 401) {
          handleInvalidSession();
          return;
        }

        if (!response.ok) {
          setErrorMessage(
            responseData.message ||
              "Unable to load your registrations.",
          );

          return;
        }

        setRegistrations(
          responseData.registrations || [],
        );
      } catch (error) {
        console.error(
          "Unable to load participant registrations:",
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

  const handleOpenEvents = () => {
    navigate("/events");
  };

  const handleOpenProfile = () => {
    navigate("/profile");
  };

  const handleOpenPayment = (slug) => {
    navigate(`/events/${slug}/payment`);
  };

  const handleEditBreakoutSelections = (
    registrationId,
  ) => {
    navigate(
      `/dashboard/registrations/${registrationId}/edit-breakout-selections`,
    );
  };

  const handleOpenPaymentReviews = () => {
    navigate("/admin/payments");
  };

  const handleOpenRefunds = () => {
    navigate("/admin/refunds");
  };

  const handleOpenRefundHistory = () => {
    navigate("/admin/refunds/history");
  };

  const handleOpenCancellationDialog = (
    registration,
  ) => {
    setCancellationError("");
    setCancellationSuccess("");
    setRegistrationToCancel(registration);
  };

  const handleCloseCancellationDialog =
    () => {
      if (isCancelling) {
        return;
      }

      setCancellationError("");
      setRegistrationToCancel(null);
    };

  const handleCancelRegistration =
    async () => {
      if (
        !registrationToCancel?.id ||
        !API_URL ||
        !token
      ) {
        setCancellationError(
          "The cancellation request is incomplete.",
        );

        return;
      }

      setIsCancelling(true);
      setCancellationError("");

      try {
        const response = await fetch(
          `${API_URL}/api/profile/registrations/${registrationToCancel.id}/cancel`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const responseData =
          await response.json();

        if (response.status === 401) {
          handleInvalidSession();
          return;
        }

        if (!response.ok) {
          setCancellationError(
            responseData.message ||
              "Unable to cancel this registration.",
          );

          return;
        }

        setCancellationSuccess(
          responseData.message ||
            "Registration cancelled successfully.",
        );

        setRegistrationToCancel(null);
        await loadRegistrations();
      } catch (error) {
        console.error(
          "Unable to cancel participant registration:",
        );
        console.error(error.message);

        setCancellationError(
          "Unable to connect to the server. Check your connection and try again.",
        );
      } finally {
        setIsCancelling(false);
      }
    };

  return (
    <main className="min-h-screen bg-[#f4f1ff] px-4 py-4 sm:px-6 sm:py-6">
      <section className="mx-auto grid max-w-[90rem] gap-5 md:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="flex flex-col overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-blue-700 to-blue-900 text-white shadow-xl shadow-blue-950/15 md:sticky md:top-6 md:h-[calc(100vh-3rem)]">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-6">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-lg font-black text-teal-800 shadow-sm">
              S
            </div>

            <div>
              <p className="text-lg font-black tracking-tight">
                Conferia<span className="text-teal-300">.</span>
              </p>
              <p className="text-xs font-semibold text-teal-100/70">
                Event workspace
              </p>
            </div>
          </div>

          <nav
            className="grid gap-1 p-4"
            aria-label="Dashboard navigation"
          >
            <button
              type="button"
              onClick={handleOpenEvents}
              className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-teal-50/80 transition hover:bg-white/10 hover:text-white"
            >
              <CalendarDays
                className="h-4 w-4"
                aria-hidden="true"
              />

              Events
            </button>

            <button
              type="button"
              onClick={handleOpenProfile}
              className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-teal-50/80 transition hover:bg-white/10 hover:text-white"
            >
              <CircleUserRound
                className="h-4 w-4"
                aria-hidden="true"
              />

              Profile
            </button>

            {isAdmin && (
              <>
                <p className="mb-1 mt-5 px-3.5 text-[0.68rem] font-black uppercase tracking-[0.18em] text-teal-100/50">
                  Administration
                </p>

                <button
                  type="button"
                  onClick={
                    handleOpenPaymentReviews
                  }
                  className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-teal-50/80 transition hover:bg-white/10 hover:text-white"
                >
                  <ClipboardCheck
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  Payment reviews
                </button>

                <button
                  type="button"
                  onClick={handleOpenRefunds}
                  className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-teal-50/80 transition hover:bg-white/10 hover:text-white"
                >
                  <RotateCcw
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  Refunds
                </button>

                <button
                  type="button"
                  onClick={
                    handleOpenRefundHistory
                  }
                  className="inline-flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-bold text-teal-50/80 transition hover:bg-white/10 hover:text-white"
                >
                  <History
                    className="h-4 w-4"
                    aria-hidden="true"
                  />

                  Refund history
                </button>
              </>
            )}
          </nav>

          <div className="mt-auto border-t border-white/10 p-4">
            <div className="rounded-2xl bg-white/8 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-200 font-black text-teal-950">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {user?.name}
                  </p>
                  <p className="truncate text-xs text-teal-100/65">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-teal-200/15 px-2.5 py-1 text-xs font-bold capitalize text-teal-100">
                  {user?.role}
                </span>

                <button
                  className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-xs font-bold text-teal-50/80 transition hover:bg-white/10 hover:text-white"
                  type="button"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-6 text-white shadow-lg shadow-blue-900/15 sm:p-8">
            <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-blue-200/20" aria-hidden="true" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-100/80">
                  {isAdmin ? "Administration" : "Your event hub"}
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Welcome back, {user?.name?.split(" ")[0]}.
                </h1>
                <p className="mt-3 max-w-2xl leading-7 text-teal-50/80">
                  {isAdmin
                    ? "Review payments, manage refunds, and keep participant registrations moving."
                    : "Track your registrations, payment progress, and selected sessions in one place."}
                </p>
              </div>

              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 font-black text-teal-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-50"
                type="button"
                onClick={
                  isAdmin
                    ? handleOpenPaymentReviews
                    : handleOpenEvents
                }
              >
                {isAdmin ? (
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                )}
                {isAdmin
                  ? "Review payments"
                  : "Browse events"}
              </button>
            </div>
          </header>

        {isAdmin ? (
          <section className="mt-7 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                Administrative workspace
              </p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Registration operations
              </h2>
              <p className="mt-2 max-w-2xl text-slate-600">
                Choose a work queue to review participant payments, process refunds, or inspect completed records.
              </p>
            </div>

            <div className="mt-7 grid gap-4 xl:grid-cols-3">
              <button
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:shadow-md"
                type="button"
                onClick={handleOpenPaymentReviews}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-100 text-teal-800">
                  <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-5 block text-lg font-black text-slate-950">
                  Payment reviews
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  Inspect uploaded receipts and approve or reject pending payments.
                </span>
              </button>

              <button
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:shadow-md"
                type="button"
                onClick={handleOpenRefunds}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-100 text-teal-800">
                  <RotateCcw className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-5 block text-lg font-black text-slate-950">
                  Cancellations and refunds
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  Manage paid registrations that require administrator assistance.
                </span>
              </button>

              <button
                className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-teal-50 hover:shadow-md"
                type="button"
                onClick={handleOpenRefundHistory}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-100 text-teal-800">
                  <History className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-5 block text-lg font-black text-slate-950">
                  Refund history
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  Review completed refunds and retained audit information.
                </span>
              </button>
            </div>
          </section>
        ) : (
        <section className="mt-7 rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-teal-700">
                My registrations
              </p>

              <h2 className="mt-2 text-3xl font-black text-slate-950">
                Events and payment status
              </h2>

              <p className="mt-2 text-slate-600">
                View your submitted registrations
                and their current payment status.
              </p>
            </div>

            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={loadRegistrations}
              disabled={isLoading}
            >
              {isLoading ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <RefreshCw
                  className="h-4 w-4"
                  aria-hidden="true"
                />
              )}

              Refresh
            </button>
          </div>

          {!isLoading &&
            cancellationSuccess && (
              <div
                className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800"
                role="status"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />

                <div>
                  <p className="font-bold">
                    Registration cancelled
                  </p>

                  <p className="mt-1">
                    {cancellationSuccess}
                  </p>
                </div>
              </div>
            )}

          {isLoading && (
            <div
              className="mt-6 flex items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-10 text-slate-600"
              role="status"
            >
              <LoaderCircle
                className="h-6 w-6 animate-spin text-teal-600"
                aria-hidden="true"
              />

              <p className="font-semibold">
                Loading your registrations...
              </p>
            </div>
          )}

          {!isLoading && errorMessage && (
            <div
              className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700"
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              <div>
                <p className="font-bold">
                  Unable to load registrations
                </p>

                <p className="mt-1">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {!isLoading &&
            !errorMessage &&
            registrations.length === 0 && (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <CalendarDays
                  className="mx-auto h-12 w-12 text-slate-400"
                  aria-hidden="true"
                />

                <h3 className="mt-5 text-2xl font-bold text-slate-950">
                  No registrations yet
                </h3>

                <p className="mt-2 text-slate-600">
                  Browse the available events and
                  submit your first registration.
                </p>

                <button
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-teal-700 px-5 py-2 font-bold text-white transition hover:bg-teal-800"
                  type="button"
                  onClick={handleOpenEvents}
                >
                  Browse events
                </button>
              </div>
            )}

          {!isLoading &&
            !errorMessage &&
            registrations.length > 0 && (
              <div className="mt-6 space-y-6">
                {registrations.map(
                  (registration) => {
                    const proofStatus =
                      getProofStatusMessage(
                        registration.payment,
                      );

                    const ProofStatusIcon =
                      proofStatus.icon;

                    const selections =
                      registration.breakoutSelections ||
                      [];

                    const shouldShowPaymentButton =
                      registration.event?.slug &&
                      registration.status !==
                        "confirmed" &&
                      registration.status !==
                        "cancelled";

                    return (
                      <article
                        key={registration.id}
                        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60"
                      >
                        <div className="border-b border-slate-200 p-6 sm:p-8">
                          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <p className="text-sm font-bold uppercase tracking-[0.15em] text-teal-700">
                                Registered event
                              </p>

                              <h3 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                                {registration.event
                                  ?.title ||
                                  "Event unavailable"}
                              </h3>

                              <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                                {registration.event
                                  ?.summary ||
                                  "Event information is unavailable."}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`rounded-full px-3 py-1.5 text-sm font-bold ${getRegistrationStatusClasses(
                                  registration.status,
                                )}`}
                              >
                                Registration:{" "}
                                {formatStatusLabel(
                                  registration.status,
                                )}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1.5 text-sm font-bold ${getPaymentStatusClasses(
                                  registration.payment
                                    ?.status ||
                                    registration.paymentStatus,
                                )}`}
                              >
                                Payment:{" "}
                                {formatStatusLabel(
                                  registration.payment
                                    ?.status ||
                                    registration.paymentStatus,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-6 sm:p-8">
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div className="flex items-start gap-3">
                              <CalendarDays
                                className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
                                aria-hidden="true"
                              />

                              <div>
                                <p className="text-sm font-semibold text-slate-500">
                                  Event dates
                                </p>

                                <p className="mt-1 font-bold text-slate-950">
                                  {formatDateRange(
                                    registration.event
                                      ?.startDate,
                                    registration.event
                                      ?.endDate,
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3">
                              <MapPin
                                className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
                                aria-hidden="true"
                              />

                              <div>
                                <p className="text-sm font-semibold text-slate-500">
                                  Venue
                                </p>

                                <p className="mt-1 font-bold text-slate-950">
                                  {formatVenue(
                                    registration.event
                                      ?.venue,
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          {registration.payment && (
                            <div
                              className={`mt-7 flex items-start gap-3 rounded-2xl border p-5 ${proofStatus.classes}`}
                            >
                              <ProofStatusIcon
                                className="mt-0.5 h-5 w-5 shrink-0"
                                aria-hidden="true"
                              />

                              <div>
                                <p className="font-bold">
                                  {proofStatus.title}
                                </p>

                                <p className="mt-1 leading-6">
                                  {
                                    proofStatus.description
                                  }
                                </p>
                              </div>
                            </div>
                          )}

                          <section className="mt-8 border-t border-slate-200 pt-8">
                            <div className="flex items-start gap-3">
                              <Route
                                className="mt-0.5 h-6 w-6 shrink-0 text-teal-700"
                                aria-hidden="true"
                              />

                              <div>
                                <p className="text-sm font-bold uppercase tracking-[0.15em] text-teal-700">
                                  My breakout agenda
                                </p>

                                <h4 className="mt-1 text-2xl font-bold text-slate-950">
                                  Selected sessions
                                </h4>

                                <p className="mt-2 text-slate-600">
                                  Your selected breakout
                                  sessions are listed in
                                  schedule order.
                                </p>
                              </div>
                            </div>

                            {selections.length ===
                            0 ? (
                              <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-slate-600">
                                No breakout sessions have
                                been selected for this
                                registration.
                              </div>
                            ) : (
                              <div className="mt-6 space-y-4">
                                {selections.map(
                                  (
                                    selection,
                                    index,
                                  ) => {
                                    const block =
                                      selection.breakoutBlock;

                                    const session =
                                      selection.breakoutSession;

                                    return (
                                      <article
                                        key={
                                          session?.id ||
                                          `${registration.id}-${index}`
                                        }
                                        className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
                                      >
                                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                          <div>
                                            <p className="text-sm font-bold uppercase tracking-[0.14em] text-teal-700">
                                              {block?.title ||
                                                `Breakout block ${
                                                  index +
                                                  1
                                                }`}
                                            </p>

                                            <h5 className="mt-2 text-xl font-bold text-slate-950">
                                              {session?.title ||
                                                "Selected session unavailable"}
                                            </h5>

                                            {session?.description && (
                                              <p className="mt-2 max-w-3xl leading-7 text-slate-600">
                                                {
                                                  session.description
                                                }
                                              </p>
                                            )}
                                          </div>

                                          <span className="w-fit rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm">
                                            Session{" "}
                                            {index + 1}
                                          </span>
                                        </div>

                                        <div className="mt-5 grid gap-4 lg:grid-cols-3">
                                          <div className="flex items-start gap-3">
                                            <Clock3
                                              className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
                                              aria-hidden="true"
                                            />

                                            <div>
                                              <p className="text-sm font-semibold text-slate-500">
                                                Schedule
                                              </p>

                                              <p className="mt-1 font-semibold text-slate-950">
                                                {formatAgendaSchedule(
                                                  block?.startsAt,
                                                  block?.endsAt,
                                                )}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-start gap-3">
                                            <MapPin
                                              className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
                                              aria-hidden="true"
                                            />

                                            <div>
                                              <p className="text-sm font-semibold text-slate-500">
                                                Room
                                              </p>

                                              <p className="mt-1 font-semibold text-slate-950">
                                                {session?.room ||
                                                  "Room unavailable"}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-start gap-3">
                                            <Mic2
                                              className="mt-0.5 h-5 w-5 shrink-0 text-teal-700"
                                              aria-hidden="true"
                                            />

                                            <div>
                                              <p className="text-sm font-semibold text-slate-500">
                                                Speaker
                                              </p>

                                              <p className="mt-1 font-semibold leading-6 text-slate-950">
                                                {formatSpeakers(
                                                  session?.speakers,
                                                )}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </article>
                                    );
                                  },
                                )}
                              </div>
                            )}
                          </section>

                          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                            {registration.canEditBreakoutSelections && (
                              <button
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-5 py-2 font-bold text-teal-800 transition hover:bg-teal-100 sm:w-auto"
                                type="button"
                                onClick={() =>
                                  handleEditBreakoutSelections(
                                    registration.id,
                                  )
                                }
                              >
                                <Pencil
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />

                                Edit breakout selections
                              </button>
                            )}

                            {shouldShowPaymentButton && (
                              <button
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2 font-bold text-white transition hover:bg-teal-800 sm:w-auto"
                                type="button"
                                onClick={() =>
                                  handleOpenPayment(
                                    registration.event
                                      .slug,
                                  )
                                }
                              >
                                <Banknote
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />

                                Continue payment
                              </button>
                            )}

                            {registration.canCancelRegistration && (
                              <button
                                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2 font-bold text-red-700 transition hover:bg-red-100 sm:w-auto"
                                type="button"
                                onClick={() =>
                                  handleOpenCancellationDialog(
                                    registration,
                                  )
                                }
                              >
                                <Trash2
                                  className="h-5 w-5"
                                  aria-hidden="true"
                                />

                                Cancel registration
                              </button>
                            )}
                          </div>

                          {!registration.canCancelRegistration &&
                            registration.cancellationRestrictionReason && (
                              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                <AlertCircle
                                  className="mt-0.5 h-5 w-5 shrink-0 text-slate-500"
                                  aria-hidden="true"
                                />

                                <p>
                                  {
                                    registration.cancellationRestrictionReason
                                  }
                                </p>
                              </div>
                            )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
        </section>
        )}
        </div>
      </section>

      {registrationToCancel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-5 py-8"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              handleCloseCancellationDialog();
            }
          }}
        >
          <section
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-registration-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.15em] text-red-600">
                  Cancel registration
                </p>

                <h2
                  id="cancel-registration-title"
                  className="mt-2 text-2xl font-bold text-slate-950"
                >
                  Are you sure?
                </h2>
              </div>

              <button
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                onClick={
                  handleCloseCancellationDialog
                }
                disabled={isCancelling}
                aria-label="Close cancellation dialog"
              >
                <X
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </button>
            </div>

            <p className="mt-5 leading-7 text-slate-600">
              This will cancel your registration
              for{" "}
              <strong className="text-slate-950">
                {registrationToCancel.event
                  ?.title || "this event"}
              </strong>
              . Your breakout selections will
              remain in the record, but the
              registration will no longer be
              active.
            </p>

            {cancellationError && (
              <div
                className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700"
                role="alert"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />

                <p>{cancellationError}</p>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2 font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={
                  handleCloseCancellationDialog
                }
                disabled={isCancelling}
              >
                Keep registration
              </button>

              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                onClick={
                  handleCancelRegistration
                }
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <LoaderCircle
                    className="h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                )}

                {isCancelling
                  ? "Cancelling..."
                  : "Yes, cancel registration"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default DashboardPage;
