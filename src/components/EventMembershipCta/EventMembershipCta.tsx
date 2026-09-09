import { MouseEvent } from "react";

import { Button } from "../Button/Button";
import { useEventMembership } from "../../hooks/useEventMembership";
import styles from "./EventMembershipCta.module.scss";

interface EventMembershipCtaProps {
  eventId: number | null;
  onMembershipChanged?: () => void;
}

function stopCardSelect(event: MouseEvent<HTMLDivElement>) {
  event.stopPropagation();
}

export function EventMembershipCta({
  eventId,
  onMembershipChanged,
}: EventMembershipCtaProps) {
  const { state, inFlight, join, leave } = useEventMembership(eventId);

  async function handleJoin() {
    const changed = await join();
    if (changed) {
      onMembershipChanged?.();
    }
  }

  async function handleLeave() {
    const changed = await leave();
    if (changed) {
      onMembershipChanged?.();
    }
  }

  if (eventId === null || state.status === "idle") {
    return null;
  }

  return (
    <div
      className={styles.cta}
      onClick={stopCardSelect}
    >
      {state.status === "loading" ? (
        <p className={styles.status}>Cargando tu inscripción...</p>
      ) : null}

      {state.status === "anonymous" ? (
        <Button
          onClick={() => void handleJoin()}
          disabled={inFlight}
        >
          Anotarme
        </Button>
      ) : null}

      {state.status === "not-joined" ? (
        <Button
          onClick={() => void handleJoin()}
          loading={inFlight}
          disabled={inFlight}
        >
          Anotarme
        </Button>
      ) : null}

      {state.status === "joined" && state.registration.status_code === "confirmed" ? (
        <>
          <p className={styles.status}>Inscripto</p>
          <Button
            variant="secondary"
            onClick={() => void handleLeave()}
            loading={inFlight}
            disabled={inFlight}
          >
            Darme de baja
          </Button>
        </>
      ) : null}

      {state.status === "joined" && state.registration.status_code === "waitlisted" ? (
        <>
          <p className={styles.status}>
            En espera
            {state.registration.waitlist_position != null
              ? ` (${state.registration.waitlist_position})`
              : ""}
          </p>
          <Button
            variant="secondary"
            onClick={() => void handleLeave()}
            loading={inFlight}
            disabled={inFlight}
          >
            Darme de baja
          </Button>
        </>
      ) : null}

      {state.status === "error" ? (
        <p
          className={styles.error}
          role="alert"
        >
          {state.errorCode && !state.message.includes(state.errorCode)
            ? `${state.message} (${state.errorCode})`
            : state.message}
        </p>
      ) : null}
    </div>
  );
}
