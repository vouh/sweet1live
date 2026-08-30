export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (/[\x00-\x1f\x7f]/.test(password)) {
    issues.push("Password contains invalid characters");
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    issues.push(`No more than ${MAX_PASSWORD_LENGTH} characters`);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push(`At least ${MIN_PASSWORD_LENGTH} characters`);
  }
  if (!/[A-Z]/.test(password)) issues.push("One uppercase letter");
  if (!/[a-z]/.test(password)) issues.push("One lowercase letter");
  if (!/[0-9]/.test(password)) issues.push("One number");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("One symbol");
  return issues;
}

export function isStrongPassword(password: string): boolean {
  return passwordIssues(password).length === 0;
}
