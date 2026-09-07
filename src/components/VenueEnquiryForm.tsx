"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import Reveal from "@/components/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import SplitReveal from "@/components/motion/SplitReveal";
import FormSecurityFields from "@/components/FormSecurityFields";
import { createVenueEnquiry, type ActionState } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { IMG } from "@/lib/images";

const initialState: ActionState = { success: false, message: "" };

/** Client island — keeps the rest of /venue-hire as a fast server page. */
export default function VenueEnquiryForm() {
  const [state, formAction, pending] = useActionState(createVenueEnquiry, initialState);

  useEffect(() => {
    if (state.success) trackEvent("venue_enquiry_submitted");
  }, [state.success]);

  return (
    <Reveal variant="up">
      <div className="contact-float-card max-w-5xl mx-auto hairline-gold !mt-0">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          <div
            className="hidden lg:block lg:col-span-2 bg-cover bg-center min-h-[320px]"
            style={{ backgroundImage: `url('${IMG.collageC}')` }}
          />
          <div className="lg:col-span-3 p-8 md:p-12 lg:p-14">
            {state.success ? (
              <div className="text-center flex flex-col items-center gap-5 py-10">
                <span className="material-symbols-outlined text-primary text-5xl">check_circle</span>
                <h2 className="font-headline-md text-headline-md">Enquiry received</h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                  Thank you. Our team will be in touch to discuss your celebration and availability.
                </p>
                <Magnetic>
                  <Link href="/" className="btn-ink font-label-caps text-label-caps px-7 py-4 mt-2">
                    Back to home
                  </Link>
                </Magnetic>
              </div>
            ) : (
              <>
                <SplitReveal
                  as="h2"
                  text="Begin your enquiry"
                  accentWord="enquiry"
                  className="font-headline-lg text-[26px] md:text-[34px] uppercase tracking-[0.04em] mb-2"
                />
                <p className="font-body-md text-body-md text-on-surface-variant mb-10">
                  Tell us the occasion, your preferred date, and how many people are coming. Our team
                  will follow up with availability, dining options, and pricing. Sending an enquiry
                  does not confirm a booking.
                </p>
                <form action={formAction} className="flex flex-col gap-6 relative">
                  <FormSecurityFields />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Field
                      label="Full name"
                      name="name"
                      type="text"
                      placeholder="Your name"
                      error={state.fieldErrors?.name}
                    />
                    <Field
                      label="Email"
                      name="email"
                      type="email"
                      placeholder="you@email.com"
                      error={state.fieldErrors?.email}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label
                        className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]"
                        htmlFor="eventType"
                      >
                        What are you celebrating?
                      </label>
                      <select
                        id="eventType"
                        name="eventType"
                        defaultValue=""
                        required
                        className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary appearance-none transition-colors"
                      >
                        <option disabled value="">
                          Choose an occasion
                        </option>
                        <option value="birthday">Birthday party</option>
                        <option value="private-dinner">Celebration dinner</option>
                        <option value="other">Anniversary or other celebration</option>
                      </select>
                      {state.fieldErrors?.event_type && (
                        <p className="text-error text-sm">{state.fieldErrors.event_type[0]}</p>
                      )}
                    </div>
                    <Field
                      label="Estimated guests"
                      name="guests"
                      type="number"
                      placeholder="e.g. 50"
                      error={state.fieldErrors?.guests}
                    />
                  </div>
                  <Field label="Preferred date" name="date" type="date" error={state.fieldErrors?.date} />
                  <div className="flex flex-col gap-2">
                    <label
                      className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]"
                      htmlFor="details"
                    >
                      Additional details
                    </label>
                    <textarea
                      id="details"
                      name="details"
                      rows={4}
                      placeholder="Tell us about the occasion, preferred time, dining plans, and any special requests"
                      className="w-full bg-surface-container-lowest border border-outline-variant text-on-background p-4 focus:ring-0 focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  {!state.success && state.message && (
                    <p className="text-error text-sm">{state.message}</p>
                  )}
                  <Magnetic>
                    <button
                      type="submit"
                      disabled={pending}
                      className="btn-ink font-label-caps text-label-caps uppercase tracking-widest px-10 py-4 disabled:opacity-60"
                    >
                      {pending ? "Submitting…" : "Submit enquiry"}
                    </button>
                  </Magnetic>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  error,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  error?: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-[0.2em]"
        htmlFor={name}
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={type !== "number" ? true : undefined}
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-outline-variant text-on-background px-4 py-3 focus:ring-0 focus:border-primary transition-colors"
      />
      {error && <p className="text-error text-sm">{error[0]}</p>}
    </div>
  );
}
