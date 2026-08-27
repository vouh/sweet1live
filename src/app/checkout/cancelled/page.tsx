import Link from "next/link";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";

export const metadata: Metadata = {
  title: "Checkout cancelled | Sweet1ne LIVE",
  robots: { index: false },
};

type PageProps = { searchParams: Promise<{ ref?: string }> };

export default async function CheckoutCancelledPage({ searchParams }: PageProps) {
  const { ref } = await searchParams;

  return (
    <>
      <Nav active="/live-events" />
      <main className="flex-grow bg-background">
        <section className="max-w-2xl mx-auto px-margin-mobile md:px-gutter pt-20 md:pt-28 pb-section-gap-mobile md:pb-section-gap-desktop">
          <Reveal>
            <div className="text-center flex flex-col items-center gap-5">
              <span className="material-symbols-outlined text-on-surface-variant text-5xl">
                shopping_cart_off
              </span>
              <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg uppercase tracking-[0.03em]">
                Checkout cancelled
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                Nothing has been charged. We&apos;ll hold your seats for a few more minutes — pick
                up where you left off, or take another look at what&apos;s on.
              </p>
              {ref && (
                <p className="font-label-caps text-label-caps uppercase tracking-[0.25em] text-on-surface-variant">
                  Reference <span className="numeral">{ref}</span>
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-5 mt-4">
                <Link href="/live-events" className="btn-ink font-label-caps text-label-caps px-7 py-4">
                  Back to events
                </Link>
                <Link
                  href="/venue-hire"
                  className="link-underline font-label-caps text-label-caps uppercase tracking-[0.25em] hover:text-primary transition-colors"
                >
                  Venue hire instead
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
        <BrandCloser />
      </main>
      <FooterFlyover>
        <Footer />
      </FooterFlyover>
    </>
  );
}
