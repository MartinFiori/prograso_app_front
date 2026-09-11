import { Button } from "../../../components/Button/Button";
import { Modal } from "../../../components/Modal/Modal";
import shared from "../adminShared.module.scss";
import styles from "./RegistrationsPage.module.scss";

type RemovePlayerModalProps = {
  open: boolean;
  playerName: string;
  eventTitle: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function RemovePlayerModal({
  open,
  playerName,
  eventTitle,
  busy,
  error,
  onClose,
  onConfirm,
}: RemovePlayerModalProps) {
  return (
    <Modal
      open={open}
      title="Quitar del evento"
      onClose={onClose}
      busy={busy}
    >
      <p className={styles.modalLede}>
        ¿Querés quitar a {playerName} de {eventTitle}?
      </p>
      {error ? (
        <p
          className={shared.error}
          role="alert"
        >
          {error}
        </p>
      ) : null}
      <div className={styles.modalActions}>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          variant="danger"
          loading={busy}
          onClick={() => {
            if (!busy) {
              onConfirm();
            }
          }}
        >
          Quitar del evento
        </Button>
      </div>
    </Modal>
  );
}
