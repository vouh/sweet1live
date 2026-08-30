/** Client-side limits for menu admin forms — kept in sync with backend where noted. */
export const MAX_MENU_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_MENU_IMAGE_MB = 4;
export const MAX_MENU_IMAGES = 6;

export const MENU_FIELD_LIMITS = {
  categoryName: 64,
  dishName: 120,
  description: 500,
  tag: 4,
  ingredients: 1000,
  nutrition: 200,
} as const;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateMenuImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `${file.name}: use JPEG, PNG, WebP, or GIF.`;
  }
  if (file.size > MAX_MENU_IMAGE_BYTES) {
    return `${file.name}: must be under ${MAX_MENU_IMAGE_MB}MB.`;
  }
  return null;
}
