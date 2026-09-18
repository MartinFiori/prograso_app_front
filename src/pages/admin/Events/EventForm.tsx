import { FormEvent, useEffect, useState } from "react";

import { Button } from "../../../components/Button/Button";
import {
  useAdminEventMutations,
  useEventFormLookups,
} from "../../../hooks/useAdminEvents";
import type { AdminEvent, CreateEventBody } from "../../../types/admin";
import {
  datetimeLocalToIso,
  isoToDatetimeLocal,
} from "../../../utils/datetimeLocal";
import styles from "../adminShared.module.scss";

type EventFormProps = {
  mode: "create";
  event?: never;
  onSaved: (event: AdminEvent) => void;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
} | {
  mode: "edit";
  event: AdminEvent;
  onSaved: (event: AdminEvent) => void;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
};

export default function EventForm({
  mode,
  event,
  onSaved,
  onCancel,
  onBusyChange,
}: EventFormProps) {
  const { create, update } = useAdminEventMutations();
  const lookups = useEventFormLookups();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [capacity, setCapacity] = useState("16");
  const [price, setPrice] = useState("");
  const [statusCode, setStatusCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit") {
      return;
    }

    setTitle(event.title);
    setCategoryId(String(event.category_id));
    setStartsAt(isoToDatetimeLocal(event.starts_at));
    setEndAt(isoToDatetimeLocal(event.end_at));
    setCapacity(String(event.capacity));
    setPrice(String(event.price));
    setStatusCode(event.status_code);
    setError(null);
  }, [event, mode]);

  async function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const trimmedTitle = title.trim();
    const parsedCategory = Number(categoryId);
    const parsedCapacity = Number(capacity);
    const parsedPrice = Number(price);
    const startsAtIso = datetimeLocalToIso(startsAt);
    const endAtIso = datetimeLocalToIso(endAt);

    if (
      !trimmedTitle ||
      !parsedCategory ||
      !startsAtIso ||
      !endAtIso ||
      parsedCapacity < 1 ||
      !Number.isInteger(parsedPrice) ||
      parsedPrice < 1
    ) {
      setError("Completá título, categoría, inicio, fin, cupo y precio (entero mayor a 0).");
      return;
    }

    if (Date.parse(endAtIso) <= Date.parse(startsAtIso)) {
      setError("La finalización debe ser posterior al inicio.");
      return;
    }

    const body: CreateEventBody = {
      category_id: parsedCategory,
      title: trimmedTitle,
      starts_at: startsAtIso,
      end_at: endAtIso,
      capacity: parsedCapacity,
      price: parsedPrice,
    };

    if (statusCode) {
      body.status_code = statusCode;
    }

    setSaving(true);
    onBusyChange?.(true);
    setError(null);

    const result =
      mode === "create"
        ? await create(body)
        : await update(event.id, body);

    setSaving(false);
    onBusyChange?.(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    if (result.event) {
      onSaved(result.event);
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(formEvent) => void handleSubmit(formEvent)}
    >
      {lookups.error ? (
        <p
          className={styles.error}
          role="alert"
        >
          {lookups.error}
        </p>
      ) : null}

      <label className={styles.field}>
        <span className={styles.label}>Título *</span>
        <input
          className={styles.input}
          name="title"
          value={title}
          onChange={(changeEvent) => setTitle(changeEvent.target.value)}
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Categoría *</span>
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
        <span className={styles.label}>Inicio *</span>
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
        <span className={styles.label}>Fin *</span>
        <input
          className={styles.input}
          type="datetime-local"
          name="end_at"
          value={endAt}
          onChange={(changeEvent) => setEndAt(changeEvent.target.value)}
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Cupo *</span>
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
        <span className={styles.label}>Precio *</span>
        <input
          className={styles.input}
          type="number"
          name="price"
          min={1}
          step={1}
          value={price}
          onChange={(changeEvent) => setPrice(changeEvent.target.value)}
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
          onClick={onCancel}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
