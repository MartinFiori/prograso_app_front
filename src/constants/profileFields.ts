export const PROFILE_CATEGORIES = [
  "9na",
  "8va",
  "7ma",
  "6ta",
  "5ta",
  "4ta",
  "3ra",
] as const;

export const PROFILE_GENDERS = [
  "Masculino",
  "Femenino",
  "No binario",
] as const;

export type ProfileCategory = (typeof PROFILE_CATEGORIES)[number];
export type ProfileGender = (typeof PROFILE_GENDERS)[number];

export const PHONE_PREFIXES = [
  { id: "AR", code: "+54", label: "AR" },
  { id: "UY", code: "+598", label: "UY" },
  { id: "CL", code: "+56", label: "CL" },
  { id: "BR", code: "+55", label: "BR" },
  { id: "PY", code: "+595", label: "PY" },
  { id: "PE", code: "+51", label: "PE" },
  { id: "CO", code: "+57", label: "CO" },
  { id: "MX", code: "+52", label: "MX" },
  { id: "ES", code: "+34", label: "ES" },
  { id: "US", code: "+1", label: "US" },
] as const;

export const DEFAULT_PHONE_PREFIX = "+54";

export function splitPhoneNumber(value: string | null): {
  prefix: string;
  national: string;
} {
  if (!value?.trim()) {
    return { prefix: DEFAULT_PHONE_PREFIX, national: "" };
  }

  const trimmed = value.trim();
  const match = [...PHONE_PREFIXES]
    .sort((left, right) => right.code.length - left.code.length)
    .find((item) => trimmed.startsWith(item.code));

  if (match) {
    return {
      prefix: match.code,
      national: trimmed.slice(match.code.length).trim(),
    };
  }

  if (trimmed.startsWith("+")) {
    return { prefix: DEFAULT_PHONE_PREFIX, national: trimmed.replace(/^\+/, "") };
  }

  return { prefix: DEFAULT_PHONE_PREFIX, national: trimmed };
}

export function joinPhoneNumber(
  prefix: string,
  national: string,
): string | null {
  const digits = national.replace(/\s/g, "");

  if (!digits) {
    return null;
  }

  return `${prefix}${digits}`;
}
