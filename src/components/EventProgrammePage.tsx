import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import EventCinematicHero from "@/components/EventCinematicHero";
import EventsClosingSection from "@/components/EventsClosingSection";
import EventsSplitStack from "@/components/EventsSplitStack";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import MustardCtaBand from "@/components/MustardCtaBand";
import { DEMO_EVENTS } from "@/lib/demoEvents";
import { lineupWithoutTop, pickTopEvent } from "@/lib/eventLineup";
import { IMG } from "@/lib/images";
import { getEvents } from "@/lib/ticketing";

export default async function EventProgrammePage({ kind }: { kind: "in_house" | "external" }) {
  const fromApi = (await getEvents({ eventType: kind })).filter(event => event.slug !== "ticket-demo");
  const events = fromApi.length > 0 ? fromApi.slice(0, 12) : kind === "in_house" ? DEMO_EVENTS : [];
  const topEvent = pickTopEvent(events);
  const rest = lineupWithoutTop(events, topEvent);
  const external = kind === "external";

  return <>
    <Nav active={external ? "/events" : "/whats-on"} overlay />
    <main className="live-events-page flex-grow bg-[#131313]">
      {topEvent ? <>
        <EventCinematicHero event={topEvent} />
        {rest.length > 0 && <EventsSplitStack events={rest} />}
      </> : <section className="flex min-h-[70svh] items-center justify-center px-margin-mobile py-32 text-center text-[#f7f3ea]">
        <div className="max-w-2xl">
          <p className="font-label-caps mb-5 text-[11px] uppercase tracking-[0.35em] text-[#d8b632]">Events beyond Sweet1ne</p>
          <h1 className="font-headline-lg text-[42px] uppercase leading-tight md:text-[68px]">New dates coming soon</h1>
          <p className="mx-auto mt-6 max-w-lg text-[#cfc6af]">External Sweet1ne events will appear here with their venue and full address clearly shown.</p>
        </div>
      </section>}
      <EventsClosingSection imageSrc={IMG.dining} panelBody={external
        ? "Every listing shows exactly where the event takes place, so you can plan the night with confidence."
        : "Book a table for a performance night and keep it through the last set."} />
      <MustardCtaBand eyebrow={external ? "Host venue confirmed" : "Stay for the set"}
        title={external ? "Know where the night takes you" : "Table reserved through the last note"}
        accentWord={external ? "where" : "reserved"}
        body={external ? "Check the venue name and address on every event before booking." : "Book dining for a performance night and keep your seat."}
        primaryHref={external ? "/whats-on" : "/reservations"}
        primaryLabel={external ? "See what's on at Sweet1ne" : "Reserve a table"}
        secondaryHref="/contact" secondaryLabel="Talk to us" />
      <BrandCloser />
    </main>
    <FooterFlyover><Footer /></FooterFlyover>
  </>;
}
