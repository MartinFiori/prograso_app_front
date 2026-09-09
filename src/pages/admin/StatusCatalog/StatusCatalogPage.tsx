import { Button } from "../../../components/Button/Button";
import { PadelLoader } from "../../../components/PadelLoader/PadelLoader";
import { useStatusCatalog } from "../../../hooks/useStatusCatalog";
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

  if (state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label={`Cargando ${title.toLowerCase()}...`} />
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
        <h1>{title}</h1>
      </header>

      {state.items.length === 0 ? (
        <p className={styles.message}>{emptyMessage}</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Código</th>
                <th>Etiqueta</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {state.items.map((item) => (
                <tr key={item.code}>
                  <td>{item.code}</td>
                  <td>{item.label}</td>
                  <td>{item.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
