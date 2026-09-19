import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import AdminRoute from "./components/AdminRoute.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import AdminLayout from "./layouts/AdminLayout.jsx";

import AdminPaymentReviewsPage from "./pages/AdminPaymentReviewsPage.jsx";
import AdminRefundHistoryPage from "./pages/AdminRefundHistoryPage.jsx";
import AdminRefundsPage from "./pages/AdminRefundsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import EditBreakoutSelectionsPage from "./pages/EditBreakoutSelectionsPage.jsx";
import EventDetailsPage from "./pages/EventDetailsPage.jsx";
import EventPaymentPage from "./pages/EventPaymentPage.jsx";
import EventRegistrationPage from "./pages/EventRegistrationPage.jsx";
import EventsPage from "./pages/EventsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to="/events"
            replace
          />
        }
      />

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />

      <Route
        path="/events"
        element={<EventsPage />}
      />

      <Route
        path="/events/:slug"
        element={<EventDetailsPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/events/:slug/register"
          element={
            <EventRegistrationPage />
          }
        />

        <Route
          path="/events/:slug/payment"
          element={<EventPaymentPage />}
        />

        <Route
          path="/dashboard/registrations/:registrationId/edit-breakout-selections"
          element={
            <EditBreakoutSelectionsPage />
          }
        />
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="/admin/payments"
            element={
              <AdminPaymentReviewsPage />
            }
          />

          <Route
            path="/admin/refunds"
            element={<AdminRefundsPage />}
          />

          <Route
            path="/admin/refunds/history"
            element={
              <AdminRefundHistoryPage />
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          <Navigate
            to="/events"
            replace
          />
        }
      />
    </Routes>
  );
};

export default App;