/**
 * MISSION FIXTURES
 *
 * PROPERTY 1 → MANY MISSIONS. A mission is an EVENT belonging to a property.
 *
 * Customer-reported issues in these records are CONTEXT, not property truth.
 * Nothing here is written to Passport as a verified fact — only validated
 * downstream evidence can do that.
 */
import { iso, ago } from "../../utils/format.js";

export const MISSION_ORIGIN = [
  "STRATEX_INTERNAL", "PROFESSIONAL", "HOMEOWNER", "MAINTENANCE",
  "REINSPECTION", "REPAIR_VERIFICATION", "OTHER",
];

export const ASSESSMENT_OBJECTIVES = [
  "WHOLE_HOME", "ROOF", "STORM_DAMAGE", "LEAK_MOISTURE", "THERMAL", "ENERGY",
  "EXTERIOR", "HVAC_ENVELOPE", "SOLAR", "REMODEL", "PRE_PROJECT", "POST_PROJECT",
  "REPAIR_VERIFICATION", "COMMERCIAL_ROOF", "CUSTOM",
];

export const REQUESTED_PACKAGES = [
  "DAYSCAN", "THERMALSCAN", "AWE_ASSESSMENT",
  "COMPLETE_PROPERTY_INTELLIGENCE", "PROJECT_VERIFICATION", "CUSTOM_MISSION",
];

export const MISSION_RELATIONSHIP = [
  "INITIAL", "RECAPTURE_OF", "RESCAN_OF", "REPAIR_VERIFICATION_OF", "FOLLOWUP_OF",
];

export const TIME_WINDOW_TYPES = ["DAY", "EVENING", "NIGHT_THERMAL", "CUSTOM"];

/** Resource catalogue. Kept generic — no hardware model is hard-coded into UI. */
export const sensorPackages = [
  { id: "SP-RGB", label: "RGB only", capabilities: ["RGB"] },
  { id: "SP-IR", label: "Thermal only", capabilities: ["THERMAL"] },
  { id: "SP-RGB-IR", label: "RGB + Thermal", capabilities: ["RGB", "THERMAL"] },
  { id: "SP-RGB-LID", label: "RGB + LiDAR", capabilities: ["RGB", "LIDAR", "PHOTOGRAMMETRY"] },
  { id: "SP-RGB-IR-LID", label: "Full package", capabilities: ["RGB", "THERMAL", "LIDAR", "RTK", "PHOTOGRAMMETRY"] },
];

const base = {
  requestingPartyType: "STRATEX", requestingPartyRef: "u-001", createdBy: "u-001",
  focusAreas: [], knownIssues: [], accessNotes: "", occupancyState: "OCCUPIED",
  petGateNotes: "", specialInstructions: "", priority: "NORMAL",
  timeWindowType: "DAY", estimatedDurationMinutes: 90, estimatedDurationIsPlanning: true,
  vehicleId: null, homeownerAuthorizationId: null, atcState: "NOT_REQUESTED",
  captureState: "NOT_STARTED", evidenceState: "NOT_STARTED", processingState: "NOT_STARTED",
  cortexState: "NOT_STARTED", passportState: "NOT_STARTED", reportState: "NOT_STARTED",
  holdReason: null, cancelReason: null, closeoutState: "NOT_STARTED",
  parentMissionId: null, relationshipType: "INITIAL", rescanReason: null,
};

export const missions = [
  // 1 — professional-origin, awaiting homeowner authorization
  { ...base, id: "M-2026-0901-030", propertyId: "SXP-004188",
    originType: "PROFESSIONAL", requestingPartyType: "ORGANIZATION", requestingPartyRef: "ORG-BLUEGRASS",
    missionType: "Roof Assessment", assessmentObjective: "ROOF",
    requestedPackage: "DAYSCAN", requestedServices: ["RGB_MAPPING", "ROOF_GEOMETRY", "MEASUREMENTS"],
    focusAreas: [{ id: "FA-1", area: "West elevation", note: "Cold band reported in prior capture" }],
    knownIssues: [{ id: "KI-1", issue: "Possible insulation displacement", reportedBy: "PROFESSIONAL", location: "West elevation", severity: null, notes: "Reported context — not a verified finding." }],
    missionState: "AUTHORIZATION_PENDING", authorizationState: "SENT",
    homeownerAuthorizationId: "AUTH-0091",
    requestedDate: iso("2026-09-01"), scheduledStart: null, scheduledEnd: null,
    operatorId: null, aircraftId: null, sensorPackageId: "SP-RGB-LID",
    createdAt: ago(60), updatedAt: ago(50) },

  // 2 — scheduled DayScan, homeowner origin
  { ...base, id: "M-2026-0830-020", propertyId: "SXP-004179",
    originType: "HOMEOWNER", requestingPartyType: "PARTY", requestingPartyRef: "P-6120",
    missionType: "Annual Property Scan", assessmentObjective: "WHOLE_HOME",
    requestedPackage: "DAYSCAN", requestedServices: ["RGB_MAPPING", "EXTERIOR_CAPTURE", "MEASUREMENTS"],
    missionState: "SCHEDULED", authorizationState: "NOT_REQUIRED",
    requestedDate: iso("2026-08-30"), scheduledStart: iso("2026-08-30T13:30:00"), scheduledEnd: iso("2026-08-30T15:00:00"),
    operatorId: "OP-02", aircraftId: "AC-M4TD-02", sensorPackageId: "SP-RGB-LID",
    createdAt: ago(400), updatedAt: ago(120) },

  // 3 — scheduled ThermalScan, night window
  { ...base, id: "M-2026-0902-031", propertyId: "SXP-004182",
    originType: "STRATEX_INTERNAL", missionType: "Thermal Follow-up",
    assessmentObjective: "LEAK_MOISTURE", requestedPackage: "THERMALSCAN",
    requestedServices: ["THERMAL_CAPTURE", "AWE"],
    focusAreas: [{ id: "FA-2", area: "North roof plane / attic", note: "Confirm the moisture signature from CX-0330" }],
    timeWindowType: "NIGHT_THERMAL", estimatedDurationMinutes: 60,
    missionState: "SCHEDULED", authorizationState: "NOT_REQUIRED",
    requestedDate: iso("2026-09-02"), scheduledStart: iso("2026-09-02T21:30:00"), scheduledEnd: iso("2026-09-02T22:30:00"),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", sensorPackageId: "SP-RGB-IR",
    createdAt: ago(28), updatedAt: ago(20), priority: "HIGH" },

  // 4 — ATC review, weather hold
  { ...base, id: "M-2026-0830-019", propertyId: "SXP-004191",
    originType: "STRATEX_INTERNAL", missionType: "Initial Property Capture",
    assessmentObjective: "WHOLE_HOME", requestedPackage: "DAYSCAN",
    requestedServices: ["RGB_MAPPING", "THERMAL_CAPTURE"],
    missionState: "ATC_REVIEW", authorizationState: "NOT_REQUIRED", atcState: "IN_REVIEW",
    requestedDate: iso("2026-08-30"), scheduledStart: iso("2026-08-30T09:00:00"), scheduledEnd: iso("2026-08-30T10:30:00"),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", sensorPackageId: "SP-RGB-IR",
    createdAt: ago(700), updatedAt: ago(30) },

  // 5 — ready to launch
  { ...base, id: "M-2026-0831-021", propertyId: "SXP-004188",
    originType: "STRATEX_INTERNAL", missionType: "Recapture — North Elevation",
    assessmentObjective: "EXTERIOR", requestedPackage: "DAYSCAN",
    requestedServices: ["RGB_MAPPING"],
    missionState: "READY", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: iso("2026-08-31"), scheduledStart: iso("2026-08-31T10:00:00"), scheduledEnd: iso("2026-08-31T11:00:00"),
    operatorId: "OP-01", aircraftId: "AC-DOCK-03", sensorPackageId: "SP-RGB",
    captureState: "READY", createdAt: ago(300), updatedAt: ago(10) },

  // 6 — active capture
  { ...base, id: "M-2026-0829-018", propertyId: "SXP-004182",
    originType: "STRATEX_INTERNAL", missionType: "Roof Verification Scan",
    assessmentObjective: "REPAIR_VERIFICATION", requestedPackage: "PROJECT_VERIFICATION",
    requestedServices: ["RGB_MAPPING", "THERMAL_CAPTURE", "PROJECT_VERIFICATION"],
    missionState: "CAPTURING", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: ago(60), scheduledStart: ago(45), scheduledEnd: ago(-15),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", sensorPackageId: "SP-RGB-IR-LID",
    captureState: "IN_PROGRESS", createdAt: ago(200), updatedAt: ago(2),
    relationshipType: "REPAIR_VERIFICATION_OF", parentMissionId: "M-2026-0827-012" },

  // 7 — data validation
  { ...base, id: "M-2026-0829-016", propertyId: "SXP-004188",
    originType: "STRATEX_INTERNAL", missionType: "Initial Property Capture",
    assessmentObjective: "WHOLE_HOME", requestedPackage: "AWE_ASSESSMENT",
    requestedServices: ["RGB_MAPPING", "THERMAL_CAPTURE", "AWE"],
    missionState: "CORTEX_ANALYSIS", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: ago(420), scheduledStart: ago(400), scheduledEnd: ago(380),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", sensorPackageId: "SP-RGB-IR",
    captureState: "COMPLETE", evidenceState: "VALIDATED", processingState: "COMPLETE",
    cortexState: "RUNNING", createdAt: ago(500), updatedAt: ago(39) },

  // 8 — recapture required
  { ...base, id: "M-2026-0829-015", propertyId: "SXP-004190",
    originType: "STRATEX_INTERNAL", missionType: "Initial Property Capture",
    assessmentObjective: "WHOLE_HOME", requestedPackage: "DAYSCAN",
    requestedServices: ["RGB_MAPPING", "ROOF_GEOMETRY"],
    missionState: "RECAPTURE_REQUIRED", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: ago(1450), scheduledStart: ago(1400), scheduledEnd: ago(1340),
    operatorId: "OP-02", aircraftId: "AC-M4TD-02", sensorPackageId: "SP-RGB",
    captureState: "RECAPTURE_REQUIRED", evidenceState: "FAILED_VALIDATION",
    rescanReason: "Coverage 71% — rear roof plane, west elevation and chimney missing.",
    createdAt: ago(1500), updatedAt: ago(1190) },

  // 9 — Passport sync
  { ...base, id: "M-2026-0828-014", propertyId: "SXP-004193",
    originType: "STRATEX_INTERNAL", missionType: "Initial Property Capture",
    assessmentObjective: "WHOLE_HOME", requestedPackage: "COMPLETE_PROPERTY_INTELLIGENCE",
    requestedServices: ["RGB_MAPPING", "THERMAL_CAPTURE", "DIGITAL_TWIN", "MEASUREMENTS", "REPORT"],
    missionState: "PASSPORT_SYNC", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: ago(2650), scheduledStart: ago(2600), scheduledEnd: ago(2520),
    operatorId: "OP-02", aircraftId: "AC-DOCK-03", sensorPackageId: "SP-RGB-IR-LID",
    captureState: "COMPLETE", evidenceState: "VALIDATED", processingState: "COMPLETE",
    cortexState: "COMPLETE", passportState: "CONFLICT", reportState: "BLOCKED",
    createdAt: ago(2700), updatedAt: ago(2400) },

  // 10 — complete
  { ...base, id: "M-2026-0827-012", propertyId: "SXP-004182",
    originType: "STRATEX_INTERNAL", missionType: "Roof Verification Scan",
    assessmentObjective: "ROOF", requestedPackage: "COMPLETE_PROPERTY_INTELLIGENCE",
    requestedServices: ["RGB_MAPPING", "THERMAL_CAPTURE", "DIGITAL_TWIN", "MEASUREMENTS", "REPORT"],
    missionState: "COMPLETE", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: iso("2026-08-27"), scheduledStart: iso("2026-08-27T09:00:00"), scheduledEnd: iso("2026-08-27T11:40:00"),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", sensorPackageId: "SP-RGB-IR-LID",
    captureState: "COMPLETE", evidenceState: "VALIDATED", processingState: "COMPLETE",
    cortexState: "COMPLETE", passportState: "SYNCED", reportState: "READY",
    closeoutState: "COMPLETE", createdAt: iso("2026-08-20"), updatedAt: ago(28) },

  // 11 — complete (older property, annual)
  { ...base, id: "M-2026-0829-017", propertyId: "SXP-004179",
    originType: "HOMEOWNER", missionType: "Annual Property Scan",
    assessmentObjective: "WHOLE_HOME", requestedPackage: "DAYSCAN",
    requestedServices: ["RGB_MAPPING", "DIGITAL_TWIN"],
    missionState: "COMPLETE", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: ago(340), scheduledStart: ago(320), scheduledEnd: ago(280),
    operatorId: "OP-02", aircraftId: "AC-M4TD-02", sensorPackageId: "SP-RGB-LID",
    captureState: "COMPLETE", evidenceState: "VALIDATED", processingState: "COMPLETE",
    cortexState: "COMPLETE", passportState: "SYNCED", reportState: "READY",
    closeoutState: "COMPLETE", createdAt: ago(600), updatedAt: ago(5) },

  // 12 — repair verification, complete
  { ...base, id: "M-2026-0812-011", propertyId: "SXP-004150",
    originType: "REPAIR_VERIFICATION", missionType: "Repair Completion Verification",
    assessmentObjective: "REPAIR_VERIFICATION", requestedPackage: "PROJECT_VERIFICATION",
    requestedServices: ["RGB_MAPPING", "THERMAL_CAPTURE", "PROJECT_VERIFICATION"],
    relatedProjectId: "PJ-0150", relatedRepairId: "RP-0150",
    missionState: "COMPLETE", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: ago(920), scheduledStart: ago(900), scheduledEnd: ago(880),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", sensorPackageId: "SP-RGB-IR",
    captureState: "COMPLETE", evidenceState: "VALIDATED", processingState: "COMPLETE",
    cortexState: "COMPLETE", passportState: "SYNCED", reportState: "READY",
    closeoutState: "COMPLETE", createdAt: ago(1000), updatedAt: ago(870) },

  // 13 — rescan of an earlier mission
  { ...base, id: "M-2026-0805-009", propertyId: "SXP-003044",
    originType: "REINSPECTION", missionType: "Annual Property Scan",
    assessmentObjective: "WHOLE_HOME", requestedPackage: "COMPLETE_PROPERTY_INTELLIGENCE",
    requestedServices: ["RGB_MAPPING", "THERMAL_CAPTURE", "DIGITAL_TWIN", "MEASUREMENTS"],
    missionState: "COMPLETE", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: iso("2026-08-05"), scheduledStart: iso("2026-08-05T09:00:00"), scheduledEnd: iso("2026-08-05T11:20:00"),
    operatorId: "OP-02", aircraftId: "AC-M4TD-02", sensorPackageId: "SP-RGB-IR-LID",
    captureState: "COMPLETE", evidenceState: "VALIDATED", processingState: "COMPLETE",
    cortexState: "COMPLETE", passportState: "SYNCED", reportState: "READY",
    closeoutState: "COMPLETE", relationshipType: "RESCAN_OF", parentMissionId: "M-2026-0616-008",
    rescanReason: "Annual longitudinal comparison.", createdAt: iso("2026-07-20"), updatedAt: iso("2026-08-05") },

  // 14 — cancelled
  { ...base, id: "M-2026-0824-013", propertyId: "SXP-004150",
    originType: "PROFESSIONAL", requestingPartyType: "ORGANIZATION", requestingPartyRef: "ORG-BLUEGRASS",
    missionType: "Pre-Project Survey", assessmentObjective: "PRE_PROJECT",
    requestedPackage: "DAYSCAN", requestedServices: ["RGB_MAPPING"],
    missionState: "CANCELLED", authorizationState: "REVOKED",
    cancelReason: "AUTHORIZATION", requestedDate: iso("2026-08-24"),
    scheduledStart: null, scheduledEnd: null,
    operatorId: null, aircraftId: null, sensorPackageId: "SP-RGB",
    createdAt: iso("2026-08-18"), updatedAt: iso("2026-08-22") },

  // 15 — aborted in the field
  { ...base, id: "M-2026-0820-010", propertyId: "SXP-004191",
    originType: "STRATEX_INTERNAL", missionType: "Initial Property Capture",
    assessmentObjective: "WHOLE_HOME", requestedPackage: "DAYSCAN",
    requestedServices: ["RGB_MAPPING"],
    missionState: "ABORTED", authorizationState: "NOT_REQUIRED", atcState: "APPROVED",
    requestedDate: iso("2026-08-20"), scheduledStart: iso("2026-08-20T14:00:00"), scheduledEnd: iso("2026-08-20T15:30:00"),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", sensorPackageId: "SP-RGB",
    captureState: "ABORTED", createdAt: iso("2026-08-15"), updatedAt: iso("2026-08-20") },

  // 16 — maintenance-origin, created, not yet authorized or scheduled
  { ...base, id: "M-2026-0903-032", propertyId: "SXP-004182",
    originType: "MAINTENANCE", missionType: "Post-Remediation Attic Check",
    assessmentObjective: "LEAK_MOISTURE", requestedPackage: "THERMALSCAN",
    requestedServices: ["THERMAL_CAPTURE"],
    missionState: "CREATED", authorizationState: "NOT_REQUIRED",
    requestedDate: iso("2026-12-01"), scheduledStart: null, scheduledEnd: null,
    operatorId: null, aircraftId: null, sensorPackageId: null,
    createdAt: ago(20), updatedAt: ago(20), priority: "LOW" },
];

/** One mission may have several capture attempts. Attempt 1 is never edited. */
export const captureSessions = [
  { captureId: "CAP-018-1", missionId: "M-2026-0829-018", propertyId: "SXP-004182", attemptNumber: 1,
    startedAt: ago(45), endedAt: null, operatorId: "OP-01", aircraftId: "AC-M4TD-01",
    status: "IN_PROGRESS", abortReason: null, coverageState: "78%", notes: "" },

  { captureId: "CAP-015-1", missionId: "M-2026-0829-015", propertyId: "SXP-004190", attemptNumber: 1,
    startedAt: ago(1400), endedAt: ago(1340), operatorId: "OP-02", aircraftId: "AC-M4TD-02",
    status: "PARTIAL", abortReason: null, coverageState: "71%",
    notes: "Rear roof plane, west elevation and chimney not captured." },

  { captureId: "CAP-010-1", missionId: "M-2026-0820-010", propertyId: "SXP-004191", attemptNumber: 1,
    startedAt: iso("2026-08-20T14:05:00"), endedAt: iso("2026-08-20T14:18:00"),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", status: "ABORTED", abortReason: "WEATHER",
    coverageState: "12%", notes: "Sustained wind exceeded the envelope shortly after launch." },

  { captureId: "CAP-012-1", missionId: "M-2026-0827-012", propertyId: "SXP-004182", attemptNumber: 1,
    startedAt: iso("2026-08-27T09:10:00"), endedAt: iso("2026-08-27T11:35:00"),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", status: "COMPLETE", abortReason: null,
    coverageState: "100%", notes: "" },

  { captureId: "CAP-017-1", missionId: "M-2026-0829-017", propertyId: "SXP-004179", attemptNumber: 1,
    startedAt: ago(320), endedAt: ago(280), operatorId: "OP-02", aircraftId: "AC-M4TD-02",
    status: "COMPLETE", abortReason: null, coverageState: "100%", notes: "" },

  { captureId: "CAP-011-1", missionId: "M-2026-0812-011", propertyId: "SXP-004150", attemptNumber: 1,
    startedAt: ago(900), endedAt: ago(880), operatorId: "OP-01", aircraftId: "AC-M4TD-01",
    status: "COMPLETE", abortReason: null, coverageState: "100%", notes: "" },

  { captureId: "CAP-016-1", missionId: "M-2026-0829-016", propertyId: "SXP-004188", attemptNumber: 1,
    startedAt: ago(400), endedAt: ago(380), operatorId: "OP-01", aircraftId: "AC-M4TD-01",
    status: "COMPLETE", abortReason: null, coverageState: "98%", notes: "" },

  { captureId: "CAP-014-1", missionId: "M-2026-0828-014", propertyId: "SXP-004193", attemptNumber: 1,
    startedAt: ago(2600), endedAt: ago(2520), operatorId: "OP-02", aircraftId: "AC-DOCK-03",
    status: "COMPLETE", abortReason: null, coverageState: "100%", notes: "" },

  { captureId: "CAP-009-1", missionId: "M-2026-0805-009", propertyId: "SXP-003044", attemptNumber: 1,
    startedAt: iso("2026-08-05T09:10:00"), endedAt: iso("2026-08-05T11:15:00"),
    operatorId: "OP-02", aircraftId: "AC-M4TD-02", status: "COMPLETE", abortReason: null,
    coverageState: "100%", notes: "" },
];

/** Homeowner authorization for professional-originated missions. Historical
 *  Passport access is never granted merely because a scan was requested. */
export const authorizations = [
  { authorizationId: "AUTH-0091", propertyId: "SXP-004188", missionId: "M-2026-0901-030",
    requestingOrganizationId: "ORG-BLUEGRASS", partyRef: "P-8841",
    scope: ["MISSION_CAPTURE", "PROPERTY_ACCESS", "REPORT"],
    status: "SENT", requestedAt: ago(50), confirmedAt: null, declinedAt: null,
    expiresAt: iso("2026-09-08"), revokedAt: null },

  { authorizationId: "AUTH-0077", propertyId: "SXP-004150", missionId: "M-2026-0824-013",
    requestingOrganizationId: "ORG-BLUEGRASS", partyRef: "P-7702",
    scope: ["MISSION_CAPTURE"],
    status: "REVOKED", requestedAt: iso("2026-08-18"), confirmedAt: iso("2026-08-19"),
    declinedAt: null, expiresAt: iso("2026-09-18"), revokedAt: iso("2026-08-22") },
];

export const blockers = [
  { blockerId: "BLK-101", missionId: "M-2026-0830-019", propertyId: "SXP-004191",
    category: "WEATHER", severity: "BLOCKING", status: "OPEN",
    message: "Sustained wind 24 mph against a 20 mph envelope.",
    createdAt: ago(30), resolvedAt: null, sourceSystem: "atc.readiness", resolution: null },

  { blockerId: "BLK-102", missionId: "M-2026-0829-015", propertyId: "SXP-004190",
    category: "DATA", severity: "BLOCKING", status: "OPEN",
    message: "Capture coverage 71% — below the 95% validation threshold.",
    createdAt: ago(1190), resolvedAt: null, sourceSystem: "evidence.validation", resolution: null },

  { blockerId: "BLK-103", missionId: "M-2026-0828-014", propertyId: "SXP-004193",
    category: "PASSPORT", severity: "CRITICAL", status: "ACKNOWLEDGED",
    message: "Passport commit conflict — competing revision for the same property.",
    createdAt: ago(2400), resolvedAt: null, sourceSystem: "passport.commit", resolution: null },

  { blockerId: "BLK-104", missionId: "M-2026-0901-030", propertyId: "SXP-004188",
    category: "AUTHORIZATION", severity: "BLOCKING", status: "OPEN",
    message: "Homeowner authorization sent but not yet confirmed.",
    createdAt: ago(50), resolvedAt: null, sourceSystem: "centcom.authorization", resolution: null },

  { blockerId: "BLK-098", missionId: "M-2026-0820-010", propertyId: "SXP-004191",
    category: "WEATHER", severity: "CRITICAL", status: "RESOLVED",
    message: "Wind exceeded envelope during flight — capture aborted.",
    createdAt: iso("2026-08-20T14:18:00"), resolvedAt: iso("2026-08-20T15:00:00"),
    sourceSystem: "atc.telemetry", resolution: "Mission aborted and queued for reschedule." },
];

/** Resource assignment history. A reassignment never overwrites the record. */
export const resourceAssignments = [
  { assignmentId: "RA-01", missionId: "M-2026-0830-019", resourceType: "OPERATOR", resourceId: "OP-02", state: "REASSIGNED", assignedAt: ago(700), replacedBy: "OP-01" },
  { assignmentId: "RA-02", missionId: "M-2026-0830-019", resourceType: "OPERATOR", resourceId: "OP-01", state: "ASSIGNED", assignedAt: ago(120), replacedBy: null },
  { assignmentId: "RA-03", missionId: "M-2026-0830-019", resourceType: "AIRCRAFT", resourceId: "AC-M4TD-01", state: "ASSIGNED", assignedAt: ago(120), replacedBy: null },
];
