import { EVENTS_PAGE_LIMIT } from "./eventsApi";
import type { ListAuditLogsQuery } from "../types/admin";

export function listRegistrationStatusesPath(): string {
  return "/registration-statuses";
}

export function listAuditLogsPath(query: ListAuditLogsQuery = {}): string {
  const params = new URLSearchParams();
  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? EVENTS_PAGE_LIMIT));

  if (query.target_user_id?.trim()) {
    params.set("target_user_id", query.target_user_id.trim());
  }

  if (query.action?.trim()) {
    params.set("action", query.action.trim());
  }

  return `/admin/audit-logs?${params.toString()}`;
}
