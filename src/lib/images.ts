/**
 * Sweet1ne LIVE venue photography — flat /public/images/s1.jpg … s41.jpg
 * Logo stays /images/logo.png
 */

export const s = (n: number) => `/images/s${n}.jpg`;

export const LOGO = "/images/logo.png";

/** Full catalogue — for assigning across pages, not sliders */
export const ALL_PHOTOS = Array.from({ length: 41 }, (_, i) => s(i + 1));

/** Horizontal slider strips — 12 picks only */
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
  s(14),
  s(18),
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

/** Seven bookable rooms — flat paths for API seed */
export const ROOM_PHOTOS = {
  main: s(1),
  lounge: s(6),
  cellar: s(9),
  alcove: s(8),
  snug: s(10),
  gallery: s(11),
  atrium: s(4),
} as const;

/** Sample event season — flat paths for API seed */
export const EVENT_PHOTOS = {
  blueNote: s(5),
  velvet: s(6),
  cellar: s(9),
  lastOrders: s(7),
} as const;

export const DEFAULT_LIFESTYLE = IMG.guests;

/** Above-the-fold hero — preload in root layout */
export const PRELOAD_HERO = IMG.hero;
