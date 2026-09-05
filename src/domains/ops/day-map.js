/**
 * ATC Day Map — house pins, fleet fixes, hourly strip, radar overlay.
 * No invented GPS, no fake Doppler, no static placeholder map.
 */
import MissionService from "../mission/service.js";
import PropertyService from "../property/service.js";
import { FleetProvider } from "../atc/fleet.js";
import { WeatherProvider, LEXINGTON_KY, isLive } from "../atc/providers.js";
import { getCityWeatherSnapshot } from "../atc/weather.js";
import { localDateKey } from "./calendar.js";

export const AtcDayMapService = {
  getDay: async ({ date, city } = {}) => {
    const focus = date || "2026-08-30";
    const cityName = city || LEXINGTON_KY.city;
    const [missions, properties, weatherSnapshot, radar, fleet] = await Promise.all([
      MissionService.listAll(),
      PropertyService.listSummaries(),
      getCityWeatherSnapshot(cityName),
      WeatherProvider.getRadar(),
      FleetProvider.getLatestFixes(),
    ]);
    const byId = Object.fromEntries(properties.map((p) => [p.stratexPropertyId, p]));
    const ofDay = missions
      .filter((m) => m.scheduledStart && localDateKey(m.scheduledStart) === focus)
      .filter((m) => m.missionState !== "CANCELLED" && m.missionState !== "ABORTED")
      .filter((m) => !city || byId[m.propertyId]?.identity?.city === cityName)
      .sort((a, b) => String(a.scheduledStart).localeCompare(String(b.scheduledStart)));

    const pins = [];
    const unplaced = [];
    for (const mission of ofDay) {
      const identity = byId[mission.propertyId]?.identity || {};
      const lat = identity.lat;
      const lng = identity.lng;
      const circumstance = Array.isArray(mission.knownIssues) && mission.knownIssues[0]
        ? mission.knownIssues[0].issue
        : (mission.specialInstructions || null);
      const row = {
        missionId: mission.id,
        propertyId: mission.propertyId,
        jobNumber: mission.jobNumber || mission.id,
        missionType: mission.missionType || null,
        missionState: mission.missionState,
        address: identity.addressLine1 || null,
        city: identity.city || null,
        region: identity.region || null,
        postalCode: identity.postalCode || null,
        circumstance,
        specialInstructions: mission.specialInstructions || null,
        scheduledStart: mission.scheduledStart,
        scheduledEnd: mission.scheduledEnd || null,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      };
      if (row.lat != null && row.lng != null) pins.push(row);
      else unplaced.push({ ...row, reason: "NO_COORDINATES" });
    }

    const trucks = isLive(FleetProvider.mode) ? (fleet.vehicles || []) : [];

    return {
      date: focus,
      city: cityName,
      cityLabel: weatherSnapshot.cityLabel,
      center: { lat: LEXINGTON_KY.lat, lng: LEXINGTON_KY.lng },
      pins,
      unplaced,
      trucks,
      weatherSnapshot,
      hourly: weatherSnapshot.unavailable
        ? { unavailable: true, label: "FORECAST UNAVAILABLE", hours: [] }
        : { unavailable: false, hours: weatherSnapshot.hourly || [] },
      radar,
      radarOverlay: radar.overlay || null,
      radarClouds: radar.clouds || null,
      basemap: "maplibre-vector",
      staticImage: false,
      providerMode: weatherSnapshot.mode,
    };
  },
};

export default AtcDayMapService;
