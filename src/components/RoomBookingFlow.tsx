"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Magnetic from "@/components/motion/Magnetic";
import {
  createRoomBooking,
  formatPrice,
  getRoomAvailability,
  type Room,
  type RoomSlot,
} from "@/lib/ticketing";
import { roomPhoto } from "@/lib/images";

const EVENT_TYPES = [
  { value: "private-dinner", label: "Private dinner" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "performance", label: "Performance" },
  { value: "other", label: "Something else" },
] as const;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function RoomBookingFlow({ rooms }: { rooms: Room[] }) {
  const { user } = useAuth();

  const [roomSlug, setRoomSlug] = useState<string>(rooms[0]?.slug ?? "");
  const [date, setDate] = useState<string>("");
  const [slots, setSlots] = useState<RoomSlot[] | null>(null);
  const [slotsPending, setSlotsPending] = useState(false);
  const [startTime, setStartTime] = useState<string>("");

  const [partySize, setPartySize] = useState<string>("");
  const [eventType, setEventType] = useState<string>("private-dinner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const room = rooms.find((r) => r.slug === roomSlug) ?? rooms[0];

  // Pull availability whenever the room or date changes. `cancelled` guards
  // against a slow earlier request landing after a newer one.
  useEffect(() => {
    if (!roomSlug || !date) {
      setSlots(null);
      return;
    }

    let cancelled = false;
    setSlotsPending(true);
    setStartTime("");

    getRoomAvailability(roomSlug, date).then((result) => {
      if (cancelled) return;
      setSlots(result.ok ? result.data.slots : []);
      if (!result.ok) setError(result.message);
      setSlotsPending(false);
    });

    return () => {
      cancelled = true;
    };
  }, [roomSlug, date]);

  async function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();

    const buyerName = name || user?.name || "";
    const buyerEmail = email || user?.email || "";

    if (!room) return;
    if (!date || !startTime) {
      setError("Pick a date and a sitting.");
      return;
    }
    if (!buyerName.trim() || !buyerEmail.trim()) {
      setError("We need a name and email for the booking.");
      return;
    }

    const size = Number(partySize);
    if (!Number.isFinite(size) || size < 1) {
      setError("How many guests are you expecting?");
      return;
    }

    setPending(true);
    setError(null);

    const result = await createRoomBooking({
      room_slug: room.slug,
      name: buyerName.trim(),
      email: buyerEmail.trim(),
      phone: phone.trim(),
      party_size: size,
      date,
      start_time: startTime,
      event_type: eventType,
      notes: notes.trim() || null,
    });

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      // The slot may have gone while the form was open — refresh the picker.
      const refreshed = await getRoomAvailability(room.slug, date);
      if (refreshed.ok) setSlots(refreshed.data.slots);
      return;
    }

    if (result.data.checkout_url) {
      window.location.href = result.data.checkout_url;
      return;
    }

    window.location.href = `/checkout/success?ref=${encodeURIComponent(
      result.data.order_reference
    )}&email=${encodeURIComponent(buyerEmail.trim())}`;
  }

  if (!room) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Room availability is unavailable right now. Please try again shortly.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-14 md:gap-20">
      {/* 1 — Which room */}
      <section>
        <StepHeading step="01" title="Choose your room" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((option) => {
            const selected = option.slug === roomSlug;
            return (
              <button
                key={option.slug}
                type="button"
                onClick={() => setRoomSlug(option.slug)}
                aria-pressed={selected}
                className={`text-left flex flex-col overflow-hidden border transition-colors duration-400 ${
                  selected
                    ? "border-primary bg-surface-container"
                    : "border-outline-variant/45 bg-surface-container-lowest hover:border-primary/60"
                }`}
              >
                <div
                  className="relative aspect-[3/2] bg-cover bg-center bg-surface-container"
                  style={{ backgroundImage: `url('${roomPhoto(option.slug)}')` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e]/80 to-transparent" />
                  {selected && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-[22px]">
                      check_circle
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-2 flex-1">
                  <span className="font-headline-md text-[21px] leading-tight">{option.name}</span>
                  <span className="font-body-md text-sm text-on-surface-variant">
                    {option.tagline}
                  </span>
                  <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-on-surface-variant/80 mt-auto pt-3">
                    {option.capacity_seated} seated · {option.capacity_standing} standing
                  </span>
                  <span className="numeral font-price-display text-[16px] text-primary">
                    Hire from {formatPrice(option.hire_fee_pence)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 — Selected room detail */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        <div>
          <StepHeading step="02" title={room.name} />
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-7">
            {room.description}
          </p>
          <ul className="flex flex-wrap gap-2.5">
            {room.features.map((feature) => (
              <li
                key={feature}
                className="font-label-caps text-[10px] uppercase tracking-[0.18em] border border-outline-variant/50 text-on-surface-variant px-3 py-1.5 rounded"
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid grid-cols-2 gap-px bg-outline-variant/25 hairline-gold">
          <Fact label="Seated" value={`${room.capacity_seated}`} />
          <Fact label="Standing" value={`${room.capacity_standing}`} />
          <Fact label="Minimum party" value={`${room.min_party}`} />
          <Fact label="Hire from" value={formatPrice(room.hire_fee_pence)} />
          <Fact
            label="Deposit today"
            value={room.deposit_pence > 0 ? formatPrice(room.deposit_pence) : "None"}
            highlight
          />
          <Fact label="Balance" value="On the night" />
        </dl>
      </section>

      {/* 3 — Date, sitting, details */}
      <section>
        <StepHeading step="03" title="Date & sitting" />

        <form onSubmit={handleSubmit} className="flex flex-col gap-9">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <FieldLabel>Date</FieldLabel>
              <input
                type="date"
                value={date}
                min={today()}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError(null);
                }}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
              />
            </label>

            <label className="flex flex-col gap-2">
              <FieldLabel>Guests</FieldLabel>
              <input
                type="number"
                inputMode="numeric"
                min={room.min_party}
                max={Math.max(room.capacity_seated, room.capacity_standing)}
                value={partySize}
                onChange={(e) => setPartySize(e.target.value)}
                placeholder={`${room.min_party}–${Math.max(
                  room.capacity_seated,
                  room.capacity_standing
                )}`}
                className="numeral w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
              />
            </label>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-end gap-4">
              <FieldLabel>Available sittings</FieldLabel>
              <span className="font-body-md text-sm text-on-surface-variant">
                {!date
                  ? "Pick a date first"
                  : slotsPending
                    ? "Checking availability…"
                    : room.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(slots ?? []).map((slot) => {
                const selected = slot.start_time === startTime;
                return (
                  <button
                    key={slot.start_time + slot.end_time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => {
                      setStartTime(slot.start_time);
                      setError(null);
                    }}
                    className={`flex flex-col items-start gap-1 px-4 py-3 text-left transition-all duration-300 ${
                      !slot.available
                        ? "border border-outline-variant/30 text-on-surface-variant/35 cursor-not-allowed"
                        : selected
                          ? "bg-primary-container text-on-primary-container border border-primary-container"
                          : "border border-outline-variant text-on-background hover:border-primary hover:text-primary"
                    }`}
                  >
                    <span className="font-label-caps text-label-caps uppercase tracking-[0.18em]">
                      {slot.label}
                    </span>
                    <span className="numeral font-body-md text-sm">
                      {slot.start_time}–{slot.end_time}
                      {!slot.available && " · taken"}
                    </span>
                  </button>
                );
              })}
            </div>

            {date && !slotsPending && slots?.length === 0 && (
              <p className="font-body-md text-sm text-on-surface-variant">
                No sittings available in {room.name} on that date.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <FieldLabel>Full name</FieldLabel>
              <input
                type="text"
                value={name || user?.name || ""}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tomas Brandt"
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
              />
            </label>
            <label className="flex flex-col gap-2">
              <FieldLabel>Email</FieldLabel>
              <input
                type="email"
                value={email || user?.email || ""}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <FieldLabel>Phone (optional)</FieldLabel>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 …"
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
              />
            </label>
            <label className="flex flex-col gap-2">
              <FieldLabel>Occasion</FieldLabel>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary appearance-none transition-colors"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <FieldLabel>Anything we should know? (optional)</FieldLabel>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Dietary requirements, AV needs, running order…"
              className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors resize-y"
            />
          </label>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-outline-variant/25">
            <div className="flex items-baseline gap-3">
              <span className="font-label-caps text-label-caps uppercase tracking-[0.2em] text-on-surface-variant">
                Deposit today
              </span>
              <span className="numeral font-price-display text-[24px] text-on-background">
                {room.deposit_pence > 0 ? formatPrice(room.deposit_pence) : "Free to hold"}
              </span>
            </div>

            <Magnetic>
              <button
                type="submit"
                disabled={pending || !startTime}
                className="btn-ink font-label-caps text-label-caps px-8 py-4 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pending
                  ? "Holding the room…"
                  : room.deposit_pence > 0
                    ? "Pay deposit & hold"
                    : "Request this room"}
              </button>
            </Magnetic>
          </div>

          <p className="font-body-md text-xs text-on-surface-variant/80">
            The deposit comes off your final bill and is taken securely by Stripe. Your sitting is
            held for 30 minutes while you complete checkout.
          </p>
        </form>
      </section>
    </div>
  );
}

function StepHeading({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex items-baseline gap-4 mb-7">
      <span className="numeral font-headline-md text-[20px] text-primary">{step}</span>
      <h2 className="font-headline-md text-headline-md uppercase tracking-[0.03em]">{title}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]">
      {children}
    </span>
  );
}

function Fact({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-background px-5 py-4 flex flex-col gap-1">
      <dt className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
        {label}
      </dt>
      <dd
        className={`numeral font-price-display text-[18px] ${
          highlight ? "text-primary" : "text-on-background"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
