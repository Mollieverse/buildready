// Anonymous per-device identity, stored in a cookie. No login required.
// Each browser/device gets a private History. When real auth (Clerk) is
// added later, swap this for the authenticated user's ID.

const COOKIE_NAME = "buildready_device_id";
const COOKIE_MAX_AGE_DAYS = 365;

function generateId(): string {
  // Simple random ID, sufficient for anonymous scoping (not a security token)
  return (
    Math.random().toString(36).slice(2) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2)
  );
}

export function getDeviceId(): string {
  if (typeof document === "undefined") return ""; // SSR guard

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`)
  );
  if (match) return decodeURIComponent(match[1]);

  const id = generateId();
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  return id;
}
