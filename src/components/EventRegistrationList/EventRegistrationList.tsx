import { Avatar } from "../Avatar/Avatar";
import type { EventRegistrationWithProfile } from "../../types/events";
import styles from "./EventRegistrationList.module.scss";

interface EventRegistrationListProps {
  registrations: EventRegistrationWithProfile[];
}

function profileName(registration: EventRegistrationWithProfile): string {
  return registration.profile?.name ?? "Usuario";
}

function RegistrationCard({
  registration,
  order,
}: {
  registration: EventRegistrationWithProfile;
  order: number;
}) {
  const name = profileName(registration);
  const waitlistPosition =
    registration.status_code === "waitlisted"
      ? registration.waitlist_position
      : null;

  return (
    <li className={styles.item}>
      <span className={styles.order}>{order}</span>
      <Avatar
        src={registration.profile?.avatar_url}
        name={name}
      />
      <div className={styles.body}>
        <p className={styles.name}>{name}</p>
        {waitlistPosition != null ? (
          <p className={styles.waitlistNote}>
            Posición en espera: {waitlistPosition}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function EventRegistrationList({
  registrations,
}: EventRegistrationListProps) {
  const confirmed = registrations.filter(
    (registration) => registration.status_code === "confirmed",
  );
  const waitlisted = registrations.filter(
    (registration) => registration.status_code === "waitlisted",
  );

  return (
    <div className={styles.groups}>
      {confirmed.length > 0 ? (
        <ul className={styles.list}>
          {confirmed.map((registration, index) => (
            <RegistrationCard
              key={registration.id}
              registration={registration}
              order={index + 1}
            />
          ))}
        </ul>
      ) : null}

      {waitlisted.length > 0 ? (
        <div className={styles.waitlist}>
          <h3 className={styles.waitlistTitle}>Lista de espera</h3>
          <ul className={styles.list}>
            {waitlisted.map((registration, index) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
                order={registration.waitlist_position ?? index + 1}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
