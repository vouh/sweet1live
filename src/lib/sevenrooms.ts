/**
 * SevenRooms powers live table reservations.
 * Tickets / events stay on our own Stripe checkout — this is dining only.
 */

const DEFAULT_VENUE_ID = "sweet1nerestaurantloungechingfordvenue";

export const SEVENROOMS_VENUE_ID =
  process.env.NEXT_PUBLIC_SEVENROOMS_VENUE_ID?.trim() || DEFAULT_VENUE_ID;

export const SEVENROOMS_BOOKING_URL =
  process.env.NEXT_PUBLIC_SEVENROOMS_BOOKING_URL?.trim() ||
  `https://www.sevenrooms.com/explore/${SEVENROOMS_VENUE_ID}/reservations/create/search/`;

export const SEVENROOMS_EMBED_SCRIPT = "https://www.sevenrooms.com/widget/embed.js";
