import {
  CalendarDays,
  CircleUserRound,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router";

import useAuth from "../hooks/useAuth.js";

const DashboardPage = () => {
  const navigate = useNavigate();

  const {
    user,
    endSession,
  } = useAuth();

  const handleLogout = () => {
    endSession();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-12 sm:px-8">
      <section className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-300">
              SessionFlow
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Participant dashboard
            </h1>
          </div>

          <button
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-semibold transition hover:bg-white/20"
            type="button"
            onClick={handleLogout}
          >
            <LogOut
              className="h-5 w-5"
              aria-hidden="true"
            />
            Sign out
          </button>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
            <CircleUserRound
              className="h-10 w-10 text-blue-600"
              aria-hidden="true"
            />

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              Signed-in participant
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {user.name}
            </h2>

            <p className="mt-2 text-slate-600">
              {user.email}
            </p>

            <p className="mt-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold capitalize text-blue-700">
              {user.role}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
            <CalendarDays
              className="h-10 w-10 text-blue-600"
              aria-hidden="true"
            />

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.16em] text-blue-600">
              Event schedule
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Your schedule is coming next
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Breakout-session selection and the
              personalized two-day program will be added
              in a later module.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
};

export default DashboardPage;