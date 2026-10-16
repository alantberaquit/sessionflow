import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  LogIn,
  MapPin,
  Mic2,
  UsersRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

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

  const {
    token,
    endSession,
  } = useAuth();

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [isNotFound, setIsNotFound] =
    useState(false);
  const [hasRegistration, setHasRegistration] =
    useState(false);
  const [
    isLoadingRegistration,
    setIsLoadingRegistration,
  ] = useState(false);

  const handleInvalidSession = useCallback(() => {
    endSession();
    setHasRegistration(false);
  }, [endSession]);

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

  useEffect(() => {
    const abortController = new AbortController();

    const loadParticipantRegistration =
      async () => {
        if (!API_URL || !token || !slug) {
          setHasRegistration(false);
          setIsLoadingRegistration(false);

          return;
        }

        setIsLoadingRegistration(true);

        try {
          const response = await fetch(
            `${API_URL}/api/events/${encodeURIComponent(
              slug,
            )}/registration`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              signal: abortController.signal,
            },
          );

          const responseData =
            await response.json();

          if (response.status === 401) {
            if (!abortController.signal.aborted) {
              handleInvalidSession();
            }

            return;
          }

          if (!response.ok) {
            throw new Error(
              responseData.message ||
                "Unable to retrieve your registration.",
            );
          }

          if (abortController.signal.aborted) {
            return;
          }

          setHasRegistration(
            Boolean(
              responseData.hasRegistration,
            ),
          );
        } catch (error) {
          if (error.name === "AbortError") {
            return;
          }

          console.error(
            "Unable to check participant registration:",
          );
          console.error(error.message);

          setHasRegistration(false);
        } finally {
          if (!abortController.signal.aborted) {
            setIsLoadingRegistration(false);
          }
        }
      };

    loadParticipantRegistration();

    return () => {
      abortController.abort();
    };
  }, [
    handleInvalidSession,
    slug,
    token,
  ]);

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
        <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-10">
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
          className="w-full max-w-xl rounded-2xl border border-red-200 bg-red-50 p-8 text-center sm:p-10"
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
    <main className="min-h-screen bg-[#f7f5ff] text-[#121127]">
      <header className="relative isolate overflow-hidden bg-[#121127] px-5 pb-24 text-white sm:px-8 sm:pb-32">
        <div className="event-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-[30rem] w-[30rem] rounded-full bg-[#6d4aff]/40 blur-[100px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl">
          <nav className="flex min-h-24 items-center justify-between gap-4 border-b border-white/10" aria-label="Primary navigation">
            <Link
              className="inline-flex items-center gap-3 text-xl font-black tracking-[-0.04em] text-white"
              to="/events"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#6d4aff] text-white shadow-[0_0_35px_rgba(109,74,255,0.5)]">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>Conferia</span><span className="text-[#9b87f5]">.</span>
            </Link>

            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/10"
              to={token ? "/dashboard" : "/login"}
            >
              {token ? "Dashboard" : "Sign in"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>

          <Link
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition hover:text-white"
            to="/events"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All events
          </Link>

          <div className="mt-12 grid gap-8 lg:grid-cols-[8rem_minmax(0,1fr)] lg:items-start">
            <div className="hidden rounded-2xl border border-white/20 bg-white/5 p-5 text-center backdrop-blur lg:block">
              <span className="block text-4xl font-black tracking-[-0.06em]">{new Intl.DateTimeFormat("en-PH", { day: "2-digit", timeZone: "Asia/Manila" }).format(new Date(event.startDate))}</span>
              <span className="mx-auto my-3 block h-px w-10 bg-[#9b87f5]" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white/70">{new Intl.DateTimeFormat("en-PH", { month: "short", timeZone: "Asia/Manila" }).format(new Date(event.startDate))}</span>
            </div>
            <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#ddd5ff] px-3 py-1.5 text-sm font-black text-[#342075]">
              <Clock3
                className="h-4 w-4"
                aria-hidden="true"
              />
              {registrationDetails.label}
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[0.94] tracking-[-0.065em] sm:text-6xl lg:text-8xl">
              {event.title}
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/65">
              {event.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-white/70">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#b8a7ff]" />{formatDate(event.startDate)} – {formatDate(event.endDate)}</span>
              <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#b8a7ff]" />{event.venue.name}, {event.venue.city}</span>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              {event.registrationState === "open" && (
                <Link
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#6d4aff] px-7 font-black text-white shadow-[0_18px_45px_-18px_rgba(109,74,255,0.9)] transition hover:-translate-y-0.5 hover:bg-[#7c5cf0]"
                  to={token ? `/events/${event.slug}/register` : "/login"}
                  state={token ? undefined : { from: `/events/${event.slug}/register` }}
                >
                  {token ? (hasRegistration ? "Continue registration" : "Register for the summit") : "Sign in to register"}
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
              )}
              <a className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/20 px-7 font-bold text-white transition hover:border-white/50 hover:bg-white/5" href="#program">
                Explore the program
              </a>
            </div>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b border-[#ded8f2] bg-white/95 px-5 shadow-[0_10px_30px_-24px_rgba(18,17,39,0.5)] backdrop-blur sm:px-8" aria-label="Event sections">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-7 overflow-x-auto text-sm font-bold text-[#6f6a82]">
          <a className="shrink-0 transition hover:text-[#6d4aff]" href="#overview">Why attend</a>
          <a className="shrink-0 transition hover:text-[#6d4aff]" href="#program">Main stage</a>
          <a className="shrink-0 transition hover:text-[#6d4aff]" href="#breakouts">Breakout sessions</a>
          <a className="ml-auto hidden shrink-0 items-center gap-2 text-[#6d4aff] transition hover:text-[#45279f] sm:flex" href="#registration">Registration <ArrowRight className="h-4 w-4" /></a>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-20">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-10">
            <section className="scroll-mt-24" id="overview">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.5fr] lg:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-[#6d4aff]">Why this summit</p>
                  <h2 className="mt-4 text-4xl font-black leading-[0.98] tracking-[-0.055em] text-[#121127] sm:text-5xl">Two days to rethink how learning works.</h2>
                </div>
                <p className="text-lg leading-8 text-[#625d74]">Move beyond broad trends and into practical conversations about digital learning, responsible AI, accessibility, and experiences people can genuinely use.</p>
              </div>

              <div className="mt-10 grid overflow-hidden rounded-2xl border border-[#ded8f2] bg-white sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["02", "Focused days", "A purposeful two-day learning program"],
                  [String(event.plenarySessions.length).padStart(2, "0"), "Main-stage sessions", "A shared foundation for every attendee"],
                  [String(event.breakoutBlocks.reduce((total, block) => total + block.sessions.length, 0)).padStart(2, "0"), "Breakout choices", "Build a program around your priorities"],
                  [String(event.capacity), "Community seats", "Small enough for meaningful exchange"],
                ].map(([value, label, detail], index) => (
                  <article className={`p-6 sm:p-7 ${index > 0 ? "border-t border-[#ded8f2] sm:border-l sm:border-t-0" : ""}`} key={label}>
                    <p className="text-4xl font-black tracking-[-0.06em] text-[#6d4aff]">{value}</p>
                    <h3 className="mt-5 font-black text-[#121127]">{label}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#777187]">{detail}</p>
                  </article>
                ))}
              </div>

              <div className="mt-6 flex items-start gap-4 rounded-2xl bg-[#eeeaff] p-5 text-sm leading-6 text-[#45279f]">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p><strong>{event.venue.name}</strong><br />{event.venue.address}, {event.venue.city}, {event.venue.country}</p>
              </div>
            </section>

            <section className="scroll-mt-24 pt-8" id="program">
              <header className="grid gap-6 border-b border-[#ded8f2] pb-7 md:grid-cols-[1fr_2fr]">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                  Common sessions
                </p>

                <div><h2 className="mt-3 text-4xl font-black tracking-[-0.05em] text-slate-950">
                  The main stage
                </h2></div>

                <p className="self-end max-w-3xl leading-7 text-slate-600">
                  These sessions form the shared summit
                  experience and are required for all
                  registered participants.
                </p>
              </header>

              <div className="divide-y divide-[#ded8f2]">
                {event.plenarySessions.map(
                  (session, index) => (
                    <article
                      className="group relative grid gap-6 py-8 md:grid-cols-[5rem_minmax(0,1fr)_15rem] md:items-start"
                      key={session.id}
                    >
                      <div className="text-5xl font-black leading-none text-[#d8d0f5] transition group-hover:text-[#6d4aff]">
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="flex flex-col gap-5">
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
                            <CheckCircle2
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            Required plenary
                          </div>

                          <h3 className="relative mt-4 text-2xl font-black tracking-[-0.035em] text-slate-950">
                            {session.title}
                          </h3>

                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {session.description}
                          </p>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-900 md:hidden">
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

                      <div className="grid content-start gap-4 rounded-2xl bg-white p-5 shadow-[0_12px_40px_-24px_rgba(18,17,39,0.45)]">
                        <div className="hidden text-sm md:block"><p className="font-bold text-slate-950">{formatScheduleDate(session.startsAt)}</p><p className="mt-1 text-slate-600">{formatTime(session.startsAt)} – {formatTime(session.endsAt)}</p></div>
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

            <section className="scroll-mt-24 pt-8" id="breakouts">
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

              <div className="mt-8 grid gap-10">
                {event.breakoutBlocks.map(
                  (block) => (
                    <article
                      className="overflow-hidden rounded-2xl border border-[#ded8f2] bg-white shadow-[0_24px_70px_-48px_rgba(18,17,39,0.42)]"
                      key={block.id}
                    >
                      <header className="border-b border-[#ded8f2] bg-[#121127] p-6 text-white sm:p-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#b8a7ff]">
                              Choose{" "}
                              {block.minimumSelections}
                              {block.minimumSelections !==
                              block.maximumSelections
                                ? `–${block.maximumSelections}`
                                : ""}{" "}
                              session
                            </p>

                            <h3 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
                              {block.title}
                            </h3>

                            {block.description && (
                              <p className="mt-2 max-w-2xl leading-7 text-white/60">
                                {block.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/70">
                            <p className="font-bold text-white">
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

                      <div className="divide-y divide-[#e7e2f3] px-6 sm:px-8">
                        {block.sessions.map(
                          (session) => (
                            <section
                              className="group grid gap-5 py-7 md:grid-cols-[3.5rem_minmax(0,1fr)_15rem] md:items-start"
                              key={session.id}
                            >
                              <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-sm font-black text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                                    {String(session.displayOrder).padStart(2, "0")}
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <h4 className="text-xl font-black tracking-[-0.025em] text-slate-950">{session.title}</h4>
                                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-blue-700">{session.status}</span>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-slate-600">{session.description}</p>
                                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#777187]"><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-blue-600" />{session.room}</span><span className="flex items-center gap-1.5"><UsersRound className="h-3.5 w-3.5 text-blue-600" />{session.capacity} seats</span></div>
                              </div>
                              <div className="rounded-2xl bg-[#f7f5ff] p-4">
                                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8b869c]">Session lead</p>
                                {session.speakers.map((speaker) => (
                                  <div className="mt-3 flex items-start gap-3" key={`${session.id}-${speaker.name}`}>
                                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ddd5ff] text-xs font-black text-[#45279f]">{speaker.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
                                    <div><p className="text-sm font-bold text-slate-900">{speaker.name}</p>{(speaker.jobTitle || speaker.organization) && <p className="mt-1 text-xs leading-5 text-slate-600">{speaker.jobTitle}{speaker.jobTitle && speaker.organization ? ", " : ""}{speaker.organization}</p>}</div>
                                  </div>
                                ))}
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
            <section className="scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] xl:sticky xl:top-24" id="registration">
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

              {event.registrationState === "open" &&
                isLoadingRegistration && (
                  <div
                    className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600"
                    role="status"
                  >
                    <LoaderCircle
                      className="h-5 w-5 animate-spin text-blue-600"
                      aria-hidden="true"
                    />

                    Checking registration...
                  </div>
                )}

              {event.registrationState === "open" &&
                !isLoadingRegistration &&
                !token && (
                  <Link
                    className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300"
                    to="/login"
                    state={{
                      from: `/events/${event.slug}/register`,
                    }}
                  >
                    <LogIn
                      className="h-5 w-5"
                      aria-hidden="true"
                    />

                    Sign in to register
                  </Link>
                )}

              {event.registrationState === "open" &&
                !isLoadingRegistration &&
                token && (
                  <Link
                    className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300"
                    to={`/events/${event.slug}/register`}
                  >
                    {hasRegistration
                      ? "Continue registration"
                      : "Start registration"}

                    <ArrowRight
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </Link>
                )}

              {event.registrationState !== "open" && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-600">
                  {event.registrationState ===
                  "upcoming"
                    ? `Registration opens ${formatDate(
                        event.registrationPeriod
                          .opensAt,
                      )}.`
                    : "Registration is currently unavailable."}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
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
