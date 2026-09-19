import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  UserRound,
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
) => {
  const amount =
    Number(amountInCentavos || 0) / 100;

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return "Not available";
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(parsedDate);
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

const AdminRefundHistoryPage = () => {
  const navigate = useNavigate();

  const {
    token,
    user,
    endSession,
  } = useAuth();

  const [registrations, setRegistrations] =
    useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleInvalidSession =
    useCallback(() => {
      endSession();

      navigate("/login", {
        replace: true,
        state: {
          from: "/admin/refunds/history",
        },
      });
    }, [endSession, navigate]);

  const loadRefundHistory =
    useCallback(async () => {
      if (!API_URL || !token) {
        setErrorMessage(
          "The refund-history API configuration is incomplete.",
        );

        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `${API_URL}/api/admin/registrations/refunded`,
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

        if (response.status === 403) {
          setErrorMessage(
            "Administrator access is required to view refund history.",
          );

          return;
        }

        if (!response.ok) {
          setErrorMessage(
            responseData.message ||
              "Unable to load refund history.",
          );

          return;
        }

        setRegistrations(
          responseData.registrations || [],
        );
      } catch (error) {
        console.error(
          "Unable to load refund history:",
        );
        console.error(error.message);

        setErrorMessage(
          "Unable to connect to the server. Check your connection and try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      handleInvalidSession,
      token,
    ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => {
        loadRefundHistory();
      },
      0,
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadRefundHistory]);

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-10 sm:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="rounded-3xl bg-gradient-to-br from-blue-800 to-blue-600 p-6 text-white shadow-xl shadow-blue-300/20 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
                Conferia administration
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Refund history
              </h1>

              <p className="mt-3 max-w-3xl leading-7 text-slate-300">
                Review completed registration
                cancellations and payment refunds.
                These records are read-only and
                retained for administrative
                auditing.
              </p>

              {user?.name && (
                <p className="mt-3 text-sm text-slate-400">
                  Signed in as {user.name}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/20"
                to="/admin/refunds"
              >
                <ArrowLeft
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                Active refunds
              </Link>

              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={isLoading}
                onClick={loadRefundHistory}
              >
                <RefreshCw
                  className={`h-5 w-5 ${
                    isLoading
                      ? "animate-spin"
                      : ""
                  }`}
                  aria-hidden="true"
                />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <RotateCcw
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Completed refunds
                </p>

                <p className="text-2xl font-bold text-slate-950">
                  {registrations.length}
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Record type
                </p>

                <p className="text-lg font-bold text-slate-950">
                  Cancelled and refunded
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <ClipboardList
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>

              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Access
                </p>

                <p className="text-lg font-bold text-slate-950">
                  Administrator audit
                </p>
              </div>
            </div>
          </article>
        </section>

        {isLoading && (
          <div className="mt-6 flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 text-slate-700">
              <LoaderCircle
                className="h-6 w-6 animate-spin"
                aria-hidden="true"
              />

              <p className="font-semibold">
                Loading refund history...
              </p>
            </div>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="mt-0.5 h-6 w-6 shrink-0"
                aria-hidden="true"
              />

              <div>
                <h2 className="font-bold">
                  Unable to load refund history
                </h2>

                <p className="mt-1 leading-7">
                  {errorMessage}
                </p>

                <button
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2 font-bold text-white transition hover:bg-red-800"
                  type="button"
                  onClick={loadRefundHistory}
                >
                  <RefreshCw
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading &&
          !errorMessage &&
          registrations.length === 0 && (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <RotateCcw
                className="mx-auto h-12 w-12 text-slate-400"
                aria-hidden="true"
              />

              <h2 className="mt-5 text-2xl font-bold text-slate-950">
                No refund history
              </h2>

              <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-600">
                Completed refunds will appear here
                after an administrator cancels and
                refunds a paid registration.
              </p>

              <Link
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-bold text-white transition hover:bg-blue-700"
                to="/admin/refunds"
              >
                <Banknote
                  className="h-5 w-5"
                  aria-hidden="true"
                />
                View paid registrations
              </Link>
            </div>
          )}

        {!isLoading &&
          !errorMessage &&
          registrations.length > 0 && (
            <div className="mt-6 space-y-6">
              {registrations.map((item) => (
                <article
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
                  key={
                    item.payment?.id ||
                    item.registration?.id
                  }
                >
                  <div className="border-b border-slate-200 bg-slate-50 p-6 sm:p-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.15em] text-violet-700">
                          Completed refund
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-slate-950">
                          {item.event?.title ||
                            "Event unavailable"}
                        </h2>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-red-100 px-3 py-1.5 text-sm font-bold text-red-800">
                            Registration:{" "}
                            {formatStatusLabel(
                              item.registration
                                ?.status,
                            )}
                          </span>

                          <span className="rounded-full bg-violet-100 px-3 py-1.5 text-sm font-bold text-violet-800">
                            Payment:{" "}
                            {formatStatusLabel(
                              item.payment?.status,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.13em] text-violet-700">
                          Amount refunded
                        </p>

                        <p className="mt-1 text-2xl font-bold text-violet-950">
                          {formatMoney(
                            item.payment
                              ?.amountInCentavos,
                            item.payment?.currency,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2">
                        <UserRound
                          className="h-5 w-5 text-blue-600"
                          aria-hidden="true"
                        />

                        <h3 className="font-bold text-slate-950">
                          Participant
                        </h3>
                      </div>

                      <dl className="mt-5 space-y-4">
                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Name
                          </dt>

                          <dd className="mt-1 font-semibold text-slate-900">
                            {item.participant
                              ?.name ||
                              "Not available"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Email
                          </dt>

                          <dd className="mt-1 break-all text-slate-700">
                            {item.participant
                              ?.email ||
                              "Not available"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Registration ID
                          </dt>

                          <dd className="mt-1 break-all font-mono text-sm text-slate-700">
                            {item.registration
                              ?.id ||
                              "Not available"}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2">
                        <CalendarDays
                          className="h-5 w-5 text-blue-600"
                          aria-hidden="true"
                        />

                        <h3 className="font-bold text-slate-950">
                          Refund timeline
                        </h3>
                      </div>

                      <dl className="mt-5 space-y-4">
                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Payment completed
                          </dt>

                          <dd className="mt-1 text-slate-700">
                            {formatDateTime(
                              item.payment?.paidAt,
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Refunded
                          </dt>

                          <dd className="mt-1 font-semibold text-slate-900">
                            {formatDateTime(
                              item.payment
                                ?.refundedAt,
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Registration cancelled
                          </dt>

                          <dd className="mt-1 text-slate-700">
                            {formatDateTime(
                              item.registration
                                ?.cancelledAt,
                            )}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section className="rounded-2xl border border-slate-200 p-5 lg:col-span-2">
                      <div className="flex items-center gap-2">
                        <Banknote
                          className="h-5 w-5 text-violet-700"
                          aria-hidden="true"
                        />

                        <h3 className="font-bold text-slate-950">
                          Refund details
                        </h3>
                      </div>

                      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Refund reference
                          </dt>

                          <dd className="mt-1 break-all font-mono text-sm font-semibold text-slate-900">
                            {item.payment
                              ?.refundReference ||
                              "Not available"}
                          </dd>
                        </div>

                        <div>
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Original payment reference
                          </dt>

                          <dd className="mt-1 break-all font-mono text-sm text-slate-700">
                            {item.payment
                              ?.providerReference ||
                              "Not available"}
                          </dd>
                        </div>

                        <div className="sm:col-span-2">
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Refund reason
                          </dt>

                          <dd className="mt-1 whitespace-pre-wrap leading-7 text-slate-800">
                            {item.payment
                              ?.refundReason ||
                              "Not available"}
                          </dd>
                        </div>

                        <div className="sm:col-span-2">
                          <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            Internal refund notes
                          </dt>

                          <dd className="mt-1 whitespace-pre-wrap leading-7 text-slate-700">
                            {item.payment
                              ?.refundNotes ||
                              "No internal notes were recorded."}
                          </dd>
                        </div>
                      </dl>
                    </section>

                    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 lg:col-span-2">
                      <h3 className="font-bold text-blue-950">
                        Processed by
                      </h3>

                      <div className="mt-3 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                            Administrator
                          </p>

                          <p className="mt-1 font-semibold text-blue-950">
                            {item.refundedBy?.name ||
                              "Not available"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                            Email
                          </p>

                          <p className="mt-1 break-all text-blue-900">
                            {item.refundedBy
                              ?.email ||
                              "Not available"}
                          </p>
                        </div>
                      </div>
                    </section>
                  </div>
                </article>
              ))}
            </div>
          )}
      </section>
    </main>
  );
};

export default AdminRefundHistoryPage;
