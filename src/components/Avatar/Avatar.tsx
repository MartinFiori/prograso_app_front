import styles from "./Avatar.module.scss";

interface AvatarProps {
  src: string;
  name?: string;
}

export function Avatar({ src, name = "Usuario" }: AvatarProps) {
  return (
    <img
      className={styles.avatar}
      src={src}
      alt={`Foto de perfil de ${name}`}
      referrerPolicy="no-referrer"
    />
  );
}
