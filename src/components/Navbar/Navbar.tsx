import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Avatar } from "../Avatar/Avatar";
import { Button } from "../Button/Button";
import { useSecurity } from "../../context/SecurityContext";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const { login, logout, isAuthenticated, isAdmin, user, loading } =
    useSecurity();
  const location = useLocation();
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const onCallback = location.pathname === "/auth/callback";
  const hideLogin = loading || onCallback || loginBusy;

  async function handleLogin(): Promise<void> {
    setLoginBusy(true);
    setLoginError(null);

    try {
      await login();
    } catch {
      setLoginBusy(false);
      setLoginError("No pudimos abrir Google. Probá de nuevo.");
    }
  }

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
        {loginError ? (
          <p
            className={styles.login_error}
            role="alert"
          >
            {loginError}
          </p>
        ) : null}

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
            onClick={() => {
              void logout();
            }}
          >
            Cerrar sesión
          </Button>
        ) : hideLogin ? (
          loading || onCallback ? null : (
            <Button
              loading
              loadingText="Redirigiendo a Google…"
            >
              Iniciar sesión
            </Button>
          )
        ) : (
          <Button onClick={() => void handleLogin()}>Iniciar sesión</Button>
        )}
      </div>
    </nav>
  );
}
