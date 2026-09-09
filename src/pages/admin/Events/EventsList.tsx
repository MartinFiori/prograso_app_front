import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/Button/Button";
import { Card } from "../../../components/Card/Card";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminEventList } from "../../../hooks/useAdminEvents";
import type { AdminEvent } from "../../../types/admin";
import { formatEventDateTime } from "../../../utils/eventDisplay";
import styles from "../adminShared.module.scss";

export default function EventsList() {
  const navigate = useNavigate();
  const { state, reload, remove } = useAdminEventList();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleRemove(event: AdminEvent) {
    setRemoving(true);
    setRemoveError(null);
    const error = await remove(event.id);
    setRemoving(false);

    if (error) {
      setRemoveError(error);
      return;
    }

    setPendingId(null);
  }

  if (state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando eventos..." />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className={styles.page}>
        <div
          className={styles.error}
          role="alert"
        >
          <p>{state.message}</p>
          <Button onClick={() => void reload()}>Reintentar</Button>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Eventos</h1>
        <Button onClick={() => navigate("/admin/eventos/nuevo")}>
          Nuevo evento
        </Button>
      </header>

      {removeError ? (
        <p
          className={styles.error}
          role="alert"
        >
          {removeError}
        </p>
      ) : null}

      {state.events.length === 0 ? (
        <p className={styles.message}>No hay eventos.</p>
      ) : (
        <div className={styles.grid}>
          {state.events.map((event) => (
            <Card
              key={event.id}
              title={event.title}
              badge={event.status_code}
              subtitle={event.category?.name}
              description={formatEventDateTime(event.starts_at)}
              actions={
                pendingId === event.id ? (
                  <div className={styles.confirm}>
                    <p>¿Cancelar este evento?</p>
                    <div className={styles.actions}>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={removing}
                        onClick={() => void handleRemove(event)}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removing}
                        onClick={() => setPendingId(null)}
                      >
                        Volver
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/eventos/${event.id}/editar`)
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={event.status_code === "cancelled"}
                      onClick={() => setPendingId(event.id)}
                    >
                      Cancelar evento
                    </Button>
                  </div>
                )
              }
            >
              <p>Cupo: {event.capacity}</p>
            </Card>
          ))}
        </div>
      )}

      {state.pagination && state.pagination.total_pages > 1 ? (
        <div className={styles.actions}>
          <p>
            Página {state.pagination.page} de {state.pagination.total_pages}
          </p>
        </div>
      ) : null}
    </main>
  );
}
