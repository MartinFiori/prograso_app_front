import { useEffect, useMemo, useState } from "react";
import { FiEye, FiPlus, FiTrash2 } from "react-icons/fi";

import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import {
  ADMIN_REGISTRATIONS_TABLE_LIMIT,
  useAdminRegistrations,
  useRegistrationStatuses,
} from "../../../hooks/useAdminRegistrations";
import type { AdminEvent, AdminRegistration } from "../../../types/admin";
import { formatEventDateTime } from "../../../utils/eventDisplay";
import { ResourcePager } from "../ResourcePager";
import shared from "../adminShared.module.scss";
import { AddPlayerModal } from "./AddPlayerModal";
import { RegistrationDetailModal } from "./RegistrationDetailModal";
import { RemovePlayerModal } from "./RemovePlayerModal";
import styles from "./RegistrationsPage.module.scss";
import { catalogLabel, matchesPlayerSearch, playerName } from "./playerDisplay";

type EventRosterPanelProps = {
  event: AdminEvent;
  onChanged: () => void;
};

export function EventRosterPanel({ event, onChanged }: EventRosterPanelProps) {
  const statuses = useRegistrationStatuses();
  const list = useAdminRegistrations(event.id);
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
  const [markingPaidUserId, setMarkingPaidUserId] = useState<string | null>(null);
  const [paidError, setPaidError] = useState<string | null>(null);
  const [pendingRemove, setPendingRemove] = useState<AdminRegistration | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

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
    () => registrations.filter((row) => matchesPlayerSearch(row, emails[row.user_id], query)),
    [emails, query, registrations],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / tableLimit) || 1);
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * tableLimit, safePage * tableLimit);

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
    setPaidError(null);
    setMarkingPaidUserId(null);
  }, [event.id]);

  useEffect(() => {
    if (detail == null || detail.event_id !== event.id) return;
    const next = registrations.find((row) => row.id === detail.id);
    if (next && next !== detail) setDetail(next);
  }, [detail, event.id, registrations]);

  async function handleCreate(userId: string) {
    if (creating) return;
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
    onChanged();
  }

  async function handleUpdate(
    id: number,
    body: { status_code?: string; waitlist_position?: number | null },
  ): Promise<string | null> {
    if (saving) return "La inscripción se está guardando.";
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
    onChanged();
    return null;
  }

  async function handleMarkPaid(registration: AdminRegistration) {
    if (markingPaidUserId || registration.has_paid === true) return;
    setMarkingPaidUserId(registration.user_id);
    setPaidError(null);
    const error = await list.markPaid(registration.user_id);
    setMarkingPaidUserId(null);
    if (error) {
      setPaidError(error);
      return;
    }
    setStatusMessage("Pago actualizado.");
    onChanged();
  }

  async function handleRemove() {
    if (!pendingRemove || removing) return;
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
    onChanged();
  }

  return (
    <section aria-labelledby={`event-${event.id}-roster-title`}>
      <div className={styles.rosterHead}>
        <div>
          <h2 id={`event-${event.id}-roster-title`} className={styles.rosterTitle}>
            Jugadores inscriptos
          </h2>
          <p className={styles.rosterCount}>{registrations.length} jugadores en este evento</p>
        </div>
        <Button leftIcon={<FiPlus />} onClick={() => setAddOpen(true)}>
          Agregar jugador
        </Button>
      </div>

      {statusMessage ? <p className={shared.status} role="status">{statusMessage}</p> : null}
      {meta ? (
        <div className={styles.metrics}>
          <div className={styles.metric}><span className={styles.metricLabel}>Cupo</span><span className={styles.metricValue}>{meta.capacity}</span></div>
          <div className={styles.metric}><span className={styles.metricLabel}>Confirmados</span><span className={styles.metricValue}>{meta.confirmed_count}</span></div>
          <div className={styles.metric}><span className={styles.metricLabel}>En espera</span><span className={styles.metricValue}>{meta.waitlisted_count}</span></div>
        </div>
      ) : null}
      {paidError ? <p className={shared.error} role="alert">{paidError}</p> : null}

      <label className={`${shared.field} ${styles.searchField}`}>
        <span className={shared.label}>Buscar</span>
        <input
          className={shared.input}
          value={query}
          onChange={(changeEvent) => { setQuery(changeEvent.target.value); setPage(1); }}
          placeholder="Buscar por nombre o correo"
        />
      </label>

      <div className={shared.tableWrap}>
        {list.state.status === "loading" ? (
          <div className={shared.tableStatus}><PadelLoader label="Cargando inscripciones..." /></div>
        ) : list.state.status === "error" ? (
          <div className={shared.error} role="alert"><p>{list.state.message}</p><Button onClick={() => void list.reload()}>Reintentar</Button></div>
        ) : registrations.length === 0 ? (
          <p className={shared.tableStatus}>No hay jugadores inscriptos en este evento.</p>
        ) : filtered.length === 0 ? (
          <p className={shared.tableStatus}>No hay resultados para esa búsqueda.</p>
        ) : (
          <table className={shared.table}>
            <thead><tr><th>Jugador</th><th>Correo</th><th>Estado</th><th>Pago</th><th>Lista de espera</th><th>Inscripción</th><th>Acciones</th></tr></thead>
            <tbody>
              {pageRows.map((registration) => {
                const email = emails[registration.user_id];
                const confirmed = registration.status_code === "confirmed";
                return (
                  <tr key={registration.id}>
                    <td><span className={styles.playerName}>{playerName(registration, email)}</span></td>
                    <td>{email?.trim() ? email : "—"}</td>
                    <td><span className={`${styles.tag} ${confirmed ? styles.tagConfirmed : styles.tagWaitlisted}`}>{catalogLabel(registration.status_code, statuses)}</span></td>
                    <td>{registration.has_paid === true ? "Pagado" : "Pendiente"}</td>
                    <td>{confirmed ? "—" : registration.waitlist_position ?? "—"}</td>
                    <td>{formatEventDateTime(registration.created_at)}</td>
                    <td><div className={styles.rowActions}>
                      {registration.has_paid !== true ? (
                        <Button size="sm" variant="secondary" loading={markingPaidUserId === registration.user_id} disabled={markingPaidUserId != null} onClick={() => void handleMarkPaid(registration)}>
                          Marcar como pagado
                        </Button>
                      ) : null}
                      <Button size="sm" variant="secondary" iconOnly aria-label="Ver detalles" title="Ver detalles" onClick={() => setDetail(registration)}><FiEye aria-hidden="true" /></Button>
                      <Button size="sm" variant="ghost" iconOnly aria-label="Quitar del evento" title="Quitar del evento" onClick={() => setPendingRemove(registration)}><FiTrash2 aria-hidden="true" /></Button>
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length > 0 ? (
        <ResourcePager page={safePage} totalPages={totalPages} total={filtered.length} limit={tableLimit} noun="jugadores" disabled={list.state.status === "loading"} onPageChange={setPage} onLimitChange={(next) => { setTableLimit(next); setPage(1); }} />
      ) : null}

      <AddPlayerModal open={addOpen} eventTitle={event.title} registeredUserIds={registeredUserIds} creating={creating} error={createError} onClose={() => { if (!creating) { setAddOpen(false); setCreateError(null); } }} onSubmit={handleCreate} />
      <RegistrationDetailModal registration={detail} eventTitle={event.title} email={detail ? emails[detail.user_id] : undefined} statuses={statuses} saving={saving} error={detailError} onClose={() => { if (!saving) { setDetail(null); setDetailError(null); } }} onSave={handleUpdate} />
      <RemovePlayerModal open={pendingRemove != null} playerName={pendingRemove ? playerName(pendingRemove, emails[pendingRemove.user_id]) : ""} eventTitle={event.title} busy={removing} error={removeError} onClose={() => { if (!removing) { setPendingRemove(null); setRemoveError(null); } }} onConfirm={() => void handleRemove()} />
    </section>
  );
}
