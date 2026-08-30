/** Map dashboard routes to required view permissions. */

import { ADMIN_NAV } from "./adminNav";

export const NAV_PERMISSION: Record<string, string> = {
  "/staff-dashboard": "dashboard.view",
  "/staff-dashboard/reservations": "reservations.view",
  "/staff-dashboard/events": "events.view",
  "/staff-dashboard/menus": "menus.view",
  "/staff-dashboard/collection": "collection.view",
  "/staff-dashboard/venue-hire": "venue_hire.view",
  "/staff-dashboard/enquiries": "enquiries.view",
  "/staff-dashboard/guests": "guests.view",
  "/staff-dashboard/finance": "finance.view",
  "/staff-dashboard/notifications": "notifications.view",
};

export type NavItem = (typeof ADMIN_NAV)[number] & { href: string };

export function navForStaff(
  permissions: string[],
  basePath: "/staff-dashboard" | "/portal",
  isSuperAdmin: boolean
): NavItem[] {
  const allowed = new Set(permissions);
  const items = ADMIN_NAV.filter((item) => {
    const perm = NAV_PERMISSION[item.href];
    if (!perm) return true;
    return isSuperAdmin || allowed.has(perm);
  }).map((item) => ({
    ...item,
    href: item.href.replace("/staff-dashboard", basePath),
  }));

  if (isSuperAdmin && basePath === "/staff-dashboard") {
    items.push({
      href: "/staff-dashboard/settings",
      label: "Settings",
      icon: "settings",
    } as NavItem);
  }

  return items;
}

export function pageTitle(pathname: string, nav: NavItem[]): string {
  const hit = nav.find((item) =>
    "exact" in item && item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  if (pathname.includes("/profile")) return "My Profile";
  if (pathname.includes("/settings")) return "Settings";
  return hit?.label ?? "Dashboard";
}

export function navIsActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href.endsWith("/staff-dashboard") || href.endsWith("/portal")) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function firstAllowedPath(
  permissions: string[],
  basePath: "/staff-dashboard" | "/portal",
  isSuperAdmin: boolean
): string {
  const nav = navForStaff(permissions, basePath, isSuperAdmin);
  return nav[0]?.href ?? basePath;
}

export function canAccessPath(
  pathname: string,
  permissions: string[],
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin) return true;
  if (pathname.includes("/profile")) return true;
  const match = Object.entries(NAV_PERMISSION).find(([href]) =>
    pathname === href.replace("/staff-dashboard", "/portal") ||
    pathname.startsWith(href.replace("/staff-dashboard", "/portal") + "/")
  );
  if (!match) return pathname.startsWith("/portal") || pathname.startsWith("/staff-dashboard");
  return permissions.includes(match[1]);
}
