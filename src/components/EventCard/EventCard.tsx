import { useNavigate } from "react-router-dom";

import { Card } from "../Card/Card";
import type { EventStatus, PublicEvent } from "../../types/events";
import {
  cardVariantForStatus,
  formatCapacity,
  formatEventDateTime,
  formatPrice,
  statusLabel,
} from "../../utils/eventDisplay";
import { eventDetailPath } from "../../utils/publicEventPaths";
import styles from "./EventCard.module.scss";

interface EventCardProps {
  event: PublicEvent;
  statuses: EventStatus[] | null;
}

export function EventCard({ event, statuses }: EventCardProps) {
  const navigate = useNavigate();
  const badge = statusLabel(event.status_code, statuses);
  const imageAlt = event.category.name || event.title;
  const priceLabel = formatPrice(event.price);

  function handleActivate() {
    navigate(eventDetailPath(event.category_id, event.id));
  }

  return (
    <Card
      title={event.title}
      subtitle={event.category.name}
      image={event.category.image_url ?? undefined}
      imageAlt={imageAlt}
      badge={badge}
      variant={cardVariantForStatus(event.status_code)}
      interactive
      onClick={handleActivate}
      footer={
        <div className={styles.footer}>
          <time dateTime={event.starts_at}>
            {formatEventDateTime(event.starts_at)}
          </time>
          <span>{formatCapacity(event.capacity)}</span>
          {priceLabel ? <span>{priceLabel}</span> : null}
        </div>
      }
    >
      {null}
    </Card>
  );
}
