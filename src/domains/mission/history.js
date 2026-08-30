/**
 * SEEDED MISSION HISTORY — timeline and audit.
 *
 * These are DEVELOPMENT FIXTURES describing what would have happened on a
 * seeded mission. They are marked `seeded: true` so nothing here can be
 * mistaken for a record of a real flight.
 *
 * TIMELINE is the operator-readable story.
 * AUDIT is the system state-change record.
 * They are generated from the same script but are not the same artifact.
 */
import { iso, ago } from "../../utils/format.js";

/**
 * A compact script per mission: [minutesAgo, eventType, summary, from, to, actor].
 * Only completed or in-flight missions carry history; a mission that has not
 * moved has nothing to show, and says so rather than inventing events.
 */
const SCRIPTS = {
  "M-2026-0827-012": [
    [10080, "MISSION_CREATED", "Mission created for roof verification after the replacement project.", null, "CREATED", "u-001"],
    [10070, "SCHEDULE_REQUESTED", "Requested window 27 Aug, day.", "CREATED", "SCHEDULING", "u-001"],
    [10060, "SCHEDULED", "Scheduled 27 Aug 09:00–11:40.", "SCHEDULING", "SCHEDULED", "u-001"],
    [10050, "RESOURCE_ASSIGNED", "Operator OP-01 assigned.", null, null, "u-001"],
    [10049, "RESOURCE_ASSIGNED", "Aircraft AC-M4TD-01 and full sensor package assigned.", null, null, "u-001"],
    [3000, "ATC_REVIEW_STARTED", "ATC readiness review opened.", "SCHEDULED", "ATC_REVIEW", "system"],
    [2990, "READINESS_EVALUATED", "All required checks passed.", null, null, "atc.readiness"],
    [2980, "READY", "Mission cleared to launch.", "ATC_REVIEW", "READY", "atc.readiness"],
    [2900, "LAUNCHED", "Aircraft launched.", "READY", "LAUNCHED", "OP-01"],
    [2895, "CAPTURE_STARTED", "Capture session CAP-012-1 opened.", "LAUNCHED", "CAPTURING", "OP-01"],
    [2760, "CAPTURE_COMPLETE", "Capture complete at 100% coverage.", "CAPTURING", "CAPTURE_COMPLETE", "OP-01"],
    [2750, "DATA_VALIDATION_STARTED", "Coverage and integrity validation started.", "CAPTURE_COMPLETE", "DATA_VALIDATION", "system"],
    [2700, "PROCESSING_STARTED", "Evidence sealed; processing started.", "DATA_VALIDATION", "PROCESSING", "pipeline:processing"],
    [2600, "CORTEX_STARTED", "Analysis CX-0330 enqueued.", "PROCESSING", "CORTEX_ANALYSIS", "pipeline:cortex"],
    [2560, "CORTEX_COMPLETE", "Analysis complete — 4 findings, 2 probable.", null, null, "pipeline:cortex"],
    [2550, "PASSPORT_SYNCED", "Committed as revision r14.", "CORTEX_ANALYSIS", "PASSPORT_SYNC", "pipeline:passport"],
    [2540, "MISSION_COMPLETE", "Mission closed out.", "PASSPORT_SYNC", "COMPLETE", "u-001"],
  ],
  "M-2026-0829-018": [
    [200, "MISSION_CREATED", "Repair verification scan created from the roof project.", null, "CREATED", "u-001"],
    [180, "SCHEDULED", "Scheduled for today.", "SCHEDULING", "SCHEDULED", "u-001"],
    [120, "ATC_REVIEW_STARTED", "ATC readiness review opened.", "SCHEDULED", "ATC_REVIEW", "system"],
    [90, "READY", "Cleared to launch.", "ATC_REVIEW", "READY", "atc.readiness"],
    [50, "LAUNCHED", "Aircraft launched.", "READY", "LAUNCHED", "OP-01"],
    [45, "CAPTURE_STARTED", "Capture session CAP-018-1 opened.", "LAUNCHED", "CAPTURING", "OP-01"],
  ],
  "M-2026-0829-015": [
    [1500, "MISSION_CREATED", "Initial property capture created.", null, "CREATED", "u-001"],
    [1450, "SCHEDULED", "Scheduled window assigned.", "SCHEDULING", "SCHEDULED", "u-001"],
    [1410, "READY", "Cleared to launch.", "ATC_REVIEW", "READY", "atc.readiness"],
    [1400, "CAPTURE_STARTED", "Capture session CAP-015-1 opened.", "LAUNCHED", "CAPTURING", "OP-02"],
    [1340, "CAPTURE_COMPLETE", "Capture ended at 71% coverage.", "CAPTURING", "CAPTURE_COMPLETE", "OP-02"],
    [1200, "DATA_VALIDATION_STARTED", "Coverage validation started.", "CAPTURE_COMPLETE", "DATA_VALIDATION", "system"],
    [1190, "RECAPTURE_REQUIRED", "Rear roof plane, west elevation and chimney missing.", "DATA_VALIDATION", "RECAPTURE_REQUIRED", "evidence.validation"],
    [1190, "BLOCKER_CREATED", "Coverage below the 95% validation threshold.", null, null, "evidence.validation"],
  ],
  "M-2026-0901-030": [
    [60, "MISSION_CREATED", "Professional-origin roof assessment requested by Bluegrass Roofing.", null, "CREATED", "ORG-BLUEGRASS"],
    [55, "AUTHORIZATION_REQUESTED", "Homeowner authorization requested — capture, access and report scope.", "CREATED", "AUTHORIZATION_PENDING", "u-001"],
    [50, "BLOCKER_CREATED", "Authorization sent but not confirmed.", null, null, "centcom.authorization"],
  ],
  "M-2026-0830-019": [
    [700, "MISSION_CREATED", "Initial property capture created.", null, "CREATED", "u-001"],
    [690, "SCHEDULED", "Scheduled 30 Aug 09:00.", "SCHEDULING", "SCHEDULED", "u-001"],
    [700, "RESOURCE_ASSIGNED", "Operator OP-02 assigned.", null, null, "u-001"],
    [120, "RESOURCE_REASSIGNED", "Operator OP-02 → OP-01.", null, null, "u-001"],
    [40, "ATC_REVIEW_STARTED", "ATC readiness review opened.", "SCHEDULED", "ATC_REVIEW", "system"],
    [30, "WEATHER_BLOCKED", "Sustained wind 24 mph against a 20 mph envelope.", null, null, "atc.readiness"],
  ],
  "M-2026-0820-010": [
    [14400, "MISSION_CREATED", "Initial property capture created.", null, "CREATED", "u-001"],
    [14350, "READY", "Cleared to launch.", "ATC_REVIEW", "READY", "atc.readiness"],
    [14340, "LAUNCHED", "Aircraft launched.", "READY", "LAUNCHED", "OP-01"],
    [14335, "CAPTURE_STARTED", "Capture session CAP-010-1 opened.", "LAUNCHED", "CAPTURING", "OP-01"],
    [14322, "MISSION_ABORTED", "Wind exceeded envelope shortly after launch — capture aborted at 12%.", "CAPTURING", "ABORTED", "OP-01"],
  ],
  "M-2026-0828-014": [
    [2700, "MISSION_CREATED", "Complete property intelligence capture created.", null, "CREATED", "u-001"],
    [2600, "CAPTURE_COMPLETE", "Capture complete at 100% coverage.", "CAPTURING", "CAPTURE_COMPLETE", "OP-02"],
    [2500, "PROCESSING_STARTED", "Evidence sealed; processing started.", "DATA_VALIDATION", "PROCESSING", "pipeline:processing"],
    [2420, "CORTEX_COMPLETE", "Analysis CX-0329 complete — 9 findings.", "PROCESSING", "CORTEX_ANALYSIS", "pipeline:cortex"],
    [2400, "BLOCKER_CREATED", "Passport commit conflict — competing revision for the same property.", "CORTEX_ANALYSIS", "PASSPORT_SYNC", "passport.commit"],
  ],
  "M-2026-0829-017": [
    [600, "MISSION_CREATED", "Annual property scan requested by the owner.", null, "CREATED", "P-6120"],
    [340, "SCHEDULED", "Scheduled window assigned.", "SCHEDULING", "SCHEDULED", "u-001"],
    [320, "CAPTURE_STARTED", "Capture session CAP-017-1 opened.", "LAUNCHED", "CAPTURING", "OP-02"],
    [280, "CAPTURE_COMPLETE", "Capture complete at 100% coverage.", "CAPTURING", "CAPTURE_COMPLETE", "OP-02"],
    [60, "PASSPORT_SYNCED", "Committed as revision r09.", "CORTEX_ANALYSIS", "PASSPORT_SYNC", "pipeline:passport"],
    [5, "MISSION_COMPLETE", "Mission closed out.", "PASSPORT_SYNC", "COMPLETE", "u-001"],
  ],
  "M-2026-0812-011": [
    [1000, "MISSION_CREATED", "Repair completion verification created for project PJ-0150.", null, "CREATED", "u-001"],
    [900, "CAPTURE_COMPLETE", "Capture complete at 100% coverage.", "CAPTURING", "CAPTURE_COMPLETE", "OP-01"],
    [875, "CORTEX_COMPLETE", "Prior prediction confirmed against tear-off reality.", "PROCESSING", "CORTEX_ANALYSIS", "pipeline:cortex"],
    [870, "MISSION_COMPLETE", "Mission closed out; repair verified.", "PASSPORT_SYNC", "COMPLETE", "u-001"],
  ],
  "M-2026-0824-013": [
    [16000, "MISSION_CREATED", "Pre-project survey requested by Bluegrass Roofing.", null, "CREATED", "ORG-BLUEGRASS"],
    [15500, "AUTHORIZATION_REQUESTED", "Homeowner authorization requested.", "CREATED", "AUTHORIZATION_PENDING", "u-001"],
    [11000, "MISSION_CANCELLED", "Homeowner revoked authorization.", "AUTHORIZATION_PENDING", "CANCELLED", "u-001"],
  ],
};

let n = 0;
const nid = (p) => p + "-SEED-" + ++n;

export const seededTimeline = [];
export const seededAudit = [];

for (const [missionId, script] of Object.entries(SCRIPTS)) {
  for (const [minutes, type, summary, from, to, actor] of script) {
    const at = ago(minutes);
    seededTimeline.push({
      eventId: nid("MTL"), missionId, type, at, summary,
      fromState: from, toState: to, actor, seeded: true,
    });
    seededAudit.push({
      auditId: nid("MAU"), at, actor,
      actorType: actor.startsWith("u-") || actor.startsWith("OP-") ? "OPERATOR" : "SYSTEM",
      domain: "MISSION", action: type, objectType: "Mission", objectId: missionId,
      missionId, previousState: from, newState: to,
      reason: summary, sourceSystem: actor.includes(".") || actor.includes(":") ? actor : "centcom.mission",
      seeded: true,
    });
  }
}
