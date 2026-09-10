import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button } from "../../components/Button/Button";
import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import { useSecurity } from "../../context/SecurityContext";
import { authLog } from "../../utils/authLog";
import { isProfileComplete } from "../../utils/profileCompleteness";
import styles from "./AuthCallback.module.scss";

const AUTH_CALLBACK_TIMEOUT_MS = 8000;

function getCallbackError(search: string, hash: string): string | null {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

  return (
    searchParams.get("error_description") ||
    searchParams.get("error") ||
    hashParams.get("error_description") ||
    hashParams.get("error")
  );
}

function hasOAuthCode(search: string, hash: string): boolean {
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

  return searchParams.has("code") || hashParams.has("code");
}

export default function AuthCallback() {
  const { isAuthenticated, loading, profile, profileLoading, login } =
    useSecurity();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState(
    "Intentá nuevamente o regresá al inicio.",
  );
  const [devDetail, setDevDetail] = useState<string | null>(null);

  useEffect(() => {
    const urlError = getCallbackError(location.search, location.hash);
    const hasCode = hasOAuthCode(location.search, location.hash);

    authLog("callback mounted", {
      hasCode,
      hasUrlError: Boolean(urlError),
    });

    if (urlError) {
      setStatus("error");
      setErrorMessage("Intentá nuevamente o regresá al inicio.");
      if (process.env.NODE_ENV === "development") {
        setDevDetail(urlError);
      }
      authLog("callback url error");
    }
  }, [location.hash, location.search]);

  useEffect(() => {
    if (status === "error") {
      return;
    }

    if (loading || (isAuthenticated && profileLoading)) {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    const nextPath = isProfileComplete(profile) ? "/" : "/profile";
    authLog("callback success, navigate", { nextPath });
    navigate(nextPath, { replace: true });
  }, [
    isAuthenticated,
    loading,
    navigate,
    profile,
    profileLoading,
    status,
  ]);

  useEffect(() => {
    if (status === "error" || isAuthenticated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setStatus("error");
      setErrorMessage("Intentá nuevamente o regresá al inicio.");
      authLog("callback timeout", { loading });
    }, AUTH_CALLBACK_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isAuthenticated, loading, status]);

  if (status === "error") {
    return (
      <main className={styles.page}>
        <div
          className={styles.error}
          role="alert"
        >
          <h1>No pudimos iniciar tu sesión</h1>
          <p>{errorMessage}</p>
          {devDetail ? (
            <p className={styles.devDetail}>{devDetail}</p>
          ) : null}
          <div className={styles.actions}>
            <Button
              onClick={() => {
                authLog("callback retry login");
                void login();
              }}
            >
              Intentar nuevamente
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                authLog("callback go home after error");
                navigate("/", { replace: true });
              }}
            >
              Volver al inicio
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div
        className={styles.processing}
        aria-live="polite"
      >
        <PadelLoader label="Estamos iniciando tu sesión" />
        <p>Esto puede tardar unos segundos</p>
      </div>
    </main>
  );
}
