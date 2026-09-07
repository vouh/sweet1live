import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";
import { getEvents } from "@/lib/ticketing";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteUrl();
  const pages = ["", "/menus", "/live-events", "/venue-hire", "/reservations", "/contact", "/privacy-policy", "/cookie-policy", "/terms"];
  const events = await getEvents();
  const paths = new Set([
    ...pages,
    ...events.filter(event => event.status === "published" && event.slug !== "ticket-demo")
      .map(event => `/live-events/${encodeURIComponent(event.slug)}`),
  ]);
  return [...paths].map(path => ({ url: `${origin}${path || "/"}` }));
}
