"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import BrandTagline from "@/components/BrandTagline";
import { PUBLIC_ACCOUNTS_ENABLED } from "@/lib/features";
import { useAuthModal } from "@/components/AuthModalProvider";
import { subscribeMailingList } from "@/lib/api";
import { SITE_ADDRESS_LINES, SITE_CONTACT, SITE_SOCIAL } from "@/lib/brand";
import { FORM_SECURITY_FIELD, formSecurityTimestamp } from "@/lib/formSecurity";
import { openCookieSettings } from "@/components/Analytics";

export default function Footer() {
  const { open } = useAuthModal();
  const [joined, setJoined] = useState(false);
  const [formTs] = useState(() => formSecurityTimestamp());

  async function onNewsletter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const hp = String(data.get(FORM_SECURITY_FIELD.honeypot) ?? "").trim();
    const result = await subscribeMailingList(email, {
      [FORM_SECURITY_FIELD.honeypot]: hp,
      [FORM_SECURITY_FIELD.timestamp]: formTs,
    });
    if (result.success) {
      setJoined(true);
    }
  }

  return (
    <footer className="site-footer mt-0">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter pt-16 md:pt-24 pb-0">
        {/* Top tier */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16 pb-14 border-b border-white/15">
          <div id="event-updates" className="scroll-mt-28">
            <h3 className="font-headline-md text-[26px] md:text-[30px] leading-snug mb-4 text-[#f5efe8]">
              Join our community and get updates on live nights and what&apos;s next.
            </h3>
            <p className="font-body-md text-body-md text-white/65 mb-4 max-w-sm">
              Late-night hospitality, live rhythm, and seasonal tasting notes — delivered with care.
            </p>
            <BrandTagline variant="footer" className="mb-8 max-w-sm" />
            {joined ? (
              <p className="font-label-caps text-label-caps tracking-widest uppercase text-[#d4a574]">
                You&apos;re on the list
              </p>
            ) : (
              <form onSubmit={onNewsletter} className="flex items-center border-b border-white/35 pb-2 gap-3">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Email Address"
                  className="flex-1 bg-transparent border-0 text-[#f5efe8] placeholder:text-white/45 py-2 focus:ring-0"
                />
                <input
                  type="text"
                  name={FORM_SECURITY_FIELD.honeypot}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute opacity-0 pointer-events-none h-0 w-0"
                />
                <button type="submit" aria-label="Subscribe" className="text-[#f5efe8] hover:text-[#d4a574]">
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-col items-start lg:items-center gap-5">
            <div className="flex items-center gap-2 text-[#f5efe8]">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="material-symbols-outlined icon-fill text-[18px] text-[#d4a574]">
                  star
                </span>
              ))}
            </div>
            <p className="font-body-md text-body-md text-white/75 text-center">
              4.9 based on guest evenings this season
            </p>
            <p className="font-label-caps text-[11px] tracking-[0.2em] uppercase text-white/50">
              Secure payments · Table guarantee
            </p>
            <div className="flex gap-3 text-white/55 font-label-caps text-[10px] tracking-widest">
              <span>VISA</span>
              <span>MC</span>
              <span>AMEX</span>
              <span>APPLE PAY</span>
            </div>
          </div>

          <div>
            <h3 className="font-label-caps text-label-caps tracking-[0.2em] uppercase text-white/55 mb-4">
              Visit us
            </h3>
            <Image
              src="/images/sweet1nelive_logo-transparent.png"
              alt="Sweet1ne Live"
              width={1774}
              height={887}
              sizes="180px"
              className="h-12 w-auto object-contain -ml-1 mb-3"
            />
            <p className="font-body-md text-body-md text-white/70 mb-1">{SITE_CONTACT.phone}</p>
            <p className="font-body-md text-body-md text-white/70 mb-1">
              <a href={`mailto:${SITE_CONTACT.email}`} className="hover:text-[#d4a574] transition-colors">
                {SITE_CONTACT.email}
              </a>
            </p>
            <p className="font-body-md text-body-md text-white/70">
              {SITE_ADDRESS_LINES.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-14 border-b border-white/15">
          <FooterCol
            title="Quick links"
            links={[
              { href: "/", label: "Home" },
              { href: "/menus", label: "Menus" },
              { href: "/live-events", label: "Live & Events" },
              { href: "/reservations", label: "Reservations" },
              { href: "/venue-hire", label: "Venue Hire" },
            ]}
          />
          <FooterCol
            title="About"
            links={[
              { href: "/contact", label: "Contact" },
              { href: "/venue-hire", label: "Private dining" },
              { href: "/live-events", label: "What's on" },
            ]}
          />
          <div>
            <h4 className="font-label-caps text-label-caps tracking-[0.18em] uppercase text-white/45 mb-5">
              {PUBLIC_ACCOUNTS_ENABLED ? "Account" : "Help"}
            </h4>
            <ul className="space-y-3">
              {PUBLIC_ACCOUNTS_ENABLED && (<>
              <li>
                <button type="button" onClick={() => open("signin")} className="font-body-md text-body-md text-left">
                  Sign in
                </button>
              </li>
              <li>
                <button type="button" onClick={() => open("signup")} className="font-body-md text-body-md text-left">
                  Create account
                </button>
              </li>
              </>)}
              <li>
                <Link href="/contact" className="font-body-md text-body-md">
                  Talk to us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-caps text-label-caps tracking-[0.18em] uppercase text-white/45 mb-5">
              Social
            </h4>
            <ul className="space-y-3">
              {SITE_SOCIAL.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-body-md text-body-md"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-gutter relative z-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-8 pb-2 font-label-caps text-[11px] tracking-widest uppercase text-white/45 border-t border-white/15">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-5">
            <span>Sweet1ne Live © {new Date().getFullYear()}</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <Link href="/cookie-policy">Cookie policy</Link>
            <button type="button" onClick={openCookieSettings}>Cookie settings</button>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy-policy">Privacy policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="font-label-caps text-label-caps tracking-[0.18em] uppercase text-white/45 mb-5">
        {title}
      </h4>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href} className="font-body-md text-body-md">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
