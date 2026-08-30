"use client";

import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import RoomBookingFlow from "@/components/RoomBookingFlow";
import { getRooms, type Room } from "@/lib/ticketing";

/** Loads bookable rooms and renders the deposit checkout flow. */
export default function VenueHireRoomBooking() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRooms().then((list) => {
      setRooms(list);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
        Loading spaces…
      </p>
    );
  }

  if (rooms.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant text-center py-12">
        Room booking is unavailable right now — use the enquiry form below and our team will hold
        your date.
      </p>
    );
  }

  return (
    <Reveal variant="up">
      <RoomBookingFlow rooms={rooms} />
    </Reveal>
  );
}
