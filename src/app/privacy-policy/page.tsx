import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { SITE_ADDRESS_SINGLE_LINE, SITE_CONTACT } from "@/lib/brand";

// Placeholder privacy policy pending legal review — content to be replaced
// with the venue's actual reviewed policy before this is relied on commercially.
export const metadata: Metadata = {
  title: "Privacy Policy | Sweet1ne Live",
  description: "How Sweet1ne Live collects, uses and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Nav active="" />
      <main className="mx-auto w-full max-w-4xl flex-1 px-margin-mobile pb-24 pt-32 md:px-gutter md:pt-40">
        <p className="font-label-caps text-[11px] uppercase tracking-[0.28em] text-primary">Legal</p>
        <h1 className="mt-3 font-headline-lg text-[42px] leading-tight md:text-[58px]">Privacy policy</h1>
        <p className="mt-5 max-w-2xl text-on-surface-variant">Last updated 7 September 2026</p>
        <div className="mt-12 space-y-10 text-[16px] leading-7 text-on-surface-variant">
          <Policy title="Who we are">
            {SITE_CONTACT.name}, {SITE_ADDRESS_SINGLE_LINE}, is the data controller responsible for the personal
            data described in this policy.
          </Policy>
          <Policy title="Information we collect">
            We collect information you give us directly — for example your name, email, phone number and any
            message details when you make a reservation, buy an event ticket, enquire about venue hire, join our
            mailing list, or contact us. If you create an account, we hold your account details. If you pay online,
            our payment provider (Stripe) processes your card details on our behalf — we do not store full card
            numbers.
          </Policy>
          <Policy title="How we use your information">
            We use this information to take and manage bookings and orders, respond to enquiries, send
            booking-related communications, and — where you have opted in — send marketing updates about events and
            offers. We also use aggregated, non-identifying information to understand how the site is used and to
            improve it.
          </Policy>
          <Policy title="Marketing & the mailing list">
            If you sign up to our mailing list (including via the form in the website footer), we will use your
            email address to send you updates about live nights, offers and news. You can unsubscribe at any time
            using the link in any marketing email or by contacting us directly.
          </Policy>
          <Policy title="Cookies & analytics">
            The site uses essential cookies to operate, and — only with your consent — analytics and advertising
            technologies including Google Analytics, Google Tag Manager and the Meta Pixel, which may process
            identifiers and usage data under their own privacy terms. See our{" "}
            <Link href="/cookie-policy" className="text-primary hover:underline">
              cookie policy
            </Link>{" "}
            for full detail and how to change your choice.
          </Policy>
          <Policy title="Sharing your information">
            We share personal data with trusted service providers who help us run the venue and website — for
            example payment processing, email delivery, hosting and (where you consent) analytics/advertising
            partners. We do not sell your personal data.
          </Policy>
          <Policy title="How long we keep it">
            We keep booking and order records for as long as needed for accounting and legal purposes, and mailing
            list details until you unsubscribe or ask us to delete them.
          </Policy>
          <Policy title="Your rights">
            Depending on where you live, you may have rights to access, correct, delete or export your personal
            data, and to object to or restrict certain uses of it. To exercise any of these rights, contact us using
            the details below. If you are in the UK and remain unhappy with our response, you can complain to the
            Information Commissioner&apos;s Office (ico.org.uk).
          </Policy>
          <Policy title="Keeping data secure">
            We use reasonable technical and organisational measures to protect the personal data we hold from loss,
            misuse or unauthorised access.
          </Policy>
          <Policy title="Changes to this policy">
            We may update this policy from time to time. The version published on this page is the one currently in
            effect.
          </Policy>
          <Policy title="Contact us">
            For any privacy question or to exercise your rights, contact us at{" "}
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
