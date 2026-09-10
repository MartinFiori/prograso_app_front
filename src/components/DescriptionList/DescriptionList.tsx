import type { ReactNode } from "react";

import styles from "./DescriptionList.module.scss";

export function emptyDisplay(value: unknown): string {
  if (value == null) {
    return "—";
  }

  if (typeof value === "string" && value.trim() === "") {
    return "—";
  }

  return String(value);
}

export type DescriptionItem = {
  label: string;
  value: ReactNode;
};

export function DescriptionList({ items }: { items: DescriptionItem[] }) {
  return (
    <dl className={styles.list}>
      {items.map((item) => (
        <div
          key={item.label}
          className={styles.row}
        >
          <dt className={styles.label}>{item.label}</dt>
          <dd className={styles.value}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
