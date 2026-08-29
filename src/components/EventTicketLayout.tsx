import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import Reveal from "@/components/Reveal";
import TicketPicker from "@/components/TicketPicker";
import {
  formatEventDate,
  formatEventTime,
  formatPrice,
  type VenueEvent,
} from "@/lib/ticketing";
import { IMG } from "@/lib/images";

type Props = {
  event: VenueEvent;
  /** Show Stripe test-mode instructions (for /test-tickets). */
  testMode?: boolean;
};

export default function EventTicketLayout({ event, testMode = false }: Props) {
  const hero = event.image_url || IMG.liveHero;
  const dateLine = `${formatEventDate(event.starts_at)} · ${event.room_name}`;
  const timeLine = event.doors_at
    ? `Doors ${formatEventTime(event.doors_at)} · On at ${formatEventTime(event.starts_at)}`
    : `Starts ${formatEventTime(event.starts_at)}`;

  return (
    <>
      <Nav active="/live-events" />
      <main className="flex-grow bg-background">
        <section className="relative">
          <div className="sticky top-0 z-0 h-[72svh] md:h-[78svh] overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('${hero}')` }}
            />
            <div className="absolute inset-0 bg-[#1a100c]/55" />
            <div className="relative z-10 h-full flex flex-col justify-end px-margin-mobile md:px-gutter pb-12 md:pb-16 max-w-container-max mx-auto">
              <span className="font-label-caps text-label-caps text-[#d4a574] uppercase tracking-[0.35em] mb-4">
                {dateLine}
              </span>
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-[56px] uppercase tracking-[0.03em] text-white max-w-3xl">
                {event.title}
              </h1>
              {event.subtitle && (
                <p className="font-headline-md text-[18px] md:text-[22px] text-white/85 mt-4 max-w-xl">
                  {event.subtitle}
                </p>
              )}
              <p className="font-label-caps text-[11px] uppercase tracking-[0.22em] text-white/65 mt-5">
                {timeLine}
              </p>
              {event.from_price_pence != null && !event.sold_out && (
                <p className="numeral font-price-display text-[22px] text-[#d4a574] mt-6">
                  From {formatPrice(event.from_price_pence, event.currency)}
                </p>
              )}
              {event.sold_out && (
                <p className="font-label-caps text-label-caps uppercase tracking-[0.2em] text-white/70 mt-6">
                  Sold out
                </p>
              )}
            </div>
          </div>

          <div className="relative z-10 -mt-16 md:-mt-20 px-margin-mobile md:px-gutter pb-section-gap-mobile md:pb-section-gap-desktop max-w-container-max mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-start">
              <Reveal className="lg:col-span-2 flex flex-col gap-6">
                {testMode && (
                  <div className="bg-[#2c1810] text-[#f5efe8] p-5 md:p-6 hairline-gold border border-[#d4a574]/30">
                    <p className="font-label-caps text-[10px] uppercase tracking-[0.25em] text-[#d4a574] mb-3">
                      Stripe test mode
                    </p>
                    <p className="font-body-md text-sm text-[#f5efe8]/90 leading-relaxed">
                      This is a demo event only. Use test card{" "}
                      <span className="numeral text-[#d4a574]">4242 4242 4242 4242</span>, any
                      future expiry, any CVC. Keep{" "}
                      <code className="text-[#d4a574]">stripe listen</code> running so webhooks
                      confirm the order.
                    </p>
                  </div>
                )}

                {event.description && (
                  <div className="bg-surface-container-lowest p-6 md:p-8 hairline-gold">
                    <h2 className="font-headline-md text-[20px] uppercase tracking-[0.03em] mb-4">
                      About this night
                    </h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}

                <Link
                  href="/live-events"
                  className="link-underline font-label-caps text-label-caps uppercase tracking-[0.25em] text-on-surface-variant hover:text-primary transition-colors w-fit"
                >
                  ← All live events
                </Link>
              </Reveal>

              <Reveal delay={80} className="lg:col-span-3">
                <TicketPicker event={event} />
              </Reveal>
            </div>
          </div>
        </section>

        <BrandCloser />
      </main>
      <FooterFlyover>
        <Footer />
      </FooterFlyover>
    </>
  );
}
