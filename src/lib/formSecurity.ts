/** Client-side helpers for bot-resistant public forms. */

export const FORM_SECURITY_FIELD = {
  honeypot: "_hp",
  timestamp: "_ts",
  turnstile: "_ts_token",
} as const;

/** Milliseconds since epoch — set once when the form mounts. */
export function formSecurityTimestamp(): number {
  return Date.now();
}

export function readFormSecurityFields(formData: FormData): Record<string, string | number> {
  const hp = String(formData.get(FORM_SECURITY_FIELD.honeypot) ?? "").trim();
  const rawTs = formData.get(FORM_SECURITY_FIELD.timestamp);
  const ts = rawTs != null && String(rawTs).trim() !== "" ? Number(rawTs) : formSecurityTimestamp();
  const token = String(formData.get(FORM_SECURITY_FIELD.turnstile) ?? "").trim();
  const fields: Record<string, string | number> = {
    [FORM_SECURITY_FIELD.honeypot]: hp,
    [FORM_SECURITY_FIELD.timestamp]: ts,
  };
  if (token) {
    fields[FORM_SECURITY_FIELD.turnstile] = token;
  }
  return fields;
}
