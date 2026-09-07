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

export const dynamic = "force-dynamic";

export default async function LiveEventsPage() {
  const fromApi = (await getEvents()).filter((event) => event.slug !== "ticket-demo");
  const events = fromApi.length > 0 ? fromApi.slice(0, 5) : DEMO_EVENTS;
  const topEvent = pickTopEvent(events);
  const rest = lineupWithoutTop(events, topEvent);

  return (
    <>
      <Nav active="/live-events" overlay />
      <main className="live-events-page flex-grow bg-[#131313]">
        {topEvent && <EventCinematicHero event={topEvent} />}

        {rest.length > 0 && <EventsSplitStack events={rest} />}

        <EventsClosingSection
          imageSrc={IMG.dining}
          panelBody="Book a table for a performance night and keep it through the last set — no queue, no standing, no rush to leave."
        />

        <MustardCtaBand
          eyebrow="Stay for the set"
          title="Table reserved through the last note"
          accentWord="reserved"
          body="Book dining for a performance night and keep your seat — no queue, no standing, no rush to leave."
          primaryHref="/reservations"
          primaryLabel="Reserve a table"
          secondaryHref="/contact"
          secondaryLabel="Private lounge enquiry"
        />

        <BrandCloser />
      </main>
      <FooterFlyover>
        <Footer />
      </FooterFlyover>
    </>
  );
}
