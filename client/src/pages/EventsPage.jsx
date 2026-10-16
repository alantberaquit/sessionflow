import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Check,
  LoaderCircle,
  MapPin,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  }).format(new Date(dateValue));

const getDateParts = (dateValue) => {
  const date = new Date(dateValue);

  return {
    day: new Intl.DateTimeFormat("en-PH", { day: "2-digit", timeZone: "Asia/Manila" }).format(date),
    month: new Intl.DateTimeFormat("en-PH", { month: "short", timeZone: "Asia/Manila" }).format(date),
    year: new Intl.DateTimeFormat("en-PH", { year: "numeric", timeZone: "Asia/Manila" }).format(date),
  };
};

const getRegistrationDetails = (state) => {
  if (state === "open") return { label: "Registration open", accent: "bg-[#ddd5ff] text-[#342075]" };
  if (state === "upcoming") return { label: "Opening soon", accent: "bg-amber-200 text-amber-950" };
  return { label: "Registration closed", accent: "bg-[#e9e5f5] text-[#625d74]" };
};

const EventsPage = () => {
  const { isAuthenticated, isCheckingSession, user } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadEvents = async () => {
      if (!API_URL) {
        setErrorMessage("The events API configuration is missing.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/events`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to retrieve events.");
        if (!controller.signal.aborted) setEvents(Array.isArray(data.events) ? data.events : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Unable to load events:", error.message);
          setErrorMessage("Unable to load events right now. Please try again.");
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };

    loadEvents();
    return () => controller.abort();
  }, []);

  const featuredEvent = events[0];
  const featuredDate = featuredEvent ? getDateParts(featuredEvent.startDate) : null;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f5ff] text-[#121127]">
      <header className="relative isolate min-h-[760px] overflow-hidden bg-[#121127] px-5 text-white sm:px-8">
        <div className="event-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-44 top-20 h-[34rem] w-[34rem] rounded-full bg-[#6d4aff]/40 blur-[110px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-64 left-1/3 h-[32rem] w-[32rem] rounded-full bg-[#8c74ff]/15 blur-[100px]" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl">
          <nav className="flex min-h-24 items-center justify-between gap-4 border-b border-white/10" aria-label="Primary navigation">
            <Link className="inline-flex items-center gap-3 text-xl font-black tracking-[-0.04em]" to="/events">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#6d4aff] shadow-[0_0_35px_rgba(109,74,255,0.55)]">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              Conferia<span className="text-[#9b87f5]">.</span>
            </Link>

            <div className="hidden items-center gap-8 text-sm font-bold text-white/70 md:flex">
              <a className="transition hover:text-white" href="#events">Events</a>
              <a className="transition hover:text-white" href="#why-conferia">Why attend</a>
              <a className="transition hover:text-white" href="#about">About</a>
            </div>

            {!isCheckingSession && (
              <div className="flex items-center gap-2">
                {isAuthenticated ? (
                  <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-black text-[#121127] transition hover:bg-[#eeeaff]" to="/dashboard">
                    {user?.firstName ? `${user.firstName}'s dashboard` : "Dashboard"}
                  </Link>
                ) : (
                  <>
                    <Link className="hidden min-h-11 items-center px-4 text-sm font-bold text-white/80 transition hover:text-white sm:inline-flex" to="/login">Sign in</Link>
                    <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#6d4aff] px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-[#7f61ff]" to="/register">Join Conferia</Link>
                  </>
                )}
              </div>
            )}
          </nav>

          <div className="grid min-h-[650px] items-center gap-10 py-16 lg:grid-cols-[9rem_minmax(0,1fr)_21rem] lg:py-20">
            <div className="hidden self-center rounded-2xl border border-white/20 bg-white/[0.04] px-5 py-7 text-center backdrop-blur lg:block">
              <span className="block text-5xl font-black leading-none tracking-[-0.07em]">{featuredDate?.day || "—"}</span>
              <span className="mx-auto my-4 block h-px w-12 bg-[#9b87f5]" />
              <span className="block text-sm font-black uppercase tracking-[0.22em] text-white/70">{featuredDate?.month || "Soon"}</span>
              <span className="mt-1 block text-sm font-bold text-white/40">{featuredDate?.year || ""}</span>
            </div>

            <div>
              <div className="mb-7 flex items-center gap-3 text-xs font-black uppercase tracking-[0.26em] text-[#b8a7ff]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Ideas worth gathering for
              </div>
              <h1 className="max-w-4xl text-[clamp(3.4rem,8vw,7.5rem)] font-black leading-[0.86] tracking-[-0.075em]">
                Meet the minds <span className="text-[#8c74ff]">moving</span> tomorrow.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/65 sm:text-xl">
                Discover focused conferences where ambitious people exchange practical ideas, build lasting connections, and turn insight into action.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a className="inline-flex min-h-14 items-center gap-3 rounded-xl bg-[#6d4aff] px-7 font-black text-white shadow-[0_16px_45px_-16px_rgba(109,74,255,0.8)] transition hover:-translate-y-0.5 hover:bg-[#7f61ff]" href="#events">
                  Explore events <ArrowDown className="h-5 w-5" aria-hidden="true" />
                </a>
                {!isAuthenticated && (
                  <Link className="inline-flex min-h-14 items-center gap-3 rounded-xl border border-white/25 px-7 font-bold text-white transition hover:border-white hover:bg-white/5" to="/register">
                    Create an account <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>

            <aside className="relative hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] p-7 backdrop-blur-xl lg:block">
              <div className="absolute right-0 top-0 h-28 w-28 rounded-bl-full bg-[#6d4aff]/50" aria-hidden="true" />
              <p className="relative text-xs font-black uppercase tracking-[0.2em] text-[#c4b5fd]">Next on the calendar</p>
              <h2 className="relative mt-4 text-2xl font-black leading-tight tracking-[-0.04em]">{featuredEvent?.title || "New experiences are coming"}</h2>
              {featuredEvent && (
                <div className="relative mt-8 space-y-4 border-t border-white/10 pt-6 text-sm text-white/70">
                  <p className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#b8a7ff]" />{formatDate(featuredEvent.startDate)}</p>
                  <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#b8a7ff]" />{featuredEvent.venue.name}, {featuredEvent.venue.city}</p>
                  <Link className="mt-5 inline-flex items-center gap-2 font-black text-white hover:text-[#c4b5fd]" to={`/events/${featuredEvent.slug}`}>View event <ArrowRight className="h-4 w-4" /></Link>
                </div>
              )}
            </aside>
          </div>
        </div>
      </header>

      <section className="border-b border-[#ded8f2] bg-white" id="about">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-8 md:grid-cols-[1fr_2fr] md:items-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6d4aff]">A better way to gather</p>
          <p className="text-2xl font-bold leading-snug tracking-[-0.035em] text-[#27243d] sm:text-3xl">
            Conferia brings the full event journey into one clear experience—from discovery and registration to session selection and attendance.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28" id="events">
        <div className="grid gap-8 border-b border-[#ded8f2] pb-10 md:grid-cols-[1fr_2fr] md:items-end">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6d4aff]">Upcoming program</p>
          <div className="flex items-end justify-between gap-6">
            <h2 className="text-4xl font-black leading-none tracking-[-0.06em] sm:text-6xl">Choose your next room.</h2>
            {!isLoading && !errorMessage && <span className="hidden shrink-0 text-sm font-bold text-[#6f6a82] sm:block">{events.length} live {events.length === 1 ? "event" : "events"}</span>}
          </div>
        </div>

        {isLoading && <div className="grid min-h-72 place-items-center" role="status"><span className="flex items-center gap-3 font-bold text-[#6f6a82]"><LoaderCircle className="h-6 w-6 animate-spin text-[#6d4aff]" />Loading the program...</span></div>}

        {!isLoading && errorMessage && <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800" role="alert"><AlertCircle className="mx-auto h-7 w-7" /><h2 className="mt-4 text-xl font-black">Events could not be loaded</h2><p className="mt-2">{errorMessage}</p></div>}

        {!isLoading && !errorMessage && events.length === 0 && <div className="mt-10 rounded-2xl border border-[#ded8f2] bg-white p-12 text-center"><CalendarDays className="mx-auto h-8 w-8 text-[#6d4aff]" /><h2 className="mt-4 text-2xl font-black">The next program is taking shape</h2><p className="mt-2 text-[#6f6a82]">Published events will appear here.</p></div>}

        {!isLoading && !errorMessage && events.length > 0 && (
          <div className="divide-y divide-[#ded8f2]">
            {events.map((event, index) => {
              const date = getDateParts(event.startDate);
              const registration = getRegistrationDetails(event.registrationState);
              return (
                <article className="group grid gap-7 py-10 lg:grid-cols-[9rem_minmax(0,1fr)_14rem] lg:items-center lg:py-14" key={event.id}>
                  <div className="flex items-center gap-4 lg:block"><span className="text-5xl font-black leading-none tracking-[-0.06em] text-[#6d4aff]">{date.day}</span><div className="lg:mt-3"><span className="block text-sm font-black uppercase tracking-[0.18em]">{date.month}</span><span className="mt-0.5 block text-sm font-semibold text-[#8b869c]">{date.year}</span></div></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${registration.accent}`}>{registration.label}</span><span className="text-xs font-bold uppercase tracking-[0.14em] text-[#8b869c]">Event {String(index + 1).padStart(2, "0")}</span></div>
                    <h3 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-[-0.045em] transition group-hover:text-[#6d4aff] sm:text-4xl">{event.title}</h3>
                    <p className="mt-4 max-w-3xl leading-7 text-[#6f6a82]">{event.description}</p>
                    <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[#4e495f]"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#6d4aff]" />{event.venue.name}, {event.venue.city}</span><span className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-[#6d4aff]" />{event.capacity} seats</span></div>
                  </div>
                  <Link className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-[#cbc4e4] bg-white px-6 font-black transition hover:-translate-y-0.5 hover:border-[#6d4aff] hover:bg-[#6d4aff] hover:text-white" to={`/events/${event.slug}`}>See the program <ArrowRight className="h-5 w-5" /></Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-[#6d4aff] px-5 py-20 text-white sm:px-8 sm:py-24" id="why-conferia">
        <div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
          <div><p className="text-sm font-black uppercase tracking-[0.22em] text-[#ddd5ff]">Why Conferia</p><h2 className="mt-5 text-4xl font-black leading-none tracking-[-0.055em] sm:text-5xl">Less friction.<br />More presence.</h2></div>
          <div className="grid gap-px overflow-hidden rounded-2xl bg-white/15 sm:grid-cols-3">
            {[
              ["01", "Find the right room", "Explore the purpose, schedule, and people behind every event before you commit."],
              ["02", "Shape your agenda", "Select focused breakout sessions without losing sight of the shared experience."],
              ["03", "Stay in the flow", "Keep registration, payment, and program details together from start to finish."],
            ].map(([number, title, description]) => <article className="bg-[#6d4aff] p-7 sm:p-8" key={number}><span className="text-sm font-black text-[#ddd5ff]">{number}</span><h3 className="mt-12 text-xl font-black">{title}</h3><p className="mt-3 text-sm leading-6 text-white/70">{description}</p><Check className="mt-8 h-5 w-5 text-[#ddd5ff]" /></article>)}
          </div>
        </div></div>
      </section>

      <footer className="bg-[#121127] px-5 py-10 text-white sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-6 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between"><Link className="text-xl font-black tracking-[-0.04em]" to="/events">Conferia<span className="text-[#9b87f5]">.</span></Link><p className="text-sm text-white/45">Thoughtful events. Better connections.</p><div className="flex gap-5 text-sm font-bold text-white/60"><Link className="hover:text-white" to="/login">Sign in</Link><Link className="hover:text-white" to="/register">Create account</Link></div></div></footer>
    </main>
  );
};

export default EventsPage;
