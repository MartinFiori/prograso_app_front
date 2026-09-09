export const MAX_CATEGORY_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_CATEGORY_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type AllowedCategoryImageType =
  (typeof ALLOWED_CATEGORY_IMAGE_TYPES)[number];

const ALLOWED_SET = new Set<string>(ALLOWED_CATEGORY_IMAGE_TYPES);

export function validateCategoryImageFile(file: File): string | null {
  if (file.size === 0) {
    return "La imagen está vacía.";
  }

  if (file.size > MAX_CATEGORY_IMAGE_BYTES) {
    return "La imagen supera el máximo de 5 MB.";
  }

  if (!ALLOWED_SET.has(file.type)) {
    return "Formato no permitido. Usá JPEG, PNG, WebP o GIF.";
  }

  return null;
}
