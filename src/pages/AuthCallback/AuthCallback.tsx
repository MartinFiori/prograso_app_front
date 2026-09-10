import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button/Button";
import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import { useSecurity } from "../../context/SecurityContext";
import { authLog } from "../../utils/authLog";
import styles from "./AuthCallback.module.scss";

const AUTH_CALLBACK_TIMEOUT_MS = 8000;

function getCallbackError(): string | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    search.get("error_description") ||
    search.get("error") ||
    hash.get("error_description") ||
    hash.get("error")
  );
}

function hasOAuthCode(): boolean {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return search.has("code") || hash.has("code");
}

export default function AuthCallback() {
  const { isAuthenticated, loading } = useSecurity();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState(
    "No pudimos completar el inicio de sesión. Probá de nuevo.",
  );

  useEffect(() => {
    const urlError = getCallbackError();
    const hasCode = hasOAuthCode();

    authLog("callback mounted", {
      hasCode,
      hasUrlError: Boolean(urlError),
    });

    if (urlError) {
      setStatus("error");
      setErrorMessage(
        "Google o Supabase no pudieron completar el acceso. Probá de nuevo.",
      );
      authLog("callback url error");
    }
  }, []);

  useEffect(() => {
    if (status === "error") {
      return;
    }

    if (!isAuthenticated) {
      return;
    }

    authLog("callback success, navigate /");
    navigate("/", { replace: true });
  }, [isAuthenticated, navigate, status]);

  useEffect(() => {
    if (status === "error" || isAuthenticated) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (isAuthenticated) {
        return;
      }

      setStatus("error");
      setErrorMessage(
        "Se agotó el tiempo para completar el inicio de sesión. Probá de nuevo.",
      );
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
          <h1>No pudimos iniciar sesión</h1>
          <p>{errorMessage}</p>
          <Button
            onClick={() => {
              authLog("callback go home after error");
              navigate("/", { replace: true });
            }}
          >
            Volver al inicio
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <PadelLoader label="Iniciando sesión..." />
    </main>
  );
}
