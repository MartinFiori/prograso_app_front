import { Button } from "../../components/Button/Button";
import { CategoryCard } from "../../components/CategoryCard/CategoryCard";
import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import { usePublicCategories } from "../../hooks/usePublicCategories";
import styles from "../publicCatalog.module.scss";

export default function Home() {
  const { state, reload } = usePublicCategories();

  return (
    <main className={styles.page}>
      <header className={styles.masthead}>
        <h1>Eventos</h1>
        <p className={styles.lede}>
          Elegí una categoría y anotá tu lugar.
        </p>
      </header>

      <section
        className={styles.section}
        aria-labelledby="home-categories-heading"
      >
        <h2 id="home-categories-heading">Categorías</h2>

        {state.status === "loading" ? (
          <PadelLoader label="Cargando categorías..." />
        ) : null}

        {state.status === "empty" ? (
          <p
            className={styles.message}
            role="status"
          >
            No hay categorías disponibles.
          </p>
        ) : null}

        {state.status === "error" ? (
          <div
            className={styles.error}
            role="alert"
          >
            <p>{state.message}</p>
            <Button onClick={() => void reload()}>Reintentar</Button>
          </div>
        ) : null}

        {state.status === "success" ? (
          <div className={styles.grid}>
            {state.categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
