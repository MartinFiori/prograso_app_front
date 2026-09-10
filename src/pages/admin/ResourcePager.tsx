import { Button } from "../../components/Button/Button";
import { EVENTS_PAGE_LIMIT } from "../../services/eventsApi";
import styles from "./adminShared.module.scss";

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

type ResourcePagerProps = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  noun: string;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  disabled?: boolean;
};

export function ResourcePager({
  page,
  totalPages,
  total,
  limit,
  noun,
  onPageChange,
  onLimitChange,
  disabled = false,
}: ResourcePagerProps) {
  const pages = Math.max(1, totalPages);

  return (
    <div className={styles.pager}>
      <p>
        Página {page} de {pages} ({total} {noun})
      </p>
      <label className={styles.field}>
        <span className={styles.label}>Filas</span>
        <select
          className={styles.select}
          value={limit}
          disabled={disabled}
          aria-label="Filas por página"
          onChange={(event) => onLimitChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Anterior
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
}

export { EVENTS_PAGE_LIMIT };
