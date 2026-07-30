import { Route, Routes } from "react-router";

import RegisterPage from "./pages/RegisterPage.jsx";

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="grid min-h-screen place-items-center bg-slate-950 px-6 text-center text-white">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">
                Seminar and workshop registration
              </p>

              <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-7xl">
                SessionFlow
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                Manage your event registration and personalized
                schedule in one place.
              </p>
            </div>
          </main>
        }
      />

      <Route
        path="/register"
        element={<RegisterPage />}
      />
    </Routes>
  );
};

export default App;