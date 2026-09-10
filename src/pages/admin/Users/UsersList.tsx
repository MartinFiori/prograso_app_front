import { FormEvent, useState } from "react";

import { Button } from "../../../components/Button/Button";
import {
  DescriptionList,
  emptyDisplay,
} from "../../../components/DescriptionList/DescriptionList";
import { Modal } from "../../../components/Modal/Modal";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminUserList } from "../../../hooks/useAdminUsers";
import type { AdminUser } from "../../../types/admin";
import { formatEventDateTime } from "../../../utils/eventDisplay";
import { ResourcePager } from "../ResourcePager";
import styles from "../adminShared.module.scss";
import { UserAdminModal } from "./UserAdminModal";

const SORT_OPTIONS = [
  { value: "created_at.desc", label: "Creación (reciente)" },
  { value: "created_at.asc", label: "Creación (antigua)" },
  { value: "name.asc", label: "Nombre A-Z" },
  { value: "name.desc", label: "Nombre Z-A" },
  { value: "role.asc", label: "Rol A-Z" },
  { value: "role.desc", label: "Rol Z-A" },
] as const;

export default function UsersList() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<string>("created_at.desc");
  const { state, invite, reload } = useAdminUserList({ page, q, limit, sort });
  const [createOpen, setCreateOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUser | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQ(qInput.trim());
  }

  function resetInvite() {
    setEmail("");
    setName("");
    setRole("user");
    setInviteError(null);
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setInviteError("El email es obligatorio.");
      return;
    }

    setInviting(true);
    setInviteError(null);

    const body: { email: string; name?: string; role: "user" | "admin" } = {
      email: email.trim(),
      role,
    };

    if (name.trim()) {
      body.name = name.trim();
    }

    const error = await invite(body);
    setInviting(false);

    if (error) {
      setInviteError(error);
      return;
    }

    resetInvite();
    setCreateOpen(false);
    setStatusMessage("Usuario invitado.");
  }

  const loading = state.status === "loading";
  const failed = state.status === "error";
  const users = state.status === "success" ? state.users : [];
  const pagination = state.status === "success" ? state.pagination : null;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Usuarios</h1>
        <Button
          onClick={() => {
            resetInvite();
            setCreateOpen(true);
          }}
        >
          + Crear usuario
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

      <form
        className={styles.filters}
        onSubmit={handleSearch}
      >
        <label className={styles.field}>
          <span className={styles.label}>Buscar</span>
          <input
            className={styles.input}
            value={qInput}
            onChange={(changeEvent) => setQInput(changeEvent.target.value)}
            name="q"
            placeholder="Nombre o email"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Orden</span>
          <select
            className={styles.select}
            value={sort}
            aria-label="Orden"
            onChange={(changeEvent) => {
              setSort(changeEvent.target.value);
              setPage(1);
            }}
          >
            {SORT_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit">Buscar</Button>
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
                <PadelLoader label="Cargando usuarios..." />
              </div>
            ) : users.length === 0 ? (
              <p className={styles.tableStatus}>No hay usuarios.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Bloqueo</th>
                    <th>Suspensión</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{emptyDisplay(user.name)}</td>
                      <td>{emptyDisplay(user.email)}</td>
                      <td>{user.role}</td>
                      <td>
                        {user.event_registration_access.blocked
                          ? "bloqueado"
                          : "ok"}
                      </td>
                      <td>{user.auth_suspended ? "suspendido" : "ok"}</td>
                      <td>
                        <div className={styles.tableActions}>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDetail(user)}
                          >
                            Ver detalles
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setAdminUser(user)}
                          >
                            Administrar
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
              noun="usuarios"
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
        title="Crear usuario"
        onClose={() => {
          if (!inviting) {
            setCreateOpen(false);
            resetInvite();
          }
        }}
        busy={inviting}
      >
        <form
          className={styles.form}
          onSubmit={(formEvent) => void handleInvite(formEvent)}
        >
          <label className={styles.field}>
            <span className={styles.label}>Email *</span>
            <input
              className={styles.input}
              type="email"
              name="email"
              value={email}
              onChange={(changeEvent) => setEmail(changeEvent.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Nombre</span>
            <input
              className={styles.input}
              name="name"
              value={name}
              onChange={(changeEvent) => setName(changeEvent.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Rol</span>
            <select
              className={styles.select}
              name="role"
              value={role}
              onChange={(changeEvent) =>
                setRole(changeEvent.target.value as "user" | "admin")
              }
            >
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          {inviteError ? (
            <p
              className={styles.error}
              role="alert"
            >
              {inviteError}
            </p>
          ) : null}
          <Button
            type="submit"
            loading={inviting}
          >
            Invitar
          </Button>
        </form>
      </Modal>

      <Modal
        open={detail != null}
        title={detail?.name || detail?.email || "Detalle"}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <DescriptionList
            items={[
              { label: "Id", value: detail.id },
              { label: "Nombre", value: emptyDisplay(detail.name) },
              { label: "Email", value: emptyDisplay(detail.email) },
              { label: "Rol", value: detail.role },
              {
                label: "Bloqueo",
                value: detail.event_registration_access.blocked
                  ? "bloqueado"
                  : "ok",
              },
              {
                label: "Hasta",
                value: emptyDisplay(
                  detail.event_registration_access.blocked_until
                    ? formatEventDateTime(
                        detail.event_registration_access.blocked_until,
                      )
                    : null,
                ),
              },
              {
                label: "Suspensión",
                value: detail.auth_suspended ? "suspendido" : "ok",
              },
              {
                label: "Último acceso",
                value: emptyDisplay(
                  detail.last_sign_in_at
                    ? formatEventDateTime(detail.last_sign_in_at)
                    : null,
                ),
              },
              {
                label: "Creado",
                value: formatEventDateTime(detail.created_at),
              },
            ]}
          />
        ) : null}
      </Modal>

      <UserAdminModal
        user={adminUser}
        open={adminUser != null}
        onClose={() => setAdminUser(null)}
        onChanged={() => void reload()}
      />
    </main>
  );
}
