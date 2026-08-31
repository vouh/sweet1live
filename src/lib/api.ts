import { readFormSecurityFields } from "@/lib/formSecurity";

export type ActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type FastApiValidationIssue = {
  loc: (string | number)[];
  msg: string;
};

async function postJson(path: string, body: Record<string, unknown>): Promise<ActionState> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      success: false,
      message: "Could not reach the server. Please try again in a moment.",
    };
  }

  if (response.ok) {
    return { success: true, message: "Success" };
  }

  if (response.status === 422) {
    const data: { detail?: FastApiValidationIssue[] | string } = await response.json();
    if (typeof data.detail === "string") {
      return { success: false, message: data.detail };
    }
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of data.detail ?? []) {
      const field = issue.loc[issue.loc.length - 1];
      if (typeof field === "string") {
        fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.msg];
      }
    }
    return { success: false, message: "Please fix the errors below.", fieldErrors };
  }

  if (response.status === 429) {
    const data: { detail?: string } = await response.json().catch(() => ({}));
    return {
      success: false,
      message: data.detail ?? "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  return { success: false, message: "Something went wrong. Please try again." };
}

export async function createReservation(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  return postJson("/reservations", {
    ...readFormSecurityFields(formData),
    name: formData.get("name"),
    email: formData.get("email"),
    party_size: Number(formData.get("partySize")),
    date: formData.get("date"),
    time: formData.get("time"),
    notes: formData.get("notes") || null,
  });
}

export async function createVenueEnquiry(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  return postJson("/venue-enquiries", {
    ...readFormSecurityFields(formData),
    name: formData.get("name"),
    email: formData.get("email"),
    event_type: formData.get("eventType"),
    guests: Number(formData.get("guests")),
    date: formData.get("date"),
    details: formData.get("details") || null,
  });
}

export async function createContactMessage(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  return postJson("/contact", {
    ...readFormSecurityFields(formData),
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
}

export async function subscribeMailingList(
  email: string,
  security: Record<string, string | number> = {}
): Promise<ActionState> {
  return postJson("/mailing-list", {
    ...security,
    email,
  });
}

export type AuthUserPayload = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type AuthResult =
  | { success: true; access_token: string; user: AuthUserPayload }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

async function authPost(path: string, body: Record<string, unknown>): Promise<AuthResult> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      success: false,
      message: "Could not reach the server. Please try again in a moment.",
    };
  }

  if (response.ok) {
    const data = (await response.json()) as {
      access_token: string;
      user: AuthUserPayload;
    };
    return { success: true, access_token: data.access_token, user: data.user };
  }

  if (response.status === 422) {
    const data: { detail?: FastApiValidationIssue[] } = await response.json();
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of data.detail ?? []) {
      const field = issue.loc[issue.loc.length - 1];
      if (typeof field === "string") {
        fieldErrors[field] = [...(fieldErrors[field] ?? []), issue.msg];
      }
    }
    return { success: false, message: "Please fix the errors below.", fieldErrors };
  }

  if (response.status === 409) {
    return { success: false, message: "An account with this email already exists." };
  }

  if (response.status === 401) {
    return { success: false, message: "Invalid email or password." };
  }

  return { success: false, message: "Something went wrong. Please try again." };
}

export async function registerAccount(body: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  return authPost("/auth/register", body);
}

export async function loginAccount(body: {
  email: string;
  password: string;
}): Promise<AuthResult> {
  return authPost("/auth/login", body);
}
