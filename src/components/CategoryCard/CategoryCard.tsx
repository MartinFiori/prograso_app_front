import { Link } from "react-router-dom";

import type { EventCategory } from "../../types/events";
import { categoryEventsPath } from "../../utils/publicEventPaths";
import styles from "./CategoryCard.module.scss";

interface CategoryCardProps {
  category: EventCategory;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "");
  return letters.join("") || "?";
}

export function CategoryCard({ category }: CategoryCardProps) {
  const description = category.description?.trim() || null;

  return (
    <Link
      className={styles.card}
      to={categoryEventsPath(category.id)}
      aria-label={`Ver eventos de ${category.name}`}
    >
      {category.image_url ? (
        <img
          className={styles.photo}
          src={category.image_url}
          alt={category.name}
        />
      ) : (
        <div
          className={styles.fallback}
          aria-hidden="true"
        >
          {initials(category.name)}
        </div>
      )}
      <span
        className={styles.overlay}
        aria-hidden="true"
      />
      <div className={styles.content}>
        <div className={styles.text}>
          <h2 className={styles.name}>{category.name}</h2>
          {description ? <p className={styles.description}>{description}</p> : null}
        </div>
        <span
          className={styles.cta}
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </Link>
  );
}
