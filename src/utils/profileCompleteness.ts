import type { MeProfile } from "../types/me";

export function isProfileComplete(profile: MeProfile | null): boolean {
  return Boolean(profile?.name?.trim());
}
