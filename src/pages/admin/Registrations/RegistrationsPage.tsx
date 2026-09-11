import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import {
  ADMIN_REGISTRATIONS_TABLE_LIMIT,
  parseEventIdParam,
  useAdminEventsOptions,
  useAdminRegistrations,
  useRegistrationStatuses,
} from "../../../hooks/useAdminRegistrations";
import type { AdminRegistration } from "../../../types/admin";
import {
  formatEventDateTime,
  statusLabel,
} from "../../../utils/eventDisplay";
import { ResourcePager } from "../ResourcePager";
import shared from "../adminShared.module.scss";
import { AddPlayerModal } from "./AddPlayerModal";
import { RegistrationDetailModal } from "./RegistrationDetailModal";
import { RemovePlayerModal } from "./RemovePlayerModal";
import styles from "./RegistrationsPage.module.scss";
import {
  catalogLabel,
  matchesPlayerSearch,
  playerName,
} from "./playerDisplay";

export default function RegistrationsPage() {
  const navigate = useNavigate();
  const { eventId: rawEventId } = useParams();
  const eventId = parseEventIdParam(rawEventId);
  const options = useAdminEventsOptions();
  const statuses = useRegistrationStatuses();
  const list = useAdminRegistrations(eventId);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [tableLimit, setTableLimit] = useState(ADMIN_REGISTRATIONS_TABLE_LIMIT);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminRegistration | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<AdminRegistration | null>(
    null,
  );
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const selectedEvent = options.events.find((event) => event.id === eventId);
  const eventTitle = selectedEvent?.title ?? "";
  const emails = useMemo(
    () => (list.state.status === "success" ? list.state.emails : {}),
    [list.state],
  );
  const registrations = useMemo(
    () => (list.state.status === "success" ? list.state.registrations : []),
    [list.state],
  );
  const meta = list.state.status === "success" ? list.state.meta : null;
  const registeredUserIds = useMemo(
    () => new Set(registrations.map((row) => row.user_id)),
    [registrations],
  );
  const filtered = useMemo(
    () =>
      registrations.filter((row) =>
        matchesPlayerSearch(row, emails[row.user_id], query),
      ),
    [emails, query, registrations],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / tableLimit) || 1);
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * tableLimit,
    safePage * tableLimit,
  );

  useEffect(() => {
    setQuery("");
    setPage(1);
    setAddOpen(false);
    setCreateError(null);
    setDetail(null);
    setDetailError(null);
    setPendingRemove(null);
    setRemoveError(null);
    setStatusMessage(null);
  }, [eventId]);

  function onSelectEvent(nextId: string) {
    if (!nextId) {
      navigate("/admin/inscripciones");
      return;
    }

    navigate(`/admin/inscripciones/${nextId}`);
  }

  async function handleCreate(userId: string) {
    if (creating) {
      return;
    }

    setCreating(true);
    setCreateError(null);
    const error = await list.create(userId);
    setCreating(false);

    if (error) {
      setCreateError(error);
      return;
    }

    setAddOpen(false);
    setStatusMessage("Jugador agregado.");
  }

  async function handleUpdate(
    id: number,
    body: { status_code?: string; waitlist_position?: number | null },
  ): Promise<string | null> {
    if (saving) {
      return "La inscripción se está guardando.";
    }

    setSaving(true);
    setDetailError(null);
    const error = await list.update(id, body);
    setSaving(false);

    if (error) {
      setDetailError(error);
      return error;
    }

    setStatusMessage("Inscripción actualizada.");
    setDetail(null);
    return null;
  }

  async function handleRemove() {
    if (!pendingRemove || removing) {
      return;
    }

    setRemoving(true);
    setRemoveError(null);
    const error = await list.remove(pendingRemove.id);
    setRemoving(false);

    if (error) {
      setRemoveError(error);
      return;
    }

    setPendingRemove(null);
    setStatusMessage("Jugador quitado del evento.");
  }

  const loadingList = list.state.status === "loading" || options.loading;
  const eventStatusText = selectedEvent
    ? statusLabel(selectedEvent.status_code, options.statuses)
    : null;

  return (
    <main className={shared.page}>
      <header className={`${shared.header} ${styles.header}`}>
        <div className={styles.headerCopy}>
          <h1>Inscripciones</h1>
          <p className={styles.lede}>
            Gestioná los jugadores inscriptos en cada evento
          </p>
        </div>
        <Button
          disabled={eventId == null}
          onClick={() => {
            if (eventId != null) {
              setAddOpen(true);
            }
          }}
        >
          Agregar jugador
        </Button>
      </header>

      {statusMessage ? (
        <p
          className={shared.status}
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

      <section className={styles.card}>
        <div className={styles.eventRow}>
          <label className={`${shared.field} ${styles.eventField}`}>
            <span className={shared.label}>Evento</span>
            <select
              className={shared.select}
              value={eventId ?? ""}
              onChange={(event) => onSelectEvent(event.target.value)}
              disabled={options.loading}
            >
              <option value="">Elegí un evento</option>
              {options.events.map((eventItem) => {
                const date = formatEventDateTime(eventItem.starts_at);
                const status = statusLabel(
                  eventItem.status_code,
                  options.statuses,
                );

                return (
                  <option
                    key={eventItem.id}
                    value={eventItem.id}
                  >
                    {eventItem.title} — {date} — {status}
                  </option>
                );
              })}
            </select>
          </label>
          {eventStatusText ? (
            <span className={styles.statusTag}>{eventStatusText}</span>
          ) : null}
        </div>
      </section>

      {options.error ? (
        <p
          className={shared.error}
          role="alert"
        >
          {options.error}
        </p>
      ) : null}

      {!options.loading && options.events.length === 0 && !options.error ? (
        <p className={shared.message}>No hay eventos.</p>
      ) : null}

      {eventId === null ? (
        <p className={shared.message}>
          Elegí un evento para ver los jugadores inscriptos.
        </p>
      ) : list.state.status === "error" ? (
        <div
          className={shared.error}
          role="alert"
        >
          <p>{list.state.message}</p>
          <Button onClick={() => void list.reload()}>Reintentar</Button>
        </div>
      ) : (
        <>
          {meta ? (
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Cupo</span>
                <span className={styles.metricValue}>{meta.capacity}</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Confirmados</span>
                <span className={styles.metricValue}>
                  {meta.confirmed_count}
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>En espera</span>
                <span className={styles.metricValue}>
                  {meta.waitlisted_count}
                </span>
              </div>
            </div>
          ) : null}

          <section className={styles.card}>
            <div className={styles.rosterHead}>
              <div>
                <h2 className={styles.rosterTitle}>Jugadores inscriptos</h2>
                <p className={styles.rosterCount}>
                  {registrations.length} jugadores en este evento
                </p>
              </div>
              <label className={`${shared.field} ${styles.searchField}`}>
                <span className={shared.label}>Buscar</span>
                <input
                  className={shared.input}
                  value={query}
                  onChange={(changeEvent) => {
                    setQuery(changeEvent.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar por nombre o correo"
                />
              </label>
            </div>

            <div className={shared.tableWrap}>
              {loadingList ? (
                <div className={shared.tableStatus}>
                  <PadelLoader label="Cargando inscripciones..." />
                </div>
              ) : registrations.length === 0 ? (
                <p className={shared.tableStatus}>
                  No hay jugadores inscriptos en este evento.
                </p>
              ) : filtered.length === 0 ? (
                <p className={shared.tableStatus}>
                  No hay resultados para esa búsqueda.
                </p>
              ) : (
                <table className={shared.table}>
                  <thead>
                    <tr>
                      <th>Jugador</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Lista de espera</th>
                      <th>Inscripción</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((registration) => {
                      const email = emails[registration.user_id];
                      const name = playerName(registration, email);
                      const confirmed = registration.status_code === "confirmed";

                      return (
                        <tr key={registration.id}>
                          <td>
                            <div className={styles.playerCell}>
                              <span className={styles.playerName}>{name}</span>
                            </div>
                          </td>
                          <td>{email?.trim() ? email : "—"}</td>
                          <td>
                            <span
                              className={`${styles.tag} ${
                                confirmed
                                  ? styles.tagConfirmed
                                  : styles.tagWaitlisted
                              }`}
                            >
                              {catalogLabel(registration.status_code, statuses)}
                            </span>
                          </td>
                          <td>
                            {confirmed
                              ? "—"
                              : registration.waitlist_position ?? "—"}
                          </td>
                          <td>
                            {formatEventDateTime(registration.created_at)}
                          </td>
                          <td>
                            <div className={styles.rowActions}>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setDetail(registration)}
                              >
                                Ver detalles
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPendingRemove(registration)}
                              >
                                Quitar del evento
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {filtered.length > 0 ? (
              <ResourcePager
                page={safePage}
                totalPages={totalPages}
                total={filtered.length}
                limit={tableLimit}
                noun="jugadores"
                disabled={loadingList}
                onPageChange={setPage}
                onLimitChange={(next) => {
                  setTableLimit(next);
                  setPage(1);
                }}
              />
            ) : null}
          </section>
        </>
      )}

      <AddPlayerModal
        open={addOpen}
        eventTitle={eventTitle || "este evento"}
        registeredUserIds={registeredUserIds}
        creating={creating}
        error={createError}
        onClose={() => {
          if (!creating) {
            setAddOpen(false);
            setCreateError(null);
          }
        }}
        onSubmit={handleCreate}
      />

      <RegistrationDetailModal
        registration={detail}
        eventTitle={eventTitle}
        email={detail ? emails[detail.user_id] : undefined}
        statuses={statuses}
        saving={saving}
        error={detailError}
        onClose={() => {
          if (!saving) {
            setDetail(null);
            setDetailError(null);
          }
        }}
        onSave={handleUpdate}
      />

      <RemovePlayerModal
        open={pendingRemove != null}
        playerName={
          pendingRemove
            ? playerName(pendingRemove, emails[pendingRemove.user_id])
            : ""
        }
        eventTitle={eventTitle || "este evento"}
        busy={removing}
        error={removeError}
        onClose={() => {
          if (!removing) {
            setPendingRemove(null);
            setRemoveError(null);
          }
        }}
        onConfirm={() => void handleRemove()}
      />
    </main>
  );
}
