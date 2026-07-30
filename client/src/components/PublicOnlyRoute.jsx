import { LoaderCircle } from "lucide-react";
import { Navigate, Outlet } from "react-router";

import useAuth from "../hooks/useAuth.js";

const PublicOnlyRoute = () => {
  const {
    isAuthenticated,
    isCheckingSession,
  } = useAuth();

  if (isCheckingSession) {
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
            Checking your session...
          </span>
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
};

export default PublicOnlyRoute;