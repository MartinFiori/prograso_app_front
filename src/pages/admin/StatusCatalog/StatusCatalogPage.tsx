import { useState } from "react";

import { Button } from "../../../components/Button/Button";
import {
  DescriptionList,
  emptyDisplay,
} from "../../../components/DescriptionList/DescriptionList";
import { Modal } from "../../../components/Modal/Modal";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useStatusCatalog } from "../../../hooks/useStatusCatalog";
import type { CatalogStatus } from "../../../types/admin";
import styles from "../adminShared.module.scss";

interface StatusCatalogPageProps {
  title: string;
  path: string;
  emptyMessage: string;
}

export default function StatusCatalogPage({
  title,
  path,
  emptyMessage,
}: StatusCatalogPageProps) {
  const { state, reload } = useStatusCatalog(path);
  const [detail, setDetail] = useState<CatalogStatus | null>(null);
  const loading = state.status === "loading";
  const failed = state.status === "error";
  const items = state.status === "success" ? state.items : [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>{title}</h1>
      </header>

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
              <PadelLoader label={`Cargando ${title.toLowerCase()}...`} />
            </div>
          ) : items.length === 0 ? (
            <p className={styles.tableStatus}>{emptyMessage}</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Etiqueta</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.code}>
                    <td>{item.code}</td>
                    <td>{item.label}</td>
                    <td>{emptyDisplay(item.description)}</td>
                    <td>
                      <div className={styles.tableActions}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setDetail(item)}
                        >
                          Ver detalles
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal
        open={detail != null}
        title={detail?.label ?? "Detalle"}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <DescriptionList
            items={[
              { label: "Código", value: detail.code },
              { label: "Etiqueta", value: detail.label },
              { label: "Descripción", value: emptyDisplay(detail.description) },
            ]}
          />
        ) : null}
      </Modal>
    </main>
  );
}
