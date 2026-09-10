import { FormEvent, useEffect, useState } from "react";

import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import {
  useAdminCategoryDetail,
  useAdminCategoryMutations,
} from "../../../hooks/useAdminCategories";
import { validateCategoryImageFile } from "../../../utils/categoryImage";
import styles from "./EventCategoryForm.module.scss";

interface EventCategoryFormProps {
  mode: "create" | "edit";
  categoryId?: number;
  onSaved: () => void;
  onCancel: () => void;
  onBusyChange?: (busy: boolean) => void;
}

export default function EventCategoryForm({
  mode,
  categoryId,
  onSaved,
  onCancel,
  onBusyChange,
}: EventCategoryFormProps) {
  const detail = useAdminCategoryDetail(
    mode === "edit" && categoryId != null ? String(categoryId) : undefined,
  );
  const { create, update } = useAdminCategoryMutations();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || detail.state.status !== "success") {
      return;
    }

    setName(detail.state.category.name);
    setDescription(detail.state.category.description ?? "");
    setExistingImageUrl(detail.state.category.image_url);
  }, [mode, detail.state]);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  function onFileChange(nextFile: File | null) {
    if (!nextFile) {
      setFile(null);
      return;
    }

    const validationError = validateCategoryImageFile(nextFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setError(null);
    setFile(nextFile);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFieldError("El nombre es obligatorio.");
      return;
    }

    const form = new FormData();
    form.append("name", trimmedName);

    if (description.trim()) {
      form.append("description", description.trim());
    }

    if (file) {
      form.append("image", file);
    }

    setSaving(true);
    onBusyChange?.(true);
    setError(null);
    setFieldError(null);

    const result =
      mode === "create"
        ? await create(form)
        : detail.id === null
          ? { error: "Identificador inválido." }
          : await update(detail.id, form);

    setSaving(false);
    onBusyChange?.(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    onSaved();
  }

  if (mode === "edit" && detail.state.status === "loading") {
    return <PadelLoader label="Cargando categoría..." />;
  }

  if (mode === "edit" && detail.state.status === "invalid-id") {
    return <p className={styles.error}>Categoría no válida</p>;
  }

  if (mode === "edit" && detail.state.status === "not-found") {
    return <p className={styles.error}>Categoría no encontrada</p>;
  }

  if (mode === "edit" && detail.state.status === "error") {
    return (
      <div>
        <p
          className={styles.error}
          role="alert"
        >
          {detail.state.message}
        </p>
        <Button onClick={() => void detail.reload()}>Reintentar</Button>
      </div>
    );
  }

  const preview = previewUrl ?? existingImageUrl;

  return (
    <form
      className={styles.form}
      onSubmit={(submitEvent) => void handleSubmit(submitEvent)}
    >
      <label className={styles.field}>
        <span className={styles.label}>Nombre *</span>
        <input
          className={styles.input}
          name="name"
          value={name}
          onChange={(changeEvent) => setName(changeEvent.target.value)}
          required
          aria-invalid={fieldError ? true : undefined}
        />
        {fieldError ? (
          <span
            className={styles.error}
            role="alert"
          >
            {fieldError}
          </span>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Descripción</span>
        <textarea
          className={styles.textarea}
          name="description"
          rows={4}
          value={description}
          onChange={(changeEvent) => setDescription(changeEvent.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Imagen</span>
        <input
          className={styles.input}
          type="file"
          name="image"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(changeEvent) =>
            onFileChange(changeEvent.target.files?.[0] ?? null)
          }
        />
      </label>

      {preview ? (
        <img
          className={styles.preview}
          src={preview}
          alt={name || "Vista previa"}
        />
      ) : null}

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
