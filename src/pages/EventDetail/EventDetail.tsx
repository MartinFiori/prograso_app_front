import { Link } from "react-router-dom";

import { Button } from "../../components/Button/Button";
import { EventMembershipCta } from "../../components/EventMembershipCta/EventMembershipCta";
import { EventRegistrationList } from "../../components/EventRegistrationList/EventRegistrationList";
import { PadelLoader } from "../../components/PadelLoader/PadelLoader";
import { useEventDetail } from "../../hooks/useEventDetail";
import {
  cardVariantForStatus,
  formatCapacity,
  formatEventDateTime,
  formatPrice,
  formatRegistrationDeadline,
  statusLabel,
} from "../../utils/eventDisplay";
import {
  categoryEventsPath,
  homePath,
} from "../../utils/publicEventPaths";
import NotFound from "../NotFound/NotFound";
import styles from "./EventDetail.module.scss";

export default function EventDetail() {
  const {
    state,
    registrationsState,
    setRegistrationsPage,
    reload,
    reloadRegistrations,
  } = useEventDetail();

  if (state.status === "loading") {
    return (
      <main className={styles.page}>
        <PadelLoader label="Cargando evento..." />
      </main>
    );
  }

  if (state.status === "invalid-id") {
    return (
      <main className={styles.page}>
        <h1>Evento no válido</h1>
        <p>El identificador del evento debe ser un número entero positivo.</p>
        <Link
          className={styles.back}
          to={homePath()}
        >
          Volver a categorías
        </Link>
      </main>
    );
  }

  if (state.status === "not-found") {
    return <NotFound />;
  }

  if (state.status === "error") {
    return (
      <main className={styles.page}>
        <div
          className={styles.error}
          role="alert"
        >
          <p>{state.message}</p>
          <Button onClick={() => void reload()}>Reintentar</Button>
        </div>
      </main>
    );
  }

  const { event, statuses } = state;
  const badge = statusLabel(event.status_code, statuses);
  const imageAlt = event.category.name || event.title;
  const priceLabel = formatPrice(event.price);
  const backToCategory = categoryEventsPath(event.category_id);
  const confirmedCount =
    registrationsState.status === "success"
      ? registrationsState.registrations.filter(
          (registration) => registration.status_code === "confirmed",
        ).length
      : 0;

  return (
    <main className={styles.page}>
      <Link
        className={styles.back}
        to={backToCategory}
      >
        Volver a {event.category.name}
      </Link>

      {event.category.image_url ? (
        <img
          className={styles.hero}
          src={event.category.image_url}
          alt={imageAlt}
        />
      ) : null}

      <header className={styles.header}>
        <p className={`${styles.badge} ${styles[cardVariantForStatus(event.status_code)]}`}>
          {badge}
        </p>
        <h1>{event.title}</h1>
        <p className={styles.category}>{event.category.name}</p>
      </header>

      <dl className={styles.meta}>
        <div>
          <dt>Inicio</dt>
          <dd>
            <time dateTime={event.starts_at}>
              {formatEventDateTime(event.starts_at)}
            </time>
          </dd>
        </div>
        <div>
          <dt>Inscripción hasta</dt>
          <dd>
            {event.registration_deadline ? (
              <time dateTime={event.registration_deadline}>
                {formatRegistrationDeadline(event.registration_deadline)}
              </time>
            ) : (
              formatRegistrationDeadline(null)
            )}
          </dd>
        </div>
        <div>
          <dt>Cupo</dt>
          <dd>{formatCapacity(event.capacity)}</dd>
        </div>
        <div>
          <dt>Precio</dt>
          <dd>{priceLabel}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>{event.category.name}</dd>
        </div>
      </dl>

      <section
        className={styles.roster}
        aria-labelledby="event-registrations-heading"
      >
        <header className={styles.rosterHeader}>
          <h2 id="event-registrations-heading">Usuarios registrados</h2>
          <p className={styles.rosterCount}>
            {confirmedCount} de {event.capacity}
          </p>
        </header>

        <EventMembershipCta
          eventId={event.id}
          onMembershipChanged={() => void reloadRegistrations()}
        />

        {registrationsState.status === "loading" ? (
          <PadelLoader label="Cargando inscriptos..." />
        ) : null}

        {registrationsState.status === "empty" ? (
          <p role="status">Todavía no hay usuarios registrados en este evento.</p>
        ) : null}

        {registrationsState.status === "error" ? (
          <div
            className={styles.error}
            role="alert"
          >
            <p>{registrationsState.message}</p>
            <Button onClick={() => void reloadRegistrations()}>Reintentar</Button>
          </div>
        ) : null}

        {registrationsState.status === "success" ? (
          <>
            <EventRegistrationList
              registrations={registrationsState.registrations}
            />

            {registrationsState.totalPages > 1 ? (
              <div className={styles.pagination}>
                <Button
                  variant="secondary"
                  disabled={registrationsState.page <= 1}
                  onClick={() =>
                    setRegistrationsPage(registrationsState.page - 1)
                  }
                >
                  Anterior
                </Button>
                <p>
                  Página {registrationsState.page} de{" "}
                  {registrationsState.totalPages}
                </p>
                <Button
                  variant="secondary"
                  disabled={
                    registrationsState.page >= registrationsState.totalPages
                  }
                  onClick={() =>
                    setRegistrationsPage(registrationsState.page + 1)
                  }
                >
                  Siguiente
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    </main>
  );
}
