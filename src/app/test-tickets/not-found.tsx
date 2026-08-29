import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BrandCloser, { FooterFlyover } from "@/components/BrandCloser";
import Reveal from "@/components/Reveal";

export default function TestTicketsNotFound() {
  return (
    <>
      <Nav active="/live-events" />
      <main className="flex-grow bg-background">
        <section className="max-w-2xl mx-auto px-margin-mobile md:px-gutter pt-20 md:pt-28 pb-section-gap-mobile md:pb-section-gap-desktop text-center">
          <Reveal>
            <h1 className="font-headline-lg text-headline-lg-mobile uppercase tracking-[0.03em] mb-5">
              Demo event not found
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">
              Run the seed script so the ticket sandbox exists in your database:
            </p>
            <pre className="text-left bg-surface-container-lowest p-5 hairline-gold font-mono text-sm text-on-surface-variant mb-8 overflow-x-auto">
              cd backend{"\n"}
              venv\scripts\activate{"\n"}
              python -m app.seed
            </pre>
            <Link href="/live-events" className="btn-ink font-label-caps text-label-caps px-7 py-4">
              Back to live events
            </Link>
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
