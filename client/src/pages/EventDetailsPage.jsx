import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Mic2,
  Presentation,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router";

const API_URL = import.meta.env.VITE_API_URL;

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));

const formatTime = (dateValue) =>
  new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));

const formatScheduleDate = (dateValue) =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));

const getRegistrationDetails = (
  registrationState,
) => {
  switch (registrationState) {
    case "open":
      return {
        label: "Registration open",
        description:
          "Registration is currently available for this event.",
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "upcoming":
      return {
        label: "Registration opens soon",
        description:
          "You may review the event schedule before registration opens.",
        classes:
          "border-amber-200 bg-amber-50 text-amber-700",
      };

    case "closed":
      return {
        label: "Registration closed",
        description:
          "Registration is no longer available for this event.",
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

const EventDetailsPage = () => {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [isNotFound, setIsNotFound] =
    useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const loadEvent = async () => {
      if (!API_URL) {
        setErrorMessage(
          "The event API configuration is missing.",
        );
        setIsLoading(false);

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/events/${encodeURIComponent(
            slug,
          )}`,
          {
            method: "GET",
            signal: abortController.signal,
          },
        );

        const responseData = await response.json();

        if (response.status === 404) {
          if (!abortController.signal.aborted) {
            setIsNotFound(true);
          }

          return;
        }

        if (!response.ok) {
          throw new Error(
            responseData.message ||
              "Unable to retrieve the event.",
          );
        }

        if (abortController.signal.aborted) {
          return;
        }

        setEvent(responseData.event);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error(
          "Unable to load event details:",
        );
        console.error(error.message);

        setErrorMessage(
          "Unable to load this event right now. Please try again.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadEvent();

    return () => {
      abortController.abort();
    };
  }, [slug]);

  if (isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-6">
        <div
          className="flex items-center gap-3 text-slate-600"
          role="status"
        >
          <LoaderCircle
            className="h-6 w-6 animate-spin text-blue-600"
            aria-hidden="true"
          />

          <span className="font-semibold">
            Loading event details...
          </span>
        </div>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-5 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-10">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
            <AlertCircle
              className="h-7 w-7"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
            Event not found
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            This event may not exist, may not be
            published, or may no longer be available.
          </p>

          <Link
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
            to="/events"
          >
            <ArrowLeft
              className="h-5 w-5"
              aria-hidden="true"
            />
            Browse events
          </Link>
        </section>
      </main>
    );
  }

  if (errorMessage || !event) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-5 py-12">
        <section
          className="w-full max-w-xl rounded-3xl border border-red-200 bg-red-50 p-8 text-center sm:p-10"
          role="alert"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-700">
            <AlertCircle
              className="h-7 w-7"
              aria-hidden="true"
            />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-red-950">
            Event could not be loaded
          </h1>

          <p className="mt-3 leading-7 text-red-700">
            {errorMessage}
          </p>

          <Link
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800"
            to="/events"
          >
            <ArrowLeft
              className="h-5 w-5"
              aria-hidden="true"
            />
            Return to events
          </Link>
        </section>
      </main>
    );
  }

  const registrationDetails =
    getRegistrationDetails(
      event.registrationState,
    );

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 px-5 py-10 text-white sm:px-8 sm:py-14">
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-200 transition hover:text-white"
            to="/events"
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            Back to events
          </Link>

          <div className="mt-10 max-w-4xl">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-bold ${registrationDetails.classes}`}
            >
              <Clock3
                className="h-4 w-4"
                aria-hidden="true"
              />
              {registrationDetails.label}
            </div>

            <h1 className="mt-5 text-4xl font-bold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {event.title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
              {event.description}
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-10">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                Event overview
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Summit information
              </h2>

              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CalendarDays
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="font-bold text-slate-950">
                      Event dates
                    </p>

                    <p className="mt-1 leading-6 text-slate-600">
                      {formatDate(event.startDate)} –{" "}
                      {formatDate(event.endDate)}
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
                      Venue
                    </p>

                    <p className="mt-1 leading-6 text-slate-600">
                      {event.venue.name}
                      <br />
                      {event.venue.address},{" "}
                      {event.venue.city},{" "}
                      {event.venue.country}
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
                      Capacity
                    </p>

                    <p className="mt-1 leading-6 text-slate-600">
                      Up to {event.capacity} participants
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
                      Event format
                    </p>

                    <p className="mt-1 leading-6 text-slate-600">
                      Required plenary sessions and
                      participant-selected breakout sessions
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <header>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                  Common sessions
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  Plenary sessions
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  These sessions form the shared summit
                  experience and are required for all
                  registered participants.
                </p>
              </header>

              <div className="mt-7 grid gap-5">
                {event.plenarySessions.map(
                  (session) => (
                    <article
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-200/50 sm:p-7"
                      key={session.id}
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
                            <CheckCircle2
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            Required plenary
                          </div>

                          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
                            {session.title}
                          </h3>

                          <p className="mt-3 leading-7 text-slate-600">
                            {session.description}
                          </p>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                          <p className="font-bold">
                            {formatScheduleDate(
                              session.startsAt,
                            )}
                          </p>

                          <p className="mt-1">
                            {formatTime(
                              session.startsAt,
                            )}{" "}
                            –{" "}
                            {formatTime(session.endsAt)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                        <div className="flex items-start gap-3">
                          <MapPin
                            className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                            aria-hidden="true"
                          />

                          <div>
                            <p className="text-sm font-bold text-slate-950">
                              Room
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {session.room}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Mic2
                            className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                            aria-hidden="true"
                          />

                          <div>
                            <p className="text-sm font-bold text-slate-950">
                              Speaker
                            </p>

                            {session.speakers.map(
                              (speaker) => (
                                <div
                                  className="mt-1 text-sm text-slate-600"
                                  key={`${session.id}-${speaker.name}`}
                                >
                                  <p className="font-semibold text-slate-800">
                                    {speaker.name}
                                  </p>

                                  {(speaker.jobTitle ||
                                    speaker.organization) && (
                                    <p>
                                      {speaker.jobTitle}
                                      {speaker.jobTitle &&
                                      speaker.organization
                                        ? ", "
                                        : ""}
                                      {
                                        speaker.organization
                                      }
                                    </p>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </section>

            <section>
              <header>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                  Participant choices
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  Breakout sessions
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-slate-600">
                  Each breakout block contains three
                  options. Participants will later choose
                  one session from each block.
                </p>
              </header>

              <div className="mt-8 grid gap-8">
                {event.breakoutBlocks.map(
                  (block) => (
                    <article
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
                      key={block.id}
                    >
                      <header className="border-b border-slate-200 bg-slate-50 p-6 sm:p-7">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                              Choose{" "}
                              {block.minimumSelections}
                              {block.minimumSelections !==
                              block.maximumSelections
                                ? `–${block.maximumSelections}`
                                : ""}{" "}
                              session
                            </p>

                            <h3 className="mt-2 text-2xl font-bold text-slate-950">
                              {block.title}
                            </h3>

                            {block.description && (
                              <p className="mt-2 max-w-2xl leading-7 text-slate-600">
                                {block.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                            <p className="font-bold text-slate-950">
                              {formatScheduleDate(
                                block.startsAt,
                              )}
                            </p>

                            <p className="mt-1">
                              {formatTime(
                                block.startsAt,
                              )}{" "}
                              –{" "}
                              {formatTime(block.endsAt)}
                            </p>
                          </div>
                        </div>
                      </header>

                      <div className="grid gap-5 p-6 sm:p-7">
                        {block.sessions.map(
                          (session) => (
                            <section
                              className="rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:shadow-md"
                              key={session.id}
                            >
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
                                    <Presentation
                                      className="h-4 w-4"
                                      aria-hidden="true"
                                    />
                                    Breakout option{" "}
                                    {session.displayOrder}
                                  </div>

                                  <h4 className="mt-2 text-xl font-bold text-slate-950">
                                    {session.title}
                                  </h4>
                                </div>

                                <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                                  {session.status}
                                </span>
                              </div>

                              <p className="mt-3 leading-7 text-slate-600">
                                {session.description}
                              </p>

                              <div className="mt-5 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-3">
                                <div className="flex items-start gap-2">
                                  <MapPin
                                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                                    aria-hidden="true"
                                  />

                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                      Room
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                      {session.room}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <UsersRound
                                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                                    aria-hidden="true"
                                  />

                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                      Capacity
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-slate-800">
                                      {session.capacity}{" "}
                                      participants
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <BriefcaseBusiness
                                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                                    aria-hidden="true"
                                  />

                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                      Speaker
                                    </p>

                                    {session.speakers.map(
                                      (speaker) => (
                                        <div
                                          className="mt-1 text-sm"
                                          key={`${session.id}-${speaker.name}`}
                                        >
                                          <p className="font-semibold text-slate-800">
                                            {speaker.name}
                                          </p>

                                          {(speaker.jobTitle ||
                                            speaker.organization) && (
                                            <p className="text-slate-600">
                                              {
                                                speaker.jobTitle
                                              }
                                              {speaker.jobTitle &&
                                              speaker.organization
                                                ? ", "
                                                : ""}
                                              {
                                                speaker.organization
                                              }
                                            </p>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              </div>
                            </section>
                          ),
                        )}
                      </div>
                    </article>
                  ),
                )}
              </div>
            </section>
          </div>

          <aside className="grid content-start gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                Registration
              </p>

              <h2 className="mt-3 text-xl font-bold text-slate-950">
                {registrationDetails.label}
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {registrationDetails.description}
              </p>

              <dl className="mt-6 grid gap-5 border-t border-slate-200 pt-5">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Opens
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-900">
                    {formatDate(
                      event.registrationPeriod.opensAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Closes
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-900">
                    {formatDate(
                      event.registrationPeriod.closesAt,
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                Schedule summary
              </p>

              <dl className="mt-5 grid gap-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-blue-900">
                    Plenary sessions
                  </dt>

                  <dd className="font-bold text-blue-950">
                    {event.plenarySessions.length}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-blue-900">
                    Breakout blocks
                  </dt>

                  <dd className="font-bold text-blue-950">
                    {event.breakoutBlocks.length}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-blue-900">
                    Breakout choices
                  </dt>

                  <dd className="font-bold text-blue-950">
                    {event.breakoutBlocks.reduce(
                      (total, block) =>
                        total +
                        block.sessions.length,
                      0,
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default EventDetailsPage;