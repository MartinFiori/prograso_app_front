import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import {
  useAdminEventDetail,
  useAdminEventMutations,
  useEventFormLookups,
} from "../../../hooks/useAdminEvents";
import type { CreateEventBody } from "../../../types/admin";
import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
} from "../../../utils/datetimeLocal";
import styles from "../adminShared.module.scss";

interface EventFormProps {
  mode: "create" | "edit";
}

export default function EventForm({ mode }: EventFormProps) {
  const navigate = useNavigate();
  const { id: rawId } = useParams();
  const detail = useAdminEventDetail(mode === "edit" ? rawId : undefined);
  const { create, update } = useAdminEventMutations();
  const lookups = useEventFormLookups();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [deadline, setDeadline] = useState("");
  const [capacity, setCapacity] = useState("16");
  const [statusCode, setStatusCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || detail.state.status !== "success") {
      return;
    }

    const event = detail.state.event;
    setTitle(event.title);
    setCategoryId(String(event.category_id));
    setStartsAt(isoToDatetimeLocal(event.starts_at));
    setDeadline(isoToDatetimeLocal(event.registration_deadline));
    setCapacity(String(event.capacity));
    setStatusCode(event.status_code);
  }, [mode, detail.state]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const parsedCategory = Number(categoryId);
    const parsedCapacity = Number(capacity);
    const startsAtIso = datetimeLocalToIso(startsAt);

    if (!trimmedTitle || !parsedCategory || !startsAtIso || parsedCapacity < 1) {
      setError("Completá título, categoría, inicio y cupo.");
      return;
    }

    const deadlineIso = datetimeLocalToIso(deadline);
    const body: CreateEventBody = {
      category_id: parsedCategory,
      title: trimmedTitle,
      starts_at: startsAtIso,
      capacity: parsedCapacity,
    };

    if (deadlineIso) {
      body.registration_deadline = deadlineIso;
    } else if (mode === "edit") {
      body.registration_deadline = null;
    }

    if (statusCode) {
      body.status_code = statusCode;
    }

    setSaving(true);
    setError(null);

    const result =
      mode === "create"
        ? await create(body)
        : detail.id === null
          ? { error: "Identificador inválido." }
          : await update(detail.id, body);

    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    navigate("/admin/eventos");
  }

  if (mode === "edit" && detail.state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando evento..." />
      </main>
    );
  }

  if (mode === "edit" && detail.state.status === "invalid-id") {
    return (
      <main className={styles.page}>
        <h1>Evento no válido</h1>
        <Link to="/admin/eventos">Volver</Link>
      </main>
    );
  }

  if (mode === "edit" && detail.state.status === "not-found") {
    return (
      <main className={styles.page}>
        <h1>Evento no encontrado</h1>
        <Link to="/admin/eventos">Volver</Link>
      </main>
    );
  }

  if (mode === "edit" && detail.state.status === "error") {
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

  return (
    <main className={styles.page}>
      <h1>{mode === "create" ? "Nuevo evento" : "Editar evento"}</h1>

      {lookups.error ? (
        <p
          className={styles.error}
          role="alert"
        >
          {lookups.error}
        </p>
      ) : null}

      <form
        className={styles.form}
        onSubmit={(formEvent) => void handleSubmit(formEvent)}
      >
        <label className={styles.field}>
          <span className={styles.label}>Título</span>
          <input
            className={styles.input}
            name="title"
            value={title}
            onChange={(changeEvent) => setTitle(changeEvent.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Categoría</span>
          <select
            className={styles.select}
            name="category_id"
            value={categoryId}
            onChange={(changeEvent) => setCategoryId(changeEvent.target.value)}
            required
          >
            <option value="">Elegí una categoría</option>
            {lookups.categories.map((category) => (
              <option
                key={category.id}
                value={category.id}
              >
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Inicio</span>
          <input
            className={styles.input}
            type="datetime-local"
            name="starts_at"
            value={startsAt}
            onChange={(changeEvent) => setStartsAt(changeEvent.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Límite de inscripción</span>
          <input
            className={styles.input}
            type="datetime-local"
            name="registration_deadline"
            value={deadline}
            onChange={(changeEvent) => setDeadline(changeEvent.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Cupo</span>
          <input
            className={styles.input}
            type="number"
            name="capacity"
            min={1}
            value={capacity}
            onChange={(changeEvent) => setCapacity(changeEvent.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Estado</span>
          <select
            className={styles.select}
            name="status_code"
            value={statusCode}
            onChange={(changeEvent) => setStatusCode(changeEvent.target.value)}
          >
            <option value="">
              {mode === "create" ? "Borrador (por defecto)" : "Sin cambios"}
            </option>
            {lookups.statuses.map((status) => (
              <option
                key={status.code}
                value={status.code}
              >
                {status.label}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p
            className={styles.error}
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className={styles.actions}>
          <Button
            type="submit"
            loading={saving}
            loadingText="Guardando..."
          >
            Guardar
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => navigate("/admin/eventos")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </main>
  );
}
