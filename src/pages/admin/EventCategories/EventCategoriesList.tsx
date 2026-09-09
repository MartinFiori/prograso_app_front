import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../../components/Button/Button";
import { Card } from "../../../components/Card/Card";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminCategoryList } from "../../../hooks/useAdminCategories";
import type { EventCategory } from "../../../types/events";
import styles from "../adminShared.module.scss";

export default function EventCategoriesList() {
  const navigate = useNavigate();
  const { state, reload, remove } = useAdminCategoryList();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  async function handleRemove(category: EventCategory) {
    setRemoving(true);
    setRemoveError(null);
    const error = await remove(category.id);
    setRemoving(false);

    if (error) {
      setRemoveError(error);
      return;
    }

    setPendingId(null);
  }

  if (state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando categorías..." />
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
        <h1>Categorías</h1>
        <Button onClick={() => navigate("/admin/categorias/nueva")}>
          Nueva categoría
        </Button>
      </header>

      {removeError ? (
        <p
          className={styles.error}
          role="alert"
        >
          {removeError}
        </p>
      ) : null}

      {state.categories.length === 0 ? (
        <p className={styles.message}>No hay categorías activas.</p>
      ) : (
        <div className={styles.grid}>
          {state.categories.map((category) => (
            <Card
              key={category.id}
              title={category.name}
              description={category.description ?? undefined}
              image={category.image_url ?? undefined}
              imageAlt={category.name}
              actions={
                pendingId === category.id ? (
                  <div className={styles.confirm}>
                    <p>¿Desactivar esta categoría?</p>
                    <div className={styles.actions}>
                      <Button
                        variant="danger"
                        size="sm"
                        loading={removing}
                        onClick={() => void handleRemove(category)}
                      >
                        Confirmar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removing}
                        onClick={() => setPendingId(null)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.actions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(`/admin/categorias/${category.id}/editar`)
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingId(category.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                )
              }
            >
              {null}
            </Card>
          ))}
        </div>
      )}

      <Link to="/">Volver al inicio</Link>
    </main>
  );
}
