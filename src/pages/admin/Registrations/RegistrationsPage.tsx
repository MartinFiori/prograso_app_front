import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "../../../components/Button/Button";
import {
  DescriptionList,
  emptyDisplay,
} from "../../../components/DescriptionList/DescriptionList";
import { Modal } from "../../../components/Modal/Modal";
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
import { formatEventDateTime } from "../../../utils/eventDisplay";
import { ResourcePager } from "../ResourcePager";
import styles from "../adminShared.module.scss";

const PICKER_LIMIT = 100;

function RegistrationRow({
  registration,
  statuses,
  onSave,
  onRemoveFromSet,
  onDetails,
}: {
  registration: AdminRegistration;
  statuses: { code: string; label: string }[];
  onSave: (
    id: number,
    body: { status_code?: string; waitlist_position?: number | null },
  ) => Promise<string | null>;
  onRemoveFromSet: (userId: string) => void;
  onDetails: (registration: AdminRegistration) => void;
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
        <div className={styles.tableActions}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onDetails(registration)}
          >
            Ver detalles
          </Button>
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
  const [createOpen, setCreateOpen] = useState(false);
  const [createUserId, setCreateUserId] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminRegistration | null>(null);

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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!createUserId.trim()) {
      setCreateError("El user_id es obligatorio.");
      return;
    }

    setCreating(true);
    setCreateError(null);
    const error = await list.create(createUserId.trim());
    setCreating(false);

    if (error) {
      setCreateError(error);
      return;
    }

    setCreateOpen(false);
    setCreateUserId("");
    setStatusMessage("Inscripción creada.");
  }

  const loadingList = list.state.status === "loading" || options.loading;
  const pagination =
    list.state.status === "success" ? list.state.pagination : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Inscripciones</h1>
        {eventId != null ? (
          <Button onClick={() => setCreateOpen(true)}>+ Crear inscripción</Button>
        ) : null}
      </header>

      {statusMessage ? (
        <p
          className={styles.status}
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

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
          {list.state.status === "success" && list.state.meta ? (
            <div className={styles.meta}>
              <p>Cupo: {list.state.meta.capacity}</p>
              <p>Confirmados: {list.state.meta.confirmed_count}</p>
              <p>En espera: {list.state.meta.waitlisted_count}</p>
            </div>
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

          <div className={styles.tableWrap}>
            {loadingList ? (
              <div className={styles.tableStatus}>
                <PadelLoader label="Cargando inscripciones..." />
              </div>
            ) : list.state.status === "success" &&
              list.state.registrations.length === 0 ? (
              <p className={styles.tableStatus}>
                No hay inscripciones en este evento.
              </p>
            ) : list.state.status === "success" ? (
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
                      onDetails={setDetail}
                    />
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>

          {pagination ? (
            <ResourcePager
              page={list.page}
              totalPages={pagination.total_pages}
              total={pagination.total}
              limit={list.tableLimit}
              noun="inscripciones"
              disabled={loadingList}
              onPageChange={list.setPage}
              onLimitChange={(next) => {
                list.setTableLimit(next);
                list.setPage(1);
              }}
            />
          ) : null}
        </>
      )}

      <Modal
        open={createOpen}
        title="Crear inscripción"
        onClose={() => {
          if (!creating) {
            setCreateOpen(false);
            setCreateError(null);
            setCreateUserId("");
          }
        }}
        busy={creating}
      >
        <form
          className={styles.form}
          onSubmit={(formEvent) => void handleCreate(formEvent)}
        >
          <label className={styles.field}>
            <span className={styles.label}>user_id *</span>
            <input
              className={styles.input}
              name="user_id"
              value={createUserId}
              onChange={(changeEvent) => setCreateUserId(changeEvent.target.value)}
              required
            />
          </label>
          {createError ? (
            <p
              className={styles.error}
              role="alert"
            >
              {createError}
            </p>
          ) : null}
          <Button
            type="submit"
            loading={creating}
          >
            Crear
          </Button>
        </form>
      </Modal>

      <Modal
        open={detail != null}
        title={
          detail
            ? `Inscripción ${detail.id}`
            : "Detalle"
        }
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <DescriptionList
            items={[
              { label: "Id", value: emptyDisplay(detail.id) },
              { label: "Evento", value: emptyDisplay(detail.event_id) },
              { label: "Usuario", value: detail.user_id },
              {
                label: "Nombre",
                value: emptyDisplay(detail.profile?.name),
              },
              { label: "Estado", value: detail.status_code },
              {
                label: "Espera",
                value: emptyDisplay(detail.waitlist_position),
              },
              {
                label: "Creada",
                value: formatEventDateTime(detail.created_at),
              },
              {
                label: "Actualizada",
                value: formatEventDateTime(detail.updated_at),
              },
            ]}
          />
        ) : null}
      </Modal>
    </main>
  );
}
