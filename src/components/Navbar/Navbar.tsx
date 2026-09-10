import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

import { Avatar } from "../Avatar/Avatar";
import { Button } from "../Button/Button";
import { useSecurity } from "../../context/SecurityContext";
import {
  profileAvatarSrc,
  profileDisplayName,
} from "../../utils/profileDisplay";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const { login, isAuthenticated, isAdmin, user, profile, loading } =
    useSecurity();
  const location = useLocation();
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const onCallback = location.pathname === "/auth/callback";
  const hideLogin = loading || onCallback || loginBusy;
  const displayName = profileDisplayName(profile, user);

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
          <Link
            className={styles.profile_link}
            to="/profile"
            aria-label={`Mi perfil, ${displayName}`}
          >
            <Avatar
              src={profileAvatarSrc(profile, user)}
              name={displayName}
            />
            <span className={styles.user_name}>{displayName}</span>
          </Link>
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
