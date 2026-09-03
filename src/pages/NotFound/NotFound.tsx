import { Link } from "react-router-dom";

import styles from "./NotFound.module.scss";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <div
        className={styles.backgroundBall}
        aria-hidden="true"
      />

      <section className={styles.content}>
        <div
          className={styles.court}
          aria-hidden="true"
        >
          <div className={styles.glassWall} />

          <span className={styles.serviceLine} />
          <span className={styles.centerLine} />
          <span className={styles.net} />

          <div className={styles.ball}>
            <span className={styles.ballLine} />
          </div>

          <span className={styles.ballShadow} />
        </div>

        <div className={styles.information}>
          <h1>Pelota fuera de juego</h1>
          <p>
            La página que estás buscando no existe o fue movida a otra parte de
            la cancha.
          </p>
          <Link
            className={styles.homeButton}
            to="/"
          >
            <span aria-hidden="true">←</span>
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
