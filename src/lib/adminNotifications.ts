const SEEN_NOTIFICATIONS_KEY = "sweet1ne-admin-seen-notifications";

export function loadSeenNotificationIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_NOTIFICATIONS_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

export function saveSeenNotificationIds(ids: Set<string>) {
  try {
    window.localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
  } catch {
    // Storage can be unavailable — badge/toast dedupe may not persist.
  }
}

export function markNotificationsSeen(ids: string[]) {
  const seen = loadSeenNotificationIds();
  ids.forEach((id) => seen.add(id));
  saveSeenNotificationIds(seen);
  return seen;
}
