/** Site-wide brand line — never baked into logo assets. */
export const BRAND_TAGLINE = "Always in the mood for you.";

export const BRAND_TAGLINE_SPLIT = {
  lead: "Always in the mood",
  accent: "for you.",
} as const;

/** SEO / meta one-liner — Live venue, not the family restaurants. */
export const SITE_DESCRIPTION =
  "Afro-Caribbean flavour, live music and warm hospitality — cosy, vibrant evenings for grown-up nights out in Chadwell Heath.";

/** Short pitch for homepage and closers. */
export const SITE_PITCH =
  "Sweet1ne Live is our adult-friendly room: live performances, a lively night out, and a focused menu drawn from the Sweet1ne kitchen.";

/**
 * Brand story (group history). Live is the performance venue —
 * Lewisham & Chingford are the family restaurants.
 */
export const BRAND_STORY =
  "Our journey began in 2020 as a small restaurant and takeaway in Fairlop, Ilford — a bold fusion of Afro-Caribbean cuisine enriched by American soul food. After building a loyal following, we opened Lewisham in 2023, returned to East London with Chingford, and opened Sweet1ne Live for evenings built around music, hospitality and great food.";

export const BRAND_ASSOCIATIONS = [
  "Food quality",
  "Family",
  "Culture",
  "Entertainment",
  "Hospitality",
  "Music",
  "Authenticity",
] as const;

export const BRAND_VOICE = ["Friendly", "Sophisticated", "Warm"] as const;

/** Signature dishes to highlight (group kitchen; Live serves a smaller menu). */
export const SIGNATURE_DISHES = [
  { name: "Big Chopper Platter", meta: "House favourite · Share", blurb: "Our most popular main." },
  { name: "Seafood Boil", meta: "Soul food classic", blurb: "A crowd-pleaser from the boil pot." },
  { name: "Rum Punch", meta: "Signature pour", blurb: "The drink guests ask for again." },
] as const;

export const STARTER_HIGHLIGHTS = [
  "Oxtail bao buns",
  "Jollof sushi",
  "Tempura prawns",
  "Curry goat spring rolls",
] as const;

/** Public venue contact — single source of truth for footer, contact page, etc. */
export const SITE_CONTACT = {
  name: "Sweet1ne Live",
  email: "info@sweet1nelive.com",
  /** Display format */
  phone: "020 3819 9109",
  /** E.164-ish for tel: links */
  phoneTel: "+442038199109",
  address: {
    line1: "218 High Road",
    line2: "Chadwell Heath",
    postcode: "RM6 6LS",
    country: "United Kingdom",
  },
} as const;

/** Opening hours as shown on contact / footer contexts. */
export const SITE_HOURS = {
  summary: "Wed–Thu 3pm–1am · Fri–Sun 1pm–1am",
  lines: [
    "Wednesday – Thursday: 3pm – 1am",
    "Friday – Sunday: 1pm – 1am",
  ],
} as const;

/** Online booking rules (SevenRooms / website). */
export const RESERVATION_POLICY = {
  maxOnlineGuests: 12,
  maxOnlineNote: "Parties of 12 or fewer can book online. Larger groups need a staff availability check and confirmation.",
  cancellationFee: "£20",
  cancellationNote:
    "A £20 charge applies for no-shows or cancellations within 24 hours of your booking.",
  holdNote: "Tables are held for 15 minutes past reservation time.",
  preferredChannels: ["Website", "Booking platform"] as const,
} as const;

export const SITE_ADDRESS_LINES = [
  SITE_CONTACT.address.line1,
  SITE_CONTACT.address.line2,
  SITE_CONTACT.address.postcode,
] as const;

export const SITE_ADDRESS_SINGLE_LINE = SITE_ADDRESS_LINES.join(", ");

export const SITE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE_ADDRESS_SINGLE_LINE)}`;

export const SITE_SOCIAL = [
  { label: "Instagram", href: "https://www.instagram.com/ssweet1ne/" },
  { label: "Facebook", href: "https://www.facebook.com/sweet1ne" },
  { label: "TikTok", href: "https://www.tiktok.com/@sweet1ne" },
] as const;

export const SITE_CONTACT_DETAILS = [
  {
    icon: "call",
    label: "Telephone",
    value: SITE_CONTACT.phone,
    href: `tel:${SITE_CONTACT.phoneTel}`,
  },
  { icon: "mail", label: "Email", value: SITE_CONTACT.email, href: `mailto:${SITE_CONTACT.email}` },
  { icon: "location_on", label: "Visit", value: SITE_ADDRESS_SINGLE_LINE, href: SITE_MAPS_URL },
  { icon: "schedule", label: "Hours", value: SITE_HOURS.summary },
] as const;
