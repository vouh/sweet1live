import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import CheckoutAnalytics from "@/components/CheckoutAnalytics";
import {
  formatEventTime,
  formatLongDate,
  formatPrice,
  syncOrder,
  type Order,
} from "@/lib/ticketing";

export const metadata: Metadata = {
  title: "Order confirmed | Sweet1ne LIVE",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ ref?: string; email?: string; session_id?: string }>;
};

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { ref, email, session_id } = await searchParams;

  // Ask the API to reconcile with Stripe now rather than waiting on the
  // webhook, so the guest sees their tickets on this first render.
  const result = ref
    ? await syncOrder(ref, { email, sessionId: session_id })
    : ({ ok: false, message: "No order reference was supplied." } as const);

  return (
    <>
      <Nav active="/whats-on" />
      <main className="flex-grow bg-background">
        <section className="max-w-3xl mx-auto px-margin-mobile md:px-gutter pt-20 md:pt-28 pb-section-gap-mobile md:pb-section-gap-desktop">
          {!result.ok ? (
            <Problem message={result.message} reference={ref} />
          ) : result.data.status === "paid" ? (
            <>
              <CheckoutAnalytics order={result.data} />
              <Confirmed order={result.data} />
            </>
          ) : (
            <Processing order={result.data} />
          )}
        </section>
        <BrandCloser />
      </main>
      <FooterFlyover>
        <Footer />
      </FooterFlyover>
    </>
  );
}

function Confirmed({ order }: { order: Order }) {
  const isRoom = order.kind === "room_deposit";
  const isCollection = order.kind === "food_collection";

  return (
    <Reveal>
      <div className="text-center flex flex-col items-center gap-5">
        <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
        <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.03em]">
          {isRoom ? "Room held" : isCollection ? "Order confirmed" : "You're in"}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          {isRoom
            ? "Your deposit is paid and the date is yours. Our events team will be in touch to shape the evening."
            : isCollection
              ? "Payment received. Head to the bar at your collection time — show this reference if asked."
              : "Payment received. Your tickets are below and a copy is on its way to your inbox."}
        </p>
        <p className="font-label-caps text-label-caps uppercase tracking-[0.25em] text-on-surface-variant">
          Reference <span className="numeral text-primary">{order.reference}</span>
        </p>
      </div>

      <div className="mt-12 bg-surface-container-lowest p-6 md:p-8 hairline-gold">
        <h2 className="font-headline-md text-[22px] uppercase tracking-[0.03em] mb-6">
          Order summary
        </h2>
        <ul className="flex flex-col divide-y divide-outline-variant/25">
          {order.items.map((item, index) => (
            <li key={index} className="flex items-center justify-between gap-5 py-4">
              <span className="font-body-md text-body-md text-on-background">
                {item.description}
                <span className="numeral text-on-surface-variant"> × {item.quantity}</span>
              </span>
              <span className="numeral font-price-display text-[17px] text-on-background whitespace-nowrap">
                {formatPrice(item.unit_price_pence * item.quantity, order.currency)}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-5 pt-5 mt-2 border-t border-outline-variant/25">
          <span className="font-label-caps text-label-caps uppercase tracking-[0.2em] text-on-surface-variant">
            {isRoom ? "Deposit paid" : isCollection ? "Total paid" : "Total paid"}
          </span>
          <span className="numeral font-price-display text-[24px] text-primary">
            {formatPrice(order.subtotal_pence, order.currency)}
          </span>
        </div>
      </div>

      {order.tickets.length > 0 && (
        <div className="mt-10">
          <h2 className="font-headline-md text-[22px] uppercase tracking-[0.03em] mb-6">
            Your tickets
          </h2>
          <div className="flex flex-col gap-4">
            {order.tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-surface-container-lowest p-5 md:p-6 hairline-gold flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="min-w-0">
                  <p className="font-headline-md text-[20px] leading-tight">{ticket.event_title}</p>
                  <p className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-primary mt-2">
                    {ticket.ticket_type_name}
                  </p>
                  <p className="font-body-md text-sm text-on-surface-variant mt-2">
                    {formatLongDate(ticket.starts_at)} · {ticket.room_name}
                    {ticket.doors_at && ` · doors ${formatEventTime(ticket.doors_at)}`}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="font-label-caps text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                    Show at the door
                  </p>
                  <p className="numeral font-price-display text-[20px] tracking-[0.08em] text-on-background mt-1">
                    {ticket.code}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="font-body-md text-xs text-on-surface-variant/80 mt-5">
            Each code admits one guest and is scanned once on arrival. Keep this page or the
            confirmation email to hand.
          </p>
        </div>
      )}

      <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5">
        <Link href="/whats-on" className="btn-ink font-label-caps text-label-caps px-7 py-4">
          More nights
        </Link>
        <Link
          href="/"
          className="link-underline font-label-caps text-label-caps uppercase tracking-[0.25em] hover:text-primary transition-colors"
        >
          Back to home
        </Link>
      </div>
    </Reveal>
  );
}

function Processing({ order }: { order: Order }) {
  return (
    <Reveal>
      <div className="text-center flex flex-col items-center gap-5">
        <span className="material-symbols-outlined text-primary text-5xl">hourglass_top</span>
        <h1 className="font-headline-lg text-headline-lg-mobile uppercase tracking-[0.03em]">
          Confirming your payment
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          Your bank is still settling this one. It usually takes a few seconds — refresh this page
          shortly, and we&apos;ll email your confirmation either way.
        </p>
        <p className="font-label-caps text-label-caps uppercase tracking-[0.25em] text-on-surface-variant">
          Reference <span className="numeral text-primary">{order.reference}</span>
        </p>
        <Link href="/whats-on" className="btn-ink font-label-caps text-label-caps px-7 py-4 mt-4">
          Back to events
        </Link>
      </div>
    </Reveal>
  );
}

function Problem({ message, reference }: { message: string; reference?: string }) {
  return (
    <Reveal>
      <div className="text-center flex flex-col items-center gap-5">
        <span className="material-symbols-outlined text-error text-5xl">error</span>
        <h1 className="font-headline-lg text-headline-lg-mobile uppercase tracking-[0.03em]">
          We couldn&apos;t load that order
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">{message}</p>
        {reference && (
          <p className="font-label-caps text-label-caps uppercase tracking-[0.25em] text-on-surface-variant">
            Reference <span className="numeral">{reference}</span>
          </p>
        )}
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          If you were charged, nothing is lost — send us the reference and we&apos;ll sort it out.
        </p>
        <Link href="/contact" className="btn-ink font-label-caps text-label-caps px-7 py-4 mt-2">
          Talk to us
        </Link>
      </div>
    </Reveal>
  );
}
