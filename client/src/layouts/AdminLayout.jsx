import {
  CalendarDays,
  CircleUserRound,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  RotateCcw,
  X,
} from "lucide-react";
import {
  useState,
} from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

const getNavLinkClasses = ({
  isActive,
}) => {
  const baseClasses =
    "flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition";

  if (isActive) {
    return `${baseClasses} bg-blue-600 text-white shadow-sm`;
  }

  return `${baseClasses} text-slate-300 hover:bg-white/10 hover:text-white`;
};

const AdminLayout = () => {
  const navigate = useNavigate();

  const {
    user,
    endSession,
  } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    endSession();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
          aria-label="Close administrator navigation"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gradient-to-b from-blue-800 to-blue-950 text-white shadow-2xl transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-white/10 px-6">
          <NavLink
            to="/dashboard"
            onClick={closeSidebar}
            className="text-xl font-black tracking-tight text-white"
          >
            Conferia<span className="text-teal-300">.</span>
          </NavLink>

          <button
            type="button"
            onClick={closeSidebar}
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="border-b border-white/10 px-6 py-5">
          <p className="text-sm font-bold text-white">
            {user?.name ??
              "Administrator"}
          </p>

          <p className="mt-1 truncate text-sm text-slate-400">
            {user?.email}
          </p>

          <span className="mt-3 inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-200">
            Administrator
          </span>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-4 py-5"
          aria-label="Administrator navigation"
        >
          <p className="px-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Administration
          </p>

          <div className="mt-3 space-y-1">
            <NavLink
              to="/dashboard"
              onClick={closeSidebar}
              className={getNavLinkClasses}
            >
              <LayoutDashboard
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              Dashboard
            </NavLink>

            <NavLink
              to="/admin/payments"
              onClick={closeSidebar}
              className={getNavLinkClasses}
            >
              <ClipboardCheck
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              Payment reviews
            </NavLink>

            <NavLink
              to="/admin/refunds"
              end
              onClick={closeSidebar}
              className={getNavLinkClasses}
            >
              <RotateCcw
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              Cancellations and refunds
            </NavLink>

            <NavLink
              to="/admin/refunds/history"
              onClick={closeSidebar}
              className={getNavLinkClasses}
            >
              <History
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              Refund history
            </NavLink>
          </div>

          <p className="mt-8 px-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            Participant view
          </p>

          <div className="mt-3 space-y-1">
            <NavLink
              to="/events"
              onClick={closeSidebar}
              className={getNavLinkClasses}
            >
              <CalendarDays
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              Events
            </NavLink>

            <NavLink
              to="/profile"
              onClick={closeSidebar}
              className={getNavLinkClasses}
            >
              <CircleUserRound
                className="h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              Profile
            </NavLink>
          </div>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-red-500/15 hover:text-red-200"
          >
            <LogOut
              className="h-5 w-5"
              aria-hidden="true"
            />

            Sign out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8 lg:px-10">
          <button
            type="button"
            onClick={() =>
              setIsSidebarOpen(true)
            }
            className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-700 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open administrator navigation"
          >
            <Menu
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>

          <div className="ml-auto text-right">
            <p className="text-sm font-bold text-slate-950">
              {user?.name ??
                "Administrator"}
            </p>

            <p className="text-xs text-slate-500">
              Administrator
            </p>
          </div>
        </header>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
