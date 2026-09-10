import { FormEvent, useEffect, useState } from "react";

import { Button } from "../../../components/Button/Button";
import { Modal } from "../../../components/Modal/Modal";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminUserDetail } from "../../../hooks/useAdminUsers";
import type { AdminUser } from "../../../types/admin";
import styles from "../adminShared.module.scss";

type UserAdminModalProps = {
  user: AdminUser | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};

export function UserAdminModal({
  user,
  open,
  onClose,
  onChanged,
}: UserAdminModalProps) {
  const detail = useAdminUserDetail(open ? user?.id : undefined);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [blockReason, setBlockReason] = useState("");
  const [blockUntil, setBlockUntil] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [banDuration, setBanDuration] = useState("24h");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
      return;
    }

    onChanged();
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
      body.blocked_until = new Date(blockUntil).toISOString();
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
    setBusy(true);
    setError(null);
    const result = await detail.remove();
    setBusy(false);

    if (result) {
      setError(result);
      return;
    }

    onChanged();
    onClose();
  }

  const title = user?.name || user?.email || "Administrar usuario";

  return (
    <Modal
      open={open}
      title={`Administrar ${title}`}
      onClose={onClose}
      busy={busy}
    >
      {detail.state.status === "loading" ? (
        <PadelLoader label="Cargando usuario..." />
      ) : detail.state.status === "error" ? (
        <div
          className={styles.error}
          role="alert"
        >
          <p>{detail.state.message}</p>
          <Button onClick={() => void detail.reload()}>Reintentar</Button>
        </div>
      ) : detail.state.status !== "success" ? (
        <p className={styles.message}>No se pudo cargar el usuario.</p>
      ) : (
        <>
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
            <h3>Perfil</h3>
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
            <h3>Rol</h3>
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
            <h3>Bloqueo de inscripciones</h3>
            <label className={styles.field}>
              <span className={styles.label}>Razón *</span>
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
            <h3>Suspensión Auth</h3>
            <label className={styles.field}>
              <span className={styles.label}>Razón *</span>
              <input
                className={styles.input}
                value={suspendReason}
                onChange={(changeEvent) =>
                  setSuspendReason(changeEvent.target.value)
                }
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Duración (ej. 24h) *</span>
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

          {confirmDelete ? (
            <div className={styles.confirm}>
              <p>¿Eliminar este usuario?</p>
              <div className={styles.actions}>
                <Button
                  variant="danger"
                  loading={busy}
                  onClick={() => void handleDelete()}
                >
                  Confirmar
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar usuario
            </Button>
          )}
        </>
      )}
    </Modal>
  );
}
