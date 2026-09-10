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
              Shows, brunches and hospitality updates — warm, friendly notes from Sweet1ne Live.
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
            <p className="font-body-md text-body-md text-white/70 mb-1">
              <a href={`tel:${SITE_CONTACT.phoneTel}`} className="hover:text-[#d4a574] transition-colors">
                {SITE_CONTACT.phone}
              </a>
            </p>
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
              { href: "/whats-on", label: "What's On" },
              { href: "/events", label: "External Events" },
              { href: "/reservations", label: "Reservations" },
              { href: "/venue-hire", label: "Venue Hire" },
            ]}
          />
          <FooterCol
            title="About"
            links={[
              { href: "/contact", label: "Contact" },
              { href: "/venue-hire", label: "Private hire" },
              { href: "/whats-on", label: "What's on" },
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
            <ul className="flex items-center gap-4">
              {SITE_SOCIAL.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="inline-flex items-center justify-center text-white/55 hover:text-[#d4a574] transition-colors"
                  >
                    <SocialIcon name={s.label} />
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

function SocialIcon({ name }: { name: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
  };

  if (name === "Instagram") {
    return (
      <svg {...common}>
        <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9A3.1 3.1 0 1 1 12 8.9a3.1 3.1 0 0 1 0 6.2Z" />
        <path d="M16.95 2.1H7.05A4.95 4.95 0 0 0 2.1 7.05v9.9A4.95 4.95 0 0 0 7.05 21.9h9.9a4.95 4.95 0 0 0 4.95-4.95v-9.9A4.95 4.95 0 0 0 16.95 2.1Zm3.25 14.85a3.25 3.25 0 0 1-3.25 3.25H7.05a3.25 3.25 0 0 1-3.25-3.25v-9.9A3.25 3.25 0 0 1 7.05 3.8h9.9a3.25 3.25 0 0 1 3.25 3.25v9.9Z" />
        <circle cx="17.45" cy="6.55" r="1.15" />
      </svg>
    );
  }

  if (name === "Facebook") {
    return (
      <svg {...common}>
        <path d="M14.5 22v-8.2h2.75l.4-3.2H14.5V8.55c0-.93.26-1.56 1.6-1.56H17.8V4.12C17.4 4.06 16.1 3.95 14.6 3.95c-3.15 0-5.3 1.92-5.3 5.45v3.2H6.7v3.2h2.6V22h5.2Z" />
      </svg>
    );
  }

  if (name === "TikTok") {
    return (
      <svg {...common}>
        <path d="M19.6 8.35a6.4 6.4 0 0 1-3.72-1.2v7.1a5.95 5.95 0 1 1-5.95-5.95c.3 0 .6.03.88.08v2.95a3.05 3.05 0 1 0 2.12 2.91V2.1h2.9c.14 1.55.9 2.95 2.05 3.9A6.3 6.3 0 0 0 19.6 7v1.35Z" />
      </svg>
    );
  }

  return null;
}
