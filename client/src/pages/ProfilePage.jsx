import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CircleCheck,
  LoaderCircle,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router";

import useAuth from "../hooks/useAuth.js";

const API_URL = import.meta.env.VITE_API_URL;

const CONTACT_NUMBER_PATTERN =
  /^\+?[0-9\s().-]{7,30}$/;

const INITIAL_FORM_DATA = {
  organization: "",
  jobTitle: "",
  contactNumber: "",
};

const BASE_INPUT_CLASSES =
  "min-h-13 w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-slate-950 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const getInputClasses = (hasError) => {
  if (hasError) {
    return `${BASE_INPUT_CLASSES} border-red-500 hover:border-red-600 focus:border-red-600 focus:ring-4 focus:ring-red-100`;
  }

  return `${BASE_INPUT_CLASSES} border-slate-300 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100`;
};

const ProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const returnTo =
    typeof location.state?.returnTo === "string"
      ? location.state.returnTo
      : null;

  const {
    token,
    user,
    endSession,
  } = useAuth();

  const [formData, setFormData] = useState(
    INITIAL_FORM_DATA,
  );
  const [errors, setErrors] = useState({});
  const [isLoadingProfile, setIsLoadingProfile] =
    useState(true);
  const [isSavingProfile, setIsSavingProfile] =
    useState(false);
  const [loadError, setLoadError] = useState("");
  const [statusMessage, setStatusMessage] =
    useState(
      typeof location.state?.message === "string"
        ? location.state.message
        : "",
    );
  const [statusType, setStatusType] =
    useState(
      typeof location.state?.message === "string"
        ? "success"
        : "",
    );
  const [isProfileComplete, setIsProfileComplete] =
    useState(false);

  const organizationRef = useRef(null);
  const jobTitleRef = useRef(null);
  const contactNumberRef = useRef(null);

  const fieldRefs = {
    organization: organizationRef,
    jobTitle: jobTitleRef,
    contactNumber: contactNumberRef,
  };

  const handleInvalidSession = useCallback(() => {
    endSession();

    navigate("/login", {
      replace: true,
    });
  }, [endSession, navigate]);

  useEffect(() => {
    const abortController = new AbortController();

    const loadProfile = async () => {
      if (!API_URL || !token) {
        setLoadError(
          "The participant profile cannot be loaded because the application configuration is incomplete.",
        );
        setIsLoadingProfile(false);

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: abortController.signal,
          },
        );

        const responseData = await response.json();

        if (response.status === 401) {
          if (!abortController.signal.aborted) {
            handleInvalidSession();
          }

          return;
        }

        if (!response.ok) {
          throw new Error(
            responseData.message ||
              "Unable to retrieve your participant profile.",
          );
        }

        if (abortController.signal.aborted) {
          return;
        }

        if (responseData.profile) {
          setFormData({
            organization:
              responseData.profile.organization || "",
            jobTitle:
              responseData.profile.jobTitle || "",
            contactNumber:
              responseData.profile.contactNumber || "",
          });
        }

        setIsProfileComplete(
          Boolean(responseData.isProfileComplete),
        );
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error(
          "Unable to load participant profile:",
        );
        console.error(error.message);

        setLoadError(
          "Unable to load your participant profile. Please try again.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      abortController.abort();
    };
  }, [token, handleInvalidSession]);

  const validateForm = () => {
    const validationErrors = {};

    const normalizedOrganization =
      formData.organization.trim();

    const normalizedJobTitle =
      formData.jobTitle.trim();

    const normalizedContactNumber =
      formData.contactNumber.trim();

    if (!normalizedOrganization) {
      validationErrors.organization =
        "Organization or school is required.";
    } else if (normalizedOrganization.length < 2) {
      validationErrors.organization =
        "Organization must contain at least 2 characters.";
    } else if (normalizedOrganization.length > 150) {
      validationErrors.organization =
        "Organization cannot exceed 150 characters.";
    }

    if (!normalizedJobTitle) {
      validationErrors.jobTitle =
        "Job title or role is required.";
    } else if (normalizedJobTitle.length < 2) {
      validationErrors.jobTitle =
        "Job title must contain at least 2 characters.";
    } else if (normalizedJobTitle.length > 100) {
      validationErrors.jobTitle =
        "Job title cannot exceed 100 characters.";
    }

    if (!normalizedContactNumber) {
      validationErrors.contactNumber =
        "Contact number is required.";
    } else if (normalizedContactNumber.length > 30) {
      validationErrors.contactNumber =
        "Contact number cannot exceed 30 characters.";
    } else if (
      !CONTACT_NUMBER_PATTERN.test(
        normalizedContactNumber,
      )
    ) {
      validationErrors.contactNumber =
        "Enter a valid contact number.";
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
    setStatusType("");

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

    if (isSavingProfile) {
      return;
    }

    setStatusMessage("");
    setStatusType("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      focusFirstInvalidField(validationErrors);

      return;
    }

    if (!API_URL || !token) {
      setStatusType("error");
      setStatusMessage(
        "The application is missing its profile API configuration.",
      );

      return;
    }

    setErrors({});
    setIsSavingProfile(true);

    const profileData = {
      organization: formData.organization.trim(),
      jobTitle: formData.jobTitle.trim(),
      contactNumber: formData.contactNumber.trim(),
    };

    try {
      const response = await fetch(
        `${API_URL}/api/profile`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profileData),
        },
      );

      const responseData = await response.json();

      if (response.status === 401) {
        handleInvalidSession();

        return;
      }

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

        setStatusType("error");
        setStatusMessage(
          responseData.message ||
            "Unable to save your participant profile.",
        );

        return;
      }

      const savedProfile = responseData.profile;

      setFormData({
        organization:
          savedProfile?.organization ||
          profileData.organization,
        jobTitle:
          savedProfile?.jobTitle ||
          profileData.jobTitle,
        contactNumber:
          savedProfile?.contactNumber ||
          profileData.contactNumber,
      });

      setIsProfileComplete(
        Boolean(responseData.isProfileComplete),
      );

      setStatusType("success");
      setStatusMessage(
        responseData.message ||
          "Participant profile saved successfully.",
      );

      if (returnTo) {
        navigate(returnTo, {
          replace: true,
          state: {
            message:
              "Profile saved. You can now complete your event registration.",
          },
        });
      }
    } catch (error) {
      console.error(
        "Unable to save participant profile:",
      );
      console.error(error.message);

      setStatusType("error");
      setStatusMessage(
        "Unable to connect to the server. Check your connection and try again.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoadingProfile) {
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
            Loading your participant profile...
          </span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-8 sm:px-8 sm:py-12">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold text-slate-600 transition hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-500"
            to="/dashboard"
          >
            <ArrowLeft
              className="h-4 w-4"
              aria-hidden="true"
            />
            Back to dashboard
          </Link>
        </div>

        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-800 via-blue-700 to-blue-500 p-6 text-white shadow-xl shadow-blue-300/20 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-200 sm:text-sm">
                Participant profile
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Complete your event details
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-blue-100">
                These details help event organizers understand
                who is attending and prepare participant records.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
              <UserRound
                className="h-8 w-8 text-blue-200"
                aria-hidden="true"
              />

              <div>
                <p className="font-bold">{user.name}</p>

                <p className="text-sm text-blue-200">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60 sm:p-8">
            <header>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                Profile information
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Tell us about your professional role
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                You can review and update these details before
                completing event registration.
              </p>
            </header>

            {loadError && (
              <div
                className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />

                <span>{loadError}</span>
              </div>
            )}

            {statusMessage && (
              <div
                className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  statusType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
                role={
                  statusType === "success"
                    ? "status"
                    : "alert"
                }
              >
                {statusType === "success" ? (
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
              className="mt-8 grid gap-6"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="grid gap-2">
                <label
                  className="text-sm font-semibold text-slate-800"
                  htmlFor="organization"
                >
                  Organization or school
                </label>

                <div className="relative">
                  <Building2
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />

                  <input
                    ref={organizationRef}
                    className={getInputClasses(
                      Boolean(errors.organization),
                    )}
                    id="organization"
                    name="organization"
                    type="text"
                    placeholder="Enter your organization or school"
                    autoComplete="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    disabled={isSavingProfile}
                    aria-invalid={Boolean(
                      errors.organization,
                    )}
                    aria-describedby={
                      errors.organization
                        ? "organization-error"
                        : undefined
                    }
                  />
                </div>

                {errors.organization && (
                  <p
                    className="flex items-center gap-1.5 text-sm text-red-600"
                    id="organization-error"
                    role="alert"
                  >
                    <AlertCircle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {errors.organization}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label
                  className="text-sm font-semibold text-slate-800"
                  htmlFor="jobTitle"
                >
                  Job title or role
                </label>

                <div className="relative">
                  <BriefcaseBusiness
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />

                  <input
                    ref={jobTitleRef}
                    className={getInputClasses(
                      Boolean(errors.jobTitle),
                    )}
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    placeholder="Enter your job title or role"
                    autoComplete="organization-title"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    disabled={isSavingProfile}
                    aria-invalid={Boolean(errors.jobTitle)}
                    aria-describedby={
                      errors.jobTitle
                        ? "job-title-error"
                        : undefined
                    }
                  />
                </div>

                {errors.jobTitle && (
                  <p
                    className="flex items-center gap-1.5 text-sm text-red-600"
                    id="job-title-error"
                    role="alert"
                  >
                    <AlertCircle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {errors.jobTitle}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label
                  className="text-sm font-semibold text-slate-800"
                  htmlFor="contactNumber"
                >
                  Contact number
                </label>

                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />

                  <input
                    ref={contactNumberRef}
                    className={getInputClasses(
                      Boolean(errors.contactNumber),
                    )}
                    id="contactNumber"
                    name="contactNumber"
                    type="tel"
                    placeholder="+63 917 123 4567"
                    autoComplete="tel"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    disabled={isSavingProfile}
                    aria-invalid={Boolean(
                      errors.contactNumber,
                    )}
                    aria-describedby={
                      errors.contactNumber
                        ? "contact-help contact-number-error"
                        : "contact-help"
                    }
                  />
                </div>

                <p
                  className="text-xs leading-5 text-slate-500"
                  id="contact-help"
                >
                  Include the country code when event organizers
                  may need to contact you internationally.
                </p>

                {errors.contactNumber && (
                  <p
                    className="flex items-center gap-1.5 text-sm text-red-600"
                    id="contact-number-error"
                    role="alert"
                  >
                    <AlertCircle
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {errors.contactNumber}
                  </p>
                )}
              </div>

              <button
                className="mt-1 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-300 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:bg-blue-600"
                type="submit"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <LoaderCircle
                      className="h-5 w-5 animate-spin"
                      aria-hidden="true"
                    />
                    Saving profile...
                  </>
                ) : (
                  <>
                    <Save
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                    Save participant profile
                  </>
                )}
              </button>
            </form>
          </section>

          <aside className="grid content-start gap-6">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <div
                className={`grid h-11 w-11 place-items-center rounded-2xl ${
                  isProfileComplete
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {isProfileComplete ? (
                  <CircleCheck
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="h-6 w-6"
                    aria-hidden="true"
                  />
                )}
              </div>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">
                Profile status
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-950">
                {isProfileComplete
                  ? "Profile complete"
                  : "Profile incomplete"}
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {isProfileComplete
                  ? "Your participant profile has been saved and is ready for event registration."
                  : "Complete the form so you can continue with event registration."}
              </p>
            </article>

            <article className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">
                What comes next
              </p>

              <p className="mt-3 leading-7 text-blue-900">
                After your profile is saved, Conferia will
                guide you through event registration and
                breakout-session selection.
              </p>
            </article>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default ProfilePage;
