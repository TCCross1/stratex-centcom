/**
 * Mission Board — read-only calendar. Never creates missions.
 * Weather is the ATC city snapshot. Board does not call NWS, radar, or fleet.
 */
import MissionService from "../mission/service.js";
import PropertyService from "../property/service.js";
import { getCityWeatherSnapshot, LEXINGTON_KY } from "../atc/weather.js";
import { localDateKey, monthKey, monthName, monthGrid } from "./calendar.js";

function dayForecast(snapshot, date) {
  const row = snapshot?.daily?.[date];
  if (snapshot?.unavailable || !row) {
    return {
      date,
      unavailable: true,
      label: "FORECAST UNAVAILABLE",
      rainChancePct: null,
      tempHi: null,
      tempLo: null,
      storms: null,
      icon: null,
      shortForecast: null,
    };
  }
  return { date, unavailable: false, label: null, ...row };
}

function toRow(mission, property) {
  const identity = property?.identity || {};
  const circumstance = Array.isArray(mission.knownIssues) && mission.knownIssues[0]
    ? mission.knownIssues[0].issue
    : (mission.specialInstructions || null);
  return {
    missionId: mission.id,
    propertyId: mission.propertyId,
    jobNumber: mission.jobNumber || mission.id,
    scheduledStart: mission.scheduledStart,
    localDate: localDateKey(mission.scheduledStart),
    city: identity.city || null,
    address: identity.addressLine1 || null,
    circumstance,
    missionType: mission.missionType,
    missionState: mission.missionState,
    assessmentObjective: mission.assessmentObjective,
  };
}

export const BoardService = {
  getMonth: async ({ date, city } = {}) => {
    const focus = date || "2026-08-30";
    const cityName = city || LEXINGTON_KY.city;
    const month = monthKey(focus);
    const [missions, properties, weatherSnapshot] = await Promise.all([
      MissionService.listAll(),
      PropertyService.listSummaries(),
      getCityWeatherSnapshot(cityName),
    ]);
    const byId = Object.fromEntries(properties.map((p) => [p.stratexPropertyId, p]));
    const rows = missions
      .filter((m) => m.scheduledStart)
      .map((m) => toRow(m, byId[m.propertyId]))
      .filter((row) => row.localDate && row.localDate.startsWith(month))
      .filter((row) => !city || row.city === cityName)
      .sort((a, b) => String(a.scheduledStart).localeCompare(String(b.scheduledStart)));

    const days = {};
    for (const row of rows) {
      (days[row.localDate] ||= []).push(row);
    }

    const forecasts = {};
    monthGrid(month).forEach((key) => {
      if (key) forecasts[key] = dayForecast(weatherSnapshot, key);
    });

    return {
      month,
      monthName: monthName(month),
      date: focus,
      city: cityName,
      providerMode: weatherSnapshot.mode,
      weatherSnapshot,
      days,
      forecasts,
      createsMissions: false,
    };
  },

  getDay: async ({ date, city } = {}) => {
    const pack = await BoardService.getMonth({ date, city });
    const key = date || pack.date;
    return {
      date: key,
      city: pack.city,
      missions: pack.days[key] || [],
      forecast: pack.forecasts[key] || dayForecast(pack.weatherSnapshot, key),
      providerMode: pack.providerMode,
      weatherSnapshot: pack.weatherSnapshot,
      createsMissions: false,
    };
  },
};

export default BoardService;
