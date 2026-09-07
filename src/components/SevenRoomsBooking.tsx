"use client";

import Magnetic from "@/components/motion/Magnetic";
import { SEVENROOMS_BOOKING_URL } from "@/lib/sevenrooms";
import { trackEvent } from "@/lib/analytics";

/**
 * Table booking goes through SevenRooms' hosted page.
 * Their popup widget often fails on localhost / locked-down browsers
 * (empty grey modal), so we link straight to the live booking URL.
 */
export default function SevenRoomsBooking() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="font-label-caps text-[10px] uppercase tracking-[0.28em] text-primary">
          Live availability
        </p>
        <h2 className="mt-3 font-headline-md text-headline-md uppercase tracking-[0.03em]">
          Book your table
        </h2>
        <p className="mt-3 font-body-md text-body-md text-on-surface-variant max-w-md">
          Real-time seating through SevenRooms. You&apos;ll finish the booking on their secure
          page — no card charge here for dining reservations.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2 border-t border-outline-variant/25">
        <Magnetic>
          <a
            href={SEVENROOMS_BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("reservation_submitted")}
            className="btn-ink font-label-caps text-label-caps px-8 py-4 uppercase tracking-wider inline-flex items-center justify-center"
          >
            Reserve a table
          </a>
        </Magnetic>
        <p className="font-body-md text-sm text-on-surface-variant max-w-xs">
          Opens the Sweet1ne SevenRooms booking page in a new tab.
        </p>
      </div>
    </div>
  );
}
