import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "../Button/Button";
import styles from "./Modal.module.scss";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
};

export function Modal({
  open,
  title,
  children,
  onClose,
  busy = false,
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const dialog = dialogRef.current;
    const focusables = dialog?.querySelectorAll<HTMLElement>(FOCUSABLE);
    const first = focusables?.[0];
    (first ?? dialog)?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));

      if (nodes.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const currentIndex = nodes.indexOf(document.activeElement as HTMLElement);
      const lastIndex = nodes.length - 1;

      if (event.shiftKey && (currentIndex <= 0 || currentIndex === -1)) {
        event.preventDefault();
        nodes[lastIndex].focus();
        return;
      }

      if (!event.shiftKey && (currentIndex === lastIndex || currentIndex === -1)) {
        event.preventDefault();
        nodes[0].focus();
      }
    }

    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [busy, onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className={styles.root}>
      <div
        className={styles.backdrop}
        onClick={() => {
          if (!busy) {
            onClose();
          }
        }}
      />
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2
            id={titleId}
            className={styles.title}
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={busy}
            aria-label="Cerrar"
          >
            Cerrar
          </Button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
