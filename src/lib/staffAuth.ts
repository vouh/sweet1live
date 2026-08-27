/** Client-side staff session for admin testing (no real auth yet). */

export type StaffUser = {
  email: string;
  name: string;
  role: string;
};

export { emailHasAdminRole, normalizeStaffEmail } from "@/lib/staffRoles";

const STAFF_KEY = "sweet1ne-staff-session";

export function getStaffSession(): StaffUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STAFF_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StaffUser;
  } catch {
    return null;
  }
}

export function setStaffSession(user: StaffUser) {
  window.localStorage.setItem(STAFF_KEY, JSON.stringify(user));
}

export function clearStaffSession() {
  window.localStorage.removeItem(STAFF_KEY);
}

/** Testing gate: any non-empty email + password is accepted. */
export function staffLoginForTesting(email: string, password: string): StaffUser {
  const trimmed = email.trim();
  if (!trimmed || !password) {
    throw new Error("Email and password are required.");
  }
  if (!trimmed.includes("@")) {
    throw new Error("Enter a valid email address.");
  }
  const name = trimmed.split("@")[0].replace(/[._]/g, " ");
  const user: StaffUser = {
    email: trimmed,
    name: name.replace(/\b\w/g, (c) => c.toUpperCase()) || "Staff",
    role: "Super Admin",
  };
  setStaffSession(user);
  return user;
}
