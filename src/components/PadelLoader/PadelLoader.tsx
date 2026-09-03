import styles from "./PadelLoader.module.scss";

type PadelLoaderProps = {
  label?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
};

export function PadelLoader({
  label = "Cargando partido...",
  size = "md",
  fullScreen = false,
}: PadelLoaderProps) {
  const className = [
    styles.loader,
    styles[size],
    fullScreen ? styles.fullScreen : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
    >
      <div
        className={styles.court}
        aria-hidden="true"
      >
        <span className={styles.net} />
        <span className={styles.ball} />
        <span className={styles.shadow} />
      </div>

      <span className={styles.label}>{label}</span>
    </div>
  );
}
