/**
 * Sweet1ne LIVE venue photography — flat /public/images/s1.webp … s41.webp
 * Logo stays /images/sweet1nelive_logo.png
 *
 * WebP (not AVIF): best fit for CSS background-image — fast decode, one file per
 * shot, excellent browser support. Run `npm run images:webp` to regenerate.
 */

export const s = (n: number) => `/images/s${n}.webp`;

export const LOGO = "/images/sweet1nelive_logo.png";

/** Home hero background loop (landscape 16:9, from SWEET1NE FINAL) */
export const HERO_VIDEO = "/videos/brunch-vibes.mp4?v=3";

/** Full catalogue — for assigning across pages, not sliders */
export const ALL_PHOTOS = Array.from({ length: 41 }, (_, i) => s(i + 1));

/** Horizontal slider strips — 10 picks only */
export const GALLERY_STRIP = [
  s(7),
  s(10),
  s(4),
  s(5),
  s(6),
  s(13),
  s(8),
  s(9),
  s(16),
  s(11),
];

/** Editorial picks for heroes, cards, and panels */
export const IMG = {
  hero: s(1),
  contact: s(2),
  reservations: s(3),
  dining: s(4),
  jazz: s(5),
  lounge: s(6),
  bar: s(7),
  alcove: s(8),
  cellar: s(9),
  pour: s(10),
  room: s(11),
  wagyu: s(12),
  guests: s(13),
  toast: s(14),
  venue: s(15),
  liveHero: s(16),
  liveJazz: s(17),
  liveBar: s(18),
  performer1: s(19),
  performer2: s(20),
  performer3: s(21),
  performer4: s(22),
  venueSpace1: s(23),
  venueSpace2: s(24),
  venueSpace3: s(25),
  menuPlating: s(26),
  menuCellar: s(27),
  auth: s(28),
  featured1: s(29),
  featured2: s(30),
  featured3: s(31),
  featured4: s(32),
  stickyA: s(33),
  stickyB: s(34),
  bandA: s(35),
  bandB: s(36),
  collageA: s(37),
  collageB: s(38),
  collageC: s(39),
  experience5: s(40),
  experience6: s(41),
} as const;

/** Seven bookable rooms — resolved on the frontend, not stored in the DB */
export const ROOM_PHOTOS = {
  main: s(1),
  lounge: s(6),
  cellar: s(9),
  alcove: s(8),
  snug: s(10),
  gallery: s(11),
  atrium: s(4),
} as const;

const ROOM_SLUG_TO_PHOTO: Record<string, string> = {
  "main-room": ROOM_PHOTOS.main,
  "the-lounge": ROOM_PHOTOS.lounge,
  "the-cellar": ROOM_PHOTOS.cellar,
  "the-alcove": ROOM_PHOTOS.alcove,
  "the-snug": ROOM_PHOTOS.snug,
  "the-gallery": ROOM_PHOTOS.gallery,
  "private-dining": ROOM_PHOTOS.atrium,
};

/** Sample event season — resolved on the frontend, not stored in the DB */
export const EVENT_PHOTOS = {
  blueNote: s(5),
  velvet: s(6),
  cellar: s(9),
  lastOrders: s(7),
} as const;

const EVENT_SLUG_TO_PHOTO: Record<string, string> = {
  "blue-note-quintet": EVENT_PHOTOS.blueNote,
  "velvet-sessions": EVENT_PHOTOS.velvet,
  "cellar-sessions": EVENT_PHOTOS.cellar,
  "last-orders-trio": EVENT_PHOTOS.lastOrders,
  "midnight-brass": IMG.bandA,
};

export function roomPhoto(slug: string): string {
  return ROOM_SLUG_TO_PHOTO[slug] ?? DEFAULT_LIFESTYLE;
}

export function eventPhoto(slug: string): string {
  return EVENT_SLUG_TO_PHOTO[slug] ?? IMG.jazz;
}

export const DEFAULT_LIFESTYLE = IMG.guests;

/** Above-the-fold hero — preload in root layout */
export const PRELOAD_HERO = IMG.hero;

/** Hero video poster (lightweight still while MP4 buffers). */
export const HERO_VIDEO_POSTER = "/videos/brunch-vibes-poster.webp";

/**
 * Responsive paths for a catalogue photo (`/images/s12.webp`).
 * Falls back to the original if the src is not an sN.webp asset.
 */
export function responsiveSources(src: string): { sm: string; md: string; lg: string } {
  const match = src.match(/^(.*\/s\d+)\.webp(\?.*)?$/i);
  if (!match) {
    return { sm: src, md: src, lg: src };
  }
  const base = match[1];
  const query = match[2] ?? "";
  return {
    sm: `${base}-640.webp${query}`,
    md: `${base}-1280.webp${query}`,
    lg: `${base}.webp${query}`,
  };
}

/** CSS custom props for `.opt-bg.opt-bg--on` (use when LazyBackground is not practical). */
export function responsiveBgVars(src: string): Record<string, string> {
  const sources = responsiveSources(src);
  return {
    "--opt-bg-sm": `url('${sources.sm}')`,
    "--opt-bg-md": `url('${sources.md}')`,
    "--opt-bg-lg": `url('${sources.lg}')`,
  };
}
