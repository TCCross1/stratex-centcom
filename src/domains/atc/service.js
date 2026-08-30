/**
 * ATC SERVICE
 *
 * ATC decides whether a mission is ready and supervises the field operation.
 * It does not own property truth, Passport, Cortex conclusions, Core estimates,
 * Pro or Habitat. Mission owns intent; ATC owns flight readiness.
 *
 * Every mutation emits a typed ATC event and an audit record.
 */
import { serve } from "../shared/transport.js";
import MissionService from "../mission/service.js";
import { evaluateReadiness, isExpired, effectiveState, ATC_STATE, CHECK_STATE } from "./readiness.js";
import {
  WeatherProvider, AirspaceProvider, FlightProvider, AircraftTelemetryProvider,
  SensorProvider, PROVIDER_MODE, providerHealth,
} from "./providers.js";
import {
  weatherByMission, airspaceByMission, aircraftReadinessById,
  sensorReadinessByPackage, operatorReadinessById, telemetryFrames, captureValidations,
} from "./fixtures.js";

export const LIVE_STATE = {
  NOT_STARTED: "NOT_STARTED", LAUNCH_AUTHORIZED: "LAUNCH_AUTHORIZED", LAUNCHED: "LAUNCHED",
  IN_FLIGHT: "IN_FLIGHT", CAPTURING: "CAPTURING", HOLD: "HOLD", RETURNING: "RETURNING",
  LANDED: "LANDED", ABORTED: "ABORTED", CONNECTION_LOST: "CONNECTION_LOST", COMPLETE: "COMPLETE",
};

export const LAUNCH_STATE = {
  NOT_REQUESTED: "NOT_REQUESTED", PENDING: "PENDING", AUTHORIZED: "AUTHORIZED",
  AUTHORIZED_FIXTURE: "AUTHORIZED_FIXTURE", DENIED: "DENIED", EXPIRED: "EXPIRED",
  REVOKED: "REVOKED", PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
};

export const HOLD_REASONS = ["WEATHER", "AIRSPACE", "AIRCRAFT", "SENSOR", "CONNECTIVITY", "PROPERTY", "OPERATOR", "SAFETY", "OTHER"];

const store = {
  assessments: {},           // missionId -> assessment
  launchAuthorizations: {},  // missionId -> LaunchAuthorization
  liveStates: {},            // missionId -> { state, holdReason, startedAt, lastFrame }
  validations: captureValidations.map((v) => ({ ...v })),
  events: [],
  audit: [],
};

let seq = 0;
const nid = (p) => p + "-" + ++seq;
const nowIso = () => new Date().toISOString();

function emit(missionId, propertyId, type, { actor = "atc.system", reason = null, from = null, to = null } = {}) {
  store.events.push({ eventId: nid("ATCE"), missionId, propertyId, type, at: nowIso(), actor, reason, fromState: from, toState: to });
  store.audit.push({
    auditId: nid("ATCA"), at: nowIso(), actor,
    actorType: actor.startsWith("u-") || actor.startsWith("OP-") ? "OPERATOR" : "SYSTEM",
    domain: "ATC", action: type, objectType: "Mission", objectId: missionId,
    missionId, propertyId, previousState: from, newState: to, reason, sourceSystem: "atc",
  });
}

/** Planning completeness. Not a flight path. */
function missionPlanReadiness(mission) {
  const missing = [];
  if (!mission.propertyId) missing.push("property");
  if (!mission.assessmentObjective) missing.push("objective");
  if (!mission.requestedServices?.length) missing.push("requested services");
  if (!mission.sensorPackageId) missing.push("sensor package");
  if (!mission.estimatedDurationMinutes) missing.push("duration estimate");
  return { complete: missing.length === 0, missing, planIsEstimate: true };
}

export const AtcService = {
  providerHealth: () => serve(() => providerHealth()),

  /** Build a fresh readiness assessment from every provider and the mission. */
  evaluate: async (missionId, { actor = "atc.system" } = {}) => {
    const mission = await MissionService.get(missionId);
    const weather = await WeatherProvider.getSnapshot(missionId, mission.propertyId, weatherByMission[missionId] || null);
    const airspace = await AirspaceProvider.getAssessment(missionId, mission.propertyId, airspaceByMission[missionId] || {});
    const sensors = mission.sensorPackageId
      ? await SensorProvider.getReadiness(mission.aircraftId, sensorReadinessByPackage[mission.sensorPackageId] || { sensors: [] })
      : { sensors: [] };
    const blockers = await MissionService.listBlockers(missionId);

    const assessment = evaluateReadiness({
      mission,
      weather: weather && weather.snapshotId ? weather : weather?.unavailable ? { unavailable: true } : weather,
      airspace,
      aircraftReadiness: mission.aircraftId ? aircraftReadinessById[mission.aircraftId] || null : null,
      sensorReadiness: sensors,
      operatorReadiness: mission.operatorId ? operatorReadinessById[mission.operatorId] || null : null,
      missionPlan: missionPlanReadiness(mission),
      blockers,
    });

    store.assessments[missionId] = assessment;
    emit(missionId, mission.propertyId, "READINESS_EVALUATED", { actor, reason: "Overall: " + assessment.overallState });
    if (assessment.overallState === ATC_STATE.BLOCKED)
      emit(missionId, mission.propertyId, "AIRSPACE_REVIEW_REQUIRED", { actor, reason: assessment.blockingCount + " blocking, " + assessment.unresolvedCount + " unresolved" });
    return assessment;
  },

  getAssessment: (missionId) => serve(() => store.assessments[missionId] || null),

  /** Overall state with expiry applied. An expired assessment is not READY. */
  getEffectiveState: (missionId) =>
    serve(() => {
      const a = store.assessments[missionId];
      if (!a) return ATC_STATE.NOT_EVALUATED;
      return effectiveState(a);
    }),

  /* ------------------------------------------------------ launch gate --- */

  /**
   * The launch gate. Refuses with a reason rather than failing quietly, and
   * cannot issue a real authorization while no flight provider is connected.
   */
  requestLaunchAuthorization: async (missionId, { actor = "u-001", simulation = false } = {}) => {
    const mission = await MissionService.get(missionId);
    const assessment = store.assessments[missionId];
    const reasons = [];

    if (mission.missionState !== "READY") reasons.push("Mission state is " + mission.missionState + ", not READY.");
    if (!assessment) reasons.push("No readiness assessment — run an ATC evaluation first.");
    else {
      if (isExpired(assessment)) reasons.push("Readiness assessment has expired. Re-evaluate before launch.");
      if (assessment.overallState === ATC_STATE.BLOCKED) reasons.push(assessment.blockingCount + " blocking and " + assessment.unresolvedCount + " unresolved check(s).");
      const criticalFail = assessment.checks.filter(
        (c) => c.required !== false && (c.state === CHECK_STATE.FAIL || c.state === CHECK_STATE.PROVIDER_UNAVAILABLE)
      );
      if (criticalFail.length) reasons.push("Unsatisfied required checks: " + criticalFail.map((c) => c.label).join(", ") + ".");
    }

    if (reasons.length) {
      const record = {
        authorizationId: nid("LA"), missionId, propertyId: mission.propertyId,
        readinessAssessmentId: assessment?.assessmentId || null, state: LAUNCH_STATE.DENIED,
        requestedAt: nowIso(), authorizedAt: null, authorizedBy: null,
        authorizationMode: null, expiresAt: null, revokedAt: null, reason: reasons.join(" "),
      };
      store.launchAuthorizations[missionId] = record;
      emit(missionId, mission.propertyId, "LAUNCH_DENIED", { actor, reason: record.reason });
      throw new Error(record.reason);
    }

    // Gate satisfied. Whether a REAL authorization can be issued is a separate
    // question, answered by the provider — not by CENTCOM.
    const result = await FlightProvider.authorizeLaunch(missionId, { simulation });
    const record = {
      authorizationId: nid("LA"), missionId, propertyId: mission.propertyId,
      readinessAssessmentId: assessment.assessmentId,
      state: result.state === "AUTHORIZED" ? LAUNCH_STATE.AUTHORIZED : LAUNCH_STATE.AUTHORIZED_FIXTURE,
      requestedAt: nowIso(), authorizedAt: nowIso(), authorizedBy: actor,
      authorizationMode: result.isLive ? "LIVE" : "SIMULATION",
      expiresAt: assessment.expiresAt, revokedAt: null,
      reason: result.notice || null, providerReference: result.providerMode,
    };
    store.launchAuthorizations[missionId] = record;
    store.liveStates[missionId] = { state: LIVE_STATE.LAUNCH_AUTHORIZED, holdReason: null, startedAt: nowIso(), lastFrame: null };
    emit(missionId, mission.propertyId, "LAUNCH_AUTHORIZED", { actor, reason: record.authorizationMode, to: record.state });
    return record;
  },

  getLaunchAuthorization: (missionId) => serve(() => store.launchAuthorizations[missionId] || null),

  /* -------------------------------------------------------- live ops ---- */

  getLiveState: (missionId) => serve(() => store.liveStates[missionId] || { state: LIVE_STATE.NOT_STARTED, holdReason: null }),

  setLiveState: (missionId, state, { actor = "OP-01", reason = null } = {}) =>
    serve(() => {
      const cur = store.liveStates[missionId] || { state: LIVE_STATE.NOT_STARTED };
      const from = cur.state;
      store.liveStates[missionId] = { ...cur, state, holdReason: state === LIVE_STATE.HOLD ? reason : null };
      emit(missionId, null, "LIVE_STATE_CHANGED", { actor, reason, from, to: state });
      return store.liveStates[missionId];
    }),

  /** HOLD requires a reason and records who called it. */
  hold: (missionId, reason, { actor = "OP-01" } = {}) =>
    serve(() => {
      if (!HOLD_REASONS.includes(reason)) throw new Error("A hold requires a valid reason category.");
      const cur = store.liveStates[missionId];
      if (!cur || ![LIVE_STATE.LAUNCHED, LIVE_STATE.IN_FLIGHT, LIVE_STATE.CAPTURING].includes(cur.state))
        throw new Error("Only an active field operation can be placed on hold.");
      const from = cur.state;
      store.liveStates[missionId] = { ...cur, state: LIVE_STATE.HOLD, holdReason: reason, heldFrom: from };
      emit(missionId, null, "MISSION_HELD", { actor, reason, from, to: LIVE_STATE.HOLD });
      return store.liveStates[missionId];
    }),

  /** Resume is a human decision. Nothing resumes itself. */
  resume: (missionId, { actor = "OP-01", blockerResolved = false } = {}) =>
    serve(() => {
      const cur = store.liveStates[missionId];
      if (!cur || cur.state !== LIVE_STATE.HOLD) throw new Error("Mission is not on hold.");
      if (!blockerResolved)
        throw new Error("The hold condition (" + cur.holdReason + ") must be resolved before resuming.");
      const to = cur.heldFrom || LIVE_STATE.IN_FLIGHT;
      store.liveStates[missionId] = { ...cur, state: to, holdReason: null };
      emit(missionId, null, "MISSION_RESUMED", { actor, reason: "Hold resolved", from: LIVE_STATE.HOLD, to });
      return store.liveStates[missionId];
    }),

  connectionLost: (missionId, { actor = "atc.telemetry" } = {}) =>
    serve(() => {
      const cur = store.liveStates[missionId] || { state: LIVE_STATE.NOT_STARTED };
      store.liveStates[missionId] = { ...cur, state: LIVE_STATE.CONNECTION_LOST, lostAt: nowIso() };
      emit(missionId, null, "CONNECTION_LOST", { actor, from: cur.state, to: LIVE_STATE.CONNECTION_LOST });
      return store.liveStates[missionId];
    }),

  getTelemetry: (missionId) => AircraftTelemetryProvider.getLatest(missionId, telemetryFrames[0]),
  subscribeTelemetry: (missionId, onFrame) => AircraftTelemetryProvider.subscribe(missionId, telemetryFrames, onFrame),

  /* ------------------------------------------------------ post-flight --- */

  getValidation: (missionId) => serve(() => store.validations.find((v) => v.missionId === missionId) || null),

  /**
   * Post-flight capture validation. Evidence does not go to Cortex until the
   * capture package is checked. A missing required output means recapture.
   */
  validateCapture: async (missionId, { actor = "u-001" } = {}) => {
    const mission = await MissionService.get(missionId);
    const sessions = await MissionService.listCaptureSessions(missionId);
    const complete = sessions.find((s) => s.status === "COMPLETE");

    const required = [];
    if (mission.requestedServices.includes("RGB_MAPPING") || mission.requestedServices.includes("EXTERIOR_CAPTURE")) required.push("RGB");
    if (mission.requestedServices.includes("THERMAL_CAPTURE") || mission.requestedServices.includes("AWE")) required.push("THERMAL");
    if (mission.requestedServices.includes("DIGITAL_TWIN") || mission.requestedServices.includes("ROOF_GEOMETRY")) required.push("GEOMETRY");

    const pkg = sensorReadinessByPackage[mission.sensorPackageId] || { sensors: [] };
    const capable = new Set(pkg.sensors.flatMap((s) => s.capabilities));
    const completed = complete ? required.filter((r) => r === "GEOMETRY" ? capable.has("PHOTOGRAMMETRY") : capable.has(r)) : [];
    const missing = required.filter((r) => !completed.includes(r));

    const coverage = complete ? parseInt(complete.coverageState, 10) || 0 : sessions.length ? parseInt(sessions[sessions.length - 1].coverageState, 10) || 0 : 0;
    let state;
    if (!complete || missing.length || coverage < 95) state = "RECAPTURE_REQUIRED";
    else if (coverage < 100) state = "APPROVED_WITH_WARNINGS";
    else state = "APPROVED";

    const record = {
      assessmentId: nid("CV"), missionId, captureId: complete?.captureId || sessions[0]?.captureId || null,
      propertyId: mission.propertyId, state, requiredOutputs: required, completedOutputs: completed,
      missingOutputs: missing, coverageState: coverage + "%",
      qualityFlags: missing.length ? missing.map((m) => m + " output not produced") : [],
      reviewedBy: actor, reviewedAt: nowIso(),
      notes: state === "RECAPTURE_REQUIRED" ? "Capture package incomplete — recapture required." : "Capture package accepted.",
    };
    store.validations = store.validations.filter((v) => v.missionId !== missionId).concat(record);

    emit(missionId, mission.propertyId, "POST_FLIGHT_REVIEW_STARTED", { actor });
    if (state === "RECAPTURE_REQUIRED") {
      emit(missionId, mission.propertyId, "RECAPTURE_REQUIRED", { actor, reason: record.notes });
    } else {
      emit(missionId, mission.propertyId, "CAPTURE_APPROVED", { actor, reason: record.notes });
      emit(missionId, mission.propertyId, "ATC_CLOSEOUT", { actor, reason: "ATC operational responsibility closed." });
    }
    return record;
  },

  listEvents: (missionId) => serve(() => store.events.filter((e) => e.missionId === missionId)),
  listAudit: (missionId) => serve(() => store.audit.filter((e) => e.missionId === missionId)),

  /* ------------------------------------------------------ command view -- */

  getQueue: async () => {
    const missions = await MissionService.listAll();
    return missions
      .filter((m) => !["COMPLETE", "CANCELLED"].includes(m.missionState))
      .map((m) => {
        const a = store.assessments[m.id];
        return {
          mission: m,
          atcState: a ? effectiveState(a) : ATC_STATE.NOT_EVALUATED,
          blockingCount: a?.blockingCount ?? null,
          unresolvedCount: a?.unresolvedCount ?? null,
          warningCount: a?.warningCount ?? null,
          thermalBand: a?.thermal?.band ?? null,
          launch: store.launchAuthorizations[m.id]?.state || LAUNCH_STATE.NOT_REQUESTED,
          live: store.liveStates[m.id]?.state || LIVE_STATE.NOT_STARTED,
        };
      });
  },

  __store: store,
};

export default AtcService;
