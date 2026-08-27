import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export default function SuccessErrorStatesPage() {
  return (
    <>
      <Nav active="/success-error-states" />
      <main className="flex-grow flex flex-col items-center justify-center py-section-gap-mobile md:py-section-gap-desktop px-margin-mobile md:px-gutter max-w-container-max mx-auto w-full gap-section-gap-desktop">
        <Reveal variant="scale" as="section" className="w-full max-w-3xl flex flex-col items-center text-center gap-8 relative overflow-hidden rounded-xl border border-primary-container/30 bg-surface-container-low p-8 md:p-16">
          <div className="w-16 h-16 rounded-full border border-primary-container flex items-center justify-center bg-primary-container/10 z-10">
            <span className="material-symbols-outlined icon-thin text-primary-container text-4xl">
              check_circle
            </span>
          </div>
          <div className="z-10 flex flex-col gap-4">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg">
              Reservation Confirmed
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Your table at Sweet1ne Live has been secured. We look forward to welcoming you for an
              evening of exceptional jazz and curated dining.
            </p>
          </div>
          <div className="w-full max-w-md bg-surface border border-outline-variant/30 rounded-lg p-6 flex flex-col gap-4 z-10 text-left">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                Reference No.
              </span>
              <span className="font-body-md text-body-md tracking-wider">SWT-7829-KL</span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="font-body-md text-body-md text-on-surface-variant">Date</span>
                <span className="font-body-md text-body-md">Friday, 24th Nov</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body-md text-body-md text-on-surface-variant">Time</span>
                <span className="font-body-md text-body-md">20:30</span>
              </div>
              <div className="flex justify-between">
                <span className="font-body-md text-body-md text-on-surface-variant">Guests</span>
                <span className="font-body-md text-body-md">2</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full justify-center mt-4 z-10">
            <button className="btn-primary font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">calendar_add_on</span>
              Add to Calendar
            </button>
            <Link
              className="bg-transparent border border-inverse-surface text-inverse-surface font-label-caps text-label-caps uppercase tracking-widest px-8 py-4 rounded hover:bg-inverse-surface/10 transition-colors duration-400 inline-block"
              href="/"
            >
              Return to Home
            </Link>
          </div>
        </Reveal>

        <Reveal variant="up" as="section" className="w-full max-w-3xl flex flex-col items-center text-center gap-8 bg-surface-container border border-outline-variant/20 rounded-xl p-8 md:p-16">
          <div className="w-16 h-16 rounded-full border border-on-surface-variant flex items-center justify-center bg-surface-variant/20">
            <span className="material-symbols-outlined icon-thin text-on-surface-variant text-4xl">
              event_busy
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="font-headline-md text-headline-md">Currently Unavailable</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto">
              We apologise, but the performance you selected is currently sold out. Due to the
              intimate nature of our venue, capacity is strictly limited.
            </p>
          </div>
          <div className="w-full max-w-lg mt-4 flex flex-col gap-6 text-left">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-center border-b border-outline-variant/30 pb-2">
              Alternative Dates Available
            </h3>
            <div className="flex flex-col gap-4">
              <AlternativeDate date="Saturday, 25th Nov" meta="The Late Session · 22:00" />
              <AlternativeDate date="Thursday, 30th Nov" meta="Evening Set · 19:30" />
            </div>
          </div>
          <div className="mt-4">
            <button className="bg-transparent border-none text-inverse-surface font-label-caps text-label-caps uppercase tracking-widest pb-1 border-b border-inverse-surface hover:text-primary-container hover:border-primary-container transition-all duration-400">
              Join Waiting List
            </button>
          </div>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}

function AlternativeDate({ date, meta }: { date: string; meta: string }) {
  return (
    <div className="flex items-center justify-between p-4 border border-outline-variant/30 rounded-lg hover:border-primary-container/50 transition-colors duration-400 cursor-pointer group">
      <div className="flex flex-col">
        <span className="font-body-lg text-body-lg">{date}</span>
        <span className="font-body-md text-body-md text-on-surface-variant">{meta}</span>
      </div>
      <span className="material-symbols-outlined text-primary-container opacity-0 group-hover:opacity-100 transition-opacity duration-400">
        arrow_forward
      </span>
    </div>
  );
}
