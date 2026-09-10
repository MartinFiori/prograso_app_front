import type { CardVariant } from "../components/Card/Card";
import type { EventStatus } from "../types/events";
import { PUBLIC_EVENT_STATUS_CODES } from "../types/events";

export function formatEventDateTime(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRegistrationDeadline(iso: string | null): string {
  if (iso === null) {
    return "Sin fecha límite";
  }

  return formatEventDateTime(iso);
}

export function formatCapacity(capacity: number): string {
  return `Cupo máximo: ${capacity}`;
}

const priceFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  return priceFormatter.format(price);
}

export function statusLabel(
  statusCode: string,
  statuses: EventStatus[] | null,
): string {
  const match = statuses?.find((status) => status.code === statusCode);
  return match?.label ?? statusCode;
}

export function cardVariantForStatus(statusCode: string): CardVariant {
  if (statusCode === "open") {
    return "primary";
  }

  if (statusCode === "completed") {
    return "accent";
  }

  return "default";
}

export function publicStatusOptions(statuses: EventStatus[] | null): EventStatus[] {
  const publicCodes = new Set<string>(PUBLIC_EVENT_STATUS_CODES);

  if (!statuses || statuses.length === 0) {
    return PUBLIC_EVENT_STATUS_CODES.map((code) => ({
      code,
      label: code,
      description: null,
    }));
  }

  return statuses.filter((status) => publicCodes.has(status.code));
}
