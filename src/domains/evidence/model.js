/**
 * EVIDENCE DOMAIN MODEL
 *
 * Constitution:
 *   MISSION defines what was intended.
 *   ATC controls operational readiness.
 *   CAPTURE records what occurred.
 *   EVIDENCE VAULT preserves the original record.
 *   CORTEX interprets evidence.
 *   PASSPORT preserves validated property truth.
 *
 * Original evidence is never rewritten to agree with anything downstream.
 */

/** PROPERTY → MISSION → CAPTURE SESSION → CAPTURE PACKAGE → EVIDENCE ASSETS */
export const PACKAGE_STATUS = {
  OPEN: "OPEN", RECEIVING: "RECEIVING", CLOSED: "CLOSED", VALIDATING: "VALIDATING",
  APPROVED: "APPROVED", APPROVED_WITH_WARNINGS: "APPROVED_WITH_WARNINGS",
  RECAPTURE_REQUIRED: "RECAPTURE_REQUIRED", REJECTED: "REJECTED",
  INGESTED: "INGESTED", ARCHIVED: "ARCHIVED",
};

/**
 * ORIGINAL vs DERIVED is a hard distinction. An original never claims a
 * processing parent; a derived artifact always names one.
 */
export const ARTIFACT_ORIGIN = { ORIGINAL: "ORIGINAL", DERIVED: "DERIVED" };

export const ORIGINAL_TYPES = [
  "RGB_IMAGE", "THERMAL_IMAGE", "THERMAL_RJPEG", "VIDEO", "TELEMETRY_LOG",
  "FLIGHT_LOG", "POINT_CLOUD_SOURCE", "LIDAR_SOURCE", "DEPTH_DATA", "PANORAMA",
  "GPS_LOG", "RTK_LOG", "OPERATOR_PHOTO", "DOCUMENT", "OTHER",
];

export const DERIVED_TYPES = [
  "THUMBNAIL", "NORMALIZED_RGB", "THERMAL_RENDER", "THERMAL_OVERLAY", "ORTHOMOSAIC",
  "POINT_CLOUD", "MESH", "TEXTURED_MESH", "ROOF_GEOMETRY", "CAD", "BIM",
  "MEASUREMENT_SET", "ANNOTATION_SET", "REPORT_ASSET", "OTHER_DERIVED",
];

/**
 * Thermal has three distinct things that must never be merged. A rendered
 * JPEG is a picture of temperature; it is not the radiometric data.
 */
export const THERMAL_KIND = {
  RADIOMETRIC_SOURCE: "RADIOMETRIC_SOURCE",
  RENDERED_THERMAL_IMAGE: "RENDERED_THERMAL_IMAGE",
  THERMAL_DERIVED_OVERLAY: "THERMAL_DERIVED_OVERLAY",
};

export const INGEST_STATE = {
  NOT_STARTED: "NOT_STARTED", QUEUED: "QUEUED", INGESTING: "INGESTING",
  COMPLETE: "COMPLETE", COMPLETE_WITH_WARNINGS: "COMPLETE_WITH_WARNINGS",
  FAILED: "FAILED", QUARANTINED: "QUARANTINED",
};

export const IMMUTABILITY = {
  IMMUTABLE: "IMMUTABLE", MUTABLE_METADATA: "MUTABLE_METADATA", NOT_STORED: "NOT_STORED",
};

export const QUALITY_STATE = {
  NOT_EVALUATED: "NOT_EVALUATED", PASS: "PASS",
  PASS_WITH_WARNINGS: "PASS_WITH_WARNINGS", FAIL: "FAIL", UNKNOWN: "UNKNOWN",
};

/** A quality check must say who judged it. Automation is not human judgment. */
export const CHECK_SOURCE = { AUTOMATED: "AUTOMATED", HUMAN: "HUMAN", FIXTURE: "FIXTURE", PROVIDER: "PROVIDER" };

export const COVERAGE_STATE = {
  NOT_EVALUATED: "NOT_EVALUATED", COMPLETE: "COMPLETE",
  COMPLETE_WITH_WARNINGS: "COMPLETE_WITH_WARNINGS", INCOMPLETE: "INCOMPLETE", UNKNOWN: "UNKNOWN",
};

export const EVIDENCE_REVIEW = {
  NOT_REVIEWED: "NOT_REVIEWED", REVIEWING: "REVIEWING", APPROVED: "APPROVED",
  APPROVED_WITH_WARNINGS: "APPROVED_WITH_WARNINGS",
  RECAPTURE_REQUIRED: "RECAPTURE_REQUIRED", REJECTED: "REJECTED", QUARANTINED: "QUARANTINED",
};

export const CUSTODY_ACTION = {
  CAPTURED: "CAPTURED", RECEIVED: "RECEIVED", HASHED: "HASHED", INGESTED: "INGESTED",
  STORED: "STORED", COPIED: "COPIED", MOVED_TIER: "MOVED_TIER", REVIEWED: "REVIEWED",
  QUARANTINED: "QUARANTINED", RELEASED: "RELEASED", DERIVED: "DERIVED",
  ARCHIVED: "ARCHIVED", EXPORTED: "EXPORTED",
};

export const PROCESSING_STATE = {
  QUEUED: "QUEUED", RUNNING: "RUNNING", COMPLETE: "COMPLETE", FAILED: "FAILED", CANCELLED: "CANCELLED",
};

export const PROCESSOR_TYPES = [
  "THUMBNAIL", "IMAGE_NORMALIZATION", "THERMAL_RENDER", "THERMAL_ALIGNMENT",
  "PHOTOGRAMMETRY", "POINT_CLOUD", "MESH", "ORTHOMOSAIC", "ROOF_GEOMETRY",
  "MEASUREMENT_EXTRACTION", "CAD_PREP", "BIM_PREP", "OTHER",
];

/** Whether Cortex may consume an asset. Cortex never scans the vault itself. */
export const ELIGIBILITY = {
  ELIGIBLE: "ELIGIBLE", ELIGIBLE_WITH_WARNINGS: "ELIGIBLE_WITH_WARNINGS",
  NOT_ELIGIBLE: "NOT_ELIGIBLE", PENDING_REVIEW: "PENDING_REVIEW",
};

/**
 * Coverage requirements come from the mission's objective and services —
 * never from one global list.
 */
export const COVERAGE_REQUIREMENTS = {
  ROOF: ["North roof plane", "South roof plane", "East roof plane", "West roof plane", "Ridge", "Valleys"],
  WHOLE_HOME: ["North elevation", "South elevation", "East elevation", "West elevation", "Roof planes", "Site context"],
  EXTERIOR: ["North elevation", "South elevation", "East elevation", "West elevation"],
  LEAK_MOISTURE: ["Suspected zone", "Adjacent roof plane", "Interior ceiling context"],
  THERMAL: ["Envelope elevations", "Roof planes"],
  ENERGY: ["Envelope elevations", "Roof planes", "Openings"],
  REPAIR_VERIFICATION: ["Repair area", "Adjacent surfaces"],
  STORM_DAMAGE: ["All roof planes", "All elevations", "Site debris context"],
  COMMERCIAL_ROOF: ["Roof sections", "Drains", "Penetrations", "Perimeter"],
  DEFAULT: ["Primary structure"],
};

export function requiredAreasFor(mission) {
  const base = COVERAGE_REQUIREMENTS[mission.assessmentObjective] || COVERAGE_REQUIREMENTS.DEFAULT;
  // A focus area the operator was told to capture is a coverage requirement.
  const focus = (mission.focusAreas || []).map((f) => f.area);
  return [...new Set([...base, ...focus])];
}

/**
 * Truth classification is NOT determined by file type. An RGB photo is
 * evidence; it is not automatically a MEASURED value.
 */
export function defaultTruthClassification(origin) {
  return origin === ARTIFACT_ORIGIN.DERIVED ? "DERIVED" : null;
}
