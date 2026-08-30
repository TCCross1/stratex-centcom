/**
 * ATC READINESS ENGINE
 *
 * Composes one assessment from mission eligibility, authorization, operator,
 * aircraft, sensors, weather, thermal window, airspace, geofence, property
 * access and mission plan.
 *
 * Two rules govern everything here:
 *   1. UNKNOWN is not FAIL, and neither is PASS. Missing information stays
 *      missing and keeps the mission out of READY when the check is required.
 *   2. Requirements come from the mission's package. Not every check applies
 *      to every mission.
 */
import { policyFor, assessThermalWindow, READINESS_TTL_MINUTES, THERMAL_BAND, POLICY_SOURCE } from "./policy.js";
import { PROVIDER_MODE } from "./providers.js";

export const CHECK_STATE = {
  PASS: "PASS", WARNING: "WARNING", FAIL: "FAIL",
  UNKNOWN: "UNKNOWN", NOT_APPLICABLE: "NOT_APPLICABLE",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
};

export const ATC_STATE = {
  NOT_EVALUATED: "NOT_EVALUATED", EVALUATING: "EVALUATING",
  READY: "READY", READY_WITH_WARNINGS: "READY_WITH_WARNINGS",
  BLOCKED: "BLOCKED", HOLD: "HOLD", EXPIRED: "EXPIRED", ERROR: "ERROR",
};

export const CHECK_CATEGORIES = [
  "MISSION", "AUTHORIZATION", "OPERATOR", "AIRCRAFT", "BATTERY", "STORAGE",
  "CAMERA", "THERMAL_SENSOR", "CALIBRATION", "GPS_RTK", "WEATHER", "WIND",
  "PRECIPITATION", "VISIBILITY", "TEMPERATURE", "SUNLIGHT", "THERMAL_WINDOW",
  "AIRSPACE", "GEOFENCE", "PROPERTY_ACCESS", "MISSION_PLAN", "CONNECTIVITY",
];

let checkSeq = 0;
const mk = (missionId, category, code, label, state, opts = {}) => ({
  checkId: "CHK-" + ++checkSeq,
  missionId, category, code, label, state,
  severity: opts.severity || (state === CHECK_STATE.FAIL ? "BLOCKING" : state === CHECK_STATE.WARNING ? "WARNING" : "INFO"),
  message: opts.message || "",
  required: opts.required !== false,
  source: opts.source || "atc.readiness",
  evaluatedAt: new Date().toISOString(),
  expiresAt: opts.expiresAt || null,
  details: opts.details || null,
  resolutionHint: opts.resolutionHint || null,
});

/**
 * @param {object} input
 *   mission, authorization, operator, aircraft, sensors, weather,
 *   airspace, blockers, missionPlan
 */
export function evaluateReadiness(input) {
  const {
    mission, authorization = null, operatorReadiness = null, aircraftReadiness = null,
    sensorReadiness = null, weather = null, airspace = null, blockers = [],
    missionPlan = null, now = new Date(),
  } = input;

  const policy = policyFor(mission.requestedPackage);
  const checks = [];
  const C = (...a) => checks.push(mk(mission.id, ...a));

  /* -- mission + authorization ------------------------------------------ */
  C("MISSION", "MISSION_SCHEDULED", "Mission scheduled",
    mission.scheduledStart ? CHECK_STATE.PASS : CHECK_STATE.FAIL,
    { message: mission.scheduledStart ? "Window assigned." : "No scheduled window.",
      resolutionHint: "Set a scheduled start in Mission Command." });

  const authOk = mission.authorizationState === "NOT_REQUIRED" || mission.authorizationState === "CONFIRMED";
  C("AUTHORIZATION", "HOMEOWNER_AUTH", "Homeowner authorization",
    mission.authorizationState === "NOT_REQUIRED" ? CHECK_STATE.NOT_APPLICABLE
      : authOk ? CHECK_STATE.PASS : CHECK_STATE.FAIL,
    { message: "Authorization is " + mission.authorizationState + ".",
      resolutionHint: "Confirm homeowner authorization before launch." });

  /* -- operator ---------------------------------------------------------- */
  if (!operatorReadiness) {
    C("OPERATOR", "OPERATOR_ASSIGNED", "Operator assigned", CHECK_STATE.FAIL,
      { message: "No operator readiness on record.", resolutionHint: "Assign an operator." });
  } else {
    C("OPERATOR", "OPERATOR_ASSIGNED", "Operator assigned",
      operatorReadiness.assignmentState === "ASSIGNED" ? CHECK_STATE.PASS : CHECK_STATE.FAIL,
      { message: "Assignment is " + operatorReadiness.assignmentState + "." });
    C("OPERATOR", "OPERATOR_AVAILABLE", "Operator available",
      operatorReadiness.availabilityState === "AVAILABLE" ? CHECK_STATE.PASS
        : operatorReadiness.availabilityState === "UNKNOWN" ? CHECK_STATE.UNKNOWN : CHECK_STATE.FAIL,
      { message: "Availability is " + operatorReadiness.availabilityState + "." });
    C("OPERATOR", "OPERATOR_ACK", "Mission acknowledged",
      operatorReadiness.acknowledgedMission ? CHECK_STATE.PASS : CHECK_STATE.WARNING,
      { message: operatorReadiness.acknowledgedMission ? "Operator has acknowledged the mission." : "Operator has not acknowledged the mission.",
        resolutionHint: "The operator must acknowledge before launch." });
  }

  /* -- aircraft ---------------------------------------------------------- */
  if (!aircraftReadiness || aircraftReadiness.connectionState === "DISCONNECTED") {
    C("AIRCRAFT", "AIRCRAFT_LINK", "Aircraft connectivity", CHECK_STATE.PROVIDER_UNAVAILABLE,
      { message: "No telemetry provider is connected — aircraft state is unknown, not confirmed.",
        source: "AircraftTelemetryProvider",
        resolutionHint: "Connect a telemetry provider or verify the aircraft manually in the field." });
    C("BATTERY", "BATTERY_LEVEL", "Battery", CHECK_STATE.UNKNOWN, { message: "No telemetry." });
    C("STORAGE", "STORAGE_FREE", "Storage", CHECK_STATE.UNKNOWN, { message: "No telemetry." });
    C("GPS_RTK", "GPS_STATE", "GPS / RTK", CHECK_STATE.UNKNOWN,
      { message: "No telemetry.", required: policy.rtkRequired });
  } else {
    const a = aircraftReadiness;
    C("AIRCRAFT", "AIRCRAFT_LINK", "Aircraft connectivity",
      a.connectionState === "CONNECTED" || a.connectionState === "FIXTURE" ? CHECK_STATE.PASS : CHECK_STATE.WARNING,
      { message: "Link is " + a.connectionState + ".", source: a.providerMode || "fixture" });
    C("AIRCRAFT", "AIRCRAFT_HEALTH", "Aircraft health",
      a.healthState === "GOOD" ? CHECK_STATE.PASS
        : a.healthState === "WARNING" ? CHECK_STATE.WARNING
        : a.healthState === "UNKNOWN" ? CHECK_STATE.UNKNOWN : CHECK_STATE.FAIL,
      { message: "Health reported as " + a.healthState + "." });
    C("BATTERY", "BATTERY_LEVEL", "Battery",
      a.batteryPercent == null ? CHECK_STATE.UNKNOWN
        : a.batteryPercent >= policy.batteryMinPercent ? CHECK_STATE.PASS
        : a.batteryPercent >= policy.batteryMinPercent - 15 ? CHECK_STATE.WARNING : CHECK_STATE.FAIL,
      { message: a.batteryPercent == null ? "Unknown." : a.batteryPercent + "% against a " + policy.batteryMinPercent + "% policy minimum.",
        details: POLICY_SOURCE });
    C("STORAGE", "STORAGE_FREE", "Storage",
      a.storageFreeGb == null ? CHECK_STATE.UNKNOWN
        : a.storageFreeGb >= policy.storageMinGb ? CHECK_STATE.PASS : CHECK_STATE.FAIL,
      { message: a.storageFreeGb == null ? "Unknown." : a.storageFreeGb + " GB free against a " + policy.storageMinGb + " GB planning estimate.",
        details: "Expected capture size is a planning estimate, not a measured requirement." });
    C("GPS_RTK", "GPS_STATE", "GPS / RTK",
      !policy.rtkRequired && a.rtkState === "NOT_REQUIRED" ? CHECK_STATE.NOT_APPLICABLE
        : a.gpsState === "READY" && (!policy.rtkRequired || a.rtkState === "READY") ? CHECK_STATE.PASS
        : a.gpsState === "UNKNOWN" ? CHECK_STATE.UNKNOWN : CHECK_STATE.WARNING,
      { message: "GPS " + a.gpsState + ", RTK " + a.rtkState + ".", required: policy.rtkRequired });
  }

  /* -- sensors ----------------------------------------------------------- */
  const sensorsOf = sensorReadiness?.sensors || [];
  for (const capability of ["RGB", "THERMAL"]) {
    const required = policy.requiredSensors.includes(capability);
    const sensor = sensorsOf.find((s) => s.type === capability);
    const category = capability === "RGB" ? "CAMERA" : "THERMAL_SENSOR";
    if (!required && !sensor) {
      C(category, capability + "_READY", capability + " sensor", CHECK_STATE.NOT_APPLICABLE,
        { message: "Not required for this package.", required: false });
      continue;
    }
    if (!sensor) {
      C(category, capability + "_READY", capability + " sensor", CHECK_STATE.FAIL,
        { message: capability + " is required by this package but is not present on the assigned aircraft.",
          resolutionHint: "Assign a sensor package with " + capability + " capability." });
      continue;
    }
    C(category, capability + "_READY", capability + " sensor",
      !sensor.connected ? CHECK_STATE.FAIL
        : sensor.health === "GOOD" ? CHECK_STATE.PASS
        : sensor.health === "UNKNOWN" ? CHECK_STATE.UNKNOWN : CHECK_STATE.WARNING,
      { message: sensor.connected ? capability + " connected, health " + sensor.health + "." : capability + " is not connected.",
        required });
    C("CALIBRATION", capability + "_CAL", capability + " calibration",
      sensor.calibrationState === "CURRENT" ? CHECK_STATE.PASS
        : sensor.calibrationState === "DUE" ? CHECK_STATE.WARNING
        : sensor.calibrationState === "REQUIRED" ? CHECK_STATE.FAIL
        : sensor.calibrationState === "NOT_APPLICABLE" ? CHECK_STATE.NOT_APPLICABLE : CHECK_STATE.UNKNOWN,
      { message: "Calibration is " + sensor.calibrationState + ".", required });
  }

  /* -- weather ----------------------------------------------------------- */
  if (!weather || weather.unavailable || weather.providerMode === PROVIDER_MODE.DISCONNECTED) {
    C("WEATHER", "WEATHER_FEED", "Weather", CHECK_STATE.PROVIDER_UNAVAILABLE,
      { message: "No weather provider is connected. Conditions have not been checked.",
        source: "WeatherProvider" });
  } else {
    const w = weather;
    const src = w.dataSource || "FIXTURE";
    C("WIND", "WIND_SPEED", "Wind",
      w.windSpeedMph == null ? CHECK_STATE.UNKNOWN
        : w.windSpeedMph > policy.windMaxMph ? CHECK_STATE.FAIL
        : w.windSpeedMph > policy.windWarnMph ? CHECK_STATE.WARNING : CHECK_STATE.PASS,
      { message: w.windSpeedMph + " mph sustained against a " + policy.windMaxMph + " mph policy limit.",
        source: src, details: POLICY_SOURCE });
    C("WIND", "WIND_GUST", "Gusts",
      w.windGustMph == null ? CHECK_STATE.UNKNOWN
        : w.windGustMph > policy.gustMaxMph ? CHECK_STATE.FAIL : CHECK_STATE.PASS,
      { message: (w.windGustMph ?? "—") + " mph gusts against a " + policy.gustMaxMph + " mph policy limit.", source: src });
    C("PRECIPITATION", "PRECIP", "Precipitation",
      w.precipitationProbability == null ? CHECK_STATE.UNKNOWN
        : w.precipitationProbability > policy.precipMaxProbability ? CHECK_STATE.FAIL
        : w.precipitationProbability > policy.precipMaxProbability / 2 ? CHECK_STATE.WARNING : CHECK_STATE.PASS,
      { message: Math.round((w.precipitationProbability ?? 0) * 100) + "% probability.", source: src });
    C("VISIBILITY", "VISIBILITY", "Visibility",
      w.visibilityMiles == null ? CHECK_STATE.UNKNOWN
        : w.visibilityMiles < policy.visibilityMinMiles ? CHECK_STATE.FAIL : CHECK_STATE.PASS,
      { message: w.visibilityMiles + " mi. Visibility is a readiness factor; it does not establish VLOS compliance, which remains the operator's responsibility.",
        source: src });
    C("TEMPERATURE", "TEMP", "Temperature",
      w.temperatureF == null ? CHECK_STATE.UNKNOWN
        : w.temperatureF < policy.minTempF || w.temperatureF > policy.maxTempF ? CHECK_STATE.WARNING : CHECK_STATE.PASS,
      { message: w.temperatureF + "°F.", source: src });
    C("SUNLIGHT", "SUN", "Light conditions",
      w.minutesAfterSunset == null ? CHECK_STATE.UNKNOWN
        : policy.daylightRequired && w.minutesAfterSunset > 0 ? CHECK_STATE.FAIL : CHECK_STATE.PASS,
      { message: w.minutesAfterSunset == null ? "Unknown."
          : w.minutesAfterSunset > 0 ? Math.round(w.minutesAfterSunset) + " min after sunset."
          : Math.abs(Math.round(w.minutesAfterSunset)) + " min before sunset.",
        source: src, required: policy.daylightRequired });
  }

  /* -- thermal window ---------------------------------------------------- */
  let thermal = { band: THERMAL_BAND.NOT_APPLICABLE, score: null, scoreIsFixture: true, factors: [], risks: [] };
  if (policy.thermalWindowRequired) {
    thermal = assessThermalWindow(weather);
    const band = thermal.band;
    C("THERMAL_WINDOW", "THERMAL_WINDOW", "Thermal window",
      band === THERMAL_BAND.PREDICTED_IDEAL || band === THERMAL_BAND.GOOD ? CHECK_STATE.PASS
        : band === THERMAL_BAND.MARGINAL ? CHECK_STATE.WARNING
        : band === THERMAL_BAND.INSUFFICIENT_DATA || band === THERMAL_BAND.UNAVAILABLE ? CHECK_STATE.UNKNOWN
        : CHECK_STATE.FAIL,
      { message: "Predicted band: " + band.replace(/_/g, " ") + ".",
        details: thermal.disclaimer, source: "atc.thermal (heuristic)" });
  } else {
    C("THERMAL_WINDOW", "THERMAL_WINDOW", "Thermal window", CHECK_STATE.NOT_APPLICABLE,
      { message: "Not required for this package.", required: false });
  }

  /* -- airspace ---------------------------------------------------------- */
  if (!airspace || airspace.state === "PROVIDER_UNAVAILABLE") {
    C("AIRSPACE", "AIRSPACE", "Airspace", CHECK_STATE.PROVIDER_UNAVAILABLE,
      { message: "No airspace provider is connected. Airspace has not been checked — this is not a clearance.",
        source: "AirspaceProvider",
        resolutionHint: "Verify airspace and any required authorization through an approved source before flight." });
    C("GEOFENCE", "GEOFENCE", "Geofence", CHECK_STATE.UNKNOWN, { message: "Not checked." });
  } else {
    C("AIRSPACE", "AIRSPACE", "Airspace",
      airspace.state === "CLEAR" || airspace.state === "AUTHORIZED" ? CHECK_STATE.PASS
        : airspace.state === "REVIEW_REQUIRED" || airspace.state === "AUTHORIZATION_REQUIRED" ? CHECK_STATE.WARNING
        : airspace.state === "UNKNOWN" ? CHECK_STATE.UNKNOWN : CHECK_STATE.FAIL,
      { message: "Airspace state is " + airspace.state + ".", source: airspace.dataSource || "fixture" });
    C("GEOFENCE", "GEOFENCE", "Geofence",
      airspace.geofenceState === "CLEAR" ? CHECK_STATE.PASS
        : airspace.geofenceState === "WARNING" ? CHECK_STATE.WARNING
        : airspace.geofenceState === "UNKNOWN" ? CHECK_STATE.UNKNOWN : CHECK_STATE.FAIL,
      { message: "Geofence is " + airspace.geofenceState + ". Geofence state is distinct from airspace authorization." });
    // Unchecked TFRs are surfaced loudly but do not permanently block readiness:
    // no provider exists to check them, and responsibility for confirming
    // temporary restrictions stays with the operator. What is NOT permitted is
    // rendering them as CLEAR.
    C("AIRSPACE", "TFR", "Temporary restrictions",
      airspace.temporaryRestrictionState === "CLEAR" ? CHECK_STATE.PASS
        : airspace.temporaryRestrictionState === "NOT_CHECKED" ? CHECK_STATE.PROVIDER_UNAVAILABLE
        : airspace.temporaryRestrictionState === "ACTIVE" ? CHECK_STATE.FAIL : CHECK_STATE.UNKNOWN,
      { required: airspace.temporaryRestrictionState === "ACTIVE",
        severity: "WARNING",
        message: airspace.temporaryRestrictionState === "NOT_CHECKED"
          ? "NOT CHECKED — no provider connected. Temporary restrictions have not been verified by CENTCOM."
          : "Temporary restrictions: " + airspace.temporaryRestrictionState + ".",
        resolutionHint: "Confirm temporary flight restrictions through an approved source before flight." });
  }

  /* -- property access + plan -------------------------------------------- */
  C("PROPERTY_ACCESS", "ACCESS", "Property access",
    mission.accessNotes || mission.occupancyState ? CHECK_STATE.PASS : CHECK_STATE.WARNING,
    { message: mission.occupancyState ? "Occupancy: " + mission.occupancyState + "." : "No access context recorded.",
      required: false });

  if (missionPlan) {
    C("MISSION_PLAN", "PLAN", "Mission plan",
      missionPlan.complete ? CHECK_STATE.PASS : CHECK_STATE.WARNING,
      { message: missionPlan.complete ? "Planning information is sufficient to attempt this mission."
          : "Incomplete: " + missionPlan.missing.join(", ") + ".",
        details: "Planning completeness only. No autonomous flight path is generated." });
  }

  /* -- mission-level blockers -------------------------------------------- */
  for (const b of blockers.filter((x) => ["BLOCKING", "CRITICAL"].includes(x.severity) && ["OPEN", "ACKNOWLEDGED"].includes(x.status))) {
    C(b.category === "WEATHER" ? "WEATHER" : "MISSION", "BLOCKER_" + b.blockerId, "Mission blocker",
      CHECK_STATE.FAIL, { message: b.message, source: b.sourceSystem, severity: b.severity });
  }

  /* -- compose ----------------------------------------------------------- */
  const required = checks.filter((c) => c.required !== false);
  const failures = required.filter((c) => c.state === CHECK_STATE.FAIL);
  // A required check with no answer keeps the mission out of READY. Unknown is
  // not permission.
  const unresolved = required.filter(
    (c) => c.state === CHECK_STATE.UNKNOWN || c.state === CHECK_STATE.PROVIDER_UNAVAILABLE
  );
  const warnings = checks.filter(
    (c) =>
      c.state === CHECK_STATE.WARNING ||
      // An optional check with no answer is a warning, not silence.
      (c.required === false &&
        (c.state === CHECK_STATE.UNKNOWN || c.state === CHECK_STATE.PROVIDER_UNAVAILABLE))
  );

  const generatedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + READINESS_TTL_MINUTES * 60000).toISOString();

  let overallState;
  if (failures.length) overallState = ATC_STATE.BLOCKED;
  else if (unresolved.length) overallState = ATC_STATE.BLOCKED;
  else if (warnings.length) overallState = ATC_STATE.READY_WITH_WARNINGS;
  else overallState = ATC_STATE.READY;

  return {
    assessmentId: "ATC-" + mission.id + "-" + now.getTime(),
    missionId: mission.id, propertyId: mission.propertyId,
    generatedAt, expiresAt, overallState, checks,
    blockingCount: failures.length,
    unresolvedCount: unresolved.length,
    warningCount: warnings.length,
    thermal,
    policyPackage: mission.requestedPackage,
    policySource: POLICY_SOURCE,
    launchAuthorizationState: "NOT_REQUESTED",
  };
}

/** An expired assessment authorizes nothing. */
export const isExpired = (assessment, now = new Date()) =>
  !assessment?.expiresAt || new Date(assessment.expiresAt).getTime() <= now.getTime();

export const effectiveState = (assessment, now = new Date()) =>
  isExpired(assessment, now) ? ATC_STATE.EXPIRED : assessment.overallState;
