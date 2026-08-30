/**
 * MISSION LIFECYCLE
 *
 * A mission is one Stratex field/capture operation. It is not a project, an
 * estimate, a Passport revision, a Cortex analysis or an appointment. It may
 * PRODUCE captures, evidence, twins, measurements, analyses, findings, Passport
 * revisions and reports — but it is never the parent of the property.
 *
 * This module owns the rules: the stages, which transitions are legal, what
 * gates a mission must pass, and what closeout requires. The service applies
 * these rules; the UI only asks whether an action is allowed and why not.
 */

/** The 15 canonical stages, in order. */
export const MISSION_STAGES = [
  { key: "CREATED", n: 1, label: "Created" },
  { key: "AUTHORIZATION_PENDING", n: 2, label: "Authorization Pending" },
  { key: "AUTHORIZED", n: 3, label: "Authorized" },
  { key: "SCHEDULING", n: 4, label: "Scheduling" },
  { key: "SCHEDULED", n: 5, label: "Scheduled" },
  { key: "ATC_REVIEW", n: 6, label: "ATC Review" },
  { key: "READY", n: 7, label: "Ready" },
  { key: "LAUNCHED", n: 8, label: "Launched" },
  { key: "CAPTURING", n: 9, label: "Capturing" },
  { key: "CAPTURE_COMPLETE", n: 10, label: "Capture Complete" },
  { key: "DATA_VALIDATION", n: 11, label: "Data Validation" },
  { key: "PROCESSING", n: 12, label: "Processing" },
  { key: "CORTEX_ANALYSIS", n: 13, label: "Cortex Analysis" },
  { key: "PASSPORT_SYNC", n: 14, label: "Passport Sync" },
  { key: "COMPLETE", n: 15, label: "Complete" },
];

/** Exception and terminal states. Never hidden inside free text. */
export const MISSION_EXCEPTION_STATES = [
  { key: "CANCELLED", label: "Cancelled", terminal: true },
  { key: "ABORTED", label: "Aborted", terminal: false },
  { key: "FAILED", label: "Failed", terminal: true },
  { key: "RECAPTURE_REQUIRED", label: "Recapture Required", terminal: false },
  { key: "RESCHEDULE_REQUIRED", label: "Reschedule Required", terminal: false },
];

const ALL_STATES = [
  ...MISSION_STAGES.map((s) => s.key),
  ...MISSION_EXCEPTION_STATES.map((s) => s.key),
];

export const stageByKey = (key) =>
  MISSION_STAGES.find((s) => s.key === key) ||
  MISSION_EXCEPTION_STATES.find((s) => s.key === key) ||
  { key, label: key, n: 0 };

export const isTerminal = (key) =>
  key === "COMPLETE" ||
  Boolean(MISSION_EXCEPTION_STATES.find((s) => s.key === key && s.terminal));

/**
 * The transition map. If a pair is not listed here it is not legal — there is
 * no wildcard. CANCELLED is reachable from any non-terminal state and is
 * handled separately by canCancel().
 */
export const TRANSITIONS = {
  CREATED: ["AUTHORIZATION_PENDING", "AUTHORIZED", "SCHEDULING"],
  AUTHORIZATION_PENDING: ["AUTHORIZED", "FAILED"],
  AUTHORIZED: ["SCHEDULING"],
  SCHEDULING: ["SCHEDULED"],
  SCHEDULED: ["ATC_REVIEW", "RESCHEDULE_REQUIRED"],
  ATC_REVIEW: ["READY", "RESCHEDULE_REQUIRED"],
  READY: ["LAUNCHED", "RESCHEDULE_REQUIRED"],
  LAUNCHED: ["CAPTURING", "ABORTED"],
  CAPTURING: ["CAPTURE_COMPLETE", "ABORTED"],
  CAPTURE_COMPLETE: ["DATA_VALIDATION"],
  DATA_VALIDATION: ["PROCESSING", "RECAPTURE_REQUIRED"],
  PROCESSING: ["CORTEX_ANALYSIS", "FAILED"],
  CORTEX_ANALYSIS: ["PASSPORT_SYNC", "FAILED"],
  PASSPORT_SYNC: ["COMPLETE", "FAILED"],
  COMPLETE: [],
  // exception recoveries
  RECAPTURE_REQUIRED: ["SCHEDULED", "READY", "CANCELLED"],
  RESCHEDULE_REQUIRED: ["SCHEDULING", "SCHEDULED", "CANCELLED"],
  ABORTED: ["DATA_VALIDATION", "RESCHEDULE_REQUIRED", "CANCELLED"],
  FAILED: ["RESCHEDULE_REQUIRED", "CANCELLED"],
  CANCELLED: [],
};

/* ------------------------------------------------------------- blockers -- */

export const BLOCKER_CATEGORY = [
  "AUTHORIZATION", "SCHEDULING", "WEATHER", "AIRSPACE", "AIRCRAFT", "SENSOR",
  "OPERATOR", "PROPERTY_ACCESS", "DATA", "PROCESSING", "CORTEX", "PASSPORT",
  "REPORT", "OTHER",
];

export const BLOCKER_SEVERITY = ["INFO", "WARNING", "BLOCKING", "CRITICAL"];
export const BLOCKER_STATUS = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "DISMISSED"];

/** Only BLOCKING and CRITICAL prevent advancement, and only while unresolved. */
export const isHardBlocker = (b) =>
  ["BLOCKING", "CRITICAL"].includes(b.severity) &&
  ["OPEN", "ACKNOWLEDGED"].includes(b.status);

/* ------------------------------------------------------- sensor capability -- */

export const SENSOR_CAPABILITY = ["RGB", "THERMAL", "RTK", "PHOTOGRAMMETRY", "LIDAR", "OTHER"];

/** What each package requires of the assigned sensor package. */
export const PACKAGE_REQUIREMENTS = {
  DAYSCAN: ["RGB"],
  THERMALSCAN: ["THERMAL"],
  AWE_ASSESSMENT: ["RGB", "THERMAL"],
  COMPLETE_PROPERTY_INTELLIGENCE: ["RGB", "THERMAL", "PHOTOGRAMMETRY"],
  PROJECT_VERIFICATION: ["RGB"],
  CUSTOM_MISSION: [],
};

/** What each requested service requires. */
export const SERVICE_REQUIREMENTS = {
  RGB_MAPPING: ["RGB"],
  THERMAL_CAPTURE: ["THERMAL"],
  ROOF_GEOMETRY: ["PHOTOGRAMMETRY"],
  EXTERIOR_CAPTURE: ["RGB"],
  MEASUREMENTS: ["PHOTOGRAMMETRY"],
  AWE: ["THERMAL"],
  DIGITAL_TWIN: ["PHOTOGRAMMETRY"],
  DAMAGE_ASSESSMENT: ["RGB"],
  PROJECT_VERIFICATION: ["RGB"],
  REPORT: [],
  CAD_BIM_PREP: ["LIDAR"],
  OTHER: [],
};

/**
 * Check the assigned sensor package against what the mission asked for.
 * Returns the missing capabilities — an empty array means compatible.
 */
export function checkSensorCompatibility(mission, sensorPackage) {
  const needed = new Set([
    ...(PACKAGE_REQUIREMENTS[mission.requestedPackage] || []),
    ...(mission.requestedServices || []).flatMap((s) => SERVICE_REQUIREMENTS[s] || []),
  ]);
  const have = new Set(sensorPackage?.capabilities || []);
  return [...needed].filter((c) => !have.has(c));
}

/* ------------------------------------------------------------ READY gate -- */

export const AUTHORIZATION_STATES = [
  "NOT_REQUIRED", "PENDING", "SENT", "CONFIRMED", "DECLINED", "EXPIRED", "REVOKED",
];

export const authorizationSatisfied = (m) =>
  m.authorizationState === "NOT_REQUIRED" || m.authorizationState === "CONFIRMED";

/**
 * Mission-level readiness. ATC adds weather, airspace, aircraft health,
 * battery and calibration later — this gate deliberately does not duplicate
 * any of that.
 *
 * @returns {{ready: boolean, failures: string[]}}
 */
export function evaluateReadyGate(mission, { sensorPackage, blockers = [] } = {}) {
  const failures = [];

  if (!authorizationSatisfied(mission))
    failures.push("Authorization is " + mission.authorizationState + " — it must be CONFIRMED or NOT_REQUIRED.");
  if (!mission.scheduledStart)
    failures.push("No scheduled start time.");
  if (!mission.operatorId)
    failures.push("No operator assigned.");
  if (!mission.aircraftId)
    failures.push("No aircraft assigned.");
  if (!mission.sensorPackageId) {
    failures.push("No sensor package assigned.");
  } else if (sensorPackage) {
    const missing = checkSensorCompatibility(mission, sensorPackage);
    if (missing.length)
      failures.push("Sensor package lacks required capability: " + missing.join(", ") + ".");
  }

  const hard = blockers.filter(isHardBlocker);
  for (const b of hard) failures.push("Unresolved " + b.severity.toLowerCase() + " blocker: " + b.message);

  return { ready: failures.length === 0, failures };
}

/* -------------------------------------------------------------- closeout -- */

/**
 * A mission may only complete when the work its package actually asked for is
 * done. A package with no report does not wait on a report.
 */
export function evaluateCloseout(mission, { captureSessions = [] } = {}) {
  const failures = [];
  const wantsReport = (mission.requestedServices || []).includes("REPORT");

  if (mission.captureState !== "COMPLETE")
    failures.push("Capture is " + mission.captureState + ", not COMPLETE.");
  if (mission.evidenceState !== "VALIDATED")
    failures.push("Evidence is " + mission.evidenceState + ", not VALIDATED.");
  if (mission.processingState !== "COMPLETE")
    failures.push("Processing is " + mission.processingState + ", not COMPLETE.");
  if (mission.cortexState !== "COMPLETE")
    failures.push("Cortex analysis is " + mission.cortexState + ", not COMPLETE.");
  if (mission.passportState !== "SYNCED")
    failures.push("Passport sync is " + mission.passportState + ", not SYNCED.");
  if (wantsReport && !["REQUESTED", "READY"].includes(mission.reportState))
    failures.push("This package requested a report; report state is " + mission.reportState + ".");
  if (!captureSessions.some((s) => s.status === "COMPLETE"))
    failures.push("No completed capture session on record.");

  return { canComplete: failures.length === 0, failures };
}

/* ------------------------------------------------------------ transition -- */

export const CANCEL_REASONS = [
  "CUSTOMER_REQUEST", "PROFESSIONAL_REQUEST", "PROPERTY_ACCESS", "WEATHER",
  "OPERATOR", "AIRCRAFT", "AUTHORIZATION", "DUPLICATE", "OTHER",
];

export const ABORT_REASONS = [
  "WEATHER", "AIRSPACE", "AIRCRAFT", "SENSOR", "SAFETY", "PROPERTY", "OPERATOR", "OTHER",
];

export const canCancel = (mission) => !isTerminal(mission.missionState);

/**
 * The single authority on whether a mission may move. Returns a reason on
 * refusal so the UI can disable a control AND explain it, rather than silently
 * hiding the action.
 *
 * @returns {{allowed: boolean, reason: string|null}}
 */
export function canTransition(mission, toState, context = {}) {
  if (!ALL_STATES.includes(toState))
    return { allowed: false, reason: '"' + toState + '" is not a mission state.' };

  const from = mission.missionState;

  if (toState === "CANCELLED")
    return canCancel(mission)
      ? { allowed: true, reason: null }
      : { allowed: false, reason: "A " + stageByKey(from).label.toLowerCase() + " mission cannot be cancelled." };

  const legal = TRANSITIONS[from] || [];
  if (!legal.includes(toState))
    return {
      allowed: false,
      reason: stageByKey(from).label + " cannot move directly to " + stageByKey(toState).label + ".",
    };

  if (toState === "READY") {
    const gate = evaluateReadyGate(mission, context);
    if (!gate.ready) return { allowed: false, reason: gate.failures.join(" ") };
  }

  if (toState === "COMPLETE") {
    const gate = evaluateCloseout(mission, context);
    if (!gate.canComplete) return { allowed: false, reason: gate.failures.join(" ") };
  }

  if (toState === "AUTHORIZED" && !authorizationSatisfied(mission))
    return { allowed: false, reason: "Authorization is " + mission.authorizationState + "." };

  return { allowed: true, reason: null };
}

/** Every state a mission could legally move to right now. */
export const legalNextStates = (mission, context = {}) =>
  [...(TRANSITIONS[mission.missionState] || []), "CANCELLED"]
    .filter((s, i, a) => a.indexOf(s) === i)
    .map((s) => ({ state: s, ...canTransition(mission, s, context) }));
