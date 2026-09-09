import { EVENTS_PAGE_LIMIT } from "./eventsApi";
import type { ListAdminUsersQuery } from "../types/admin";

export function listAdminUsersPath(query: ListAdminUsersQuery = {}): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? EVENTS_PAGE_LIMIT));

  if (query.q?.trim()) {
    params.set("q", query.q.trim());
  }

  if (query.role) {
    params.set("role", query.role);
  }

  if (query.event_registration_blocked != null) {
    params.set(
      "event_registration_blocked",
      String(query.event_registration_blocked),
    );
  }

  if (query.auth_suspended != null) {
    params.set("auth_suspended", String(query.auth_suspended));
  }

  if (query.sort) {
    params.set("sort", query.sort);
  }

  return `/admin/users?${params.toString()}`;
}

export function getAdminUserPath(userId: string): string {
  return `/admin/users/${userId}`;
}

export function inviteAdminUserPath(): string {
  return "/admin/users/invitations";
}

export function updateAdminUserPath(userId: string): string {
  return `/admin/users/${userId}`;
}

export function updateAdminUserRolePath(userId: string): string {
  return `/admin/users/${userId}/role`;
}

export function eventRegistrationBlockPath(userId: string): string {
  return `/admin/users/${userId}/event-registration-block`;
}

export function authSuspensionPath(userId: string): string {
  return `/admin/users/${userId}/auth-suspension`;
}

export function deleteAdminUserPath(userId: string): string {
  return `/admin/users/${userId}`;
}

export function parseUserIdParam(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuid.test(raw) ? raw : null;
}
