import { FormEvent, useState } from "react";

import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminAuditLogs } from "../../../hooks/useAdminAuditLogs";
import { AUDIT_ACTIONS } from "../../../types/admin";
import { formatEventDateTime } from "../../../utils/eventDisplay";
import styles from "../adminShared.module.scss";

function stringifyJson(value: unknown): string {
  if (value == null) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [targetUserIdInput, setTargetUserIdInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [action, setAction] = useState("");
  const { state, reload } = useAdminAuditLogs({
    page,
    target_user_id: targetUserId,
    action,
  });

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setTargetUserId(targetUserIdInput.trim());
    setAction(actionInput);
  }

  if (state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando auditoría..." />
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
        <h1>Auditoría</h1>
      </header>

      <form
        className={styles.filters}
        onSubmit={handleFilter}
      >
        <label className={styles.field}>
          <span className={styles.label}>Usuario objetivo</span>
          <input
            className={styles.input}
            name="target_user_id"
            value={targetUserIdInput}
            onChange={(changeEvent) =>
              setTargetUserIdInput(changeEvent.target.value)
            }
            placeholder="UUID"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Acción</span>
          <select
            className={styles.select}
            name="action"
            value={actionInput}
            onChange={(changeEvent) => setActionInput(changeEvent.target.value)}
          >
            <option value="">Todas</option>
            {AUDIT_ACTIONS.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">Filtrar</Button>
      </form>

      {state.pagination ? (
        <p>
          Página {state.pagination.page} de {state.pagination.total_pages} (
          {state.pagination.total} registros)
        </p>
      ) : null}

      {state.logs.length === 0 ? (
        <p className={styles.message}>No hay registros de auditoría.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Actor</th>
                <th>Objetivo</th>
                <th>Razón</th>
                <th>Antes</th>
                <th>Después</th>
              </tr>
            </thead>
            <tbody>
              {state.logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatEventDateTime(log.created_at)}</td>
                  <td>{log.action}</td>
                  <td>{log.actor_user_id}</td>
                  <td>{log.target_user_id}</td>
                  <td>{log.reason}</td>
                  <td>{stringifyJson(log.previous_values)}</td>
                  <td>{stringifyJson(log.new_values)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.pagination && state.pagination.total_pages > 1 ? (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Anterior
          </Button>
          <Button
            variant="secondary"
            disabled={page >= state.pagination.total_pages}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </Button>
        </div>
      ) : null}
    </main>
  );
}
