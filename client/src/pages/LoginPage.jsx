import { useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Mail,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const API_URL = import.meta.env.VITE_API_URL;

const INITIAL_FORM_DATA = {
  email: "",
  password: "",
};

const BASE_INPUT_CLASSES =
  "min-h-13 w-full rounded-xl border bg-white py-3 text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const getInputClasses = (hasError, extraClasses) => {
  const stateClasses = hasError
    ? "border-red-500 hover:border-red-600 focus:border-red-600 focus:ring-4 focus:ring-red-100"
    : "border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100";

  return `${BASE_INPUT_CLASSES} ${extraClasses} ${stateClasses}`;
};

const LoginPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { startSession } = useAuth();

  const returnTo =
    typeof location.state?.from === "string"
      ? location.state.from
      : "/dashboard";

  const [formData, setFormData] = useState(
    INITIAL_FORM_DATA,
  );
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] =
    useState("");
  const [isPasswordVisible, setIsPasswordVisible] =
    useState(false);
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const fieldRefs = {
    email: emailRef,
    password: passwordRef,
  };

  const validateForm = () => {
    const validationErrors = {};

    const normalizedEmail = formData.email
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      validationErrors.email =
        "Email address is required.";
    } else if (normalizedEmail.length > 254) {
      validationErrors.email =
        "Email address cannot exceed 254 characters.";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      validationErrors.email =
        "Enter a valid email address.";
    }

    if (!formData.password) {
      validationErrors.password =
        "Password is required.";
    } else if (formData.password.length > 72) {
      validationErrors.password =
        "Password cannot exceed 72 characters.";
    }

    return validationErrors;
  };

  const focusFirstInvalidField = (
    validationErrors,
  ) => {
    const firstInvalidField = Object.keys(
      validationErrors,
    )[0];

    fieldRefs[firstInvalidField]?.current?.focus();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));

    setStatusMessage("");

    setErrors((currentErrors) => {
      if (!currentErrors[name]) {
        return currentErrors;
      }

      const updatedErrors = {
        ...currentErrors,
      };

      delete updatedErrors[name];

      return updatedErrors;
    });
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(
      (currentValue) => !currentValue,
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setStatusMessage("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstInvalidField(validationErrors);

      return;
    }

    if (!API_URL) {
      setStatusMessage(
        "The application is missing its API configuration.",
      );

      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const loginData = {
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    };

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        },
      );

      const responseData = await response.json();

      if (!response.ok) {
        if (
          response.status === 400 &&
          responseData.errors &&
          typeof responseData.errors === "object"
        ) {
          setErrors(responseData.errors);
          focusFirstInvalidField(
            responseData.errors,
          );

          return;
        }

        if (response.status === 401) {
          setStatusMessage(
            responseData.message ||
              "Invalid email or password.",
          );

          setFormData((currentFormData) => ({
            ...currentFormData,
            password: "",
          }));

          setIsPasswordVisible(false);

          window.requestAnimationFrame(() => {
            passwordRef.current?.focus();
          });

          return;
        }

        setStatusMessage(
          responseData.message ||
            "Unable to sign in. Please try again.",
        );

        return;
      }

      if (
        !responseData.token ||
        !responseData.user
      ) {
        throw new Error(
          "The login response is incomplete",
        );
      }

      startSession(
        responseData.token,
        responseData.user,
      );

      navigate(returnTo, {
        replace: true,
      });
    } catch (error) {
      console.error("Login request failed:");
      console.error(error.message);

      setStatusMessage(
        "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative flex min-h-[30rem] flex-col overflow-hidden bg-gradient-to-br from-blue-800 via-blue-700 to-blue-500 px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-10 xl:px-20">
        <div
          className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl"
          aria-hidden="true"
        />

        <Link
          className="relative z-10 flex w-fit items-center gap-3 rounded-xl focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-blue-300"
          to="/events"
          aria-label="Conferia events"
        >
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-lg font-black shadow-lg shadow-slate-950/20">
            S
          </div>

          <span className="text-lg font-bold tracking-tight">
            Conferia<span className="text-teal-300">.</span>
          </span>
        </Link>

        <div className="relative z-10 my-auto max-w-2xl py-16 lg:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200 sm:text-sm">
            Digital Learning &amp; Innovation Summit
            2026
          </p>

          <h1 className="mt-5 max-w-[10ch] text-5xl font-bold leading-[0.98] tracking-[-0.055em] sm:text-6xl xl:text-7xl">
            Your event schedule awaits
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-blue-100 sm:text-lg">
            Sign in to continue your registration,
            manage your breakout choices, and review
            your personalized two-day program.
          </p>

          <ul className="mt-9 grid max-w-xl gap-4 text-sm text-blue-50 sm:text-base">
            <li className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800"
                aria-hidden="true"
              >
                <Check
                  className="h-4 w-4"
                  strokeWidth={3}
                />
              </span>

              <span>
                Continue your registration from where
                you left off.
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800"
                aria-hidden="true"
              >
                <Check
                  className="h-4 w-4"
                  strokeWidth={3}
                />
              </span>

              <span>
                Review and update your breakout-session
                selections.
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800"
                aria-hidden="true"
              >
                <Check
                  className="h-4 w-4"
                  strokeWidth={3}
                />
              </span>

              <span>
                Access your confirmed event schedule
                anytime.
              </span>
            </li>
          </ul>
        </div>

        <p className="relative z-10 flex items-center gap-2 text-sm text-blue-200">
          <CalendarDays
            className="h-4 w-4"
            aria-hidden="true"
          />
          Two-day seminar and workshop event
        </p>
      </section>

      <section className="grid min-h-screen place-items-center px-5 py-12 sm:px-8 lg:px-10 xl:px-16">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40 sm:p-9 xl:p-11">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Participant access
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Sign in to Conferia
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Enter the email address and password you
              used when creating your participant
              account.
            </p>
          </header>

          {statusMessage && (
            <div
              className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0"
                aria-hidden="true"
              />

              <span>{statusMessage}</span>
            </div>
          )}

          <form
            className="mt-8 grid gap-5"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-slate-800"
                htmlFor="email"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <input
                  ref={emailRef}
                  className={getInputClasses(
                    Boolean(errors.email),
                    "pl-12 pr-4",
                  )}
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email
                      ? "email-error"
                      : undefined
                  }
                />
              </div>

              {errors.email && (
                <p
                  className="flex items-center gap-1.5 text-sm text-red-600"
                  id="email-error"
                  role="alert"
                >
                  <AlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {errors.email}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-4">
                <label
                  className="text-sm font-semibold text-slate-800"
                  htmlFor="password"
                >
                  Password
                </label>

                <button
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  disabled={isSubmitting}
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <input
                  ref={passwordRef}
                  className={getInputClasses(
                    Boolean(errors.password),
                    "pl-12 pr-12",
                  )}
                  id="password"
                  name="password"
                  type={
                    isPasswordVisible
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(
                    errors.password,
                  )}
                  aria-describedby={
                    errors.password
                      ? "password-error"
                      : undefined
                  }
                />

                <button
                  className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                  onClick={togglePasswordVisibility}
                  disabled={isSubmitting}
                  aria-label={
                    isPasswordVisible
                      ? "Hide password"
                      : "Show password"
                  }
                  aria-pressed={isPasswordVisible}
                >
                  {isPasswordVisible ? (
                    <EyeOff
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  ) : (
                    <Eye
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </div>

              {errors.password && (
                <p
                  className="flex items-center gap-1.5 text-sm text-red-600"
                  id="password-error"
                  role="alert"
                >
                  <AlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {errors.password}
                </p>
              )}
            </div>

            <button
              className="mt-2 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-blue-600"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle
                    className="h-5 w-5 animate-spin"
                    aria-hidden="true"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                  Sign in
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            New to Conferia?{" "}
            <Link
              className="font-bold text-blue-700 hover:text-blue-800 hover:underline"
              to="/register"
              state={{ from: returnTo }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
