import { FormEvent, useState } from "react";

import { Button } from "../../../components/Button/Button";
import {
  DescriptionList,
  emptyDisplay,
} from "../../../components/DescriptionList/DescriptionList";
import { Modal } from "../../../components/Modal/Modal";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminAuditLogs } from "../../../hooks/useAdminAuditLogs";
import type { AuditLog } from "../../../types/admin";
import { AUDIT_ACTIONS } from "../../../types/admin";
import { formatEventDateTime } from "../../../utils/eventDisplay";
import { ResourcePager } from "../ResourcePager";
import styles from "../adminShared.module.scss";

function stringifyJson(value: unknown): string {
  if (value == null) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [targetUserIdInput, setTargetUserIdInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [action, setAction] = useState("");
  const { state, reload } = useAdminAuditLogs({
    page,
    limit,
    target_user_id: targetUserId,
    action,
  });
  const [detail, setDetail] = useState<AuditLog | null>(null);

  function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setTargetUserId(targetUserIdInput.trim());
    setAction(actionInput);
  }

  const loading = state.status === "loading";
  const failed = state.status === "error";
  const logs = state.status === "success" ? state.logs : [];
  const pagination = state.status === "success" ? state.pagination : null;

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
                <PadelLoader label="Cargando auditoría..." />
              </div>
            ) : logs.length === 0 ? (
              <p className={styles.tableStatus}>No hay registros de auditoría.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Acción</th>
                    <th>Actor</th>
                    <th>Objetivo</th>
                    <th>Razón</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatEventDateTime(log.created_at)}</td>
                      <td>{log.action}</td>
                      <td>{emptyDisplay(log.actor_user_id)}</td>
                      <td>{emptyDisplay(log.target_user_id)}</td>
                      <td>{emptyDisplay(log.reason)}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDetail(log)}
                          >
                            Ver detalles
                          </Button>
                        </div>
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
              noun="registros"
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
        open={detail != null}
        title={detail ? `Auditoría ${detail.id}` : "Detalle"}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <DescriptionList
            items={[
              { label: "Id", value: emptyDisplay(detail.id) },
              { label: "Acción", value: detail.action },
              {
                label: "Fecha",
                value: formatEventDateTime(detail.created_at),
              },
              { label: "Actor", value: emptyDisplay(detail.actor_user_id) },
              { label: "Objetivo", value: emptyDisplay(detail.target_user_id) },
              { label: "Razón", value: emptyDisplay(detail.reason) },
              {
                label: "Antes",
                value: (
                  <pre className={styles.json}>
                    {emptyDisplay(stringifyJson(detail.previous_values))}
                  </pre>
                ),
              },
              {
                label: "Después",
                value: (
                  <pre className={styles.json}>
                    {emptyDisplay(stringifyJson(detail.new_values))}
                  </pre>
                ),
              },
            ]}
          />
        ) : null}
      </Modal>
    </main>
  );
}
