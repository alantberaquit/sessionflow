import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleCheck,
  Clock3,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Presentation,
  Save,
  Send,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;

const formatScheduleDate = (dateValue) =>
  new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
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

const EventRegistrationPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const {
    token,
    user,
    endSession,
  } = useAuth();

  const [event, setEvent] = useState(null);
  const [registration, setRegistration] =
    useState(null);
  const [selections, setSelections] = useState({});
  const [isLoading, setIsLoading] =
    useState(true);
  const [isSaving, setIsSaving] =
    useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [isNotFound, setIsNotFound] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [statusMessage, setStatusMessage] =
    useState("");
  const [statusType, setStatusType] =
    useState("");

  const handleInvalidSession = useCallback(() => {
    endSession();

    navigate("/login", {
      replace: true,
      state: {
        from: `/events/${slug}/register`,
      },
    });
  }, [endSession, navigate, slug]);

  useEffect(() => {
    const abortController = new AbortController();

    const loadRegistrationPage = async () => {
      if (!API_URL || !token) {
        setErrorMessage(
          "The registration page cannot be loaded because the application configuration is incomplete.",
        );
        setIsLoading(false);

        return;
      }

      try {
        const [
          eventResponse,
          registrationResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/events/${encodeURIComponent(
              slug,
            )}`,
            {
              method: "GET",
              signal: abortController.signal,
            },
          ),

          fetch(
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
          ),
        ]);

        const [
          eventResponseData,
          registrationResponseData,
        ] = await Promise.all([
          eventResponse.json(),
          registrationResponse.json(),
        ]);

        if (registrationResponse.status === 401) {
          if (!abortController.signal.aborted) {
            handleInvalidSession();
          }

          return;
        }

        if (
          eventResponse.status === 404 ||
          registrationResponse.status === 404
        ) {
          if (!abortController.signal.aborted) {
            setIsNotFound(true);
          }

          return;
        }

        if (!eventResponse.ok) {
          throw new Error(
            eventResponseData.message ||
              "Unable to retrieve the event.",
          );
        }

        if (!registrationResponse.ok) {
          throw new Error(
            registrationResponseData.message ||
              "Unable to retrieve your registration.",
          );
        }

        if (abortController.signal.aborted) {
          return;
        }

        setEvent(eventResponseData.event);

        setRegistration(
          registrationResponseData.registration,
        );

        const restoredSelections = {};

        const savedSelections =
          registrationResponseData.registration
            ?.breakoutSelections || [];

        savedSelections.forEach((selection) => {
          restoredSelections[
            selection.breakoutBlock
          ] = selection.breakoutSession;
        });

        setSelections(restoredSelections);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error(
          "Unable to load event registration:",
        );
        console.error(error.message);

        setErrorMessage(
          "Unable to load the registration page right now. Please try again.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadRegistrationPage();

    return () => {
      abortController.abort();
    };
  }, [handleInvalidSession, slug, token]);

  const selectedCount = useMemo(
    () => Object.keys(selections).length,
    [selections],
  );

  const totalBlocks =
    event?.breakoutBlocks?.length || 0;

  const allBlocksSelected =
    totalBlocks > 0 &&
    selectedCount === totalBlocks;

  const isSubmitted =
    registration?.status === "pending-payment" ||
    registration?.status === "confirmed";

  const isInteractionLocked =
    isSaving ||
    isSubmitting ||
    isSubmitted;

  const handleSelectionChange = (
    breakoutBlockId,
    breakoutSessionId,
  ) => {
    if (isSubmitted) {
      return;
    }

    setSelections((currentSelections) => ({
      ...currentSelections,
      [breakoutBlockId]: breakoutSessionId,
    }));

    setStatusMessage("");
    setStatusType("");
  };

  const buildBreakoutSelections = () =>
    Object.entries(selections).map(
      ([
        breakoutBlock,
        breakoutSession,
      ]) => ({
        breakoutBlock,
        breakoutSession,
      }),
    );

  const handleSaveDraft = async () => {
    if (isSaving || isSubmitting || isSubmitted) {
      return;
    }

    if (!API_URL || !token) {
      setStatusType("error");
      setStatusMessage(
        "The registration API configuration is missing.",
      );

      return;
    }

    setIsSaving(true);
    setStatusMessage("");
    setStatusType("");

    try {
      const response = await fetch(
        `${API_URL}/api/events/${encodeURIComponent(
          slug,
        )}/registration`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            breakoutSelections:
              buildBreakoutSelections(),
          }),
        },
      );

      const responseData = await response.json();

      if (response.status === 401) {
        handleInvalidSession();

        return;
      }

      if (
        response.status === 403 &&
        responseData.code ===
          "PROFILE_INCOMPLETE"
      ) {
        navigate("/profile", {
          replace: true,
          state: {
            message:
              "Complete your participant profile before registering for an event.",
            returnTo: `/events/${slug}/register`,
          },
        });

        return;
      }

      if (!response.ok) {
        setStatusType("error");
        setStatusMessage(
          responseData.errors
            ?.breakoutSelections ||
            responseData.message ||
            "Unable to save your registration draft.",
        );

        return;
      }

      setRegistration(responseData.registration);
      setStatusType("success");
      setStatusMessage(responseData.message);
    } catch (error) {
      console.error(
        "Unable to save registration draft:",
      );
      console.error(error.message);

      setStatusType("error");
      setStatusMessage(
        "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitRegistration = async () => {
    if (
      isSaving ||
      isSubmitting ||
      isSubmitted
    ) {
      return;
    }

    if (!allBlocksSelected) {
      setStatusType("error");
      setStatusMessage(
        "Select one session from every breakout block before submitting.",
      );

      return;
    }

    if (!API_URL || !token) {
      setStatusType("error");
      setStatusMessage(
        "The registration API configuration is missing.",
      );

      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");
    setStatusType("");

    try {
      const draftResponse = await fetch(
        `${API_URL}/api/events/${encodeURIComponent(
          slug,
        )}/registration`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            breakoutSelections:
              buildBreakoutSelections(),
          }),
        },
      );

      const draftResponseData =
        await draftResponse.json();

      if (draftResponse.status === 401) {
        handleInvalidSession();

        return;
      }

      if (
        draftResponse.status === 403 &&
        draftResponseData.code ===
          "PROFILE_INCOMPLETE"
      ) {
        navigate("/profile", {
          replace: true,
          state: {
            message:
              "Complete your participant profile before submitting your registration.",
            returnTo: `/events/${slug}/register`,
          },
        });

        return;
      }

      if (!draftResponse.ok) {
        setStatusType("error");
        setStatusMessage(
          draftResponseData.errors
            ?.breakoutSelections ||
            draftResponseData.message ||
            "Unable to save your final breakout selections.",
        );

        return;
      }

      const submitResponse = await fetch(
        `${API_URL}/api/events/${encodeURIComponent(
          slug,
        )}/registration/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const submitResponseData =
        await submitResponse.json();

      if (submitResponse.status === 401) {
        handleInvalidSession();

        return;
      }

      if (
        submitResponse.status === 403 &&
        submitResponseData.code ===
          "PROFILE_INCOMPLETE"
      ) {
        navigate("/profile", {
          replace: true,
          state: {
            message:
              "Complete your participant profile before submitting your registration.",
            returnTo: `/events/${slug}/register`,
          },
        });

        return;
      }

      if (!submitResponse.ok) {
        setStatusType("error");
        setStatusMessage(
          submitResponseData.errors
            ?.breakoutSelections ||
            submitResponseData.message ||
            "Unable to submit your registration.",
        );

        return;
      }

      setRegistration(
        submitResponseData.registration,
      );

      navigate(
        `/events/${encodeURIComponent(
          slug,
        )}/payment`,
        {
          replace: true,
          state: {
            message:
              "Registration submitted successfully. Complete your payment to confirm your place.",
          },
        },
      );
    } catch (error) {
      console.error(
        "Unable to submit registration:",
      );
      console.error(error.message);

      setStatusType("error");
      setStatusMessage(
        "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
            Loading your registration...
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
            This event may no longer be published or
            available for registration.
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
          <AlertCircle
            className="mx-auto h-10 w-10 text-red-700"
            aria-hidden="true"
          />

          <h1 className="mt-5 text-3xl font-bold text-red-950">
            Registration could not be loaded
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

  return (
    <main className="min-h-screen bg-[#f4f1ff]">
      <header className="relative overflow-hidden bg-gradient-to-br from-[#f8f6ff] via-[#eee9ff] to-[#d9d1ff] px-5 pb-20 text-slate-950 sm:px-8 sm:pb-24">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[30rem] w-[30rem] rounded-full bg-blue-400/30 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl">
          <Link
            className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:text-blue-900"
            to={`/events/${event.slug}`}
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            Back to event details
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
              Participant registration
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">
              Build your event schedule
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Your plenary program is included automatically. Choose one experience from every breakout block to complete your schedule.
            </p>
          </div>
        </div>
      </header>

      <section className="relative mx-auto -mt-8 max-w-6xl px-5 pb-16 sm:-mt-10 sm:px-8 sm:pb-20">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div>
            <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)] sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
                    Registration for
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                    {event.title}
                  </h2>
                </div>

                <div className="flex min-w-0 max-w-full items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3 sm:max-w-sm">
                  <UserRoundCheck
                    className="h-6 w-6 text-blue-600"
                    aria-hidden="true"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-950">
                      {user.name}
                    </p>

                    <p className="truncate text-xs text-slate-600">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CalendarDays
                    className="mt-0.5 h-5 w-5 shrink-0 text-blue-600"
                    aria-hidden="true"
                  />

                  <div>
                    <p className="font-bold text-slate-950">
                      Event begins
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {formatScheduleDate(
                        event.startDate,
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
                      Venue
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {event.venue.name},{" "}
                      {event.venue.city}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {event.plenarySessions?.length > 0 && (
              <section className="mt-7 rounded-[2rem] border border-blue-200 bg-blue-50/70 p-6 sm:p-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
                      Included in your registration
                    </p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      Plenary program
                    </h2>
                  </div>
                  <span className="w-fit shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-blue-800 shadow-sm">
                    No selection required
                  </span>
                </div>

                <div className="mt-6 grid gap-3 lg:grid-cols-3">
                  {event.plenarySessions.map((session, index) => (
                    <article
                      className="grid gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
                      key={session.id}
                    >
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 font-black text-blue-800">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="font-bold text-slate-950">{session.title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{session.room}</p>
                      </div>
                      <div className="border-t border-slate-100 pt-3 text-sm">
                        <p className="font-bold text-slate-900">{formatScheduleDate(session.startsAt)}</p>
                        <p className="mt-1 text-slate-600">{formatTime(session.startsAt)} – {formatTime(session.endsAt)}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {statusMessage && (
              <div
                className={`mt-6 flex items-start gap-3 rounded-2xl border px-5 py-4 ${
                  statusType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
                role={
                  statusType === "success"
                    ? "status"
                    : "alert"
                }
              >
                {statusType === "success" ? (
                  <CircleCheck
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />
                )}

                <span>{statusMessage}</span>
              </div>
            )}

            {isSubmitted && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-blue-900">
                <LockKeyhole
                  className="mt-0.5 h-5 w-5 shrink-0 text-blue-700"
                  aria-hidden="true"
                />

                <div>
                  <p className="font-bold">
                    Registration submitted
                  </p>

                  <p className="mt-1 text-sm leading-6">
                    Your selections are saved. Continue to
                    payment now, or manage your registration
                    from the dashboard.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-10 grid gap-10">
              {event.breakoutBlocks.map((block) => {
                const selectedSessionId =
                  selections[block.id];

                return (
                  <article
                    className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.4)]"
                    key={block.id}
                  >
                    <header className="border-b border-slate-200 bg-[#fbfaf8] p-6 sm:p-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                            Select one session
                          </p>

                          <h2 className="mt-2 text-2xl font-bold text-slate-950">
                            {block.title}
                          </h2>

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
                            – {formatTime(block.endsAt)}
                          </p>
                        </div>
                      </div>
                    </header>

                    <fieldset
                      className="grid gap-3 p-6 sm:p-7"
                      disabled={isInteractionLocked}
                    >
                      <legend className="sr-only">
                        Select one session for{" "}
                        {block.title}
                      </legend>

                      {block.sessions.map(
                        (session) => {
                          const isSelected =
                            selectedSessionId ===
                            session.id;

                          const isUnavailable = [
                            "full",
                            "closed",
                            "cancelled",
                          ].includes(session.status);

                          return (
                            <label
                              className={`relative flex rounded-2xl border p-4 transition duration-200 sm:p-5 ${
                                isUnavailable
                                  ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
                                  : isSelected
                                    ? "cursor-pointer border-blue-600 bg-blue-50 ring-4 ring-blue-100 shadow-md"
                                    : isSubmitted
                                      ? "cursor-not-allowed border-slate-200 bg-white opacity-70"
                                      : "cursor-pointer border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                              }`}
                              key={session.id}
                            >
                              <div className="flex w-full items-start gap-4">
                                <input
                                  className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
                                  type="radio"
                                  name={`block-${block.id}`}
                                  value={session.id}
                                  checked={isSelected}
                                  disabled={
                                    isInteractionLocked ||
                                    isUnavailable
                                  }
                                  onChange={() =>
                                    handleSelectionChange(
                                      block.id,
                                      session.id,
                                    )
                                  }
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700">
                                        <Presentation
                                          className="h-4 w-4"
                                          aria-hidden="true"
                                        />
                                        Breakout option{" "}
                                        {
                                          session.displayOrder
                                        }
                                      </div>

                                      <h3 className="mt-2 text-xl font-bold text-slate-950">
                                        {session.title}
                                      </h3>
                                    </div>

                                    <span
                                      className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide ${
                                        session.status ===
                                        "available"
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-slate-200 text-slate-600"
                                      }`}
                                    >
                                      {session.status}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {session.description}
                                  </p>

                                  <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
                                    <div className="flex items-start gap-2">
                                      <MapPin
                                        className="mt-0.5 h-4 w-4 text-blue-600"
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
                                        className="mt-0.5 h-4 w-4 text-blue-600"
                                        aria-hidden="true"
                                      />

                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                          Seats
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                          {
                                            session.capacity
                                          }{" "}
                                          participants
                                        </p>
                                      </div>
                                    </div>

                                    <div>
                                      <p className="text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">
                                        Led by
                                      </p>

                                      {session.speakers.map(
                                        (speaker) => (
                                          <div
                                            className="mt-1 text-sm"
                                            key={`${session.id}-${speaker.name}`}
                                          >
                                            <p className="font-semibold text-slate-800">
                                              {
                                                speaker.name
                                              }
                                            </p>

                                            <p className="text-slate-600">
                                              {
                                                speaker.organization
                                              }
                                            </p>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        },
                      )}
                    </fieldset>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="grid content-start gap-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.35)]">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                Registration progress
              </p>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-bold text-slate-950">
                  {selectedCount}
                </span>

                <span className="pb-1 text-slate-600">
                  of {totalBlocks} blocks selected
                </span>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{
                    width:
                      totalBlocks > 0
                        ? `${Math.min(
                            100,
                            (selectedCount /
                              totalBlocks) *
                              100,
                          )}%`
                        : "0%",
                  }}
                />
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {allBlocksSelected
                  ? "All breakout blocks have a selected session."
                  : "Select one session from every block before submitting."}
              </p>

              {!isSubmitted && (
                <>
                  <button
                    className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-3 font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                    type="button"
                    disabled={
                      isSaving || isSubmitting
                    }
                    onClick={handleSaveDraft}
                  >
                    {isSaving ? (
                      <>
                        <LoaderCircle
                          className="h-5 w-5 animate-spin"
                          aria-hidden="true"
                        />
                        Saving draft...
                      </>
                    ) : (
                      <>
                        <Save
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                        Save registration draft
                      </>
                    )}
                  </button>

                  <button
                    className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-800 px-5 py-3 font-bold text-white shadow-lg shadow-blue-950/15 transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    disabled={
                      !allBlocksSelected ||
                      isSaving ||
                      isSubmitting
                    }
                    onClick={
                      handleSubmitRegistration
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle
                          className="h-5 w-5 animate-spin"
                          aria-hidden="true"
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                        Submit registration
                      </>
                    )}
                  </button>
                </>
              )}

              {isSubmitted && (
                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <CreditCard
                      className="mt-0.5 h-6 w-6 shrink-0 text-blue-700"
                      aria-hidden="true"
                    />

                    <div>
                      <p className="font-bold text-blue-950">
                        Payment pending
                      </p>

                      <p className="mt-1 text-sm leading-6 text-blue-800">
                        Your registration is ready for
                        payment. Continue now to confirm
                        your place.
                      </p>
                    </div>
                  </div>

                  <button
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2 font-bold text-white transition hover:bg-blue-700"
                    type="button"
                    onClick={() =>
                      navigate(
                        `/events/${encodeURIComponent(
                          slug,
                        )}/payment`,
                      )
                    }
                  >
                    <CreditCard
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    Continue to payment
                  </button>
                </div>
              )}
            </section>

            <section
              className={`rounded-3xl border p-6 ${
                isSubmitted
                  ? "border-blue-200 bg-blue-50"
                  : registration
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex items-start gap-3">
                {isSubmitted ? (
                  <CheckCircle2
                    className="mt-0.5 h-6 w-6 shrink-0 text-blue-700"
                    aria-hidden="true"
                  />
                ) : registration ? (
                  <CheckCircle2
                    className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                ) : (
                  <Clock3
                    className="mt-0.5 h-6 w-6 shrink-0 text-amber-700"
                    aria-hidden="true"
                  />
                )}

                <div>
                  <h2
                    className={`font-bold ${
                      isSubmitted
                        ? "text-blue-950"
                        : registration
                          ? "text-emerald-950"
                          : "text-amber-950"
                    }`}
                  >
                    {isSubmitted
                      ? "Registration submitted"
                      : registration
                        ? "Draft saved"
                        : "Draft not saved yet"}
                  </h2>

                  <p
                    className={`mt-2 text-sm leading-6 ${
                      isSubmitted
                        ? "text-blue-800"
                        : registration
                          ? "text-emerald-800"
                          : "text-amber-800"
                    }`}
                  >
                    {isSubmitted
                      ? "Your selections are saved. You can edit them from your dashboard while payment is pending."
                      : registration
                        ? "Your current choices are stored and will be restored when you return."
                        : "Select sessions and save your draft to keep your progress."}
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default EventRegistrationPage;
