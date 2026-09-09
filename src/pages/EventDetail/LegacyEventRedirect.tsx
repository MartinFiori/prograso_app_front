import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import { isConnectionError, useConnection } from "../../hooks/useConnection";
import { getEventByIdPath, parseEventIdParam } from "../../services/eventsApi";
import type { ApiResponse } from "../../types";
import type { PublicEvent } from "../../types/events";
import { eventDetailPath, homePath } from "../../utils/publicEventPaths";
import NotFound from "../NotFound/NotFound";
import styles from "./EventDetail.module.scss";

type RedirectState =
  | { status: "loading" }
  | { status: "invalid-id" }
  | { status: "not-found" }
  | { status: "error"; message: string };

export default function LegacyEventRedirect() {
  const { id } = useParams<{ id: string }>();
  const eventId = parseEventIdParam(id);
  const navigate = useNavigate();
  const connection = useConnection();
  const [state, setState] = useState<RedirectState>({ status: "loading" });

  const load = useCallback(async () => {
    if (eventId === null) {
      setState({ status: "invalid-id" });
      return;
    }

    setState({ status: "loading" });

    const result = await connection<ApiResponse<PublicEvent>>({
      url: getEventByIdPath(eventId),
      requiresAuth: false,
      abortRepeat: true,
    });

    if (isConnectionError(result)) {
      if (result.message === "Petición cancelada") {
        return;
      }

      if (result.status === 404) {
        setState({ status: "not-found" });
        return;
      }

      setState({
        status: "error",
        message: result.message,
      });
      return;
    }

    navigate(eventDetailPath(result.data.category_id, result.data.id), {
      replace: true,
    });
  }, [connection, eventId, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "invalid-id") {
    return (
      <main className={styles.page}>
        <h1>Evento no válido</h1>
        <p>El identificador del evento debe ser un número entero positivo.</p>
        <Link
          className={styles.back}
          to={homePath()}
        >
          Volver a categorías
        </Link>
      </main>
    );
  }

  if (state.status === "not-found") {
    return <NotFound />;
  }

  if (state.status === "error") {
    return (
      <main className={styles.page}>
        <div
          className={styles.error}
          role="alert"
        >
          <p>{state.message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <PadelLoader label="Cargando evento..." />
    </main>
  );
}
