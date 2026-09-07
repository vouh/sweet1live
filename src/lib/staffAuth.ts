/** Staff session and authentication against the FastAPI backend. */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const STAFF_KEY = "sweet1ne-staff-session";
export const STAFF_AUTH_INVALID_EVENT = "sweet1ne:staff-auth-invalid";

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  status: string;
  must_reset_password: boolean;
  is_super_admin: boolean;
  roles: string[];
  permissions: string[];
  token: string;
};

/** Ensure arrays exist — older localStorage sessions may predate RBAC fields. */
function normalizeStaffUser(raw: Partial<StaffUser> & { token?: string }): StaffUser | null {
  if (!raw.id || !raw.email || !raw.token) return null;
  return {
    id: raw.id,
    email: raw.email,
    name: raw.name ?? raw.email.split("@")[0] ?? "Staff",
    status: raw.status ?? "active",
    must_reset_password: Boolean(raw.must_reset_password),
    is_super_admin: Boolean(raw.is_super_admin),
    roles: Array.isArray(raw.roles) ? raw.roles : [],
    permissions: Array.isArray(raw.permissions) ? raw.permissions : [],
    token: raw.token,
  };
}

export function getStaffSession(): StaffUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STAFF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StaffUser>;
    const user = normalizeStaffUser(parsed);
    if (!user) {
      window.localStorage.removeItem(STAFF_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function setStaffSession(user: StaffUser) {
  const normalized = normalizeStaffUser(user);
  if (!normalized) return;
  window.localStorage.setItem(STAFF_KEY, JSON.stringify(normalized));
}

export function clearStaffSession() {
  window.localStorage.removeItem(STAFF_KEY);
}

/**
 * Put the whole staff UI back into its signed-out state when an authenticated
 * API request is rejected. Keeping this in one place prevents individual
 * pages from rendering a misleading in-dashboard 401 error while the shell
 * still displays the staff member from localStorage.
 */
export function invalidateStaffSession() {
  if (typeof window === "undefined") return;
  clearStaffSession();
  window.dispatchEvent(new Event(STAFF_AUTH_INVALID_EVENT));
}

export function staffAuthHeaders(): HeadersInit {
  const session = getStaffSession();
  if (!session?.token) return {};
  return { Authorization: `Bearer ${session.token}` };
}

export async function staffLogin(email: string, password: string): Promise<StaffUser> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/staff/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  const data = (await response.json()) as {
    access_token?: string;
    staff?: Omit<StaffUser, "token">;
    detail?: string;
  };

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : "Too many attempts. Please wait a few minutes and try again."
      );
    }
    throw new Error(typeof data.detail === "string" ? data.detail : "Sign in failed.");
  }

  if (!data.access_token || !data.staff) {
    throw new Error("Unexpected response from server.");
  }

  const user = normalizeStaffUser({ ...data.staff, token: data.access_token });
  if (!user) throw new Error("Unexpected response from server.");
  setStaffSession(user);
  return user;
}

export async function refreshStaffSession(): Promise<StaffUser | null> {
  const current = getStaffSession();
  if (!current?.token) return null;

  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/staff/me`, {
      headers: { Authorization: `Bearer ${current.token}` },
    });
  } catch {
    return current;
  }

  if (!response.ok) {
    clearStaffSession();
    return null;
  }

  const staff = (await response.json()) as Omit<StaffUser, "token">;
  const user = normalizeStaffUser({ ...staff, token: current.token });
  if (!user) {
    clearStaffSession();
    return null;
  }
  setStaffSession(user);
  return user;
}

export async function staffSetPassword(token: string, password: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/staff/set-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = (await response.json()) as { detail?: string; message?: string };
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Could not set password.");
  }
}

export async function staffForgotPassword(email: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/auth/staff/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
  } catch {
    throw new Error("Could not reach the server. Is the backend running?");
  }

  const data = (await response.json()) as { detail?: string; message?: string };
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Could not send reset link.");
  }
  return data.message ?? "Reset link sent. Check your inbox.";
}

/** Starts a logged-in password change — a confirmation code is emailed, nothing changes yet. */
export async function staffRequestPasswordChange(newPassword: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/staff/change-password/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...staffAuthHeaders() },
    body: JSON.stringify({ new_password: newPassword }),
  });
  const data = (await response.json()) as { detail?: string };
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Could not start password change.");
  }
}

/**
 * Confirms the emailed code and applies the new password. The password isn't
 * stored anywhere between staffRequestPasswordChange and this call — it's
 * only ever held in memory on this page — so it's supplied again here.
 */
export async function staffConfirmPasswordChange(code: string, newPassword: string): Promise<void> {
  const response = await fetch(`${API_URL}/auth/staff/change-password/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...staffAuthHeaders() },
    body: JSON.stringify({ code: code.trim(), new_password: newPassword }),
  });
  const data = (await response.json()) as { detail?: string };
  if (!response.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Could not confirm that code.");
  }
}

export function staffDisplayRole(user: StaffUser): string {
  if (user.is_super_admin) return "Super Admin";
  const roles = Array.isArray(user.roles) ? user.roles : [];
  return roles[0] ?? "Staff";
}
