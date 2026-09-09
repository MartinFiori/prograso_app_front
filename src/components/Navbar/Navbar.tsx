import { Link } from "react-router-dom";

import { Avatar } from "../Avatar/Avatar";
import { Button } from "../Button/Button";
import { useSecurity } from "../../context/SecurityContext";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const { login, logout, isAuthenticated, isAdmin, user } = useSecurity();

  return (
    <nav
      className={styles.nav_container}
      aria-label="Sitio"
    >
      <div className={styles.nav_start}>
        <Link
          className={styles.nav_link}
          to="/"
        >
          Inicio
        </Link>
        {isAdmin ? (
          <Link
            className={styles.nav_link}
            to="/admin"
          >
            Admin
          </Link>
        ) : null}
      </div>

      <div className={styles.nav_end}>
        {isAuthenticated ? (
          <div className={styles.avatar_container}>
            <Avatar
              src={user?.user_metadata?.avatar_url}
              name={user?.user_metadata?.full_name}
            />
            <p className={styles.user_name}>{user?.user_metadata?.full_name}</p>
          </div>
        ) : null}

        {isAuthenticated ? (
          <Button
            variant="ghost"
            onClick={logout}
          >
            Cerrar sesión
          </Button>
        ) : (
          <Button onClick={login}>Iniciar sesión</Button>
        )}
      </div>
    </nav>
  );
}
