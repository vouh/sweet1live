export const THEME_STORAGE_KEY = "sweet1ne-theme";

export type Theme = "dark" | "light";

export function resolveTheme(stored: string | undefined | null): Theme {
  return stored === "light" ? "light" : "dark";
}

export function themeCookieValue(theme: Theme): string {
  return `${THEME_STORAGE_KEY}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}
