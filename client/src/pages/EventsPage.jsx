import {
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  CircleCheck,
  Clock3,
  LoaderCircle,
  MapPin,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;

const formatEventDate = (dateValue) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));

const formatRegistrationDate = (dateValue) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));

const getRegistrationDetails = (registrationState) => {
  switch (registrationState) {
    case "open":
      return {
        label: "Registration open",
        description:
          "Registration is currently available.",
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "upcoming":
      return {
        label: "Registration opens soon",
        description:
          "Registration has not opened yet.",
        classes:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "closed":
      return {
        label: "Registration closed",
        description:
          "Registration is no longer available.",
        classes:
          "border-slate-200 bg-slate-100 text-slate-600",
      };

    default:
      return {
        label: "Registration unavailable",
        description:
          "Registration is currently unavailable.",
        classes:
          "border-slate-200 bg-slate-100 text-slate-600",
      };
  }
};

const EventsPage = () => {
  const {
    isAuthenticated,
    isCheckingSession,
    user,
  } = useAuth();

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const abortController = new AbortController();

    const loadEvents = async () => {
      if (!API_URL) {
        setErrorMessage(
          "The events API configuration is missing.",
        );
        setIsLoading(false);

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/events`,
          {
            method: "GET",
            signal: abortController.signal,
          },
        );

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.message ||
              "Unable to retrieve events.",
          );
        }

        if (abortController.signal.aborted) {
          return;
        }

        setEvents(
          Array.isArray(responseData.events)
            ? responseData.events
            : [],
        );
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Unable to load events:");
        console.error(error.message);

        setErrorMessage(
          "Unable to load events right now. Please try again.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadEvents();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f4f1ff]">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#f8f6ff] via-[#eee9ff] to-[#d9d1ff] px-5 pb-20 text-slate-950 sm:px-8 sm:pb-28">
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-[30rem] w-[30rem] rounded-full bg-blue-400/30 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-36 left-1/4 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl">
          <nav className="flex min-h-24 items-center justify-between gap-4" aria-label="Primary navigation">
            <Link
              className="inline-flex items-center gap-3 text-xl font-black tracking-[-0.04em] text-slate-950 transition hover:text-blue-700"
              to="/events"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <CalendarDays
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              </span>
              Conferia<span className="text-blue-600">.</span>
            </Link>

            {!isCheckingSession && (
              <div className="flex items-center gap-2 sm:gap-3">
                {isAuthenticated ? (
                  <>
                    <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
                      Welcome, {user?.firstName || "back"}
                    </span>
                    <Link
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300"
                      to="/dashboard"
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      className="hidden min-h-11 items-center justify-center rounded-xl px-5 py-2 text-sm font-bold text-slate-700 transition hover:bg-white/70 hover:text-blue-700 sm:inline-flex"
                      to="/login"
                    >
                      Sign in
                    </Link>
                    <Link
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300"
                      to="/register"
                    >
                      Create account
                    </Link>
                  </>
                )}
              </div>
            )}
          </nav>

          <div className="mt-14 grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-700">
                Professional events, thoughtfully organized
              </p>

              <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                Learn together. <span className="text-blue-600">Leave inspired.</span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                Discover curated conferences, workshops, and professional learning experiences—all in one clear, effortless place.
              </p>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/70 p-6 shadow-xl shadow-blue-200/30 backdrop-blur-sm">
              <p className="text-4xl font-black tracking-[-0.05em] text-blue-600">{isLoading ? "—" : events.length}</p>
              <p className="mt-2 font-semibold text-slate-950">Published experience{events.length === 1 ? "" : "s"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Browse the program before creating an account.</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
              Curated experiences
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Find your next event
            </h2>
          </div>

          {!isLoading && !errorMessage && (
            <p className="text-sm font-semibold text-slate-500">
              {events.length}{" "}
              {events.length === 1
                ? "event available"
                : "events available"}
            </p>
          )}
        </header>

        {isLoading && (
          <div
            className="mt-10 flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white"
            role="status"
          >
            <div className="flex items-center gap-3 text-slate-600">
              <LoaderCircle
                className="h-6 w-6 animate-spin text-blue-600"
                aria-hidden="true"
              />

              <span className="font-semibold">
                Loading published events...
              </span>
            </div>
          </div>
        )}

        {!isLoading && errorMessage && (
          <div
            className="mt-10 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-red-200 bg-red-50 px-6 text-center"
            role="alert"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-700">
              <AlertCircle
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-5 text-xl font-bold text-red-950">
              Events could not be loaded
            </h2>

            <p className="mt-2 max-w-md leading-7 text-red-700">
              {errorMessage}
            </p>
          </div>
        )}

        {!isLoading &&
          !errorMessage &&
          events.length === 0 && (
            <div className="mt-10 flex min-h-64 flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-600">
                <CalendarDays
                  className="h-6 w-6"
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-950">
                No published events yet
              </h2>

              <p className="mt-2 max-w-md leading-7 text-slate-600">
                New learning events will appear here once
                they are published.
              </p>
            </div>
          )}

        {!isLoading &&
          !errorMessage &&
          events.length > 0 && (
            <div className="mt-10 grid gap-7">
              {events.map((event) => {
                const registrationDetails =
                  getRegistrationDetails(
                    event.registrationState,
                  );

                return (
                  <article
                    className="group overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-34px_rgba(13,148,136,0.28)]"
                    key={event.id}
                  >
                    <div className="grid lg:grid-cols-[minmax(0,1fr)_22rem]">
                      <div className="p-6 sm:p-8 lg:p-10">
                        <div
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${registrationDetails.classes}`}
                        >
                          {event.registrationState ===
                          "open" ? (
                            <CircleCheck
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          ) : (
                            <Clock3
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )}

                          {registrationDetails.label}
                        </div>

                        <h3 className="mt-6 max-w-3xl text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
                          {event.title}
                        </h3>

                        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                          {event.description}
                        </p>

                        <div className="mt-7 grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                          <div className="flex items-start gap-3">
                            <CalendarDays
                              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                              aria-hidden="true"
                            />

                            <div>
                              <p className="font-bold text-slate-950">
                                Event dates
                              </p>

                              <p className="mt-1">
                                {formatEventDate(
                                  event.startDate,
                                )}{" "}
                                –{" "}
                                {formatEventDate(
                                  event.endDate,
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <MapPin
                              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                              aria-hidden="true"
                            />

                            <div>
                              <p className="font-bold text-slate-950">
                                Location
                              </p>

                              <p className="mt-1">
                                {event.venue.name},{" "}
                                {event.venue.city}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <UsersRound
                              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                              aria-hidden="true"
                            />

                            <div>
                              <p className="font-bold text-slate-950">
                                Event capacity
                              </p>

                              <p className="mt-1">
                                Up to {event.capacity}{" "}
                                participants
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Building2
                              className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                              aria-hidden="true"
                            />

                            <div>
                              <p className="font-bold text-slate-950">
                                Venue
                              </p>

                              <p className="mt-1">
                                {event.venue.address}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Link
                          className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300"
                          to={`/events/${event.slug}`}
                        >
                          View event details
                          <ArrowRight
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>

                      <aside className="border-t border-blue-100 bg-blue-50/70 p-6 sm:p-8 lg:border-l lg:border-t-0">
                        <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                          Registration
                        </p>

                        <h4 className="mt-3 text-xl font-bold text-slate-950">
                          {registrationDetails.label}
                        </h4>

                        <p className="mt-2 leading-7 text-slate-600">
                          {registrationDetails.description}
                        </p>

                        <dl className="mt-6 grid gap-5">
                          <div>
                            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Opens
                            </dt>

                            <dd className="mt-1 font-semibold text-slate-900">
                              {formatRegistrationDate(
                                event.registrationPeriod
                                  .opensAt,
                              )}
                            </dd>
                          </div>

                          <div>
                            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                              Closes
                            </dt>

                            <dd className="mt-1 font-semibold text-slate-900">
                              {formatRegistrationDate(
                                event.registrationPeriod
                                  .closesAt,
                              )}
                            </dd>
                          </div>
                        </dl>
                      </aside>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>
    </main>
  );
};

export default EventsPage;
