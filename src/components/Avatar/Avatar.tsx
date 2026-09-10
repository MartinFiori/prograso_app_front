import { useState } from "react";

import styles from "./Avatar.module.scss";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "md" | "lg";
}

export function Avatar({ src, name = "Usuario", size = "md" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const label = `Foto de perfil de ${name}`;
  const className = `${styles.avatar} ${styles[size]}`;

  if (!src || failed) {
    const initial = name.trim().charAt(0) || "?";

    return (
      <span
        className={`${className} ${styles.fallback}`}
        role="img"
        aria-label={label}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      className={className}
      src={src}
      alt={label}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
