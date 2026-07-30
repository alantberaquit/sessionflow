import {
  Navigate,
  Route,
  Routes,
} from "react-router";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicOnlyRoute from "./components/PublicOnlyRoute.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import EventDetailsPage from "./pages/EventDetailsPage.jsx";
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
        path="/events"
        element={<EventsPage />}
      />

      <Route
        path="/events/:slug"
        element={<EventDetailsPage />}
      />

      <Route element={<PublicOnlyRoute />}>
        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/profile"
          element={<ProfilePage />}
        />

        <Route
          path="/events/:slug/register"
          element={<EventRegistrationPage />}
        />
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