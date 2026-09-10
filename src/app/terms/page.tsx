import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { RESERVATION_POLICY, SITE_ADDRESS_SINGLE_LINE, SITE_CONTACT } from "@/lib/brand";

// Placeholder terms pending legal review — content to be replaced with the
// venue's actual reviewed terms before this is relied on commercially.
export const metadata: Metadata = {
  title: "Terms & Conditions | Sweet1ne Live",
  description: "Terms and conditions for reservations, live events, venue hire and use of the Sweet1ne Live website.",
};

export default function TermsPage() {
  return (
    <>
      <Nav active="" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-margin-mobile pb-24 pt-32 md:px-gutter md:pt-40">
        <p className="font-label-caps text-[11px] uppercase tracking-[0.28em] text-primary">Legal</p>
        <h1 className="mt-3 font-headline-lg text-[42px] leading-tight md:text-[58px]">Terms &amp; conditions</h1>
        <p className="mt-5 max-w-2xl text-on-surface-variant">Last updated 7 September 2026</p>
        <div className="mt-12 space-y-10 text-[16px] leading-7 text-on-surface-variant">
          <Policy title="Agreement to these terms">
            These terms govern your use of the {SITE_CONTACT.name} website and your booking of tables, tickets, private
            dining or venue hire with us. By using the site or making a booking, you agree to them. If you do not agree,
            please do not use the site or make a booking.
          </Policy>
          <Policy title="Reservations">
            Table reservations can be made online for parties of up to {RESERVATION_POLICY.maxOnlineGuests}. Larger
            groups require a staff availability check and confirmation — call {SITE_CONTACT.phone} or use our contact
            form. Please arrive within 15 minutes of your booking time; after that we may release the table.{" "}
            {RESERVATION_POLICY.cancellationNote}
          </Policy>
          <Policy title="Live events & ticketing">
            Tickets to live events are sold subject to availability and capacity limits. Unless an event is cancelled
            or rescheduled by us, ticket sales are final and non-refundable. Entry may be refused or revoked without
            refund for behaviour that puts other guests, staff or the venue at risk, or where entry conditions
            (including age or ID requirements) are not met.
          </Policy>
          <Policy title="Age restrictions & alcohol">
            We operate a licensed premises. We may ask any guest to prove they are 18 or over before serving alcohol,
            and we reserve the right to refuse service or entry where proof of age cannot be provided. Management
            reserves the right of admission.
          </Policy>
          <Policy title="Venue hire & private events">
            Private dining and venue hire bookings are confirmed once a deposit has been received. Cancellation
            terms, minimum spends and final numbers deadlines are set out in your individual hire agreement or
            quote; where no specific agreement exists, our standard reservation terms above apply.
          </Policy>
          <Policy title="Website use">
            Content on this site — including text, photography, menus and branding — belongs to {SITE_CONTACT.name}
            or its licensors and may not be reproduced without permission. We aim to keep information (including
            menus, prices and event listings) accurate, but items may change or sell out without notice.
          </Policy>
          <Policy title="Liability">
            Nothing in these terms limits liability that cannot be limited by law (for example, for death or
            personal injury caused by negligence, or fraud). Otherwise, to the extent permitted by law, we are not
            liable for indirect or consequential losses arising from your use of the site or attendance at the
            venue.
          </Policy>
          <Policy title="Changes to these terms">
            We may update these terms from time to time to reflect changes to how we operate or to legal
            requirements. The version in force is the one published on this page at the time of your booking or
            visit.
          </Policy>
          <Policy title="Governing law">
            These terms are governed by the laws of England and Wales, and any disputes will be handled by the
            courts of England and Wales.
          </Policy>
          <Policy title="Contact">
            Questions about these terms can be sent to{" "}
            <a href={`mailto:${SITE_CONTACT.email}`} className="text-primary hover:underline">
              {SITE_CONTACT.email}
            </a>{" "}
            or in writing to {SITE_ADDRESS_SINGLE_LINE}.
          </Policy>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-headline-md text-[28px] text-on-surface">{title}</h2>
      <p className="mt-3">{children}</p>
    </section>
  );
}
