import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminUserDetail } from "../../../hooks/useAdminUsers";
import styles from "../adminShared.module.scss";

export default function UserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const detail = useAdminUserDetail(userId);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [blockReason, setBlockReason] = useState("");
  const [blockUntil, setBlockUntil] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [banDuration, setBanDuration] = useState("24h");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (detail.state.status !== "success") {
      return;
    }

    setName(detail.state.user.name ?? "");
    setRole(detail.state.user.role === "admin" ? "admin" : "user");
  }, [detail.state]);

  async function runAction(action: () => Promise<string | null>) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);

    if (result) {
      setError(result);
    }
  }

  async function handleProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(() => detail.updateProfile({ name: name.trim() }));
  }

  async function handleRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(() => detail.updateRole(role));
  }

  async function handleBlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!blockReason.trim()) {
      setError("La razón de bloqueo es obligatoria.");
      return;
    }

    const body: { reason: string; blocked_until?: string | null } = {
      reason: blockReason.trim(),
    };

    if (blockUntil.trim()) {
      const iso = new Date(blockUntil).toISOString();
      body.blocked_until = iso;
    }

    await runAction(() => detail.putBlock(body));
  }

  async function handleSuspend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!suspendReason.trim() || !banDuration.trim()) {
      setError("Razón y duración son obligatorias.");
      return;
    }

    await runAction(() =>
      detail.putSuspension({
        reason: suspendReason.trim(),
        ban_duration: banDuration.trim(),
      }),
    );
  }

  async function handleDelete() {
    const result = await detail.remove();

    if (result) {
      setError(result);
      return;
    }

    navigate("/admin/usuarios");
  }

  if (detail.state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando usuario..." />
      </main>
    );
  }

  if (detail.state.status === "invalid-id") {
    return (
      <main className={styles.page}>
        <h1>Usuario no válido</h1>
        <Link to="/admin/usuarios">Volver</Link>
      </main>
    );
  }

  if (detail.state.status === "not-found") {
    return (
      <main className={styles.page}>
        <h1>Usuario no encontrado</h1>
        <Link to="/admin/usuarios">Volver</Link>
      </main>
    );
  }

  if (detail.state.status === "error") {
    return (
      <main className={styles.page}>
        <p
          className={styles.error}
          role="alert"
        >
          {detail.state.message}
        </p>
        <Button onClick={() => void detail.reload()}>Reintentar</Button>
      </main>
    );
  }

  const user = detail.state.user;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>{user.name || user.email}</h1>
        <Link to="/admin/usuarios">Volver al listado</Link>
      </header>

      <p>Email: {user.email}</p>
      <p>Rol: {user.role}</p>
      <p>
        Bloqueo de inscripciones:{" "}
        {user.event_registration_access.blocked ? "sí" : "no"}
      </p>
      <p>Suspensión Auth: {user.auth_suspended ? "sí" : "no"}</p>

      {error ? (
        <p
          className={styles.error}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <form
        className={styles.form}
        onSubmit={(formEvent) => void handleProfile(formEvent)}
      >
        <h2>Perfil</h2>
        <label className={styles.field}>
          <span className={styles.label}>Nombre</span>
          <input
            className={styles.input}
            value={name}
            onChange={(changeEvent) => setName(changeEvent.target.value)}
          />
        </label>
        <Button
          type="submit"
          loading={busy}
        >
          Guardar perfil
        </Button>
      </form>

      <form
        className={styles.form}
        onSubmit={(formEvent) => void handleRole(formEvent)}
      >
        <h2>Rol</h2>
        <label className={styles.field}>
          <span className={styles.label}>Rol</span>
          <select
            className={styles.select}
            value={role}
            onChange={(changeEvent) =>
              setRole(changeEvent.target.value as "user" | "admin")
            }
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <Button
          type="submit"
          loading={busy}
        >
          Cambiar rol
        </Button>
      </form>

      <form
        className={styles.form}
        onSubmit={(formEvent) => void handleBlock(formEvent)}
      >
        <h2>Bloqueo de inscripciones</h2>
        <label className={styles.field}>
          <span className={styles.label}>Razón</span>
          <input
            className={styles.input}
            value={blockReason}
            onChange={(changeEvent) => setBlockReason(changeEvent.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Hasta (opcional)</span>
          <input
            className={styles.input}
            type="datetime-local"
            value={blockUntil}
            onChange={(changeEvent) => setBlockUntil(changeEvent.target.value)}
          />
        </label>
        <div className={styles.actions}>
          <Button
            type="submit"
            loading={busy}
          >
            Bloquear
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void runAction(() => detail.deleteBlock())}
          >
            Quitar bloqueo
          </Button>
        </div>
      </form>

      <form
        className={styles.form}
        onSubmit={(formEvent) => void handleSuspend(formEvent)}
      >
        <h2>Suspensión Auth</h2>
        <label className={styles.field}>
          <span className={styles.label}>Razón</span>
          <input
            className={styles.input}
            value={suspendReason}
            onChange={(changeEvent) => setSuspendReason(changeEvent.target.value)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Duración (ej. 24h)</span>
          <input
            className={styles.input}
            value={banDuration}
            onChange={(changeEvent) => setBanDuration(changeEvent.target.value)}
          />
        </label>
        <div className={styles.actions}>
          <Button
            type="submit"
            loading={busy}
          >
            Suspender
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => void runAction(() => detail.deleteSuspension())}
          >
            Reactivar
          </Button>
        </div>
      </form>

      <div className={styles.actions}>
        <Button
          variant="danger"
          disabled={busy}
          onClick={() => void handleDelete()}
        >
          Eliminar usuario
        </Button>
      </div>
    </main>
  );
}
