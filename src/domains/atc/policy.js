/**
 * ATC READINESS POLICY
 *
 * Thresholds live here, not scattered through checks. Every number below is a
 * DEVELOPMENT POLICY FIXTURE — none of it is transcribed from a manufacturer
 * specification or a regulation. When real aircraft limits are encoded from
 * verified specs, this file is what changes.
 */

export const POLICY_SOURCE = "DEVELOPMENT POLICY FIXTURE — not manufacturer or regulatory data";

/** Per-package requirements. Not every check applies to every mission. */
export const PACKAGE_POLICY = {
  DAYSCAN: {
    requiredSensors: ["RGB"],
    thermalWindowRequired: false,
    rtkRequired: false,
    windMaxMph: 20, windWarnMph: 15, gustMaxMph: 25,
    visibilityMinMiles: 3, minTempF: 20, maxTempF: 105,
    precipMaxProbability: 0.4, batteryMinPercent: 45, storageMinGb: 16,
    daylightRequired: true,
  },
  THERMALSCAN: {
    requiredSensors: ["THERMAL"],
    thermalWindowRequired: true,
    rtkRequired: false,
    windMaxMph: 15, windWarnMph: 10, gustMaxMph: 20,
    visibilityMinMiles: 2, minTempF: 20, maxTempF: 95,
    precipMaxProbability: 0.2, batteryMinPercent: 50, storageMinGb: 12,
    daylightRequired: false,
  },
  AWE_ASSESSMENT: {
    requiredSensors: ["RGB", "THERMAL"],
    thermalWindowRequired: true, rtkRequired: false,
    windMaxMph: 15, windWarnMph: 12, gustMaxMph: 22,
    visibilityMinMiles: 3, minTempF: 20, maxTempF: 100,
    precipMaxProbability: 0.25, batteryMinPercent: 55, storageMinGb: 24,
    daylightRequired: false,
  },
  COMPLETE_PROPERTY_INTELLIGENCE: {
    requiredSensors: ["RGB", "THERMAL", "PHOTOGRAMMETRY"],
    thermalWindowRequired: true, rtkRequired: true,
    windMaxMph: 18, windWarnMph: 13, gustMaxMph: 24,
    visibilityMinMiles: 3, minTempF: 20, maxTempF: 100,
    precipMaxProbability: 0.2, batteryMinPercent: 60, storageMinGb: 48,
    daylightRequired: true,
  },
  PROJECT_VERIFICATION: {
    requiredSensors: ["RGB"],
    thermalWindowRequired: false, rtkRequired: false,
    windMaxMph: 20, windWarnMph: 15, gustMaxMph: 25,
    visibilityMinMiles: 3, minTempF: 20, maxTempF: 105,
    precipMaxProbability: 0.4, batteryMinPercent: 45, storageMinGb: 16,
    daylightRequired: true,
  },
  CUSTOM_MISSION: {
    requiredSensors: [], thermalWindowRequired: false, rtkRequired: false,
    windMaxMph: 20, windWarnMph: 15, gustMaxMph: 25,
    visibilityMinMiles: 3, minTempF: 20, maxTempF: 105,
    precipMaxProbability: 0.4, batteryMinPercent: 45, storageMinGb: 16,
    daylightRequired: false,
  },
};

export const policyFor = (pkg) => PACKAGE_POLICY[pkg] || PACKAGE_POLICY.CUSTOM_MISSION;

/** Readiness ages out. An expired assessment cannot authorize anything. */
export const READINESS_TTL_MINUTES = 60;

/* --------------------------------------------------- thermal window ------ */

export const THERMAL_BAND = {
  PREDICTED_IDEAL: "PREDICTED_IDEAL",
  GOOD: "GOOD",
  MARGINAL: "MARGINAL",
  POOR: "POOR",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
  UNAVAILABLE: "UNAVAILABLE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

export const THERMAL_DISCLAIMER =
  "Predicted suitability from a development heuristic. Not a calibrated or scientifically validated model, and never a guarantee of thermal conditions.";

/**
 * Thermal window suitability. This is a PREDICTION, expressed as a band.
 * Returns INSUFFICIENT_DATA — never a zero — when inputs are missing.
 */
export function assessThermalWindow(weather, { minutesAfterSunset = null } = {}) {
  if (!weather || weather.unavailable)
    return { band: THERMAL_BAND.UNAVAILABLE, score: null, scoreIsFixture: true,
             factors: [], risks: ["No weather data available."], disclaimer: THERMAL_DISCLAIMER };

  const have = (v) => v !== null && v !== undefined;
  if (!have(weather.windSpeedMph) || !have(weather.cloudCoverPercent) || !have(weather.temperatureF))
    return { band: THERMAL_BAND.INSUFFICIENT_DATA, score: null, scoreIsFixture: true,
             factors: [], risks: ["Not enough observations to assess a thermal window."],
             disclaimer: THERMAL_DISCLAIMER };

  const factors = [];
  const risks = [];
  let score = 100;

  const afterSunset = minutesAfterSunset ?? weather.minutesAfterSunset ?? null;
  if (afterSunset === null) {
    risks.push("Time relative to sunset is unknown.");
    score -= 25;
  } else if (afterSunset < 0) {
    risks.push("Before sunset — solar loading still present.");
    score -= 45;
  } else if (afterSunset < 60) {
    factors.push("Shortly after sunset; surfaces still shedding solar load.");
    score -= 20;
  } else if (afterSunset <= 300) {
    factors.push("Well inside the post-sunset cooling period.");
  } else {
    factors.push("Late in the cooling period; differentials may have flattened.");
    score -= 15;
  }

  if (weather.windSpeedMph <= 5) factors.push("Light wind preserves surface differentials.");
  else if (weather.windSpeedMph <= 10) { factors.push("Moderate wind."); score -= 10; }
  else { risks.push("Wind is convecting heat off surfaces."); score -= 30; }

  if (weather.cloudCoverPercent >= 70) { factors.push("Overcast slows radiative cooling."); score -= 20; }
  else if (weather.cloudCoverPercent <= 25) factors.push("Clear sky supports radiative cooling.");

  if (weather.recentPrecipitationHours !== null && weather.recentPrecipitationHours < 12) {
    risks.push("Recent precipitation may confound moisture interpretation.");
    score -= 25;
  }
  if (weather.precipitationProbability > 0.3) { risks.push("Precipitation likely during the window."); score -= 20; }

  score = Math.max(0, Math.min(100, score));
  const band =
    score >= 80 ? THERMAL_BAND.PREDICTED_IDEAL :
    score >= 60 ? THERMAL_BAND.GOOD :
    score >= 40 ? THERMAL_BAND.MARGINAL : THERMAL_BAND.POOR;

  return {
    band, score, scoreIsFixture: true, factors, risks,
    recommendedStart: weather.recommendedThermalStart || null,
    recommendedEnd: weather.recommendedThermalEnd || null,
    disclaimer: THERMAL_DISCLAIMER,
  };
}
