export const ADMIN_NAV = [
  { href: "/staff-dashboard", label: "Dashboard", icon: "space_dashboard", exact: true },
  { href: "/staff-dashboard/reservations", label: "Reservations", icon: "event_seat" },
  { href: "/staff-dashboard/events", label: "Events", icon: "mic" },
  { href: "/staff-dashboard/menus", label: "Menus", icon: "restaurant_menu" },
  { href: "/staff-dashboard/venue-hire", label: "Venue Hire", icon: "apartment" },
  { href: "/staff-dashboard/enquiries", label: "Enquiries", icon: "mail" },
  { href: "/staff-dashboard/guests", label: "Guests", icon: "group" },
  { href: "/staff-dashboard/finance", label: "Finance", icon: "payments" },
  { href: "/staff-dashboard/settings", label: "Settings", icon: "settings" },
  { href: "/staff-dashboard/notifications", label: "Notifications", icon: "notifications" },
] as const;

export function adminPageTitle(pathname: string): string {
  const hit = ADMIN_NAV.find((item) =>
    "exact" in item && item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  if (pathname.startsWith("/staff-dashboard/profile")) return "My Profile";
  return hit?.label ?? "Dashboard";
}

export function isAdminNavActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact || href === "/staff-dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
