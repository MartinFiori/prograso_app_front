import { HTMLAttributes, KeyboardEvent, ReactNode } from "react";

import styles from "./Card.module.scss";

export type CardVariant = "default" | "primary" | "accent";
export type CardPadding = "sm" | "md" | "lg";

export type CardProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  icon?: ReactNode;
  badge?: string;
  footer?: ReactNode;
  actions?: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  horizontal?: boolean;
  interactive?: boolean;
  loading?: boolean;
  onClick?: () => void;
} & Omit<HTMLAttributes<HTMLElement>, "title" | "onClick">;

export function Card({
  children,
  title,
  subtitle,
  description,
  image,
  imageAlt = "",
  icon,
  badge,
  footer,
  actions,
  variant = "default",
  padding = "md",
  horizontal = false,
  interactive = false,
  loading = false,
  onClick,
  className = "",
  ...rest
}: CardProps) {
  const isInteractive = interactive || Boolean(onClick);

  const cardClassName = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    horizontal ? styles.horizontal : "",
    isInteractive ? styles.interactive : "",
    loading ? styles.loading : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!onClick) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }

  if (loading) {
    return (
      <article
        className={cardClassName}
        aria-busy="true"
        aria-label="Cargando contenido"
        {...rest}
      >
        <div className={styles.skeletonImage} />

        <div className={styles.skeletonContent}>
          <span className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <span className={styles.skeletonLine} />
          <span className={styles.skeletonLine} />
          <span className={`${styles.skeletonLine} ${styles.skeletonShort}`} />
        </div>
      </article>
    );
  }

  return (
    <article
      className={cardClassName}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      {...rest}
    >
      {image && (
        <div className={styles.imageContainer}>
          <img
            className={styles.image}
            src={image}
            alt={imageAlt}
            loading="lazy"
          />

          {badge && <span className={styles.imageBadge}>{badge}</span>}
        </div>
      )}

      <div className={styles.body}>
        {(icon || badge) && !image && (
          <div className={styles.top}>
            {icon && <div className={styles.icon}>{icon}</div>}

            {badge && <span className={styles.badge}>{badge}</span>}
          </div>
        )}

        {(title || subtitle) && (
          <header className={styles.header}>
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </header>
        )}

        {description && <p className={styles.description}>{description}</p>}

        <div className={styles.content}>{children}</div>

        {actions && (
          <div
            className={styles.actions}
            onClick={(event) => event.stopPropagation()}
          >
            {actions}
          </div>
        )}

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </article>
  );
}
