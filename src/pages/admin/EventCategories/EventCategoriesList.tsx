import { useState } from "react";

import { Avatar } from "../../../components/Avatar/Avatar";
import { Button } from "../../../components/Button/Button";
import {
  DescriptionList,
  emptyDisplay,
} from "../../../components/DescriptionList/DescriptionList";
import { Modal } from "../../../components/Modal/Modal";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useAdminCategoryList } from "../../../hooks/useAdminCategories";
import type { EventCategory } from "../../../types/events";
import { formatEventDateTime } from "../../../utils/eventDisplay";
import styles from "../adminShared.module.scss";
import EventCategoryForm from "./EventCategoryForm";

export default function EventCategoriesList() {
  const { state, reload, remove } = useAdminCategoryList();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [detail, setDetail] = useState<EventCategory | null>(null);

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
    setStatusMessage("Categoría desactivada.");
  }

  const loading = state.status === "loading";
  const failed = state.status === "error";
  const categories = state.status === "success" ? state.categories : [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Categorías</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Crear categoría</Button>
      </header>

      {statusMessage ? (
        <p
          className={styles.status}
          role="status"
        >
          {statusMessage}
        </p>
      ) : null}

      {removeError ? (
        <p
          className={styles.error}
          role="alert"
        >
          {removeError}
        </p>
      ) : null}

      {failed ? (
        <div
          className={styles.error}
          role="alert"
        >
          <p>{state.message}</p>
          <Button onClick={() => void reload()}>Reintentar</Button>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          {loading ? (
            <div className={styles.tableStatus}>
              <PadelLoader label="Cargando categorías..." />
            </div>
          ) : categories.length === 0 ? (
            <p className={styles.tableStatus}>No hay categorías activas.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Activa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <Avatar
                        src={category.image_url}
                        name={category.name}
                      />
                    </td>
                    <td>{category.name}</td>
                    <td>{emptyDisplay(category.description)}</td>
                    <td>{category.is_active ? "sí" : "no"}</td>
                    <td>
                      {pendingId === category.id ? (
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
                        <div className={styles.tableActions}>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setDetail(category)}
                          >
                            Ver detalles
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditId(category.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setPendingId(category.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal
        open={createOpen}
        title="Crear categoría"
        onClose={() => setCreateOpen(false)}
        busy={formBusy}
      >
        <EventCategoryForm
          mode="create"
          onBusyChange={setFormBusy}
          onCancel={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            setStatusMessage("Categoría creada.");
            void reload();
          }}
        />
      </Modal>

      <Modal
        open={editId != null}
        title="Editar categoría"
        onClose={() => setEditId(null)}
        busy={formBusy}
      >
        {editId != null ? (
          <EventCategoryForm
            mode="edit"
            categoryId={editId}
            onBusyChange={setFormBusy}
            onCancel={() => setEditId(null)}
            onSaved={() => {
              setEditId(null);
              setStatusMessage("Categoría actualizada.");
              void reload();
            }}
          />
        ) : null}
      </Modal>

      <Modal
        open={detail != null}
        title={detail?.name ?? "Detalle"}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <DescriptionList
            items={[
              { label: "Id", value: emptyDisplay(detail.id) },
              { label: "Nombre", value: detail.name },
              { label: "Descripción", value: emptyDisplay(detail.description) },
              { label: "Imagen", value: emptyDisplay(detail.image_url) },
              { label: "Activa", value: detail.is_active ? "sí" : "no" },
              {
                label: "Creada",
                value: formatEventDateTime(detail.created_at),
              },
              {
                label: "Actualizada",
                value: formatEventDateTime(detail.updated_at),
              },
            ]}
          />
        ) : null}
      </Modal>
    </main>
  );
}
