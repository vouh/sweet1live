"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/components/AuthProvider";
import { useAuthModal } from "@/components/AuthModalProvider";

/** Short labels — single line, no wrapping. Reserve lives in the CTA. */
const LINKS_LEFT = [
  { href: "/", label: "Home" },
  { href: "/menus", label: "Menu" },
  { href: "/live-events", label: "Events" },
  { href: "/venue-hire", label: "Venue" },
  { href: "/contact", label: "Contact" },
] as const;

const MOBILE_LINKS = [
  { href: "/", label: "Home" },
  { href: "/menus", label: "Menu" },
  { href: "/live-events", label: "Events" },
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
  const live = tone === "onMedia" ? "text-[#d4a574]" : "text-primary";

  return (
    <Link
      href="/"
      aria-label="Sweet1ne Live — home"
      className={`site-nav-wordmark group flex flex-col items-center leading-none ${name}`}
    >
      <Image
        src="/images/logo.png"
        alt="Sweet1ne"
        width={1536}
        height={1024}
        priority
        sizes="(max-width: 768px) 150px, 200px"
        className={`logo-neon ${
          tone === "onMedia" ? "logo-neon-dark" : ""
        } w-auto object-contain transition-[height] duration-400 ${
          scrolled ? "h-9 md:h-11" : "h-11 md:h-14"
        }`}
      />
      <span
        className={`font-label-caps text-[9px] md:text-[10px] font-semibold tracking-[0.55em] uppercase -mt-1 ${live}`}
      >
        Live
      </span>
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

          <div className="site-nav-bar mx-auto flex min-h-[3.5rem] w-full max-w-container-max items-center justify-between overflow-x-clip px-gutter">
            <NavLinks
              links={LINKS_LEFT}
              active={active}
              tone="onMedia"
              className="justify-start min-w-0"
            />

            <div className="flex min-w-0 items-center justify-end gap-4 xl:gap-6">
              <ThemeToggle className="!text-white/80 hover:!text-white shrink-0" />
              {ready && user ? (
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
              )}
              <Link
                href="/reservations"
                className={`site-nav-cta hidden sm:inline-flex ${NAV_LINK} px-5 py-2.5 border border-white/35 text-white hover:bg-white hover:text-[#1a100c] transition-colors duration-300`}
              >
                Reserve
              </Link>
              <button
                type="button"
                className="lg:hidden text-white shrink-0"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <span className="material-symbols-outlined text-[28px]">menu</span>
              </button>
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

      <div className="site-nav-bar mx-auto flex min-h-[3.5rem] w-full max-w-container-max items-center justify-between overflow-x-clip px-gutter">
        <NavLinks
          links={LINKS_LEFT}
          active={active}
          className="justify-start min-w-0"
        />

        <div className="flex min-w-0 items-center justify-end gap-4 xl:gap-6">
          <ThemeToggle className="shrink-0" />
          {ready && user ? (
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
          )}
          <Link
            href="/reservations"
            className={`site-nav-cta hidden sm:inline-flex ${NAV_LINK} px-5 py-2.5 bg-primary-container text-on-primary-container hover:opacity-90 transition-opacity duration-300`}
          >
            Reserve
          </Link>
          <button
            type="button"
            className="lg:hidden text-on-background hover:text-primary transition-colors shrink-0"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>
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
  tone,
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
    <div className="fixed inset-0 bg-background z-[60] flex flex-col px-margin-mobile overflow-y-auto">
      <div className="flex items-center justify-between py-5 border-b border-outline-variant/20">
        <Wordmark scrolled={false} tone={tone === "dark" ? "default" : "default"} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="text-on-background p-2 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>

      <nav className="flex flex-col gap-1 py-8 flex-1">
        {MOBILE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`font-headline-md text-[28px] uppercase tracking-[0.04em] py-4 border-b border-outline-variant/15 ${
              active === link.href
                ? "text-primary"
                : "text-on-background hover:text-primary"
            } transition-colors`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="py-8 flex flex-col gap-4 border-t border-outline-variant/20">
        <div className="flex items-center justify-between">
          <ThemeToggle />
          {ready && user ? (
            <button
              type="button"
              onClick={() => {
                signOut();
                setOpen(false);
              }}
              className={`${NAV_LINK} text-on-background/70 hover:text-primary transition-colors`}
            >
              Sign out
            </button>
          ) : (
            <div className="flex gap-6">
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
          )}
        </div>
        <Link
          href="/reservations"
          onClick={() => setOpen(false)}
          className={`site-nav-cta w-full text-center ${NAV_LINK} px-6 py-4 bg-primary-container text-on-primary-container`}
        >
          Reserve a table
        </Link>
      </div>
    </div>
  );
}
