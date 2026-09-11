import type { AdminRegistration } from "../../../types/admin";

export function playerName(
  registration: AdminRegistration,
  email?: string | null,
): string {
  const name = registration.profile?.name?.trim();

  if (name) {
    return name;
  }

  if (email?.trim()) {
    return email.trim();
  }

  return registration.user_id;
}

export function catalogLabel(
  code: string,
  items: { code: string; label: string }[],
): string {
  return items.find((item) => item.code === code)?.label ?? code;
}

export function matchesPlayerSearch(
  registration: AdminRegistration,
  email: string | null | undefined,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  const name = registration.profile?.name ?? "";
  const mail = email ?? "";

  return (
    name.toLowerCase().includes(needle) || mail.toLowerCase().includes(needle)
  );
}
