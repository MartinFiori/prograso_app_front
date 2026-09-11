import { FormEvent, useEffect, useState } from "react";

import { Button } from "../../../components/Button/Button";
import { Modal } from "../../../components/Modal/Modal";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import {
  isConnectionError,
  useConnection,
} from "../../../hooks/useConnection";
import { listAdminUsersPath } from "../../../services/adminUsersApi";
import type { ApiResponse } from "../../../types";
import type { AdminUser } from "../../../types/admin";
import { formatConnectionError } from "../../../utils/apiError";
import shared from "../adminShared.module.scss";
import styles from "./RegistrationsPage.module.scss";

const PICKER_LIMIT = 100;

type AddPlayerModalProps = {
  open: boolean;
  eventTitle: string;
  registeredUserIds: Set<string>;
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (userId: string) => Promise<void>;
};

export function AddPlayerModal({
  open,
  eventTitle,
  registeredUserIds,
  creating,
  error,
  onClose,
  onSubmit,
}: AddPlayerModalProps) {
  const connection = useConnection();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery("");
    setSelectedId("");
    setLocalError(null);
    setSearchError(null);
    setUsers([]);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function search() {
      setSearching(true);
      setSearchError(null);

      const result = await connection<ApiResponse<AdminUser[]>>({
        url: listAdminUsersPath({
          page: 1,
          limit: PICKER_LIMIT,
          q: query,
        }),
      });

      if (cancelled) {
        return;
      }

      setSearching(false);

      if (isConnectionError(result)) {
        setSearchError(formatConnectionError(result));
        setUsers([]);
        return;
      }

      setUsers(result.data ?? []);
    }

    const timer = window.setTimeout(() => {
      void search();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [connection, open, query]);

  const available = users.filter((user) => !registeredUserIds.has(user.id));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (creating) {
      return;
    }

    if (!selectedId) {
      setLocalError("Seleccioná un usuario.");
      return;
    }

    setLocalError(null);
    await onSubmit(selectedId);
  }

  return (
    <Modal
      open={open}
      title="Agregar jugador"
      onClose={onClose}
      busy={creating}
    >
      <p className={styles.modalLede}>
        Seleccioná un usuario para agregarlo a {eventTitle}.
      </p>
      <form
        className={shared.form}
        onSubmit={(formEvent) => void handleSubmit(formEvent)}
      >
        <label className={shared.field}>
          <span className={shared.label}>Buscar jugador</span>
          <input
            className={shared.input}
            value={query}
            onChange={(changeEvent) => setQuery(changeEvent.target.value)}
            placeholder="Nombre o correo"
            autoComplete="off"
          />
        </label>
        {searching ? <PadelLoader label="Buscando usuarios..." /> : null}
        {searchError ? (
          <p
            className={shared.error}
            role="alert"
          >
            {searchError}
          </p>
        ) : null}
        {!searching && !searchError && available.length === 0 ? (
          <p className={shared.message}>
            {users.length === 0
              ? "No hay usuarios disponibles para agregar."
              : "No hay usuarios disponibles para agregar."}
          </p>
        ) : (
          <ul className={styles.userList}>
            {available.map((user) => {
              const label = user.name?.trim() || user.email || user.id;

              return (
                <li key={user.id}>
                  <button
                    type="button"
                    className={styles.userOption}
                    aria-pressed={selectedId === user.id}
                    onClick={() => setSelectedId(user.id)}
                  >
                    <span className={styles.userMeta}>
                      <strong>{label}</strong>
                      <span>{user.email ?? "—"}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {localError || error ? (
          <p
            className={shared.error}
            role="alert"
          >
            {localError ?? error}
          </p>
        ) : null}
        <div className={styles.modalActions}>
          <Button
            type="button"
            variant="secondary"
            disabled={creating}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={creating}
          >
            Agregar jugador
          </Button>
        </div>
      </form>
    </Modal>
  );
}
