/**
 * Local calendar keys for Board and ATC Day Map.
 * scheduledStart is grouped by the operator's local date, not UTC.
 */

export function localDateKey(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

export function monthKey(date) {
  return String(date || "").slice(0, 7);
}

const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

export function monthName(yyyyMm) {
  const m = Number(String(yyyyMm || "").split("-")[1]);
  return MONTHS[m - 1] || "";
}

/** Northern-hemisphere meteorological season for a YYYY-MM key. */
export function seasonOfMonth(yyyyMm) {
  const m = Number(String(yyyyMm || "").split("-")[1]);
  if (m === 12 || m === 1 || m === 2) return "winter";
  if (m >= 3 && m <= 5) return "spring";
  if (m >= 6 && m <= 8) return "summer";
  if (m >= 9 && m <= 11) return "autumn";
  return "summer";
}

export function headerWeatherRoute(city = "Lexington") {
  return "/atc/day?city=" + encodeURIComponent(city);
}

export function daysInMonth(yyyyMm) {
  const [y, m] = String(yyyyMm).split("-").map(Number);
  if (!y || !m) return 0;
  return new Date(y, m, 0).getDate();
}

export function monthGrid(yyyyMm) {
  const [y, m] = String(yyyyMm).split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const pad = first.getDay();
  const count = daysInMonth(yyyyMm);
  const cells = [];
  for (let i = 0; i < pad; i += 1) cells.push(null);
  for (let d = 1; d <= count; d += 1) {
    cells.push(yyyyMm + "-" + String(d).padStart(2, "0"));
  }
  return cells;
}

export function parseOpsQuery(route) {
  const [path, query = ""] = String(route || "").split("?");
  const parts = path.split("/").filter(Boolean);
  const params = new URLSearchParams(query);
  const city = params.get("city") || "";
  let date = null;
  if (parts[0] === "board") date = parts[1] || null;
  if (parts[0] === "atc" && parts[1] === "day") date = parts[2] || null;
  return { path, date, city };
}
