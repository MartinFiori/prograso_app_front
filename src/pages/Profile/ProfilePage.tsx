import { Link, Navigate } from "react-router-dom";

import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import { useSecurity } from "../../context/SecurityContext";
import { isProfileComplete } from "../../utils/profileCompleteness";
import styles from "../AuthCallback/AuthCallback.module.scss";

export default function ProfilePage() {
  const { loading, profileLoading, isAuthenticated, profile } = useSecurity();

  if (loading || profileLoading) {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando tu perfil..." />
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (isProfileComplete(profile)) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.error}>
        <h1>Tu perfil todavía no está completo</h1>
        <p>
          Todavía no tenemos tu nombre en la cuenta. Cuando esté listo vas a
          poder inscribirte en los eventos.
        </p>
        <Link to="/">Volver al inicio</Link>
      </div>
    </main>
  );
}
