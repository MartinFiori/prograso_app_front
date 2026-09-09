import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminUserList } from "../../../hooks/useAdminUsers";
import styles from "../adminShared.module.scss";

export default function UsersList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const { state, invite } = useAdminUserList({ page, q });
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setQ(qInput.trim());
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

    setEmail("");
    setName("");
    setRole("user");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Usuarios</h1>
      </header>

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
        <Button type="submit">Buscar</Button>
      </form>

      <form
        className={styles.form}
        onSubmit={(formEvent) => void handleInvite(formEvent)}
      >
        <h2>Invitar</h2>
        <label className={styles.field}>
          <span className={styles.label}>Email</span>
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

      {state.status === "loading" ? (
        <PadelLoader label="Cargando usuarios..." />
      ) : state.status === "error" ? (
        <p
          className={styles.error}
          role="alert"
        >
          {state.message}
        </p>
      ) : (
        <>
          {state.pagination ? (
            <p>
              Página {state.pagination.page} de {state.pagination.total_pages} (
              {state.pagination.total} usuarios)
            </p>
          ) : null}

          {state.users.length === 0 ? (
            <p className={styles.message}>No hay usuarios.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Bloqueo</th>
                    <th>Suspensión</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {state.users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        {user.event_registration_access.blocked
                          ? "bloqueado"
                          : "ok"}
                      </td>
                      <td>{user.auth_suspended ? "suspendido" : "ok"}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => navigate(`/admin/usuarios/${user.id}`)}
                        >
                          Ver
                        </Button>
                      </td>
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
        </>
      )}
    </main>
  );
}
