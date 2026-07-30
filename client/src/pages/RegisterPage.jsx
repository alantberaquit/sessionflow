import { useRef, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CircleCheck,
  LoaderCircle,
  LockKeyhole,
  Mail,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import { Link } from "react-router";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const API_URL = import.meta.env.VITE_API_URL;

const INITIAL_FORM_DATA = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const BASE_INPUT_CLASSES =
  "min-h-13 w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-slate-950 outline-none transition placeholder:text-slate-400";

const getInputClasses = (hasError) => {
  if (hasError) {
    return `${BASE_INPUT_CLASSES} border-red-500 hover:border-red-600 focus:border-red-600 focus:ring-4 focus:ring-red-100`;
  }

  return `${BASE_INPUT_CLASSES} border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100`;
};

const RegisterPage = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const fieldRefs = {
    name: nameRef,
    email: emailRef,
    password: passwordRef,
    confirmPassword: confirmPasswordRef,
  };

  const validateForm = () => {
    const validationErrors = {};

    const normalizedName = formData.name.trim();
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedName) {
      validationErrors.name = "Full name is required.";
    } else if (normalizedName.length < 2) {
      validationErrors.name =
        "Full name must contain at least 2 characters.";
    } else if (normalizedName.length > 100) {
      validationErrors.name =
        "Full name cannot exceed 100 characters.";
    }

    if (!normalizedEmail) {
      validationErrors.email = "Email address is required.";
    } else if (normalizedEmail.length > 254) {
      validationErrors.email =
        "Email address cannot exceed 254 characters.";
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      validationErrors.email = "Enter a valid email address.";
    }

    if (!formData.password) {
      validationErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      validationErrors.password =
        "Password must contain at least 8 characters.";
    } else if (formData.password.length > 72) {
      validationErrors.password =
        "Password cannot exceed 72 characters.";
    }

    if (!formData.confirmPassword) {
      validationErrors.confirmPassword =
        "Password confirmation is required.";
    } else if (
      formData.password !== formData.confirmPassword
    ) {
      validationErrors.confirmPassword =
        "Passwords do not match.";
    }

    return validationErrors;
  };

  const focusFirstInvalidField = (validationErrors) => {
    const firstInvalidField = Object.keys(validationErrors)[0];

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

    const registrationData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationData),
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
          focusFirstInvalidField(responseData.errors);

          return;
        }

        if (response.status === 409) {
          setErrors({
            email:
              responseData.message ||
              "An account with this email already exists.",
          });

          emailRef.current?.focus();

          return;
        }

        setStatusMessage(
          responseData.message ||
            "Unable to create your account. Please try again.",
        );

        return;
      }

      setFormData(INITIAL_FORM_DATA);
      setStatusMessage(
        responseData.message ||
          "Participant account created successfully.",
      );
    } catch (error) {
      console.error("Registration request failed:");
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
      <section className="relative flex min-h-[34rem] flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-14 lg:py-10 xl:px-20">
        <div
          className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-white/10 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/10 text-lg font-black shadow-lg shadow-slate-950/20">
            S
          </div>

          <span className="text-lg font-bold tracking-tight">
            SessionFlow
          </span>
        </div>

        <div className="relative z-10 my-auto max-w-2xl py-16 lg:py-12">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200 sm:text-sm">
            Digital Learning &amp; Innovation Summit 2026
          </p>

          <h1 className="mt-5 max-w-[10ch] text-5xl font-bold leading-[0.98] tracking-[-0.055em] sm:text-6xl xl:text-7xl">
            Build your personal event schedule
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-blue-100 sm:text-lg">
            Create one participant account to choose breakout sessions,
            review your two-day program, and access your confirmed
            schedule anytime.
          </p>

          <ul className="mt-9 grid max-w-xl gap-4 text-sm text-blue-50 sm:text-base">
            <li className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800"
                aria-hidden="true"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>

              <span>
                Select one breakout session from every schedule block.
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800"
                aria-hidden="true"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>

              <span>
                Review plenary sessions and breakout choices in one
                personalized schedule.
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-800"
                aria-hidden="true"
              >
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>

              <span>
                Receive your confirmed event program through email.
              </span>
            </li>
          </ul>
        </div>

        <p className="relative z-10 flex items-center gap-2 text-sm text-blue-200">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Two-day seminar and workshop event
        </p>
      </section>

      <section className="grid min-h-screen place-items-center px-5 py-12 sm:px-8 lg:px-10 xl:px-16">
        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40 sm:p-9 xl:p-11">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Participant registration
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-slate-950 sm:text-4xl">
              Create your account
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Use an email address that you can access during the event.
            </p>
          </header>

          {statusMessage && (
            <div
              className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                statusMessage
                  .toLowerCase()
                  .includes("successfully")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
              role="status"
            >
              {statusMessage
                .toLowerCase()
                .includes("successfully") ? (
                <CircleCheck
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

          <form
            className="mt-8 grid gap-5"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-slate-800"
                htmlFor="name"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <input
                  ref={nameRef}
                  className={getInputClasses(Boolean(errors.name))}
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "name-error" : undefined
                  }
                />
              </div>

              {errors.name && (
                <p
                  className="flex items-center gap-1.5 text-sm text-red-600"
                  id="name-error"
                  role="alert"
                >
                  <AlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {errors.name}
                </p>
              )}
            </div>

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
                  className={getInputClasses(Boolean(errors.email))}
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
                    errors.email ? "email-error" : undefined
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
              <label
                className="text-sm font-semibold text-slate-800"
                htmlFor="password"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <input
                  ref={passwordRef}
                  className={getInputClasses(
                    Boolean(errors.password),
                  )}
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password
                      ? "password-help password-error"
                      : "password-help"
                  }
                />
              </div>

              <p
                className="text-xs leading-5 text-slate-500"
                id="password-help"
              >
                Use between 8 and 72 characters.
              </p>

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

            <div className="grid gap-2">
              <label
                className="text-sm font-semibold text-slate-800"
                htmlFor="confirmPassword"
              >
                Confirm password
              </label>

              <div className="relative">
                <LockKeyhole
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />

                <input
                  ref={confirmPasswordRef}
                  className={getInputClasses(
                    Boolean(errors.confirmPassword),
                  )}
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(
                    errors.confirmPassword,
                  )}
                  aria-describedby={
                    errors.confirmPassword
                      ? "confirm-password-error"
                      : undefined
                  }
                />
              </div>

              {errors.confirmPassword && (
                <p
                  className="flex items-center gap-1.5 text-sm text-red-600"
                  id="confirm-password-error"
                  role="alert"
                >
                  <AlertCircle
                    className="h-4 w-4 shrink-0"
                    aria-hidden="true"
                  />
                  {errors.confirmPassword}
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
                  Creating account...
                </>
              ) : (
                <>
                  <UserRoundPlus
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                  Create participant account
                </>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link
              className="font-bold text-blue-700 hover:text-blue-800 hover:underline"
              to="/login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;