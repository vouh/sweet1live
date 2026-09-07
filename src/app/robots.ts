import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/staff-dashboard", "/portal", "/api/", "/checkout/", "/sign-in", "/sign-up", "/test-tickets", "/success-error-states", "/live-events/ticket-demo"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
