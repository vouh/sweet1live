"use client";

import { useMemo, useState } from "react";
import Magnetic from "@/components/motion/Magnetic";
import { trackEvent } from "@/lib/analytics";
import {
  COLLECTION_TIMES,
  formatPrice,
  isCollectionEligible,
  startCollectionCheckout,
  type MenuItem,
} from "@/lib/menus";

export default function FoodCollectionCart({ items }: { items: MenuItem[] }) {
  const eligible = useMemo(() => items.filter(isCollectionEligible), [items]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pickupTime, setPickupTime] = useState("19:00");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const lines = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([menu_item_id, quantity]) => ({ menu_item_id, quantity })),
    [quantities]
  );

  const subtotal = useMemo(
    () =>
      lines.reduce((total, line) => {
        const item = eligible.find((entry) => entry.id === line.menu_item_id);
        return total + (item?.price_pence ?? 0) * line.quantity;
      }, 0),
    [lines, eligible]
  );

  function setQuantity(id: string, next: number) {
    setQuantities((current) => ({ ...current, [id]: next }));
    setError(null);
  }

  async function handleCheckout() {
    if (lines.length === 0) {
      setError("Add at least one dish for collection.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      setError("We need a name and email for your order.");
      return;
    }

    setPending(true);
    setError(null);
    trackEvent("collection_checkout_started", { items: lines.length });

    const result = await startCollectionCheckout({
      customer_name: name.trim(),
      customer_email: email.trim(),
      pickup_time: pickupTime,
      lines,
    });

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    if (result.data.checkout_url) {
      window.location.href = result.data.checkout_url;
      return;
    }

    window.location.href = `/checkout/success?ref=${encodeURIComponent(
      result.data.order_reference
    )}&email=${encodeURIComponent(email.trim())}`;
  }

  if (eligible.length === 0) return null;

  return (
    <section
      id="collect"
      className="max-w-container-max mx-auto px-margin-mobile md:px-gutter py-section-gap-mobile md:py-section-gap-desktop border-t border-outline-variant/20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.25em]">
            Collection
          </span>
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-[40px] uppercase tracking-[0.03em]">
            Order for pickup
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
            Choose from small plates and mains, pay online, and collect at the bar. Kitchen open
            until 23:00.
          </p>
        </div>

        <div className="lg:col-span-3 bg-surface-container-lowest p-6 md:p-8 hairline-gold flex flex-col gap-6">
          <ul className="flex flex-col divide-y divide-outline-variant/25">
            {eligible.map((item) => {
              const chosen = quantities[item.id] ?? 0;
              return (
                <li key={item.id} className="flex items-start justify-between gap-5 py-4">
                  <div className="min-w-0">
                    <p className="font-body-lg text-body-lg">{item.name}</p>
                    <p className="numeral font-price-display text-[17px] text-primary mt-1">
                      {formatPrice(item.price_pence, item.currency)}
                    </p>
                  </div>
                  <select
                    value={chosen}
                    onChange={(e) => setQuantity(item.id, Number(e.target.value))}
                    className="numeral bg-surface-container-lowest border border-outline-variant px-4 py-3 focus:border-primary"
                    aria-label={`Quantity of ${item.name}`}
                  >
                    {Array.from({ length: 6 }, (_, i) => (
                      <option key={i} value={i}>
                        {i}
                      </option>
                    ))}
                  </select>
                </li>
              );
            })}
          </ul>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex flex-col gap-2 md:col-span-1">
              <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                Collect at
              </span>
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant px-4 py-3 focus:border-primary"
              >
                {COLLECTION_TIMES.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant px-4 py-3 focus:border-primary"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant px-4 py-3 focus:border-primary"
              />
            </label>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-outline-variant/25">
            <span className="numeral font-price-display text-[22px]">
              {formatPrice(subtotal, eligible[0]?.currency ?? "gbp")}
            </span>
            <Magnetic>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={pending || lines.length === 0}
                className="btn-ink font-label-caps text-label-caps px-8 py-4 uppercase tracking-wider disabled:opacity-50"
              >
                {pending ? "Taking you to checkout…" : "Pay & collect"}
              </button>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
