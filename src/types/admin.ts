import type { EventCategoryEmbed, PublicEvent } from "./events";

export type AdminEvent = PublicEvent & {
  created_by: string;
  created_at: string;
  updated_at: string;
  category: EventCategoryEmbed;
};

export type CreateEventBody = {
  category_id: number;
  title: string;
  starts_at: string;
  capacity: number;
  price: number;
  registration_deadline?: string | null;
  status_code?: string;
};

export type UpdateEventBody = {
  category_id?: number;
  title?: string;
  starts_at?: string;
  registration_deadline?: string | null;
  capacity?: number;
  price?: number;
  status_code?: string;
};

export type AdminProfileEmbed = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: string;
};

export type AdminRegistration = {
  id: number;
  event_id: number;
  user_id: string;
  status_code: string;
  waitlist_position: number | null;
  has_paid?: boolean;
  created_at: string;
  updated_at: string;
  profile?: AdminProfileEmbed;
};

export type RegistrationListMeta = {
  capacity: number;
  confirmed_count: number;
  waitlisted_count: number;
};

export type CatalogStatus = {
  code: string;
  label: string;
  description: string | null;
};

export type EventRegistrationAccess = {
  blocked: boolean;
  blocked_at: string | null;
  blocked_until: string | null;
  reason?: string | null;
  blocked_by?: string | null;
};

export type AdminUser = {
  id: string;
  email: string | null;
  name: string;
  avatar_url: string | null;
  role: "user" | "admin" | string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  auth_suspended: boolean;
  banned_until: string | null;
  event_registration_access: EventRegistrationAccess;
};

export type ListAdminUsersQuery = {
  page?: number;
  limit?: number;
  q?: string;
  role?: "admin" | "user";
  event_registration_blocked?: boolean;
  auth_suspended?: boolean;
  sort?: string;
};

export type InviteUserBody = {
  email: string;
  name: string;
  role?: "admin" | "user";
};

export const AUDIT_ACTIONS = [
  "user_invited",
  "profile_updated",
  "role_changed",
  "event_registration_blocked",
  "event_registration_unblocked",
  "auth_suspended",
  "auth_reactivated",
  "user_deleted",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditLog = {
  id: number;
  actor_user_id: string | null;
  target_user_id: string;
  action: string;
  reason: string | null;
  previous_values: unknown;
  new_values: unknown;
  created_at: string;
};

export type ListAuditLogsQuery = {
  page?: number;
  limit?: number;
  target_user_id?: string;
  action?: AuditAction | string;
};
