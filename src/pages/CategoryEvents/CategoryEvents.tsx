import { Link } from "react-router-dom";

import { Button } from "../../components/Button/Button";
import { EventCard } from "../../components/EventCard/EventCard";
import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import { useCategoryEvents } from "../../hooks/useCategoryEvents";
import NotFound from "../NotFound/NotFound";
import { homePath } from "../../utils/publicEventPaths";
import styles from "../publicCatalog.module.scss";

export default function CategoryEvents() {
  const { state, statuses, setPage, reload } = useCategoryEvents();

  if (state.status === "not-found") {
    return <NotFound />;
  }

  if (state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando eventos..." />
      </main>
    );
  }

  if (state.status === "invalid-id") {
    return (
      <main className={styles.page}>
        <h1>Categoría no válida</h1>
        <p>El identificador de la categoría debe ser un número entero positivo.</p>
        <Link
          className={styles.back}
          to={homePath()}
        >
          Volver a categorías
        </Link>
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

  const { category } = state;

  return (
    <main className={styles.page}>
      <Link
        className={styles.back}
        to={homePath()}
      >
        Volver a categorías
      </Link>

      <header className={styles.masthead}>
        <h1>{category.name}</h1>
        {category.description ? (
          <p className={styles.lede}>{category.description}</p>
        ) : null}
      </header>

      <section
        className={styles.section}
        aria-labelledby="category-events-heading"
      >
        <h2 id="category-events-heading">Eventos de la categoría</h2>

        {state.status === "empty" ? (
          <p
            className={styles.message}
            role="status"
          >
            No hay eventos disponibles para esta categoría.
            <Link
              className={styles.back}
              to={homePath()}
            >
              Volver a categorías
            </Link>
          </p>
        ) : null}

        {state.status === "success" ? (
          <>
            <div className={styles.grid}>
              {state.events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  statuses={statuses}
                />
              ))}
            </div>

            {state.totalPages > 1 ? (
              <div className={styles.pagination}>
                <Button
                  variant="secondary"
                  disabled={state.page <= 1}
                  onClick={() => setPage(state.page - 1)}
                >
                  Anterior
                </Button>
                <p>
                  Página {state.page} de {state.totalPages}
                </p>
                <Button
                  variant="secondary"
                  disabled={state.page >= state.totalPages}
                  onClick={() => setPage(state.page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
