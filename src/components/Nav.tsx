"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PUBLIC_ACCOUNTS_ENABLED } from "@/lib/features";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import { useAuthModal } from "@/components/AuthModalProvider";

/** Short labels — single line, no wrapping. Reserve lives in the CTA. */
const LINKS_LEFT = [
  { href: "/", label: "Home" },
  { href: "/menus", label: "Menu" },
  { href: "/whats-on", label: "What's On" },
  { href: "/events", label: "Events" },
] as const;

const LINKS_RIGHT = [
  { href: "/venue-hire", label: "Venue Hire" },
  { href: "/contact", label: "Contact" },
] as const;

const MOBILE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menus", label: "Menu" },
  { href: "/whats-on", label: "What's On" },
  { href: "/events", label: "Events" },
  { href: "/reservations", label: "Reserve" },
  { href: "/venue-hire", label: "Venue Hire" },
  { href: "/contact", label: "Contact" },
] as const;

const NAV_LINK =
  "font-label-caps text-[12px] md:text-[13px] font-medium uppercase tracking-[0.22em] whitespace-nowrap";

function NavLinks({
  links,
  active,
  tone = "default",
  className = "",
}: {
  links: readonly { href: string; label: string }[];
  active: string;
  tone?: "default" | "onMedia";
  className?: string;
}) {
  return (
    <nav className={`hidden lg:flex items-center gap-5 xl:gap-7 ${className}`}>
      {links.map((link) => (
        <NavLink
          key={link.href}
          href={link.href}
          label={link.label}
          active={active === link.href}
          tone={tone}
        />
      ))}
    </nav>
  );
}

function MobileMenuButton({
  onClick,
  tone = "default",
}: {
  onClick: () => void;
  tone?: "default" | "onMedia";
}) {
  const toneCls =
    tone === "onMedia"
      ? "text-white hover:text-[#d4a574]"
      : "text-on-background hover:text-primary";

  return (
    <button
      type="button"
      className={`lg:hidden inline-flex h-10 w-10 items-center justify-center shrink-0 transition-colors ${toneCls}`}
      onClick={onClick}
      aria-label="Open menu"
    >
      <span className="material-symbols-outlined text-[26px]">menu</span>
    </button>
  );
}

function MobileNavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`site-nav-mobile-link group flex items-center justify-between gap-4 py-3.5 pl-4 pr-3 border-b border-outline-variant/15 transition-colors ${
        active ? "site-nav-mobile-link--active" : ""
      }`}
    >
      <span className="font-label-caps text-[13px] font-medium uppercase tracking-[0.28em]">
        {label}
      </span>
      <span
        className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${
          active ? "text-primary" : "text-on-background/25 group-hover:text-primary group-hover:translate-x-0.5"
        }`}
        aria-hidden
      >
        arrow_forward
      </span>
    </Link>
  );
}

function NavLink({
  href,
  label,
  active,
  tone = "default",
}: {
  href: string;
  label: string;
  active?: boolean;
  tone?: "default" | "onMedia";
}) {
  const idle = tone === "onMedia" ? "text-white/80" : "text-on-background/70";
  const hover = tone === "onMedia" ? "hover:text-white" : "hover:text-on-background";
  const activeCls = tone === "onMedia" ? "text-white" : "text-on-background";

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      data-active={active ? "true" : "false"}
      className={`site-nav-link ${NAV_LINK} ${idle} ${hover} transition-colors duration-300 ${
        active ? activeCls : ""
      }`}
    >
      {label}
    </Link>
  );
}

function Wordmark({
  scrolled,
  tone = "default",
}: {
  scrolled: boolean;
  tone?: "default" | "onMedia";
}) {
  const name = tone === "onMedia" ? "text-white" : "text-on-background";

  return (
    <Link
      href="/"
      aria-label="Sweet1ne Live — home"
      className={`site-nav-wordmark group flex flex-col items-center leading-none ${name}`}
    >
      <Image
        src="/images/sweet1nelive_logo-transparent.png"
        alt="Sweet1ne Live"
        width={1774}
        height={887}
        priority
        sizes="(max-width: 768px) 150px, 200px"
        className={`w-auto object-contain transition-[height] duration-400 ${
          scrolled ? "h-9 md:h-11" : "h-11 md:h-14"
        } ${tone === "onMedia" ? "drop-shadow-[0_2px_14px_rgba(0,0,0,0.5)]" : ""}`}
      />
    </Link>
  );
}

export default function Nav({ active, overlay = false }: { active: string; overlay?: boolean }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, ready, signOut } = useAuth();
  const { open: openAuth } = useAuthModal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shell = scrolled
    ? overlay
      ? "bg-[#131313]/88 backdrop-blur-md border-b border-white/10 py-3"
      : "bg-background/92 backdrop-blur-md border-b border-outline-variant/35 py-3"
    : overlay
      ? "bg-transparent border-b border-transparent py-5 md:py-6"
      : "bg-background border-b border-outline-variant/15 py-4 md:py-5";

  if (overlay) {
    return (
      <>
        <header className={`site-nav fixed top-0 inset-x-0 z-50 ${shell}`}>
          {/* Logo locked to true 50% of the page */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 flex -translate-x-1/2 items-center">
            <div className="pointer-events-auto">
              <Wordmark scrolled={scrolled} tone="onMedia" />
            </div>
          </div>

          <div className="site-nav-bar site-nav-bar--mobile-split mx-auto grid min-h-[3.5rem] w-full max-w-container-max grid-cols-[1fr_auto_1fr] items-center overflow-x-clip px-gutter">
            <div className="flex min-w-0 items-center justify-start gap-4">
              <NavLinks
                links={LINKS_LEFT}
                active={active}
                tone="onMedia"
                className="justify-start min-w-0"
              />
              {/* Mobile only — theme stays left of the logo */}
              <div className="lg:hidden">
                <ThemeToggle className="!text-white/80 hover:!text-white shrink-0" />
              </div>
            </div>

            <div aria-hidden className="min-w-0" />

            <div className="flex min-w-0 items-center justify-end gap-4 xl:gap-6">
              <NavLinks
                links={LINKS_RIGHT}
                active={active}
                tone="onMedia"
                className="justify-end min-w-0"
              />
              {/* Desktop — theme sits to the right of the logo */}
              <div className="hidden lg:block">
                <ThemeToggle className="!text-white/80 hover:!text-white shrink-0" />
              </div>
              {PUBLIC_ACCOUNTS_ENABLED && (ready && user ? (
                <button
                  type="button"
                  onClick={signOut}
                  className={`hidden md:inline-flex ${NAV_LINK} text-white/80 hover:text-white transition-colors`}
                >
                  Sign out
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuth("signin")}
                  className={`hidden md:inline-flex ${NAV_LINK} text-white/80 hover:text-white transition-colors`}
                >
                  Sign in
                </button>
              ))}
              <Link
                href="/reservations"
                className={`site-nav-cta hidden sm:inline-flex ${NAV_LINK} px-5 py-2.5 bg-[#d8b632] text-[#231b00] hover:bg-[#e4c44a] transition-colors duration-300`}
              >
                Reserve
              </Link>
              <MobileMenuButton onClick={() => setOpen(true)} tone="onMedia" />
            </div>
          </div>
        </header>
        <MobileMenu open={open} setOpen={setOpen} active={active} tone="dark" />
      </>
    );
  }

  return (
    <header className={`site-nav sticky top-0 z-50 relative ${shell}`}>
      {/* Logo locked to true 50% of the page */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 flex -translate-x-1/2 items-center">
        <div className="pointer-events-auto">
          <Wordmark scrolled={scrolled} />
        </div>
      </div>

      <div className="site-nav-bar site-nav-bar--mobile-split mx-auto grid min-h-[3.5rem] w-full max-w-container-max grid-cols-[1fr_auto_1fr] items-center overflow-x-clip px-gutter">
        <div className="flex min-w-0 items-center justify-start gap-4">
          <NavLinks links={LINKS_LEFT} active={active} className="justify-start min-w-0" />
          {/* Mobile only — theme stays left of the logo */}
          <div className="lg:hidden">
            <ThemeToggle className="shrink-0" />
          </div>
        </div>

        <div aria-hidden className="min-w-0" />

        <div className="flex min-w-0 items-center justify-end gap-4 xl:gap-6">
          <NavLinks links={LINKS_RIGHT} active={active} className="justify-end min-w-0" />
          {/* Desktop — theme sits to the right of the logo */}
          <div className="hidden lg:block">
            <ThemeToggle className="shrink-0" />
          </div>
          {PUBLIC_ACCOUNTS_ENABLED && (ready && user ? (
            <button
              type="button"
              onClick={signOut}
              className={`hidden md:inline-flex ${NAV_LINK} text-on-background/65 hover:text-on-background transition-colors max-w-[100px] truncate`}
              title={user.name}
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openAuth("signin")}
              className={`hidden md:inline-flex ${NAV_LINK} text-on-background/65 hover:text-on-background transition-colors`}
            >
              Sign in
            </button>
          ))}
          <Link
            href="/reservations"
            className={`site-nav-cta hidden sm:inline-flex ${NAV_LINK} px-5 py-2.5 bg-[#d8b632] text-[#231b00] hover:bg-[#e4c44a] transition-colors duration-300`}
          >
            Reserve
          </Link>
          <MobileMenuButton onClick={() => setOpen(true)} />
        </div>
      </div>

      <MobileMenu open={open} setOpen={setOpen} active={active} />
    </header>
  );
}

function MobileMenu({
  open,
  setOpen,
  active,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  active: string;
  tone?: "dark";
}) {
  const { user, ready, signOut } = useAuth();
  const { open: openAuth } = useAuthModal();
  if (!open) return null;

  return (
    <div className="site-nav-mobile fixed inset-0 z-[60] flex flex-col bg-background overflow-y-auto">
      <div className="flex items-center justify-between px-margin-mobile py-4 border-b border-outline-variant/20">
        <Wordmark scrolled={false} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="inline-flex h-10 w-10 items-center justify-center text-on-background hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[26px]">close</span>
        </button>
      </div>

      <nav className="flex flex-col flex-1 px-margin-mobile py-6">
        <p className="font-label-caps text-[10px] uppercase tracking-[0.32em] text-on-surface-variant mb-4">
          Explore
        </p>
        {MOBILE_LINKS.map((link) => (
          <MobileNavLink
            key={link.href}
            href={link.href}
            label={link.label}
            active={active === link.href}
            onNavigate={() => setOpen(false)}
          />
        ))}
      </nav>

      <div className="px-margin-mobile py-6 flex flex-col gap-4 border-t border-outline-variant/20">
        {PUBLIC_ACCOUNTS_ENABLED && (ready && user ? (
          <button
            type="button"
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className={`self-start ${NAV_LINK} text-on-background/70 hover:text-primary transition-colors`}
          >
            Sign out
          </button>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openAuth("signin");
              }}
              className={`${NAV_LINK} text-on-background/70 hover:text-primary transition-colors`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openAuth("signup");
              }}
              className={`${NAV_LINK} text-on-background/70 hover:text-primary transition-colors`}
            >
              Join
            </button>
          </div>
        ))}
        <Link
          href="/reservations"
          onClick={() => setOpen(false)}
          className={`site-nav-cta w-full text-center ${NAV_LINK} px-6 py-4 bg-[#d8b632] text-[#231b00] hover:bg-[#e4c44a] transition-colors`}
        >
          Reserve a table
        </Link>
      </div>
    </div>
  );
}
