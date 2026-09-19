import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  Presentation,
  Save,
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

const formatScheduleDate = (dateValue) => {
  if (!dateValue) {
    return "Schedule unavailable";
  }

  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));
};

const formatTime = (dateValue) => {
  if (!dateValue) {
    return "Time unavailable";
  }

  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));
};

const EditBreakoutSelectionsPage = () => {
  const { registrationId } = useParams();
  const navigate = useNavigate();

  const {
    token,
    user,
    endSession,
  } = useAuth();

  const [registration, setRegistration] =
    useState(null);

  const [event, setEvent] = useState(null);

  const [selections, setSelections] =
    useState({});

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [isNotFound, setIsNotFound] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [statusMessage, setStatusMessage] =
    useState("");

  const [statusType, setStatusType] =
    useState("");

  const handleInvalidSession =
    useCallback(() => {
      endSession();

      navigate("/login", {
        replace: true,
        state: {
          from: `/dashboard/registrations/${registrationId}/edit-breakout-selections`,
        },
      });
    }, [
      endSession,
      navigate,
      registrationId,
    ]);

  useEffect(() => {
    const abortController =
      new AbortController();

    const loadEditingPage = async () => {
      if (
        !API_URL ||
        !token ||
        !registrationId
      ) {
        setErrorMessage(
          "The breakout-selection editor cannot be loaded because the application configuration is incomplete.",
        );

        setIsLoading(false);

        return;
      }

      try {
        const registrationsResponse =
          await fetch(
            `${API_URL}/api/profile/registrations`,
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              signal:
                abortController.signal,
            },
          );

        const registrationsResponseData =
          await registrationsResponse.json();

        if (
          registrationsResponse.status ===
          401
        ) {
          if (
            !abortController.signal.aborted
          ) {
            handleInvalidSession();
          }

          return;
        }

        if (!registrationsResponse.ok) {
          throw new Error(
            registrationsResponseData.message ||
              "Unable to retrieve your registrations.",
          );
        }

        const matchingRegistration =
          (
            registrationsResponseData.registrations ||
            []
          ).find(
            (item) =>
              item.id === registrationId,
          );

        if (!matchingRegistration) {
          if (
            !abortController.signal.aborted
          ) {
            setIsNotFound(true);
          }

          return;
        }

        if (
          !matchingRegistration
            .canEditBreakoutSelections
        ) {
          if (
            !abortController.signal.aborted
          ) {
            setRegistration(
              matchingRegistration,
            );

            setErrorMessage(
              matchingRegistration
                .editRestrictionReason ||
                "This registration can no longer be edited.",
            );
          }

          return;
        }

        const eventSlug =
          matchingRegistration.event?.slug;

        if (!eventSlug) {
          throw new Error(
            "The event connected to this registration is unavailable.",
          );
        }

        const eventResponse = await fetch(
          `${API_URL}/api/events/${encodeURIComponent(
            eventSlug,
          )}`,
          {
            method: "GET",
            signal:
              abortController.signal,
          },
        );

        const eventResponseData =
          await eventResponse.json();

        if (eventResponse.status === 404) {
          if (
            !abortController.signal.aborted
          ) {
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

        if (
          abortController.signal.aborted
        ) {
          return;
        }

        const restoredSelections = {};

        (
          matchingRegistration
            .breakoutSelections || []
        ).forEach((selection) => {
          const blockId =
            selection.breakoutBlock?.id;

          const sessionId =
            selection.breakoutSession?.id;

          if (blockId && sessionId) {
            restoredSelections[blockId] =
              sessionId;
          }
        });

        setRegistration(
          matchingRegistration,
        );

        setEvent(
          eventResponseData.event,
        );

        setSelections(
          restoredSelections,
        );
      } catch (error) {
        if (
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Unable to load breakout-selection editor:",
        );

        console.error(error.message);

        setErrorMessage(
          error.message ||
            "Unable to load the breakout-selection editor.",
        );
      } finally {
        if (
          !abortController.signal.aborted
        ) {
          setIsLoading(false);
        }
      }
    };

    loadEditingPage();

    return () => {
      abortController.abort();
    };
  }, [
    handleInvalidSession,
    registrationId,
    token,
  ]);

  const selectedCount = useMemo(
    () =>
      Object.keys(selections).length,
    [selections],
  );

  const totalBlocks =
    event?.breakoutBlocks?.length || 0;

  const allBlocksSelected =
    totalBlocks > 0 &&
    selectedCount === totalBlocks;

  const handleSelectionChange = (
    breakoutBlockId,
    breakoutSessionId,
  ) => {
    if (isSaving) {
      return;
    }

    setSelections(
      (currentSelections) => ({
        ...currentSelections,
        [breakoutBlockId]:
          breakoutSessionId,
      }),
    );

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

  const handleSaveChanges = async () => {
    if (
      isSaving ||
      !registration ||
      !allBlocksSelected
    ) {
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
        `${API_URL}/api/profile/registrations/${encodeURIComponent(
          registration.id,
        )}/breakout-selections`,
        {
          method: "PUT",
          headers: {
            Authorization:
              `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            breakoutSelections:
              buildBreakoutSelections(),
          }),
        },
      );

      const responseData =
        await response.json();

      if (response.status === 401) {
        handleInvalidSession();

        return;
      }

      if (!response.ok) {
        setStatusType("error");

        setStatusMessage(
          responseData.errors
            ?.breakoutSelections ||
            responseData
              .editRestrictionReason ||
            responseData.message ||
            "Unable to update your breakout selections.",
        );

        if (
          responseData
            .canEditBreakoutSelections ===
          false
        ) {
          setRegistration(
            (currentRegistration) => ({
              ...currentRegistration,
              canEditBreakoutSelections:
                false,
              editRestrictionReason:
                responseData
                  .editRestrictionReason,
            }),
          );
        }

        return;
      }

      setRegistration(
        (currentRegistration) => ({
          ...currentRegistration,
          ...responseData.registration,
          canEditBreakoutSelections:
            responseData
              .canEditBreakoutSelections,
          editRestrictionReason:
            responseData
              .editRestrictionReason,
        }),
      );

      setStatusType("success");

      setStatusMessage(
        responseData.message,
      );
    } catch (error) {
      console.error(
        "Unable to update breakout selections:",
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
            Loading your breakout
            selections...
          </span>
        </div>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-100 px-5 py-12">
        <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60 sm:p-10">
          <AlertCircle
            className="mx-auto h-10 w-10 text-amber-600"
            aria-hidden="true"
          />

          <h1 className="mt-5 text-3xl font-bold text-slate-950">
            Registration not found
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            The requested registration may
            not exist or may belong to a
            different participant.
          </p>

          <Link
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
            to="/dashboard"
          >
            <ArrowLeft
              className="h-5 w-5"
              aria-hidden="true"
            />

            Return to dashboard
          </Link>
        </section>
      </main>
    );
  }

  if (
    errorMessage ||
    !registration ||
    !event
  ) {
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
            Selections cannot be edited
          </h1>

          <p className="mt-3 leading-7 text-red-700">
            {errorMessage}
          </p>

          <Link
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-bold text-white transition hover:bg-red-800"
            to="/dashboard"
          >
            <ArrowLeft
              className="h-5 w-5"
              aria-hidden="true"
            />

            Return to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-500 px-5 py-10 text-white sm:px-8 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-blue-200 transition hover:text-white"
            to="/dashboard"
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />

            Back to dashboard
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">
              Registration management
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Edit breakout selections
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              Update one session for each
              breakout block, then save your
              changes.
            </p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                Registered event
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                {event.title}
              </h2>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm">
              <p className="font-bold text-slate-950">
                {user?.name}
              </p>

              <p className="mt-1 text-slate-600">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <CalendarDays
                className="mt-0.5 h-5 w-5 text-blue-600"
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
                className="mt-0.5 h-5 w-5 text-blue-600"
                aria-hidden="true"
              />

              <div>
                <p className="font-bold text-slate-950">
                  Venue
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {event.venue?.name},{" "}
                  {event.venue?.city}
                </p>
              </div>
            </div>
          </div>
        </section>

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
              <CheckCircle2
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-8">
            {event.breakoutBlocks.map(
              (block) => {
                const selectedSessionId =
                  selections[block.id];

                return (
                  <article
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50"
                    key={block.id}
                  >
                    <header className="border-b border-slate-200 bg-slate-50 p-6 sm:p-7">
                      <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
                        Select one session
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-slate-950">
                        {block.title}
                      </h2>

                      <p className="mt-2 text-slate-600">
                        {formatScheduleDate(
                          block.startsAt,
                        )}
                        {" · "}
                        {formatTime(
                          block.startsAt,
                        )}
                        {" – "}
                        {formatTime(
                          block.endsAt,
                        )}
                      </p>
                    </header>

                    <fieldset
                      className="grid gap-4 p-6 sm:p-7"
                      disabled={isSaving}
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

                          const isUnavailable =
                            [
                              "full",
                              "closed",
                              "cancelled",
                            ].includes(
                              session.status,
                            );

                          return (
                            <label
                              className={`block rounded-2xl border p-5 transition ${
                                isUnavailable
                                  ? "cursor-not-allowed border-slate-200 bg-slate-100 opacity-70"
                                  : isSelected
                                    ? "cursor-pointer border-blue-600 bg-blue-50 ring-4 ring-blue-100"
                                    : "cursor-pointer border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                              }`}
                              key={session.id}
                            >
                              <div className="flex items-start gap-4">
                                <input
                                  className="mt-1 h-5 w-5 shrink-0 accent-blue-600"
                                  type="radio"
                                  name={`block-${block.id}`}
                                  value={session.id}
                                  checked={
                                    isSelected
                                  }
                                  disabled={
                                    isSaving ||
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
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <div className="flex items-center gap-2 text-sm font-bold text-blue-700">
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
                                        {
                                          session.title
                                        }
                                      </h3>
                                    </div>

                                    <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                                      {
                                        session.status
                                      }
                                    </span>
                                  </div>

                                  <p className="mt-3 leading-7 text-slate-600">
                                    {
                                      session.description
                                    }
                                  </p>

                                  <div className="mt-5 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                                    <div>
                                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                        Room
                                      </p>

                                      <p className="mt-1 text-sm font-semibold text-slate-800">
                                        {
                                          session.room
                                        }
                                      </p>
                                    </div>

                                    <div className="flex items-start gap-2">
                                      <UsersRound
                                        className="mt-0.5 h-4 w-4 text-blue-600"
                                        aria-hidden="true"
                                      />

                                      <div>
                                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                          Capacity
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                          {
                                            session.capacity
                                          }{" "}
                                          participants
                                        </p>
                                      </div>
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
              },
            )}
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                Selection progress
              </p>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-bold text-slate-950">
                  {selectedCount}
                </span>

                <span className="pb-1 text-slate-600">
                  of {totalBlocks} selected
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {allBlocksSelected
                  ? "All breakout blocks have a selected session."
                  : "Select one session from every breakout block."}
              </p>

              <button
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                type="button"
                disabled={
                  !allBlocksSelected ||
                  isSaving
                }
                onClick={
                  handleSaveChanges
                }
              >
                {isSaving ? (
                  <>
                    <LoaderCircle
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />

                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save
                      className="h-5 w-5"
                      aria-hidden="true"
                    />

                    Save changes
                  </>
                )}
              </button>

              <Link
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
                to="/dashboard"
              >
                Cancel
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default EditBreakoutSelectionsPage;
