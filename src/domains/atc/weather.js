/**
 * ATC city weather snapshot. Board and the hero header only READ this object.
 * They never call NWS, radar, or fleet themselves.
 */
import { serve } from "../shared/transport.js";
import { PROVIDER_MODE, isLive, stamp } from "./providers-core.js";

export const FORECAST_UNAVAILABLE = "FORECAST UNAVAILABLE";
export const DEFAULT_CITY_ID = "lexington";

export const CITIES = {
  lexington: {
    cityId: "lexington",
    city: "Lexington",
    cityLabel: "LEX, KY",
    region: "KY",
    lat: 38.0406,
    lng: -84.5037,
  },
};

export const LEXINGTON_KY = CITIES.lexington;

const NWS_UA = {
  "User-Agent": "STRATEX CENTCOM (stratex-centcom; ops@stratex.local)",
  Accept: "application/geo+json",
};

const WEEK_PATTERN = [
  { rainChancePct: 8, tempHi: 88, tempLo: 66, storms: false, icon: "sun", shortForecast: "Mostly sunny" },
  { rainChancePct: 18, tempHi: 86, tempLo: 65, storms: false, icon: "cloud", shortForecast: "Partly cloudy" },
  { rainChancePct: 35, tempHi: 84, tempLo: 64, storms: false, icon: "rain", shortForecast: "Scattered showers" },
  { rainChancePct: 12, tempHi: 87, tempLo: 65, storms: false, icon: "sun", shortForecast: "Mostly sunny" },
  { rainChancePct: 22, tempHi: 85, tempLo: 63, storms: false, icon: "cloud", shortForecast: "Partly cloudy" },
  { rainChancePct: 48, tempHi: 83, tempLo: 64, storms: true, icon: "storm", shortForecast: "Afternoon storms" },
  { rainChancePct: 15, tempHi: 84, tempLo: 62, storms: false, icon: "cloud", shortForecast: "Mostly cloudy" },
];

function monthDaily(year, month, days, tweak) {
  const out = {};
  for (let d = 1; d <= days; d += 1) {
    const key = year + "-" + String(month).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const row = { ...WEEK_PATTERN[(d - 1) % 7] };
    if (tweak) tweak(key, row, d);
    out[key] = row;
  }
  return out;
}

const DAILY_FORECAST = {
  Lexington: {
    ...monthDaily(2026, 8, 31, (key, row) => {
      if (key === "2026-08-27") Object.assign(row, { rainChancePct: 20, tempHi: 86, tempLo: 64, storms: false, icon: "cloud", shortForecast: "Partly cloudy" });
      if (key === "2026-08-30") Object.assign(row, { rainChancePct: 55, tempHi: 82, tempLo: 63, storms: true, icon: "storm", shortForecast: "Showers and storms" });
      if (key === "2026-08-31") Object.assign(row, { rainChancePct: 15, tempHi: 84, tempLo: 61, storms: false, icon: "cloud", shortForecast: "Mostly cloudy" });
    }),
    ...monthDaily(2026, 9, 7, (key, row) => {
      if (key === "2026-09-04") Object.assign(row, { rainChancePct: 30, tempHi: 81, tempLo: 60, storms: false, icon: "cloud", shortForecast: "Partly cloudy" });
    }),
  },
  Versailles: {
    "2026-08-30": { rainChancePct: 60, tempHi: 81, tempLo: 62, storms: true, icon: "storm", shortForecast: "Showers and storms" },
  },
  Nicholasville: {
    "2026-08-31": { rainChancePct: 10, tempHi: 85, tempLo: 62, storms: false, icon: "cloud", shortForecast: "Mostly cloudy" },
  },
};

const HOURLY_FORECAST = {
  Lexington: {
    "2026-08-30": [
      { hour: "09:00", rainChancePct: 40, tempF: 72, storms: false, icon: "cloud", shortForecast: "Cloudy" },
      { hour: "12:00", rainChancePct: 55, tempF: 79, storms: true, icon: "storm", shortForecast: "Storms" },
      { hour: "15:00", rainChancePct: 50, tempF: 82, storms: true, icon: "storm", shortForecast: "Storms" },
      { hour: "18:00", rainChancePct: 35, tempF: 76, storms: false, icon: "rain", shortForecast: "Showers" },
    ],
  },
  Versailles: {
    "2026-08-30": [
      { hour: "09:00", rainChancePct: 58, tempF: 70, storms: true, icon: "storm", shortForecast: "Storms" },
      { hour: "12:00", rainChancePct: 62, tempF: 78, storms: true, icon: "storm", shortForecast: "Storms" },
    ],
  },
};

export const weatherNet = {
  fetch: typeof fetch === "function" ? fetch.bind(globalThis) : null,
};

let weatherMode = PROVIDER_MODE.FIXTURE;
const cache = new Map();
const inflight = new Map();

export function getWeatherMode() {
  return weatherMode;
}

export function setWeatherMode(mode) {
  weatherMode = mode;
  clearWeatherCache();
}

export function clearWeatherCache() {
  cache.clear();
  inflight.clear();
}

export function resolveCity(cityId) {
  const raw = String(cityId || DEFAULT_CITY_ID).trim();
  const key = raw.toLowerCase();
  if (CITIES[key]) return CITIES[key];
  const byName = Object.values(CITIES).find((c) => c.city.toLowerCase() === key);
  return byName || CITIES.lexington;
}

export function headerWeatherRoute(city = "Lexington") {
  return "/atc/day?city=" + encodeURIComponent(city);
}

function dailyComplete(row) {
  return row
    && Number.isFinite(row.rainChancePct)
    && Number.isFinite(row.tempHi)
    && Number.isFinite(row.tempLo)
    && typeof row.storms === "boolean";
}

function displayMode(mode) {
  if (mode === PROVIDER_MODE.CONNECTED || mode === "LIVE") return "LIVE";
  if (mode === PROVIDER_MODE.DISCONNECTED) return "DISCONNECTED";
  return "FIXTURE";
}

function unavailableSnapshot(city, mode = "DISCONNECTED") {
  return stamp(mode === "LIVE" ? PROVIDER_MODE.DISCONNECTED : mode, {
    cityId: city.cityId,
    city: city.city,
    cityLabel: city.cityLabel,
    asOf: null,
    tempF: null,
    icon: null,
    shortForecast: null,
    rainChancePct: null,
    tempHi: null,
    tempLo: null,
    storms: null,
    hourly: [],
    daily: {},
    unavailable: true,
    label: FORECAST_UNAVAILABLE,
    mode: "DISCONNECTED",
  });
}

function fixtureSnapshot(city) {
  const name = city.city;
  const hours = HOURLY_FORECAST[name]?.["2026-08-30"] || [];
  const today = DAILY_FORECAST[name]?.["2026-08-30"] || null;
  const nowHour = hours[0] || null;
  const daily = {};
  Object.entries(DAILY_FORECAST[name] || {}).forEach(([date, row]) => {
    if (dailyComplete(row)) daily[date] = { ...row };
  });
  if (!nowHour && !today) return unavailableSnapshot(city, PROVIDER_MODE.FIXTURE);
  return stamp(PROVIDER_MODE.FIXTURE, {
    cityId: city.cityId,
    city: city.city,
    cityLabel: city.cityLabel,
    asOf: "2026-08-29T14:27:18.000Z",
    tempF: nowHour?.tempF ?? today?.tempHi ?? null,
    icon: nowHour?.icon || today?.icon || null,
    shortForecast: nowHour?.shortForecast || today?.shortForecast || null,
    rainChancePct: today?.rainChancePct ?? nowHour?.rainChancePct ?? null,
    tempHi: today?.tempHi ?? null,
    tempLo: today?.tempLo ?? null,
    storms: today?.storms ?? false,
    hourly: hours,
    daily,
    unavailable: false,
    label: null,
    mode: "FIXTURE",
  });
}

function stormsFrom(text) {
  return /thunder|t-storm|storm/i.test(String(text || ""));
}

function iconFrom(text) {
  const s = String(text || "").toLowerCase();
  if (/thunder|storm/.test(s)) return "storm";
  if (/rain|shower/.test(s)) return "rain";
  if (/snow/.test(s)) return "snow";
  if (/cloud/.test(s)) return "cloud";
  if (/sun|clear|fair/.test(s)) return "sun";
  return "cloud";
}

function localKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function hourLabel(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || "");
  return String(d.getHours()).padStart(2, "0") + ":00";
}

async function fetchJson(url, signal) {
  const fn = weatherNet.fetch;
  if (!fn) throw new Error("NO_FETCH");
  const res = await fn(url, { headers: NWS_UA, signal });
  if (!res || !res.ok) throw new Error("NWS_HTTP");
  return res.json();
}

async function fetchNwsSnapshot(city) {
  const ctrl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = setTimeout(() => ctrl?.abort(), 8000);
  try {
    const signal = ctrl?.signal;
    const points = await fetchJson("https://api.weather.gov/points/" + city.lat + "," + city.lng, signal);
    const fUrl = points?.properties?.forecast;
    const hUrl = points?.properties?.forecastHourly;
    if (!fUrl || !hUrl) throw new Error("NWS_LINKS");
    const [forecast, hourlyDoc] = await Promise.all([
      fetchJson(fUrl, signal),
      fetchJson(hUrl, signal),
    ]);
    const periods = forecast?.properties?.periods || [];
    const hoursIn = hourlyDoc?.properties?.periods || [];
    if (!periods.length && !hoursIn.length) throw new Error("NWS_EMPTY");

    const daily = {};
    for (const p of periods) {
      const key = localKey(p.startTime);
      if (!key) continue;
      const row = daily[key] || {
        rainChancePct: null, tempHi: null, tempLo: null, storms: false, icon: null, shortForecast: null,
      };
      const pop = p.probabilityOfPrecipitation?.value;
      if (Number.isFinite(pop)) row.rainChancePct = pop;
      if (p.isDaytime) row.tempHi = p.temperature;
      else row.tempLo = p.temperature;
      row.storms = row.storms || stormsFrom(p.shortForecast);
      row.shortForecast = p.shortForecast || row.shortForecast;
      row.icon = iconFrom(p.shortForecast);
      daily[key] = row;
    }
    Object.keys(daily).forEach((key) => {
      if (!dailyComplete(daily[key])) delete daily[key];
    });

    const hourly = hoursIn.slice(0, 24).map((p) => ({
      hour: hourLabel(p.startTime),
      rainChancePct: Number.isFinite(p.probabilityOfPrecipitation?.value) ? p.probabilityOfPrecipitation.value : null,
      tempF: Number.isFinite(p.temperature) ? p.temperature : null,
      storms: stormsFrom(p.shortForecast),
      icon: iconFrom(p.shortForecast),
      shortForecast: p.shortForecast || null,
    }));
    const now = hourly[0] || null;
    const firstDay = daily[Object.keys(daily)[0]] || null;
    return stamp(PROVIDER_MODE.CONNECTED, {
      cityId: city.cityId,
      city: city.city,
      cityLabel: city.cityLabel,
      asOf: new Date().toISOString(),
      tempF: now?.tempF ?? firstDay?.tempHi ?? null,
      icon: now?.icon || firstDay?.icon || null,
      shortForecast: now?.shortForecast || firstDay?.shortForecast || null,
      rainChancePct: firstDay?.rainChancePct ?? now?.rainChancePct ?? null,
      tempHi: firstDay?.tempHi ?? null,
      tempLo: firstDay?.tempLo ?? null,
      storms: firstDay?.storms ?? false,
      hourly,
      daily,
      unavailable: false,
      label: null,
      mode: "LIVE",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function buildSnapshot(cityId) {
  const city = resolveCity(cityId);
  const mode = weatherMode;
  if (mode === PROVIDER_MODE.DISCONNECTED) return unavailableSnapshot(city, PROVIDER_MODE.DISCONNECTED);
  if (mode === PROVIDER_MODE.CONNECTED || mode === "LIVE") {
    try {
      return await fetchNwsSnapshot(city);
    } catch {
      return unavailableSnapshot(city, PROVIDER_MODE.DISCONNECTED);
    }
  }
  return fixtureSnapshot(city);
}

export function getCityWeatherSnapshot(cityId = DEFAULT_CITY_ID) {
  const city = resolveCity(cityId);
  const key = city.cityId;
  if (cache.has(key)) return Promise.resolve(cache.get(key));
  if (inflight.has(key)) return inflight.get(key);
  const pending = serve(() => buildSnapshot(key)).then((snap) => {
    cache.set(key, snap);
    inflight.delete(key);
    return snap;
  }, (err) => {
    inflight.delete(key);
    throw err;
  });
  inflight.set(key, pending);
  return pending;
}

export function getDailyForecast(date, city = LEXINGTON_KY.city) {
  return getCityWeatherSnapshot(city).then((snap) => {
    const row = snap.daily?.[date];
    const mode = snap.mode === "LIVE" ? PROVIDER_MODE.CONNECTED : (snap.mode === "DISCONNECTED" ? PROVIDER_MODE.DISCONNECTED : PROVIDER_MODE.FIXTURE);
    if (snap.unavailable || !dailyComplete(row)) {
      return stamp(snap.unavailable ? PROVIDER_MODE.DISCONNECTED : mode, {
        date, city: snap.city, unavailable: true, label: FORECAST_UNAVAILABLE,
        rainChancePct: null, tempHi: null, tempLo: null, storms: null,
      });
    }
    return stamp(mode, { date, city: snap.city, unavailable: false, label: null, ...row });
  });
}

export function getHourlyForecast(date, city = LEXINGTON_KY.city) {
  return getCityWeatherSnapshot(city).then((snap) => {
    const mode = snap.mode === "LIVE" ? PROVIDER_MODE.CONNECTED : (snap.mode === "DISCONNECTED" ? PROVIDER_MODE.DISCONNECTED : PROVIDER_MODE.FIXTURE);
    if (snap.unavailable || !snap.hourly?.length) {
      return stamp(snap.unavailable ? PROVIDER_MODE.DISCONNECTED : mode, {
        date, city: snap.city, unavailable: true, label: FORECAST_UNAVAILABLE, hours: [],
      });
    }
    return stamp(mode, { date, city: snap.city, unavailable: false, label: null, hours: snap.hourly });
  });
}

function rainviewerUrl(path, color) {
  return "https://tilecache.rainviewer.com" + path + "/256/{z}/{x}/{y}/" + color + "/1_1.png";
}

export async function getRadar() {
  if (weatherMode === PROVIDER_MODE.DISCONNECTED) {
    return stamp(weatherMode, {
      overlay: null, clouds: null, status: "RADAR DISCONNECTED", sweep: false, tilesLoaded: false,
    });
  }
  try {
    const fn = weatherNet.fetch;
    if (!fn) throw new Error("NO_FETCH");
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const timer = setTimeout(() => ctrl?.abort(), 8000);
    try {
      const res = await fn("https://api.rainviewer.com/public/weather-maps.json", { signal: ctrl?.signal });
      if (!res?.ok) throw new Error("RADAR_HTTP");
      const json = await res.json();
      const radarPath = json?.radar?.past?.length ? json.radar.past[json.radar.past.length - 1]?.path : null;
      const cloudPath = json?.satellite?.infrared?.length
        ? json.satellite.infrared[json.satellite.infrared.length - 1]?.path
        : null;
      if (!radarPath && !cloudPath) throw new Error("RADAR_PATH");
      const live = isLive(weatherMode) || weatherMode === "LIVE";
      return stamp(live ? PROVIDER_MODE.CONNECTED : weatherMode, {
        overlay: radarPath ? rainviewerUrl(radarPath, 2) : null,
        clouds: cloudPath ? rainviewerUrl(cloudPath, 0) : null,
        status: live ? "RADAR LIVE" : "RADAR TILES",
        sweep: false,
        tilesLoaded: false,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return stamp(PROVIDER_MODE.DISCONNECTED, {
      overlay: null, clouds: null, status: "RADAR DISCONNECTED", sweep: false, tilesLoaded: false,
    });
  }
}

export { displayMode, dailyComplete };
