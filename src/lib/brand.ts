/** Site-wide brand line — never baked into logo assets. */
export const BRAND_TAGLINE = "Always in the mood for you.";

export const BRAND_TAGLINE_SPLIT = {
  lead: "Always in the mood",
  accent: "for you.",
} as const;

/** Public venue contact — single source of truth for footer, contact page, etc. */
export const SITE_CONTACT = {
  name: "Sweet1ne Live",
  email: "info@sweet1ne.com",
  phone: "TBC",
  address: {
    line1: "218 High Road",
    line2: "Chadwell Heath",
    postcode: "RM6 6LS",
    country: "United Kingdom",
  },
} as const;

export const SITE_ADDRESS_LINES = [
  SITE_CONTACT.address.line1,
  SITE_CONTACT.address.line2,
  SITE_CONTACT.address.postcode,
] as const;

export const SITE_ADDRESS_SINGLE_LINE = SITE_ADDRESS_LINES.join(", ");

export const SITE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE_ADDRESS_SINGLE_LINE)}`;

export const SITE_CONTACT_DETAILS = [
  { icon: "call", label: "Telephone", value: SITE_CONTACT.phone },
  { icon: "mail", label: "Email", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}` },
  { icon: "location_on", label: "Visit", value: SITE_ADDRESS_SINGLE_LINE, href: SITE_MAPS_URL },
  { icon: "schedule", label: "Concierge", value: "Tue – Sun, from 4pm" },
] as const;
