"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import {
  ADMIN_NAV,
  adminPageTitle,
  isAdminNavActive,
} from "@/lib/adminNav";
import { clearStaffSession, getStaffSession, type StaffUser } from "@/lib/staffAuth";

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 300;
const SIDEBAR_DEFAULT = 236;
const SIDEBAR_RAIL = 72;

export default function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);

  useEffect(() => {
    const session = getStaffSession();
    if (!session) {
      router.replace("/admin/login");
      return;
    }
    setStaff(session);
    setReady(true);
  }, [router]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current || collapsed) return;
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, e.clientX));
      setSidebarWidth(next);
    };
    const onUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [collapsed]);

  const startResize = useCallback(() => {
    if (collapsed) return;
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [collapsed]);

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    []
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const initials = useMemo(() => {
    if (!staff?.name) return "SA";
    return staff.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [staff]);

  function signOut() {
    clearStaffSession();
    router.replace("/admin/login");
    // Hard fallback so logout always leaves the dashboard shell
    window.setTimeout(() => {
      if (window.location.pathname.startsWith("/staff-dashboard")) {
        window.location.assign("/admin/login");
      }
    }, 80);
  }

  function toggleSidebar() {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setMobileOpen((v) => !v);
      return;
    }
    setCollapsed((v) => !v);
  }

  const rail = collapsed;
  const desktopWidth = rail ? SIDEBAR_RAIL : sidebarWidth;
  const title = adminPageTitle(pathname);
  const profileActive = pathname.startsWith("/staff-dashboard/profile");

  if (!ready || !staff) {
    return (
      <div className="admin-shell min-h-screen flex items-center justify-center">
        Loading staff dashboard…
      </div>
    );
  }

  return (
    <div
      className={`admin-shell min-h-screen flex ${theme === "dark" ? "admin-shell--dark" : "admin-shell--light"}`}
      style={{ ["--admin-sidebar-w" as string]: `${desktopWidth}px` }}
    >
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex flex-col transition-[width,transform] duration-300 ease-out md:relative md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${rail ? "admin-sidebar--rail" : ""}`}
        style={{ width: desktopWidth }}
      >
        <div
          className={`admin-sidebar__brand shrink-0 flex flex-col items-center ${
            rail ? "px-2 pt-4 pb-3" : "px-5 pt-5 pb-3"
          }`}
        >
          <Link
            href="/staff-dashboard"
            className="flex flex-col items-center group"
            title="Sweet1ne Live"
          >
            <div className="admin-sidebar__logo-ring flex items-center justify-center overflow-visible shrink-0">
              <Image
                src="/images/logo.png"
                alt="Sweet1ne"
                width={1536}
                height={1024}
                className="logo-neon-dark w-full h-auto object-contain"
                priority
              />
            </div>
            {!rail && (
              <span className="font-label-caps text-[10px] md:text-[11px] font-semibold tracking-[0.55em] uppercase text-[#d4a574] mt-2">
                Live
              </span>
            )}
          </Link>
        </div>

        <nav
          className={`admin-sidebar__nav flex-1 py-2 ${
            rail ? "px-2" : "pl-3 pr-0"
          }`}
        >
          {ADMIN_NAV.map((item) => {
            const isActive = isAdminNavActive(
              pathname,
              item.href,
              "exact" in item ? item.exact : false
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={() => setMobileOpen(false)}
                className={`admin-nav-item ${isActive ? "admin-nav-item--active" : ""} ${
                  rail ? "admin-nav-item--rail" : ""
                }`}
              >
                <span className="material-symbols-outlined text-[20px] shrink-0">
                  {item.icon}
                </span>
                {!rail && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={`admin-sidebar__footer shrink-0 ${rail ? "px-2" : "pl-3 pr-0"}`}
        >
          <Link
            href="/staff-dashboard/profile"
            title="My Profile"
            onClick={() => setMobileOpen(false)}
            className={`admin-nav-item admin-nav-item--footer ${
              profileActive ? "admin-nav-item--active" : ""
            } ${rail ? "admin-nav-item--rail" : ""}`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">
              account_circle
            </span>
            {!rail && <span>My Profile</span>}
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signOut();
            }}
            title="Sign Out"
            className={`admin-nav-item admin-nav-item--footer admin-nav-item--danger w-full text-left ${
              rail ? "admin-nav-item--rail" : ""
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            {!rail && <span>Sign Out</span>}
          </button>
        </div>

        {!rail && (
          <button
            type="button"
            aria-label="Resize sidebar"
            className="admin-sidebar__resize hidden md:block"
            onMouseDown={startResize}
          />
        )}
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#1a100c]/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="admin-main flex-1 flex flex-col min-w-0">
        <header className="admin-header sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4 px-4 md:px-8 py-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="admin-collapse-btn"
                onClick={toggleSidebar}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  /* Plain hamburger — expand */
                  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden>
                    <path d="M1 2h20M1 8h20M1 14h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                ) : (
                  /* Hamburger + left chevron — collapse (Doxa style) */
                  <svg width="26" height="16" viewBox="0 0 26 16" fill="none" aria-hidden>
                    <path d="M1 2h14M1 8h16M1 14h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M21 3.5L17 8l4 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <div className="min-w-0">
                <h1 className="font-headline-md text-[22px] md:text-[26px] leading-none truncate">
                  {title}
                </h1>
                <p className="font-body-md text-sm text-[var(--admin-muted)] mt-1">
                  {greeting}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <span className="hidden sm:inline font-label-caps text-[10px] tracking-[0.18em] uppercase text-[var(--admin-muted)]">
                {dateLabel}
              </span>
              <ThemeToggle className="admin-icon-btn !text-[var(--admin-ink)] hover:!text-[var(--admin-accent)]" />
              <Link
                href="/staff-dashboard/notifications"
                aria-label="Notifications"
                className="admin-icon-btn relative"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c45c3a]" />
              </Link>
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--admin-border)]">
                <div className="leading-tight text-right">
                  <p className="font-label-caps text-[10px] tracking-[0.16em] uppercase">
                    {staff.name}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">{staff.role}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[var(--admin-sidebar)] text-[#f5efe8] flex items-center justify-center font-label-caps text-[11px] tracking-wider">
                  {initials}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  signOut();
                }}
                className="admin-btn-danger"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span className="hidden md:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
