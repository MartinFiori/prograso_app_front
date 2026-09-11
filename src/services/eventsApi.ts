import type { ListEventsQuery } from "../types/events";

export const EVENTS_PAGE_LIMIT = 20;

function applyListEventsParams(
  params: URLSearchParams,
  query: ListEventsQuery = {},
): void {
  if (query.category_id != null) {
    params.set("category_id", String(query.category_id));
  }

  if (query.status_code) {
    params.set("status_code", query.status_code);
  }

  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? EVENTS_PAGE_LIMIT));
}

export function listEventsPath(query: ListEventsQuery = {}): string {
  const params = new URLSearchParams();
  applyListEventsParams(params, query);
  return `/events?${params.toString()}`;
}

export function listAdminEventsPath(query: ListEventsQuery = {}): string {
  const params = new URLSearchParams();
  applyListEventsParams(params, query);
  return `/admin/events?${params.toString()}`;
}

export function getAdminEventByIdPath(id: number): string {
  return `/admin/events/${id}`;
}

export function createEventPath(): string {
  return "/events";
}

export function updateEventPath(id: number): string {
  return `/events/${id}`;
}

export function deleteEventPath(id: number): string {
  return `/events/${id}`;
}

export function getEventByIdPath(id: number): string {
  return `/events/${id}`;
}

export function listCategoriesPath(): string {
  return "/event-categories";
}

export function getCategoryByIdPath(id: number): string {
  return `/event-categories/${id}`;
}

export function createCategoryPath(): string {
  return "/event-categories";
}

export function updateCategoryPath(id: number): string {
  return `/event-categories/${id}`;
}

export function deleteCategoryPath(id: number): string {
  return `/event-categories/${id}`;
}

export function getMePath(): string {
  return "/me";
}

export function patchMePath(): string {
  return "/me";
}

export function listStatusesPath(): string {
  return "/event-statuses";
}

export function listRegistrationsByEventPath(
  eventId: number,
  query: { page?: number; limit?: number } = {},
): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? EVENTS_PAGE_LIMIT));
  return `/events/${eventId}/registrations?${params.toString()}`;
}

export type ListAdminRegistrationsQuery = {
  page?: number;
  limit?: number;
  status_code?: string;
  search?: string;
};

export function listAdminRegistrationsPath(
  eventId: number,
  query: ListAdminRegistrationsQuery = {},
): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? EVENTS_PAGE_LIMIT));

  if (query.status_code) {
    params.set("status_code", query.status_code);
  }

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  return `/admin/events/${eventId}/registrations?${params.toString()}`;
}

export function createAdminRegistrationPath(eventId: number): string {
  return `/admin/events/${eventId}/registrations`;
}

export function syncAdminRegistrationsPath(eventId: number): string {
  return `/admin/events/${eventId}/registrations`;
}

export function registerForEventPath(eventId: number): string {
  return `/events/${eventId}/registrations`;
}

export function getMyRegistrationPath(eventId: number): string {
  return `/events/${eventId}/registrations/me`;
}

export function unregisterFromEventPath(eventId: number): string {
  return `/events/${eventId}/registrations/me`;
}

export function getAdminRegistrationPath(registrationId: number): string {
  return `/admin/event-registrations/${registrationId}`;
}

export function updateAdminRegistrationPath(registrationId: number): string {
  return `/admin/event-registrations/${registrationId}`;
}

export function markAdminRegistrationPaidPath(
  eventId: number,
  userId: string,
): string {
  return `/events/${eventId}/registrations/${userId}/paid`;
}

export function deleteAdminRegistrationPath(registrationId: number): string {
  return `/admin/event-registrations/${registrationId}`;
}

export function parseEventIdParam(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) {
    return null;
  }

  const id = Number(raw);

  if (id <= 0) {
    return null;
  }

  return id;
}
