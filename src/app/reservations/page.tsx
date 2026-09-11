"use client";

import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import Reveal from "@/components/Reveal";
import SplitReveal from "@/components/motion/SplitReveal";
import MustardCtaBand from "@/components/MustardCtaBand";
import BrandTagline from "@/components/BrandTagline";
import SevenRoomsBooking from "@/components/SevenRoomsBooking";
import LazyBackground from "@/components/LazyBackground";
import { IMG } from "@/lib/images";
import { RESERVATION_POLICY, SITE_CONTACT } from "@/lib/brand";

const HERO = IMG.reservations;

const NOTES = [
  { icon: "groups", text: RESERVATION_POLICY.maxOnlineNote },
  { icon: "event_busy", text: RESERVATION_POLICY.cancellationNote },
  { icon: "music_note", text: "Live sets fill the room — book early for Friday and Saturday." },
];

export default function ReservationsPage() {
  return (
    <>
      <Nav active="/reservations" />
      <main className="flex-grow">
        <section className="relative">
          <div className="sticky top-0 z-0 h-[100svh] overflow-hidden">
            <LazyBackground src={HERO} priority className="absolute inset-0 bg-cover bg-center" />
            <div className="absolute inset-0 bg-[#1a100c]/40" />
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-margin-mobile">
              <BrandTagline variant="eyebrow" onMedia className="mb-5" />
              <span className="font-label-caps text-label-caps text-[#d4a574] uppercase tracking-[0.4em] block mb-6">
                Bookings
              </span>
              <h1 className="font-display-lg text-[48px] sm:text-[80px] md:text-[110px] leading-[0.9] uppercase tracking-[0.01em] text-white drop-shadow-[0_4px_40px_rgba(0,0,0,0.55)]">
                Reserve a table
              </h1>
              <p className="font-headline-md text-[17px] md:text-[20px] text-white/85 mt-6 max-w-lg">
                Peak sets fill first — lock in your evening before the room sells out. Prefer to
                speak to us? Call {SITE_CONTACT.phone}.
              </p>
            </div>
          </div>

          <div className="relative z-10 -mt-[28vh] md:-mt-[22vh] px-margin-mobile md:px-gutter pb-20">
            <Reveal variant="up">
              <div className="max-w-3xl mx-auto bg-background p-6 md:p-12 hairline-gold shadow-[0_24px_80px_-20px_rgba(0,0,0,0.55)]">
                <SplitReveal
                  as="h2"
                  text="Your evening"
                  accentWord="evening"
                  className="font-headline-md text-headline-md uppercase tracking-[0.03em] mb-8"
                />
                <SevenRoomsBooking />
              </div>
            </Reveal>

            <div className="max-w-3xl mx-auto mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
              {NOTES.map((note, i) => (
                <Reveal key={note.icon} delay={i * 100}>
                  <div className="bg-background/95 p-5 hairline-gold">
                    <span className="material-symbols-outlined text-primary text-[22px] mb-3 block">
                      {note.icon}
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant">{note.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <MustardCtaBand
          eyebrow="Still deciding?"
          title="Our team can shape the evening"
          accentWord="evening"
          body="Celebrations, dietary notes, or the perfect spot for the first set — start a conversation."
          primaryHref="/contact"
          primaryLabel="Talk to us"
          secondaryHref="/whats-on"
          secondaryLabel="See what's on"
        />
        <BrandCloser />
      </main>
      <FooterFlyover>
        <Footer />
      </FooterFlyover>
    </>
  );
}
