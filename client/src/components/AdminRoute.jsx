import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

const AdminRoute = () => {
  const location = useLocation();

  const {
    user,
    isAuthenticated,
    isCheckingSession,
  } = useAuth();

  if (isCheckingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <p className="font-semibold text-slate-600">
          Checking administrator access...
        </p>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <Navigate
        to="/dashboard"
        replace
        state={{
          message:
            "Administrator access is required.",
        }}
      />
    );
  }

  return <Outlet />;
};

export default AdminRoute;