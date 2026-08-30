/**
 * ATC FIXTURES — development data only.
 *
 * Weather here is DEVELOPMENT WEATHER, not a forecast. Airspace here is
 * DEVELOPMENT STATUS, not a clearance. No fixture in this file asserts that a
 * real property is legally clear to fly.
 */
import { iso, ago } from "../../utils/format.js";

const dev = { dataSource: "FIXTURE", isLive: false, providerMode: "FIXTURE" };

/** Keyed by mission. Every snapshot is explicitly development weather. */
export const weatherByMission = {
  "M-2026-0830-019": { ...dev, snapshotId: "WX-019", observationTime: ago(30), temperatureF: 72, humidityPercent: 58,
    windSpeedMph: 24, windGustMph: 31, windDirection: "SW", precipitationProbability: 0.1,
    recentPrecipitationHours: null, visibilityMiles: 9, cloudCoverPercent: 55, weatherCondition: "Windy",
    sunrise: iso("2026-08-30T07:07:00"), sunset: iso("2026-08-30T20:19:00"), minutesAfterSunset: -660 },

  "M-2026-0831-021": { ...dev, snapshotId: "WX-021", observationTime: ago(10), temperatureF: 76, humidityPercent: 44,
    windSpeedMph: 7, windGustMph: 11, windDirection: "N", precipitationProbability: 0.05,
    recentPrecipitationHours: null, visibilityMiles: 10, cloudCoverPercent: 15, weatherCondition: "Clear",
    sunrise: iso("2026-08-31T07:08:00"), sunset: iso("2026-08-31T20:17:00"), minutesAfterSunset: -600 },

  "M-2026-0830-020": { ...dev, snapshotId: "WX-020", observationTime: ago(20), temperatureF: 81, humidityPercent: 61,
    windSpeedMph: 16, windGustMph: 22, windDirection: "S", precipitationProbability: 0.22,
    recentPrecipitationHours: 20, visibilityMiles: 7, cloudCoverPercent: 60, weatherCondition: "Partly cloudy",
    sunrise: iso("2026-08-30T07:07:00"), sunset: iso("2026-08-30T20:19:00"), minutesAfterSunset: -400 },

  // Thermal mission with a good predicted window
  "M-2026-0902-031": { ...dev, snapshotId: "WX-031", observationTime: ago(5), temperatureF: 58, humidityPercent: 52,
    windSpeedMph: 4, windGustMph: 7, windDirection: "NE", precipitationProbability: 0.05,
    recentPrecipitationHours: null, visibilityMiles: 10, cloudCoverPercent: 10, weatherCondition: "Clear",
    sunrise: iso("2026-09-02T07:10:00"), sunset: iso("2026-09-02T20:12:00"), minutesAfterSunset: 138,
    recommendedThermalStart: iso("2026-09-02T21:15:00"), recommendedThermalEnd: iso("2026-09-02T22:40:00") },

  // Thermal mission with a marginal window
  "M-2026-0903-032": { ...dev, snapshotId: "WX-032", observationTime: ago(5), temperatureF: 63, humidityPercent: 78,
    windSpeedMph: 11, windGustMph: 16, windDirection: "W", precipitationProbability: 0.15,
    recentPrecipitationHours: 8, visibilityMiles: 6, cloudCoverPercent: 75, weatherCondition: "Overcast",
    sunrise: iso("2026-12-01T07:45:00"), sunset: iso("2026-12-01T17:22:00"), minutesAfterSunset: 45 },
};

/**
 * DEVELOPMENT AIRSPACE STATUS. Not a clearance and not FAA data.
 * The live AirspaceProvider is DISCONNECTED, so these are only reachable when
 * a fixture provider mode is explicitly enabled in a test.
 */
export const airspaceByMission = {
  "M-2026-0831-021": { assessmentId: "AS-021", state: "CLEAR", airspaceClass: "G (development value)",
    controlledAirspace: false, authorizationRequired: false, authorizationState: "NOT_REQUIRED",
    geofenceState: "CLEAR", temporaryRestrictionState: "NOT_CHECKED",
    notes: "DEVELOPMENT FIXTURE — not an airspace clearance.", ...dev },

  "M-2026-0830-019": { assessmentId: "AS-019", state: "REVIEW_REQUIRED", airspaceClass: "E (development value)",
    controlledAirspace: true, authorizationRequired: true, authorizationState: "NOT_REQUESTED",
    geofenceState: "WARNING", temporaryRestrictionState: "NOT_CHECKED",
    notes: "DEVELOPMENT FIXTURE — controlled airspace would require authorization.", ...dev },

  "M-2026-0902-031": { assessmentId: "AS-031", state: "AUTHORIZATION_REQUIRED", airspaceClass: "D (development value)",
    controlledAirspace: true, authorizationRequired: true, authorizationState: "PENDING",
    geofenceState: "CLEAR", temporaryRestrictionState: "NOT_CHECKED",
    notes: "DEVELOPMENT FIXTURE — authorization would be required before flight.", ...dev },
};

export const aircraftReadinessById = {
  "AC-M4TD-01": { aircraftId: "AC-M4TD-01", connectionState: "FIXTURE", healthState: "GOOD",
    batteryPercent: 78, batteryState: "OK", storageFreeGb: 41, storageState: "OK",
    gpsState: "READY", rtkState: "READY", navigationState: "READY", warnings: [], ...dev },

  "AC-M4TD-02": { aircraftId: "AC-M4TD-02", connectionState: "FIXTURE", healthState: "GOOD",
    batteryPercent: 96, batteryState: "OK", storageFreeGb: 88, storageState: "OK",
    gpsState: "READY", rtkState: "READY", navigationState: "READY", warnings: [], ...dev },

  // Low battery + degraded GPS + thin storage
  "AC-DOCK-03": { aircraftId: "AC-DOCK-03", connectionState: "FIXTURE", healthState: "WARNING",
    batteryPercent: 28, batteryState: "LOW", storageFreeGb: 6, storageState: "LOW",
    gpsState: "DEGRADED", rtkState: "UNAVAILABLE", navigationState: "DEGRADED",
    warnings: ["Battery below policy minimum", "Storage below planning estimate"], ...dev },
};

export const sensorReadinessByPackage = {
  "SP-RGB": { sensors: [
    { sensorId: "S-RGB-1", type: "RGB", connected: true, health: "GOOD", calibrationState: "CURRENT",
      capabilities: ["RGB"], warnings: [], lastCalibration: ago(7000) }], ...dev },

  "SP-IR": { sensors: [
    { sensorId: "S-IR-1", type: "THERMAL", connected: true, health: "GOOD", calibrationState: "CURRENT",
      capabilities: ["THERMAL"], warnings: [], lastCalibration: ago(5000) }], ...dev },

  "SP-RGB-IR": { sensors: [
    { sensorId: "S-RGB-2", type: "RGB", connected: true, health: "GOOD", calibrationState: "CURRENT",
      capabilities: ["RGB"], warnings: [], lastCalibration: ago(7000) },
    { sensorId: "S-IR-2", type: "THERMAL", connected: true, health: "GOOD", calibrationState: "DUE",
      capabilities: ["THERMAL"], warnings: ["Calibration due"], lastCalibration: ago(60000) }], ...dev },

  "SP-RGB-LID": { sensors: [
    { sensorId: "S-RGB-3", type: "RGB", connected: true, health: "GOOD", calibrationState: "CURRENT",
      capabilities: ["RGB"], warnings: [], lastCalibration: ago(3000) },
    { sensorId: "S-LID-1", type: "LIDAR", connected: true, health: "GOOD", calibrationState: "CURRENT",
      capabilities: ["LIDAR", "PHOTOGRAMMETRY"], warnings: [], lastCalibration: ago(3000) }], ...dev },

  "SP-RGB-IR-LID": { sensors: [
    { sensorId: "S-RGB-4", type: "RGB", connected: true, health: "GOOD", calibrationState: "CURRENT",
      capabilities: ["RGB"], warnings: [], lastCalibration: ago(2000) },
    { sensorId: "S-IR-4", type: "THERMAL", connected: true, health: "GOOD", calibrationState: "CURRENT",
      capabilities: ["THERMAL"], warnings: [], lastCalibration: ago(2000) },
    { sensorId: "S-LID-4", type: "LIDAR", connected: true, health: "GOOD", calibrationState: "CURRENT",
      capabilities: ["LIDAR", "PHOTOGRAMMETRY", "RTK"], warnings: [], lastCalibration: ago(2000) }], ...dev },
};

export const operatorReadinessById = {
  "OP-01": { operatorId: "OP-01", assignmentState: "ASSIGNED", availabilityState: "AVAILABLE",
    acknowledgedMission: true, credentialState: "REPRESENTED", equipmentAcknowledgement: true,
    propertyAccessAcknowledgement: true, warnings: [], ...dev },

  "OP-02": { operatorId: "OP-02", assignmentState: "ASSIGNED", availabilityState: "UNAVAILABLE",
    acknowledgedMission: false, credentialState: "REPRESENTED", equipmentAcknowledgement: false,
    propertyAccessAcknowledgement: false, warnings: ["Operator marked unavailable for this window"], ...dev },
};

/** Deterministic simulation frames. Labelled SIMULATION at every hop. */
export const telemetryFrames = [
  { latitude: 38.0106, longitude: -84.4258, altitudeFt: 0, heading: 0, groundSpeedMph: 0, verticalSpeedFps: 0,
    batteryPercent: 78, gpsState: "READY", rtkState: "READY", connectionQuality: 5, storageRemainingGb: 41,
    activeSensor: "RGB", captureProgress: 0, warningCodes: [] },
  { latitude: 38.0107, longitude: -84.4259, altitudeFt: 120, heading: 45, groundSpeedMph: 12, verticalSpeedFps: 6,
    batteryPercent: 74, gpsState: "READY", rtkState: "READY", connectionQuality: 5, storageRemainingGb: 39,
    activeSensor: "RGB", captureProgress: 22, warningCodes: [] },
  { latitude: 38.0109, longitude: -84.4256, altitudeFt: 180, heading: 130, groundSpeedMph: 14, verticalSpeedFps: 0,
    batteryPercent: 66, gpsState: "READY", rtkState: "READY", connectionQuality: 4, storageRemainingGb: 34,
    activeSensor: "THERMAL", captureProgress: 55, warningCodes: [] },
  { latitude: 38.0104, longitude: -84.4254, altitudeFt: 180, heading: 220, groundSpeedMph: 13, verticalSpeedFps: 0,
    batteryPercent: 58, gpsState: "READY", rtkState: "DEGRADED", connectionQuality: 3, storageRemainingGb: 29,
    activeSensor: "THERMAL", captureProgress: 78, warningCodes: ["RTK_DEGRADED"] },
];

/** Post-flight capture validation records. */
export const captureValidations = [
  { assessmentId: "CV-012", missionId: "M-2026-0827-012", captureId: "CAP-012-1", propertyId: "SXP-004182",
    state: "APPROVED", requiredOutputs: ["RGB", "THERMAL", "GEOMETRY"], completedOutputs: ["RGB", "THERMAL", "GEOMETRY"],
    missingOutputs: [], coverageState: "100%", qualityFlags: [],
    reviewedBy: "u-001", reviewedAt: ago(2700), notes: "Full coverage; all required outputs present." },

  { assessmentId: "CV-015", missionId: "M-2026-0829-015", captureId: "CAP-015-1", propertyId: "SXP-004190",
    state: "RECAPTURE_REQUIRED", requiredOutputs: ["RGB", "GEOMETRY"], completedOutputs: ["RGB"],
    missingOutputs: ["GEOMETRY"], coverageState: "71%",
    qualityFlags: ["Rear roof plane not captured", "West elevation not captured", "Chimney not captured"],
    reviewedBy: "u-001", reviewedAt: ago(1190), notes: "Coverage below the 95% threshold." },

  { assessmentId: "CV-010", missionId: "M-2026-0820-010", captureId: "CAP-010-1", propertyId: "SXP-004191",
    state: "REJECTED", requiredOutputs: ["RGB"], completedOutputs: [], missingOutputs: ["RGB"],
    coverageState: "12%", qualityFlags: ["Capture aborted shortly after launch"],
    reviewedBy: "u-001", reviewedAt: iso("2026-08-20T15:10:00"), notes: "Aborted for wind; nothing usable captured." },
];
