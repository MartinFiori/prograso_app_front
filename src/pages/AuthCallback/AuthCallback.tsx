import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "../../utils/supabase";

const AUTH_CALLBACK_TIMEOUT_MS = 5000;

function getCallbackError(): string | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  console.log({search, hash})

  return (
    search.get("error_description") ||
    search.get("error") ||
    hash.get("error_description") ||
    hash.get("error")
  );
}

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const goHome = () => {
      if (!cancelled) {
        navigate("/", { replace: true });
      }
    };

    const goError = (reason?: unknown) => {
      if (reason) {
        console.error("Error procesando el login:", reason);
      }

      if (!cancelled) {
        navigate("/?authError=true", { replace: true });
      }
    };

    const urlError = getCallbackError();

    if (urlError) {
      goError(urlError);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        goHome();
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) {
        return;
      }

      if (error) {
        goError(error);
        return;
      }

      if (data.session) {
        goHome();
      }
    });

    const timeoutId = window.setTimeout(() => {
      void supabase.auth.getSession().then(({ data, error }) => {
        if (error || !data.session) {
          goError(error ?? "Tiempo de espera agotado al completar el login");
          return;
        }

        goHome();
      });
    }, AUTH_CALLBACK_TIMEOUT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return <p>Iniciando sesión...</p>;
}
