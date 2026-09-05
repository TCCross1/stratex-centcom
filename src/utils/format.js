/**
 * Formatting helpers. Pure functions only — no domain knowledge, no fixtures.
 */

/** Fixture clock. Real deployments pass a real Date; this keeps demos stable. */
export const NOW = new Date("2026-08-29T14:27:18");

export const iso = (d) => new Date(d).toISOString();
export const ago = (minutes) => iso(NOW.getTime() - minutes * 60000);
export const clock = (minutes) =>
  new Date(NOW.getTime() - minutes * 60000).toTimeString().slice(0, 5);

export function relTime(isoStr) {
  if (!isoStr) return "—";
  const minutes = Math.round((NOW.getTime() - new Date(isoStr).getTime()) / 60000);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.round(minutes / 60);
  if (hours < 48) return hours + "h ago";
  return Math.round(hours / 24) + "d ago";
}

export function shortDate(isoStr) {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

/** Operator-local clock for a stored window. Never slice UTC out of the ISO string. */
export function localClock(isoStr) {
  if (!isoStr) return "—";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Value for <input type="datetime-local"> from a stored ISO timestamp. */
export function localDateTimeValue(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr).slice(0, 16);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
    "T" + pad(d.getHours()) + ":" + pad(d.getMinutes())
  );
}

export const bytesToMb = (bytes) => (bytes / 1048576).toFixed(1) + " MB";

/** Truncate a hash for display. Full hashes are only shown on request. */
export const shortHash = (hash) =>
  !hash ? "—" : hash.length <= 12 ? hash : hash.slice(0, 6) + "…" + hash.slice(-4);
