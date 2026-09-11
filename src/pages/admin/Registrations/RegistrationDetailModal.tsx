import { FormEvent, useEffect, useState } from "react";

import { Button } from "../../../components/Button/Button";
import {
  DescriptionList,
  emptyDisplay,
} from "../../../components/DescriptionList/DescriptionList";
import { Modal } from "../../../components/Modal/Modal";
import {
  isConnectionError,
  useConnection,
} from "../../../hooks/useConnection";
import { getAdminUserPath } from "../../../services/adminUsersApi";
import type { ApiResponse } from "../../../types";
import type {
  AdminRegistration,
  AdminUser,
  CatalogStatus,
} from "../../../types/admin";
import { formatEventDateTime } from "../../../utils/eventDisplay";
import shared from "../adminShared.module.scss";
import { catalogLabel, playerName } from "./playerDisplay";
import styles from "./RegistrationsPage.module.scss";

type RegistrationDetailModalProps = {
  registration: AdminRegistration | null;
  eventTitle: string;
  email: string | null | undefined;
  statuses: CatalogStatus[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (
    id: number,
    body: { status_code?: string; waitlist_position?: number | null },
  ) => Promise<string | null>;
};

export function RegistrationDetailModal({
  registration,
  eventTitle,
  email,
  statuses,
  saving,
  error,
  onClose,
  onSave,
}: RegistrationDetailModalProps) {
  const connection = useConnection();
  const [editing, setEditing] = useState(false);
  const [statusCode, setStatusCode] = useState("");
  const [position, setPosition] = useState("");
  const [resolvedEmail, setResolvedEmail] = useState<string | null | undefined>(
    email,
  );

  useEffect(() => {
    setResolvedEmail(email);
  }, [email]);

  useEffect(() => {
    if (!registration || email != null) {
      return;
    }

    let cancelled = false;

    async function loadEmail() {
      const result = await connection<ApiResponse<AdminUser>>({
        url: getAdminUserPath(registration.user_id),
      });

      if (cancelled || isConnectionError(result)) {
        return;
      }

      setResolvedEmail(result.data?.email ?? null);
    }

    void loadEmail();

    return () => {
      cancelled = true;
    };
  }, [connection, email, registration]);

  useEffect(() => {
    if (!registration) {
      setEditing(false);
      return;
    }

    setStatusCode(registration.status_code);
    setPosition(
      registration.waitlist_position == null
        ? ""
        : String(registration.waitlist_position),
    );
    setEditing(false);
  }, [registration]);

  const writableStatuses = statuses.filter(
    (status) => status.code === "confirmed" || status.code === "waitlisted",
  );
  const statusOptions =
    writableStatuses.length > 0
      ? writableStatuses
      : registration
        ? [{ code: registration.status_code, label: registration.status_code }]
        : [];

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!registration || saving) {
      return;
    }

    const body: {
      status_code?: string;
      waitlist_position?: number | null;
    } = { status_code: statusCode };

    if (statusCode === "waitlisted") {
      body.waitlist_position = position ? Number(position) : null;
    } else {
      body.waitlist_position = null;
    }

    const saveError = await onSave(registration.id, body);

    if (!saveError) {
      setEditing(false);
    }
  }

  return (
    <Modal
      open={registration != null}
      title={editing ? "Editar inscripción" : "Detalle de inscripción"}
      onClose={onClose}
      busy={saving}
    >
      {registration && !editing ? (
        <>
          <DescriptionList
            items={[
              {
                label: "Nombre",
                value: playerName(registration, resolvedEmail),
              },
              { label: "Correo", value: emptyDisplay(resolvedEmail) },
              { label: "ID del usuario", value: registration.user_id },
              { label: "Evento", value: emptyDisplay(eventTitle) },
              {
                label: "Estado",
                value: catalogLabel(registration.status_code, statuses),
              },
              {
                label: "Posición en lista de espera",
                value:
                  registration.status_code === "waitlisted"
                    ? emptyDisplay(registration.waitlist_position)
                    : "—",
              },
              {
                label: "Fecha de inscripción",
                value: formatEventDateTime(registration.created_at),
              },
            ]}
          />
          {error ? (
            <p
              className={shared.error}
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cerrar
            </Button>
            <Button onClick={() => setEditing(true)}>Editar inscripción</Button>
          </div>
        </>
      ) : null}
      {registration && editing ? (
        <form
          className={shared.form}
          onSubmit={(formEvent) => void handleSave(formEvent)}
        >
          <label className={shared.field}>
            <span className={shared.label}>Estado</span>
            <select
              className={shared.select}
              value={statusCode}
              onChange={(changeEvent) => setStatusCode(changeEvent.target.value)}
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
          </label>
          {statusCode === "waitlisted" ? (
            <label className={shared.field}>
              <span className={shared.label}>Posición en lista de espera</span>
              <input
                className={shared.input}
                type="number"
                min={1}
                value={position}
                onChange={(changeEvent) => setPosition(changeEvent.target.value)}
              />
            </label>
          ) : null}
          {error ? (
            <p
              className={shared.error}
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <div className={styles.modalActions}>
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setEditing(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saving}
            >
              Guardar
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}
