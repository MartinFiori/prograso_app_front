import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
}

export default function EventCategoryForm({ mode }: EventCategoryFormProps) {
  const navigate = useNavigate();
  const { id: rawId } = useParams();
  const detail = useAdminCategoryDetail(mode === "edit" ? rawId : undefined);
  const { create, update } = useAdminCategoryMutations();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      setError("El nombre es obligatorio.");
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
    setError(null);

    const result =
      mode === "create"
        ? await create(form)
        : detail.id === null
          ? { error: "Identificador inválido." }
          : await update(detail.id, form);

    setSaving(false);

    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }

    navigate("/admin/categorias");
  }

  if (mode === "edit" && detail.state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando categoría..." />
      </main>
    );
  }

  if (mode === "edit" && detail.state.status === "invalid-id") {
    return (
      <main className={styles.page}>
        <h1>Categoría no válida</h1>
        <Link to="/admin/categorias">Volver</Link>
      </main>
    );
  }

  if (mode === "edit" && detail.state.status === "not-found") {
    return (
      <main className={styles.page}>
        <h1>Categoría no encontrada</h1>
        <Link to="/admin/categorias">Volver</Link>
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

  const preview = previewUrl ?? existingImageUrl;

  return (
    <main className={styles.page}>
      <h1>{mode === "create" ? "Nueva categoría" : "Editar categoría"}</h1>

      <form
        className={styles.form}
        onSubmit={(event) => void handleSubmit(event)}
      >
        <label className={styles.field}>
          <span className={styles.label}>Nombre</span>
          <input
            className={styles.input}
            name="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Descripción</span>
          <textarea
            className={styles.textarea}
            name="description"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Imagen</span>
          <input
            className={styles.input}
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
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
            onClick={() => navigate("/admin/categorias")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </main>
  );
}
