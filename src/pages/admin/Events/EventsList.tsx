import { useState } from "react";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import { Button } from "../../../components/Button/Button";
import { emptyDisplay } from "../../../components/DescriptionList/DescriptionList";
import { Modal } from "../../../components/Modal/Modal";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminEventList } from "../../../hooks/useAdminEvents";
import type { AdminEvent } from "../../../types/admin";
import { formatEventDateTime } from "../../../utils/eventDisplay";
import { ResourcePager } from "../ResourcePager";
import { EventRosterPanel } from "../Registrations/EventRosterPanel";
import styles from "../adminShared.module.scss";
import EventForm from "./EventForm";

export default function EventsList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { state, reload, remove } = useAdminEventList({ page, limit });
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);

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
    setStatusMessage("Evento cancelado.");
  }

  const loading = state.status === "loading";
  const failed = state.status === "error";
  const events = state.status === "success" ? state.events : [];
  const pagination = state.status === "success" ? state.pagination : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Eventos</h1>
        <Button
          leftIcon={<FiPlus />}
          aria-label="+ Crear evento"
          onClick={() => setCreateOpen(true)}
        >
          Crear evento
        </Button>
      </header>

      {statusMessage ? (
        <p
          className={styles.status}
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

      {removeError ? (
        <p
          className={styles.error}
          role="alert"
        >
          {removeError}
        </p>
      ) : null}

      {failed ? (
        <div
          className={styles.error}
          role="alert"
        >
          <p>{state.message}</p>
          <Button onClick={() => void reload()}>Reintentar</Button>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            {loading ? (
              <div className={styles.tableStatus}>
                <PadelLoader label="Cargando eventos..." />
              </div>
            ) : events.length === 0 ? (
              <p className={styles.tableStatus}>No hay eventos.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Categoría</th>
                    <th>Inicio</th>
                    <th>Cupo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>{event.title}</td>
                      <td>{emptyDisplay(event.category?.name)}</td>
                      <td>{formatEventDateTime(event.starts_at)}</td>
                      <td>{event.capacity}</td>
                      <td>{event.status_code}</td>
                      <td>
                        {pendingId === event.id ? (
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
                          <div className={styles.tableActions}>
                            <Button
                              size="sm"
                              variant="secondary"
                              iconOnly
                              aria-label="Ver/editar"
                              title="Ver/editar"
                              onClick={() => setSelectedEvent(event)}
                            >
                              <FiEdit2 aria-hidden="true" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              iconOnly
                              aria-label="Cancelar evento"
                              title="Cancelar evento"
                              disabled={event.status_code === "cancelled"}
                              onClick={() => setPendingId(event.id)}
                            >
                              <FiTrash2 aria-hidden="true" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {pagination ? (
            <ResourcePager
              page={pagination.page}
              totalPages={pagination.total_pages}
              total={pagination.total}
              limit={limit}
              noun="eventos"
              disabled={loading}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next);
                setPage(1);
              }}
            />
          ) : null}
        </>
      )}

      <Modal
        open={createOpen}
        title="Crear evento"
        onClose={() => setCreateOpen(false)}
        busy={formBusy}
      >
        <EventForm
          mode="create"
          onBusyChange={setFormBusy}
          onCancel={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            setStatusMessage("Evento creado.");
            void reload();
          }}
        />
      </Modal>

      <Modal
        open={selectedEvent != null}
        title="Ver/editar evento"
        onClose={() => setSelectedEvent(null)}
        busy={formBusy}
      >
        {selectedEvent ? (
          <div key={selectedEvent.id}>
            <EventForm
              key={`form-${selectedEvent.id}`}
              mode="edit"
              event={selectedEvent}
              onBusyChange={setFormBusy}
              onCancel={() => setSelectedEvent(null)}
              onSaved={(savedEvent) => {
                setSelectedEvent(savedEvent);
                setStatusMessage("Evento actualizado.");
                void reload();
              }}
            />
            <EventRosterPanel
              key={`roster-${selectedEvent.id}`}
              event={selectedEvent}
              onChanged={() => void reload()}
            />
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
