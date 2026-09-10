import { useEffect } from "react";

import { supabase } from "../../utils/supabase";

const AUTH_CALLBACK_TIMEOUT_MS = 5000;
const API_URL = process.env.REACT_APP_API_URL || "/";

function redirectToApi(search?: string): void {
  const target = new URL(API_URL, window.location.origin);

  if (search) {
    new URLSearchParams(search).forEach((value, key) => {
      target.searchParams.set(key, value);
    });
  }

  window.location.replace(target.toString());
}

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

export default function AuthCallback() {
  useEffect(() => {
    let cancelled = false;

    const goHome = () => {
      if (!cancelled) {
        redirectToApi();
      }
    };

    const goError = (reason?: unknown) => {
      if (reason) {
        console.error("Error procesando el login:", reason);
      }

      if (!cancelled) {
        redirectToApi("authError=true");
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
  }, []);

  return <p>Iniciando sesión...</p>;
}
