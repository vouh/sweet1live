"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminConfirmHost } from "@/components/admin/AdminTableTools";
import LuxuryLoader from "@/components/LuxuryLoader";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import {
  canAccessPath,
  firstAllowedPath,
  navForStaff,
  navIsActive,
  pageTitle,
  type NavItem,
} from "@/lib/staffPermissions";
import { adminApi, type AdminNotification } from "@/lib/adminApi";
import {
  clearStaffSession,
  getStaffSession,
  refreshStaffSession,
  staffDisplayRole,
  type StaffUser,
} from "@/lib/staffAuth";

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 300;
const SIDEBAR_DEFAULT = 236;
const SIDEBAR_RAIL = 72;
const NOTIFICATIONS_POLL_MS = 30_000;
const SEEN_NOTIFICATIONS_KEY = "sweet1ne-admin-seen-notifications";

function loadSeenIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_NOTIFICATIONS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage can be unavailable (private browsing, quota) — toasts just won't dedupe.
  }
}

type Toast = { title: string; detail: string; severity: AdminNotification["severity"] };

// Mirrors the Notifications page's severity colours, so a toast reads the
// same "how urgent is this" language wherever it shows up.
const TOAST_ACCENT: Record<AdminNotification["severity"], string> = {
  action: "#c45c3a",
  warning: "#e11d48",
  info: "#d4a574",
  success: "#10b981",
};
const TOAST_ICON: Record<AdminNotification["severity"], string> = {
  action: "pending_actions",
  warning: "warning",
  info: "notifications_active",
  success: "task_alt",
};
// When several notifications land at once, the toast takes on the most
// urgent one's colour rather than a generic default.
const SEVERITY_PRIORITY: AdminNotification["severity"][] = [
  "warning",
  "action",
  "info",
  "success",
];
function worstSeverity(items: AdminNotification[]): AdminNotification["severity"] {
  for (const level of SEVERITY_PRIORITY) {
    if (items.some((item) => item.severity === level)) return level;
  }
  return "info";
}

export default function AdminShell({
  children,
  basePath = "/staff-dashboard",
  superAdminOnly = true,
}: {
  children: ReactNode;
  basePath?: "/staff-dashboard" | "/portal";
  superAdminOnly?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const dragging = useRef(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const session = getStaffSession();
      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const fresh = (await refreshStaffSession()) ?? session;
      if (cancelled) return;

      if (superAdminOnly && !fresh.is_super_admin) {
        router.replace(firstAllowedPath(fresh.permissions, "/portal", false));
        return;
      }
      if (!superAdminOnly && fresh.is_super_admin) {
        router.replace("/staff-dashboard");
        return;
      }

      setStaff(fresh);
      setReady(true);
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [router, superAdminOnly]);

  useEffect(() => {
    if (!ready || !staff || superAdminOnly) return;
    if (!canAccessPath(pathname, staff.permissions, staff.is_super_admin)) {
      router.replace(firstAllowedPath(staff.permissions, "/portal", false));
    }
  }, [ready, staff, pathname, superAdminOnly, router]);

  // Lock document scroll — only the main content panel should move.
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("admin-route");
    return () => html.classList.remove("admin-route");
  }, []);

  // Polls the same computed-notifications feed the Notifications page reads,
  // and toasts whatever wasn't there last time — a booking, a payment, a new
  // enquiry. "Seen" ids persist in localStorage so a refresh doesn't re-toast
  // things already surfaced.
  useEffect(() => {
    if (!ready || !staff) return;
    if (!staff.is_super_admin && !staff.permissions.includes("notifications.view")) {
      setNotifications([]);
      return;
    }
    let cancelled = false;
    let firstRun = true;
    const seen = loadSeenIds();

    async function poll() {
      let items: AdminNotification[];
      try {
        items = await adminApi.notifications();
      } catch {
        return;
      }
      if (cancelled) return;
      setNotifications(items);

      if (!firstRun) {
        const fresh = items.filter((item) => !seen.has(item.id));
        if (fresh.length === 1) {
          setToast({
            title: fresh[0].title,
            detail: fresh[0].detail,
            severity: fresh[0].severity,
          });
        } else if (fresh.length > 1) {
          setToast({
            title: `${fresh.length} new updates`,
            detail: "New activity just landed in the notifications inbox.",
            severity: worstSeverity(fresh),
          });
        }
      }
      firstRun = false;
      items.forEach((item) => seen.add(item.id));
      saveSeenIds(seen);
    }

    poll();
    const interval = window.setInterval(poll, NOTIFICATIONS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [ready, staff]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(id);
  }, [toast]);

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

  const navItems: NavItem[] = useMemo(() => {
    if (!staff) return [];
    return navForStaff(staff.permissions, basePath, staff.is_super_admin);
  }, [staff, basePath]);

  function signOut() {
    clearStaffSession();
    router.replace("/admin/login");
    window.setTimeout(() => {
      if (
        window.location.pathname.startsWith("/staff-dashboard") ||
        window.location.pathname.startsWith("/portal")
      ) {
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
  const title = pageTitle(pathname, navItems);
  const profileActive = pathname.startsWith(`${basePath}/profile`);
  const notificationsHref = `${basePath}/notifications`;

  if (!ready || !staff) {
    return (
      <div className="admin-shell min-h-screen flex items-center justify-center">
        <LuxuryLoader variant="minimal" label="Opening staff portal" />
      </div>
    );
  }

  return (
    <div
      className={`admin-shell h-dvh overflow-hidden flex ${theme === "dark" ? "admin-shell--dark" : "admin-shell--light"}`}
      style={{ ["--admin-sidebar-w" as string]: `${desktopWidth}px` }}
    >
      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 h-dvh flex flex-col transition-[width,transform] duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${rail ? "admin-sidebar--rail" : ""}`}
        style={{ width: desktopWidth }}
      >
        <div
          className={`admin-sidebar__brand shrink-0 flex flex-col items-center ${
            rail ? "px-2 pt-4 pb-3" : "px-5 pt-5 pb-3"
          }`}
        >
          <Link
            href={basePath}
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
          data-lenis-prevent
          className={`admin-sidebar__nav flex-1 py-2 ${
            rail ? "px-2" : "pl-3 pr-0"
          }`}
        >
          {navItems.map((item) => {
            const isActive = navIsActive(
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
            href={`${basePath}/profile`}
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

      <div className="admin-main flex-1 flex flex-col min-w-0 h-dvh overflow-hidden md:ml-[var(--admin-sidebar-w)]">
        <header className="admin-header shrink-0 z-30">
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
                href={notificationsHref}
                aria-label="Notifications"
                className="admin-icon-btn relative"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifications.some(
                  (item) => item.severity === "action" || item.severity === "warning"
                ) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c45c3a]" />
                )}
              </Link>
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[var(--admin-border)]">
                <div className="leading-tight text-right">
                  <p className="font-label-caps text-[10px] tracking-[0.16em] uppercase">
                    {staff.name}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">{staffDisplayRole(staff)}</p>
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

        <main
          data-lenis-prevent
          className="admin-main__content flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 md:px-8 py-6 md:py-8"
        >
          {children}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[80] w-full max-w-sm">
          <button
            type="button"
            onClick={() => {
              setToast(null);
              router.push(notificationsHref);
            }}
            style={{ borderLeft: `4px solid ${TOAST_ACCENT[toast.severity]}` }}
            className="admin-panel w-full text-left p-4 flex items-start gap-3 shadow-xl hover:border-[var(--admin-gold)] transition-colors"
          >
            <span
              className="material-symbols-outlined text-[20px] shrink-0"
              style={{ color: TOAST_ACCENT[toast.severity] }}
            >
              {TOAST_ICON[toast.severity]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-headline-md text-[15px] truncate">{toast.title}</span>
              <span className="block text-sm text-[var(--admin-muted)] mt-0.5 line-clamp-2">
                {toast.detail}
              </span>
            </span>
            <span
              role="button"
              tabIndex={0}
              aria-label="Dismiss notification"
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  setToast(null);
                }
              }}
              className="text-[var(--admin-muted)] hover:text-[var(--admin-ink)] shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </span>
          </button>
        </div>
      )}

      <AdminConfirmHost />
    </div>
  );
}
