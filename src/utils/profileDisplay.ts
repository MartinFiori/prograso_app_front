import type { User } from "@supabase/supabase-js";

import type { MeProfile } from "../types/me";

function metaString(user: User | null, key: string): string | null {
  const value = user?.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function profileDisplayName(
  profile: MeProfile | null,
  user: User | null,
): string {
  return (
    profile?.name?.trim() ||
    metaString(user, "full_name") ||
    metaString(user, "name") ||
    "Usuario"
  );
}

export function profileAvatarSrc(
  profile: MeProfile | null,
  user: User | null,
): string | null {
  return (
    profile?.avatar_url ||
    metaString(user, "avatar_url") ||
    metaString(user, "picture")
  );
}

export function isProfileNotFoundError(error: {
  errorCode?: string;
  status: number;
}): boolean {
  return error.errorCode === "profile_not_found" || error.status === 404;
}
