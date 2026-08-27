/** Shared staff-role helpers (safe on server + client). */

/** Known admin emails until real staff roles live in the DB. */
const ADMIN_EMAILS = new Set(["staff@sweet1ne.com"]);

export function normalizeStaffEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** True when the address has an admin / staff role (stub → DB later). */
export function emailHasAdminRole(email: string): boolean {
  const normalized = normalizeStaffEmail(email);
  if (!normalized.includes("@")) return false;
  if (ADMIN_EMAILS.has(normalized)) return true;
  // Temporary testing: any @sweet1ne.com address counts as staff admin.
  return normalized.endsWith("@sweet1ne.com");
}
