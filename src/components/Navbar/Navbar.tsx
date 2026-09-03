import React from "react";
import { Button } from "../Button/Button";
import styles from "./Navbar.module.scss";
import { useSecurity } from "../../context/SecurityContext";
import { Avatar } from "../Avatar/Avatar";

export default function Navbar() {
  const { login, logout, isAuthenticated, user } = useSecurity();
  return (
    <div className={styles.nav_container}>
      {isAuthenticated ? (
        <div className={styles.avatar_container}>
          <Avatar
            src={user?.user_metadata?.avatar_url}
            name={user?.user_metadata?.full_name}
          />
          <p>{user?.user_metadata?.full_name}</p>
        </div>
      ) : (
        <div></div>
      )}
      <div className={styles.login_btn}>
        {isAuthenticated ? (
          <Button onClick={logout}>Cerrar sesión</Button>
        ) : (
          <Button onClick={!isAuthenticated && login}>Iniciar sesión</Button>
        )}
      </div>
    </div>
  );
}
