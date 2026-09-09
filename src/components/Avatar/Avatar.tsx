import { useState } from "react";

import styles from "./Avatar.module.scss";

interface AvatarProps {
  src?: string | null;
  name?: string;
}

export function Avatar({ src, name = "Usuario" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const label = `Foto de perfil de ${name}`;

  if (!src || failed) {
    const initial = name.trim().charAt(0) || "?";

    return (
      <span
        className={`${styles.avatar} ${styles.fallback}`}
        role="img"
        aria-label={label}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      className={styles.avatar}
      src={src}
      alt={label}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
