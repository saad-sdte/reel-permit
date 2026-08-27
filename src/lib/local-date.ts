/** Calendar date in the user's local timezone as YYYY-MM-DD (for <input type="date">). */
export function localIsoDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Convert YYYY-MM-DD → MM/DD/YYYY for portal / ops payloads. */
export function isoToMmDdYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${m[2]}/${m[3]}/${m[1]}`;
}
