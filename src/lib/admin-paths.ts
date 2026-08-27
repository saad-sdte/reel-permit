/** Public URL for the ops console (not the /api/admin JSON routes). */
export const ADMIN_BASE = "/cpanel/admin";

export function adminPath(suffix = ""): string {
  if (!suffix) return ADMIN_BASE;
  return `${ADMIN_BASE}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}
