import { Avatar } from "../Avatar/Avatar";
import type { EventRegistrationWithProfile } from "../../types/events";
import styles from "./EventRegistrationList.module.scss";

interface EventRegistrationListProps {
  registrations: EventRegistrationWithProfile[];
}

function profileName(registration: EventRegistrationWithProfile): string {
  return registration.profile?.name ?? "Usuario";
}

function groupRegistrations(
  registrations: EventRegistrationWithProfile[],
): EventRegistrationWithProfile[][] {
  const groups = new Map<string, EventRegistrationWithProfile[]>();

  registrations.forEach((registration) => {
    const key = registration.registration_group_id == null
      ? `registration-${registration.id}`
      : `group-${registration.registration_group_id}`;
    groups.set(key, [...(groups.get(key) ?? []), registration]);
  });

  return Array.from(groups.values());
}

function RegistrationCard({
  registrations,
  order,
}: {
  registrations: EventRegistrationWithProfile[];
  order: number;
}) {
  return (
    <li className={styles.item}>
      <span className={styles.order}>{order}</span>
      <div className={styles.participants}>
        {registrations.map((registration) => {
          const name = profileName(registration);

          return (
            <div
              className={styles.participant}
              key={registration.id}
            >
              <Avatar
                src={registration.profile?.avatar_url}
                name={name}
              />
              <div className={styles.body}>
                <p className={styles.name}>{name}</p>
                {registration.profile?.category ? (
                  <p className={styles.category}>
                    Categoría: {registration.profile.category}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
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
  const confirmedGroups = groupRegistrations(confirmed);
  const waitlistedGroups = groupRegistrations(waitlisted);

  return (
    <div className={styles.groups}>
      {confirmed.length > 0 ? (
        <ul className={styles.list}>
          {confirmedGroups.map((group, index) => (
            <RegistrationCard
              key={group[0].registration_group_id ?? `registration-${group[0].id}`}
              registrations={group}
              order={index + 1}
            />
          ))}
        </ul>
      ) : null}

      {waitlisted.length > 0 ? (
        <div className={styles.waitlist}>
          <h3 className={styles.waitlistTitle}>Lista de espera</h3>
          <ul className={styles.list}>
            {waitlistedGroups.map((group, index) => (
              <RegistrationCard
                key={group[0].registration_group_id ?? `registration-${group[0].id}`}
                registrations={group}
                order={group[0].waitlist_position ?? index + 1}
              />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
