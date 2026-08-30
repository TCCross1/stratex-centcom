/**
 * MISSION SERVICE
 *
 * The only way the application touches missions. Every write goes through a
 * transition guard and emits a timeline event and an audit event — there is no
 * path that silently mutates state.
 *
 * PROVIDER BOUNDARY: the arrays below are the in-memory development provider.
 * Replacing `provider` with a persistence-backed implementation is the entire
 * change needed to go live; no page imports a fixture array directly.
 */
import {
  missions as seedMissions, captureSessions as seedCaptures,
  authorizations as seedAuth, blockers as seedBlockers,
  resourceAssignments as seedAssignments, sensorPackages,
} from "./fixtures.js";
import { seededTimeline, seededAudit } from "./history.js";
import {
  canTransition, evaluateReadyGate, evaluateCloseout, legalNextStates,
  checkSensorCompatibility, isHardBlocker, stageByKey, isTerminal,
} from "./lifecycle.js";
import { serve } from "../shared/transport.js";

/* ---------------------------------------------------------- provider ----- */

const provider = {
  missions: seedMissions.map((m) => ({ ...m })),
  captures: seedCaptures.map((c) => ({ ...c })),
  authorizations: seedAuth.map((a) => ({ ...a })),
  blockers: seedBlockers.map((b) => ({ ...b })),
  assignments: seedAssignments.map((a) => ({ ...a })),
  // Seeded history is development data and is flagged `seeded: true` on every
  // record. Session events append after it.
  timeline: seededTimeline.map((e) => ({ ...e })),
  audit: seededAudit.map((e) => ({ ...e })),
};

let seq = 1000;
const nextId = (prefix) => prefix + "-" + ++seq;
const nowIso = () => new Date().toISOString();

/** Every meaningful write emits both a friendly timeline event and an audit
 *  record. They are different artifacts for different readers. */
function emit({ mission, action, fromState, toState, actor, reason, sourceSystem = "centcom.mission" }) {
  provider.timeline.push({
    eventId: nextId("MTL"), missionId: mission.id, propertyId: mission.propertyId,
    type: action, at: nowIso(), summary: reason || action.replace(/_/g, " "),
    fromState, toState, actor,
  });
  provider.audit.push({
    auditId: nextId("MAU"), at: nowIso(), actor, actorType: actor?.startsWith("u-") ? "OPERATOR" : "SYSTEM",
    domain: "MISSION", action, objectType: "Mission", objectId: mission.id,
    propertyId: mission.propertyId, missionId: mission.id,
    previousState: fromState ?? null, newState: toState ?? null,
    reason: reason || null, sourceSystem,
  });
}

const find = (id) => provider.missions.find((m) => m.id === id);
const blockersFor = (id) => provider.blockers.filter((b) => b.missionId === id);
const capturesFor = (id) => provider.captures.filter((c) => c.missionId === id);
const sensorFor = (m) => sensorPackages.find((s) => s.id === m.sensorPackageId) || null;

/** Everything the guards need to judge a mission. */
const contextFor = (m) => ({
  sensorPackage: sensorFor(m),
  blockers: blockersFor(m.id),
  captureSessions: capturesFor(m.id),
});

/* ------------------------------------------------------------ read API --- */

export const MissionService = {
  /** INTERNAL: CENTCOM-wide view. Tenant filtering is enforced in Phase 12;
   *  this method is explicitly internal and must not back an external surface. */
  listAll: () => serve(() => provider.missions),

  listByProperty: (propertyId) =>
    serve(() => provider.missions.filter((m) => m.propertyId === propertyId)),

  /** Tenant-scoped read. The boundary exists now even though enforcement is
   *  minimal, so external surfaces never learn to call listAll(). */
  listByOrganization: (organizationId) =>
    serve(() =>
      provider.missions.filter(
        (m) => m.requestingPartyType === "ORGANIZATION" && m.requestingPartyRef === organizationId
      )
    ),

  get: (missionId) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      return m;
    }),

  /** A mission plus everything needed to render its command surface. */
  getDetail: (missionId) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const ctx = contextFor(m);
      return {
        mission: m,
        sensorPackage: ctx.sensorPackage,
        blockers: ctx.blockers,
        captureSessions: ctx.captureSessions.sort((a, b) => a.attemptNumber - b.attemptNumber),
        authorization: provider.authorizations.find((a) => a.missionId === missionId) || null,
        assignments: provider.assignments.filter((a) => a.missionId === missionId),
        readyGate: evaluateReadyGate(m, ctx),
        closeout: evaluateCloseout(m, ctx),
        nextStates: legalNextStates(m, ctx),
        sensorMissing: ctx.sensorPackage ? checkSensorCompatibility(m, ctx.sensorPackage) : null,
        timeline: provider.timeline.filter((e) => e.missionId === missionId),
        audit: provider.audit.filter((e) => e.missionId === missionId),
        relatedMissions: provider.missions.filter(
          (x) => x.parentMissionId === missionId || x.id === m.parentMissionId
        ),
      };
    }),

  listBlockers: (missionId) => serve(() => blockersFor(missionId)),
  listCaptureSessions: (missionId) => serve(() => capturesFor(missionId)),
  listQueue: () =>
    serve(() =>
      provider.missions.filter(
        (m) => !isTerminal(m.missionState) && m.missionState !== "COMPLETE"
      )
    ),

  getCommandSummary: () =>
    serve(() => {
      const M = provider.missions;
      const inState = (...s) => M.filter((m) => s.includes(m.missionState)).length;
      return {
        total: M.length,
        awaitingAuthorization: inState("AUTHORIZATION_PENDING"),
        scheduling: inState("SCHEDULING", "CREATED"),
        upcoming: inState("SCHEDULED"),
        atcReview: inState("ATC_REVIEW"),
        ready: inState("READY"),
        active: inState("LAUNCHED", "CAPTURING"),
        processing: inState("DATA_VALIDATION", "PROCESSING", "CORTEX_ANALYSIS", "PASSPORT_SYNC"),
        blocked: M.filter((m) => blockersFor(m.id).some(isHardBlocker)).length,
        recapture: inState("RECAPTURE_REQUIRED"),
        complete: inState("COMPLETE"),
        cancelled: inState("CANCELLED"),
      };
    }),

  /**
   * ATC HANDOFF — the normalized readiness request. ATC consumes this
   * projection; it never reads or duplicates the mission record itself.
   */
  getReadinessRequest: (missionId) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const sensor = sensorFor(m);
      return {
        missionId: m.id,
        propertyId: m.propertyId,
        scheduledWindow: { start: m.scheduledStart, end: m.scheduledEnd, type: m.timeWindowType },
        objective: m.assessmentObjective,
        requestedServices: m.requestedServices,
        assignedAircraft: m.aircraftId,
        sensorPackage: m.sensorPackageId,
        requiredCapabilities: sensor ? sensor.capabilities : [],
        operator: m.operatorId,
        priority: m.priority,
      };
    }),

  /* --------------------------------------------------------- write API -- */

  /**
   * Validate a draft before creation. The wizard calls this on every step so a
   * blocked submission always explains itself rather than failing silently.
   */
  validateDraft: (draft) => {
    const errors = [];
    if (!draft.propertyId) errors.push("A property must be resolved before a mission can be created.");
    if (!draft.assessmentObjective) errors.push("An assessment objective is required.");
    if (!draft.requestedPackage) errors.push("A package is required.");
    if (!draft.requestedServices || draft.requestedServices.length === 0)
      errors.push("At least one requested service is required.");
    if (draft.originType === "PROFESSIONAL" && !draft.requestingPartyRef)
      errors.push("A professional-origin mission must reference the requesting organization.");

    // Resource planning is provisional, but an incompatible package is never
    // silently allowed through.
    const warnings = [];
    if (draft.sensorPackageId) {
      const pkg = sensorPackages.find((sp) => sp.id === draft.sensorPackageId);
      const missing = pkg ? checkSensorCompatibility(draft, pkg) : ["unknown package"];
      if (missing.length)
        errors.push("The selected sensor package cannot deliver this mission. Missing: " + missing.join(", ") + ".");
    } else {
      warnings.push("No sensor package selected yet — required before the mission can reach READY.");
    }
    if (!draft.operatorId) warnings.push("No operator assigned yet.");
    if (!draft.aircraftId) warnings.push("No aircraft assigned yet.");
    if (draft.originType === "PROFESSIONAL" && draft.authorizationState !== "CONFIRMED")
      warnings.push("Homeowner authorization is required before this mission can advance.");

    return { valid: errors.length === 0, errors, warnings };
  },

  create: (input, actor = "u-001") =>
    serve(() => {
      const check = MissionService.validateDraft(input);
      if (!check.valid) throw new Error(check.errors.join(" "));
      const mission = {
        ...input,
        id: input.id || nextId("M-NEW"),
        missionState: "CREATED",
        authorizationState: input.authorizationState || "NOT_REQUIRED",
        captureState: "NOT_STARTED", evidenceState: "NOT_STARTED",
        processingState: "NOT_STARTED", cortexState: "NOT_STARTED",
        passportState: "NOT_STARTED", reportState: "NOT_STARTED",
        closeoutState: "NOT_STARTED",
        createdAt: nowIso(), updatedAt: nowIso(), createdBy: actor,
      };
      provider.missions.push(mission);
      emit({ mission, action: "MISSION_CREATED", toState: "CREATED", actor, reason: "Mission created." });
      return mission;
    }),

  /** The single write path for state. Refuses illegal moves with a reason. */
  transition: (missionId, toState, { actor = "u-001", reason = null } = {}) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const verdict = canTransition(m, toState, contextFor(m));
      if (!verdict.allowed) throw new Error(verdict.reason);
      const from = m.missionState;
      m.missionState = toState;
      m.updatedAt = nowIso();
      if (toState === "COMPLETE") m.closeoutState = "COMPLETE";
      emit({ mission: m, action: "MISSION_STATE_CHANGED", fromState: from, toState, actor, reason });
      return m;
    }),

  cancel: (missionId, cancelReason, { actor = "u-001", note = null } = {}) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const verdict = canTransition(m, "CANCELLED");
      if (!verdict.allowed) throw new Error(verdict.reason);
      const from = m.missionState;
      m.missionState = "CANCELLED";
      m.cancelReason = cancelReason;
      m.updatedAt = nowIso();
      emit({ mission: m, action: "MISSION_CANCELLED", fromState: from, toState: "CANCELLED", actor, reason: note || cancelReason });
      return m;
    }),

  /** Abort stops a capture that already started. It is never a quiet cancel. */
  abort: (missionId, abortReason, { actor = "u-001" } = {}) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const verdict = canTransition(m, "ABORTED", contextFor(m));
      if (!verdict.allowed) throw new Error(verdict.reason);
      const session = capturesFor(missionId).find((c) => c.status === "IN_PROGRESS");
      if (session) {
        session.status = "ABORTED";
        session.abortReason = abortReason;
        session.endedAt = nowIso();
      }
      const from = m.missionState;
      m.missionState = "ABORTED";
      m.captureState = "ABORTED";
      m.updatedAt = nowIso();
      emit({ mission: m, action: "CAPTURE_ABORTED", fromState: from, toState: "ABORTED", actor, reason: abortReason });
      return m;
    }),

  assignResource: (missionId, resourceType, resourceId, { actor = "u-001" } = {}) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const field = { OPERATOR: "operatorId", AIRCRAFT: "aircraftId", SENSOR: "sensorPackageId", VEHICLE: "vehicleId" }[resourceType];
      if (!field) throw new Error("Unknown resource type: " + resourceType);

      const previous = m[field];
      if (previous === resourceId) return m;

      // A reassignment supersedes the prior record; it never erases it.
      let open = provider.assignments.find(
        (a) => a.missionId === missionId && a.resourceType === resourceType && a.state === "ASSIGNED"
      );

      // If the mission already carried a resource with no assignment record —
      // seeded data, or an import — backfill it so the history is not lost.
      if (!open && previous) {
        open = {
          assignmentId: nextId("RA"), missionId, resourceType, resourceId: previous,
          state: "ASSIGNED", assignedAt: m.createdAt || nowIso(), replacedBy: null,
          backfilled: true,
        };
        provider.assignments.push(open);
      }
      if (open) { open.state = "REASSIGNED"; open.replacedBy = resourceId; }

      provider.assignments.push({
        assignmentId: nextId("RA"), missionId, resourceType, resourceId,
        state: "ASSIGNED", assignedAt: nowIso(), replacedBy: null,
      });
      m[field] = resourceId;
      m.updatedAt = nowIso();
      emit({
        mission: m,
        action: previous ? "RESOURCE_REASSIGNED" : "RESOURCE_ASSIGNED",
        actor, reason: resourceType + " " + (previous ? previous + " → " : "") + resourceId,
      });
      return m;
    }),

  addBlocker: (missionId, blocker, { actor = "system" } = {}) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const record = {
        blockerId: nextId("BLK"), missionId, propertyId: m.propertyId,
        category: blocker.category, severity: blocker.severity, status: "OPEN",
        message: blocker.message, createdAt: nowIso(), resolvedAt: null,
        sourceSystem: blocker.sourceSystem || "centcom.mission", resolution: null,
      };
      provider.blockers.push(record);
      emit({ mission: m, action: "BLOCKER_CREATED", actor, reason: blocker.message });
      return record;
    }),

  /** Blockers are resolved with an actor and a reason, never deleted. */
  resolveBlocker: (blockerId, resolution, { actor = "u-001", status = "RESOLVED" } = {}) =>
    serve(() => {
      const b = provider.blockers.find((x) => x.blockerId === blockerId);
      if (!b) throw new Error("Blocker not found.");
      b.status = status;
      b.resolution = resolution;
      b.resolvedAt = nowIso();
      const m = find(b.missionId);
      if (m) emit({ mission: m, action: "BLOCKER_RESOLVED", actor, reason: resolution });
      return b;
    }),

  requestAuthorization: (missionId, scope, { actor = "u-001", organizationId = null, partyRef = null } = {}) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const record = {
        authorizationId: nextId("AUTH"), propertyId: m.propertyId, missionId,
        requestingOrganizationId: organizationId, partyRef, scope,
        status: "SENT", requestedAt: nowIso(), confirmedAt: null,
        declinedAt: null, expiresAt: null, revokedAt: null,
      };
      provider.authorizations.push(record);
      m.authorizationState = "SENT";
      m.homeownerAuthorizationId = record.authorizationId;
      m.updatedAt = nowIso();
      emit({ mission: m, action: "AUTHORIZATION_REQUESTED", actor, reason: "Scope: " + scope.join(", ") });
      return record;
    }),

  confirmAuthorization: (authorizationId, { actor = "homeowner" } = {}) =>
    serve(() => {
      const a = provider.authorizations.find((x) => x.authorizationId === authorizationId);
      if (!a) throw new Error("Authorization not found.");
      a.status = "CONFIRMED";
      a.confirmedAt = nowIso();
      const m = find(a.missionId);
      if (m) {
        m.authorizationState = "CONFIRMED";
        m.updatedAt = nowIso();
        emit({ mission: m, action: "AUTHORIZATION_CONFIRMED", actor, reason: "Homeowner confirmed." });
      }
      return a;
    }),

  schedule: (missionId, { start, end, windowType = "DAY", actor = "u-001" }) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      m.scheduledStart = start;
      m.scheduledEnd = end;
      m.timeWindowType = windowType;
      m.updatedAt = nowIso();
      emit({ mission: m, action: "SCHEDULED", actor, reason: "Window " + start + " → " + end });
      return m;
    }),

  /**
   * RECAPTURE — another attempt at the SAME mission. The prior session is left
   * untouched, the attempt number increments, and no new property or mission
   * is created.
   */
  startRecapture: (missionId, reason, { actor = "u-001" } = {}) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const prior = capturesFor(missionId);
      const session = {
        captureId: "CAP-" + missionId.slice(-3) + "-" + (prior.length + 1),
        missionId, propertyId: m.propertyId, attemptNumber: prior.length + 1,
        startedAt: nowIso(), endedAt: null, operatorId: m.operatorId, aircraftId: m.aircraftId,
        status: "IN_PROGRESS", abortReason: null, coverageState: "0%", notes: reason,
      };
      provider.captures.push(session);
      m.captureState = "IN_PROGRESS";
      m.updatedAt = nowIso();
      emit({ mission: m, action: "CAPTURE_STARTED", actor, reason: "Recapture attempt " + session.attemptNumber + ": " + reason });
      return session;
    }),

  /**
   * RESCAN — a NEW mission on the same property, linked to the earlier one.
   * A rescan is a new observation, not another attempt at an old one.
   */
  createRescan: (parentMissionId, overrides = {}, { actor = "u-001" } = {}) =>
    serve(() => {
      const parent = find(parentMissionId);
      if (!parent) throw new Error("Parent mission not found.");
      const mission = {
        ...parent,
        ...overrides,
        id: overrides.id || nextId("M-RESCAN"),
        propertyId: parent.propertyId,
        parentMissionId,
        relationshipType: "RESCAN_OF",
        rescanReason: overrides.rescanReason || "New observation for longitudinal comparison.",
        missionState: "CREATED",
        captureState: "NOT_STARTED", evidenceState: "NOT_STARTED",
        processingState: "NOT_STARTED", cortexState: "NOT_STARTED",
        passportState: "NOT_STARTED", reportState: "NOT_STARTED", closeoutState: "NOT_STARTED",
        scheduledStart: null, scheduledEnd: null,
        createdAt: nowIso(), updatedAt: nowIso(), createdBy: actor,
      };
      provider.missions.push(mission);
      emit({ mission, action: "MISSION_CREATED", toState: "CREATED", actor, reason: "Rescan of " + parentMissionId });
      return mission;
    }),

  markRecaptureRequired: (missionId, reason, { actor = "u-001" } = {}) =>
    serve(() => {
      const m = find(missionId);
      if (!m) throw new Error("Mission not found.");
      const verdict = canTransition(m, "RECAPTURE_REQUIRED", contextFor(m));
      if (!verdict.allowed) throw new Error(verdict.reason);
      const from = m.missionState;
      m.missionState = "RECAPTURE_REQUIRED";
      m.captureState = "RECAPTURE_REQUIRED";
      m.rescanReason = reason;
      m.updatedAt = nowIso();
      emit({ mission: m, action: "RECAPTURE_REQUIRED", fromState: from, toState: "RECAPTURE_REQUIRED", actor, reason });
      return m;
    }),

  listTimeline: (missionId) => serve(() => provider.timeline.filter((e) => e.missionId === missionId)),
  listAudit: (missionId) => serve(() => provider.audit.filter((e) => e.missionId === missionId)),

  /** Test/reset seam for the in-memory provider. */
  __provider: provider,
};

export default MissionService;
