export const INPUT_LIMITS = {
  email: 254,
  password: 128,
  name: 120,
  phone: 32,
  location: 120,
  jobTitle: 80,
  notes: 500,
} as const;

const EMAIL_RE = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
const CONTROL_CHARS = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/;

export function stripControlChars(value: string): string {
  return value.replace(CONTROL_CHARS, "");
}

export function validateLoginEmail(value: string): string | null {
  const cleaned = stripControlChars(value.trim().toLowerCase());
  if (!cleaned) return "Email is required.";
  if (cleaned.length > INPUT_LIMITS.email) return `Email must be ${INPUT_LIMITS.email} characters or fewer.`;
  if (!EMAIL_RE.test(cleaned)) return "Enter a valid email address.";
  return null;
}

export function validateLoginPassword(value: string): string | null {
  if (!value) return "Password is required.";
  if (stripControlChars(value) !== value) return "Password contains invalid characters.";
  if (value.length > INPUT_LIMITS.password) {
    return `Password must be ${INPUT_LIMITS.password} characters or fewer.`;
  }
  return null;
}

export function validateName(value: string): string | null {
  const cleaned = stripControlChars(value.trim());
  if (!cleaned) return "Name is required.";
  if (cleaned.length > INPUT_LIMITS.name) return `Name must be ${INPUT_LIMITS.name} characters or fewer.`;
  if (!/^[\w\s.'\-]+$/u.test(cleaned)) return "Name contains characters that aren't allowed.";
  return null;
}

export function validatePhone(value: string): string | null {
  const cleaned = stripControlChars(value.trim());
  if (!cleaned) return null;
  if (cleaned.length > INPUT_LIMITS.phone) return `Phone must be ${INPUT_LIMITS.phone} characters or fewer.`;
  if (!/^\+?[\d\s().\-]{7,32}$/.test(cleaned)) return "Enter a valid phone number.";
  return null;
}

export function validateLocation(value: string): string | null {
  const cleaned = stripControlChars(value.trim());
  if (!cleaned) return null;
  if (cleaned.length > INPUT_LIMITS.location) {
    return `Location must be ${INPUT_LIMITS.location} characters or fewer.`;
  }
  if (!/^[\w\s.,'\-/&#()]+$/u.test(cleaned)) return "Location contains characters that aren't allowed.";
  return null;
}

export function validateJobTitle(value: string): string | null {
  const cleaned = stripControlChars(value.trim());
  if (!cleaned) return null;
  if (cleaned.length > INPUT_LIMITS.jobTitle) {
    return `Job title must be ${INPUT_LIMITS.jobTitle} characters or fewer.`;
  }
  if (!/^[\w\s.&'\-/()]+$/u.test(cleaned)) return "Job title contains characters that aren't allowed.";
  return null;
}

export function validateNotes(value: string): string | null {
  const cleaned = stripControlChars(value.trim());
  if (!cleaned) return null;
  if (cleaned.length > INPUT_LIMITS.notes) return `Notes must be ${INPUT_LIMITS.notes} characters or fewer.`;
  return null;
}
