import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthContext from "./AuthContext.js";

const API_URL = import.meta.env.VITE_API_URL;

const TOKEN_STORAGE_KEY = "sessionflowToken";
const USER_STORAGE_KEY = "sessionflowUser";

const clearStoredSession = () => {
  window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(USER_STORAGE_KEY);
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isCheckingSession, setIsCheckingSession] =
    useState(true);

  const startSession = useCallback(
    (nextToken, nextUser) => {
      window.sessionStorage.setItem(
        TOKEN_STORAGE_KEY,
        nextToken,
      );

      window.sessionStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(nextUser),
      );

      setToken(nextToken);
      setUser(nextUser);
    },
    [],
  );

  const endSession = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const verifyStoredSession = async () => {
      const storedToken =
        window.sessionStorage.getItem(
          TOKEN_STORAGE_KEY,
        );

      if (!storedToken || !API_URL) {
        clearStoredSession();

        if (!abortController.signal.aborted) {
          setToken(null);
          setUser(null);
          setIsCheckingSession(false);
        }

        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
            signal: abortController.signal,
          },
        );

        const responseData = await response.json();

        if (!response.ok || !responseData.user) {
          throw new Error(
            responseData.message ||
              "Stored session is no longer valid",
          );
        }

        if (abortController.signal.aborted) {
          return;
        }

        window.sessionStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(responseData.user),
        );

        setToken(storedToken);
        setUser(responseData.user);
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        clearStoredSession();
        setToken(null);
        setUser(null);
      } finally {
        if (!abortController.signal.aborted) {
          setIsCheckingSession(false);
        }
      }
    };

    verifyStoredSession();

    return () => {
      abortController.abort();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isCheckingSession,
      startSession,
      endSession,
    }),
    [
      user,
      token,
      isCheckingSession,
      startSession,
      endSession,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;