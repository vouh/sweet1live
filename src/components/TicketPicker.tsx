"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Magnetic from "@/components/motion/Magnetic";
import {
  formatPrice,
  startTicketCheckout,
  type VenueEvent,
} from "@/lib/ticketing";

export default function TicketPicker({ event }: { event: VenueEvent }) {
  const { user } = useAuth();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Prefer whatever the guest has typed; fall back to their account.
  const buyerName = name || user?.name || "";
  const buyerEmail = email || user?.email || "";

  const lines = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([ticket_type_id, quantity]) => ({ ticket_type_id, quantity })),
    [quantities]
  );

  const subtotal = useMemo(
    () =>
      lines.reduce((total, line) => {
        const ticketType = event.ticket_types.find((t) => t.id === line.ticket_type_id);
        return total + (ticketType?.price_pence ?? 0) * line.quantity;
      }, 0),
    [lines, event.ticket_types]
  );

  function setQuantity(id: string, next: number) {
    setQuantities((current) => ({ ...current, [id]: next }));
    setError(null);
  }

  async function handleCheckout() {
    if (lines.length === 0) {
      setError("Choose at least one ticket.");
      return;
    }
    if (!buyerName.trim() || !buyerEmail.trim()) {
      setError("We need a name and email to send the tickets to.");
      return;
    }

    setPending(true);
    setError(null);

    const result = await startTicketCheckout({
      event_slug: event.slug,
      customer_name: buyerName.trim(),
      customer_email: buyerEmail.trim(),
      lines,
    });

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    if (result.data.checkout_url) {
      // Hand off to Stripe's hosted page. Keep `pending` true so the button
      // stays disabled through the redirect.
      window.location.href = result.data.checkout_url;
      return;
    }

    // Nothing owed — the order was settled server-side.
    window.location.href = `/checkout/success?ref=${encodeURIComponent(
      result.data.order_reference
    )}&email=${encodeURIComponent(buyerEmail.trim())}`;
  }

  if (event.ticket_types.length === 0) {
    return (
      <p className="font-body-md text-body-md text-on-surface-variant">
        Tickets for this night are not on sale yet.
      </p>
    );
  }

  return (
    <div className="bg-surface-container-lowest p-6 md:p-8 hairline-gold flex flex-col gap-7">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-headline-md text-[26px] uppercase tracking-[0.03em]">Tickets</h2>
        <span className="font-label-caps text-label-caps uppercase tracking-[0.2em] text-on-surface-variant">
          Secure checkout
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-outline-variant/25">
        {event.ticket_types.map((ticketType) => {
          const sellable = ticketType.on_sale && ticketType.quantity_available > 0;
          const cap = Math.min(ticketType.max_per_order, ticketType.quantity_available);
          const chosen = quantities[ticketType.id] ?? 0;

          return (
            <li key={ticketType.id} className="flex items-start justify-between gap-5 py-5">
              <div className="min-w-0">
                <p className="font-body-lg text-body-lg text-on-background">{ticketType.name}</p>
                {ticketType.description && (
                  <p className="font-body-md text-sm text-on-surface-variant mt-1">
                    {ticketType.description}
                  </p>
                )}
                <p className="numeral font-price-display text-[19px] text-primary mt-2">
                  {formatPrice(ticketType.price_pence, event.currency)}
                </p>
                {sellable && ticketType.quantity_available <= 10 && (
                  <p className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-error mt-2">
                    Only {ticketType.quantity_available} left
                  </p>
                )}
              </div>

              {sellable ? (
                <label className="shrink-0 flex flex-col gap-2 items-end">
                  <span className="sr-only">Quantity of {ticketType.name}</span>
                  <select
                    value={chosen}
                    onChange={(e) => setQuantity(ticketType.id, Number(e.target.value))}
                    className="numeral bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary appearance-none transition-colors"
                  >
                    {Array.from({ length: cap + 1 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="shrink-0 font-label-caps text-label-caps uppercase tracking-[0.2em] text-on-surface-variant/60">
                  {ticketType.on_sale ? "Sold out" : "Closed"}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <label className="flex flex-col gap-2">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]">
            Full name
          </span>
          <input
            type="text"
            value={buyerName}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nina Calloway"
            className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]">
            Email for tickets
          </span>
          <input
            type="email"
            value={buyerEmail}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
          />
        </label>
      </div>

      {error && <p className="text-error text-sm">{error}</p>}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-outline-variant/25">
        <div className="flex items-baseline gap-3">
          <span className="font-label-caps text-label-caps uppercase tracking-[0.2em] text-on-surface-variant">
            Total
          </span>
          <span className="numeral font-price-display text-[24px] text-on-background">
            {formatPrice(subtotal, event.currency)}
          </span>
        </div>

        <Magnetic>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={pending || lines.length === 0}
            className="btn-ink font-label-caps text-label-caps px-8 py-4 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Taking you to checkout…" : "Pay with card"}
          </button>
        </Magnetic>
      </div>

      <p className="font-body-md text-xs text-on-surface-variant/80">
        Payment is handled by Stripe — card details never touch our servers. Your seats are held
        for 30 minutes while you complete checkout.
      </p>
    </div>
  );
}
