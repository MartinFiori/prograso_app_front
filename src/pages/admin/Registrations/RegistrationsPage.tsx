import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import {
  parseEventIdParam,
  useAdminEventsOptions,
  useAdminRegistrations,
  useRegistrationStatuses,
} from "../../../hooks/useAdminRegistrations";
import { isConnectionError, useConnection } from "../../../hooks/useConnection";
import { listAdminUsersPath } from "../../../services/adminUsersApi";
import type { ApiResponse } from "../../../types";
import type { AdminRegistration, AdminUser } from "../../../types/admin";
import { formatConnectionError } from "../../../utils/apiError";
import styles from "../adminShared.module.scss";

const PICKER_LIMIT = 100;

function RegistrationRow({
  registration,
  statuses,
  onSave,
  onRemoveFromSet,
}: {
  registration: AdminRegistration;
  statuses: { code: string; label: string }[];
  onSave: (
    id: number,
    body: { status_code?: string; waitlist_position?: number | null },
  ) => Promise<string | null>;
  onRemoveFromSet: (userId: string) => void;
}) {
  const writableStatuses = statuses.filter(
    (status) => status.code === "confirmed" || status.code === "waitlisted",
  );
  const statusOptions =
    writableStatuses.length > 0
      ? writableStatuses
      : [{ code: registration.status_code, label: registration.status_code }];
  const [statusCode, setStatusCode] = useState(registration.status_code);
  const [position, setPosition] = useState(
    registration.waitlist_position == null
      ? ""
      : String(registration.waitlist_position),
  );
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setRowError(null);

    const body: {
      status_code?: string;
      waitlist_position?: number | null;
    } = { status_code: statusCode };

    if (statusCode === "waitlisted") {
      body.waitlist_position = position ? Number(position) : null;
    }

    const error = await onSave(registration.id, body);
    setBusy(false);

    if (error) {
      setRowError(error);
    }
  }

  return (
    <tr>
      <td>{registration.profile?.name ?? registration.user_id}</td>
      <td>{registration.user_id}</td>
      <td>
        <select
          className={styles.select}
          value={statusCode}
          onChange={(event) => setStatusCode(event.target.value)}
          aria-label={`Estado de ${registration.user_id}`}
        >
          {statusOptions.map((status) => (
            <option
              key={status.code}
              value={status.code}
            >
              {status.label}
            </option>
          ))}
        </select>
      </td>
      <td>
        <input
          className={styles.input}
          type="number"
          min={1}
          value={position}
          onChange={(event) => setPosition(event.target.value)}
          disabled={statusCode !== "waitlisted"}
          aria-label={`Posición de espera de ${registration.user_id}`}
        />
      </td>
      <td>
        <div className={styles.actions}>
          <Button
            size="sm"
            loading={busy}
            onClick={() => void save()}
          >
            Guardar
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={() => onRemoveFromSet(registration.user_id)}
          >
            Quitar del conjunto
          </Button>
        </div>
        {rowError ? (
          <p
            className={styles.error}
            role="alert"
          >
            {rowError}
          </p>
        ) : null}
      </td>
    </tr>
  );
}

export default function RegistrationsPage() {
  const navigate = useNavigate();
  const { eventId: rawEventId } = useParams();
  const eventId = parseEventIdParam(rawEventId);
  const options = useAdminEventsOptions();
  const statuses = useRegistrationStatuses();
  const list = useAdminRegistrations(eventId);
  const connection = useConnection();
  const [query, setQuery] = useState("");
  const [pickerUsers, setPickerUsers] = useState<AdminUser[]>([]);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function onSelectEvent(nextId: string) {
    if (!nextId) {
      navigate("/admin/inscripciones");
      return;
    }

    navigate(`/admin/inscripciones/${nextId}`);
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    setPickerError(null);

    const result = await connection<ApiResponse<AdminUser[]>>({
      url: listAdminUsersPath({ page: 1, limit: PICKER_LIMIT, q: query }),
    });

    setSearching(false);

    if (isConnectionError(result)) {
      setPickerError(formatConnectionError(result));
      return;
    }

    setPickerUsers(result.data ?? []);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const error = await list.sync();
    setSaving(false);

    if (error) {
      setSaveError(error);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Inscripciones</h1>
      </header>

      <label className={styles.field}>
        <span className={styles.label}>Evento</span>
        <select
          className={styles.select}
          value={eventId ?? ""}
          onChange={(event) => onSelectEvent(event.target.value)}
          aria-label="Evento"
        >
          <option value="">Elegí un evento</option>
          {options.events.map((eventItem) => (
            <option
              key={eventItem.id}
              value={eventItem.id}
            >
              {eventItem.title} ({eventItem.status_code})
            </option>
          ))}
        </select>
      </label>

      {options.error ? (
        <p
          className={styles.error}
          role="alert"
        >
          {options.error}
        </p>
      ) : null}

      {eventId === null ? (
        <p className={styles.message}>Elegí un evento para ver inscripciones.</p>
      ) : list.state.status === "loading" || options.loading ? (
        <PadelLoader label="Cargando inscripciones..." />
      ) : list.state.status === "error" ? (
        <div
          className={styles.error}
          role="alert"
        >
          <p>{list.state.message}</p>
          <Button onClick={() => void list.reload()}>Reintentar</Button>
        </div>
      ) : (
        <>
          {list.state.meta ? (
            <div className={styles.meta}>
              <p>Cupo: {list.state.meta.capacity}</p>
              <p>Confirmados: {list.state.meta.confirmed_count}</p>
              <p>En espera: {list.state.meta.waitlisted_count}</p>
            </div>
          ) : null}

          {list.state.pagination ? (
            <p>
              Página {list.state.pagination.page} de{" "}
              {list.state.pagination.total_pages} ({list.state.pagination.total}{" "}
              inscripciones)
            </p>
          ) : null}

          <p>Conjunto deseado: {list.desiredUserIds.length} usuarios</p>

          <form
            className={styles.filters}
            onSubmit={(formEvent) => void handleSearch(formEvent)}
          >
            <label className={styles.field}>
              <span className={styles.label}>Buscar usuarios</span>
              <input
                className={styles.input}
                value={query}
                onChange={(changeEvent) => setQuery(changeEvent.target.value)}
                name="q"
                aria-label="Buscar usuarios"
              />
            </label>
            <Button
              type="submit"
              loading={searching}
            >
              Buscar
            </Button>
          </form>

          {pickerError ? (
            <p
              className={styles.error}
              role="alert"
            >
              {pickerError}
            </p>
          ) : null}

          {pickerUsers.length > 0 ? (
            <ul>
              {pickerUsers.map((user) => (
                <li key={user.id}>
                  {user.name ?? user.email ?? user.id}
                  <Button
                    size="sm"
                    onClick={() => {
                      const error = list.addDesired(user.id);
                      if (error) {
                        setPickerError(error);
                      }
                    }}
                  >
                    Agregar
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className={styles.actions}>
            <Button
              onClick={() => void handleSave()}
              loading={saving}
            >
              Guardar conjunto
            </Button>
          </div>

          {saveError ? (
            <p
              className={styles.error}
              role="alert"
            >
              {saveError}
            </p>
          ) : null}

          {list.state.registrations.length === 0 ? (
            <p className={styles.message}>No hay inscripciones en este evento.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Usuario</th>
                    <th>Estado</th>
                    <th>Espera</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {list.state.registrations.map((registration) => (
                    <RegistrationRow
                      key={registration.id}
                      registration={registration}
                      statuses={statuses}
                      onSave={list.update}
                      onRemoveFromSet={list.removeDesired}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {list.state.pagination && list.state.pagination.total_pages > 1 ? (
            <div className={styles.actions}>
              <Button
                variant="secondary"
                disabled={list.page <= 1}
                onClick={() => list.setPage((current) => Math.max(1, current - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                disabled={list.page >= list.state.pagination.total_pages}
                onClick={() => list.setPage((current) => current + 1)}
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}
