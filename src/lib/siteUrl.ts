/** Set SITE_URL to the canonical public domain before deploying. */
export function siteUrl(): string {
  const value = process.env.SITE_URL || process.env.PUBLIC_SITE_URL || "http://localhost:3000";
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("SITE_URL must be an HTTP(S) URL");
  return url.origin;
}
