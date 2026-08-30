/**
 * PROPERTY REALITY — TYPE REGISTRY AND STATE VOCABULARY
 *
 * Stratex will ultimately expose three canonical Digital Twin outputs. Their
 * permanent product names are NOT locked, and nothing here invents one. The
 * registry below uses neutral working identifiers and displays them with an
 * explicit WORKING TYPE NAME marker so no temporary label can quietly harden
 * into branding.
 *
 * All three types share ONE Property Reality foundation: the same property
 * identity, the same Evidence Vault, the same mission lineage, the same
 * processing architecture, the same version model and the same projection
 * rules. What differs between them is policy — required inputs, supported
 * layers, expected outputs — and that lives here.
 */

export const WORKING_NAME_NOTICE = "WORKING TYPE NAME — permanent product naming is not yet defined";

export const SPATIAL_ARTIFACT_TYPE = {
  POINT_CLOUD: "POINT_CLOUD", MESH: "MESH", TEXTURED_MESH: "TEXTURED_MESH",
  ORTHOMOSAIC: "ORTHOMOSAIC", DEPTH_MODEL: "DEPTH_MODEL",
  ROOF_GEOMETRY: "ROOF_GEOMETRY", EXTERIOR_GEOMETRY: "EXTERIOR_GEOMETRY",
  THERMAL_SPATIAL_LAYER: "THERMAL_SPATIAL_LAYER", MEASUREMENT_GEOMETRY: "MEASUREMENT_GEOMETRY",
  CAD_MODEL: "CAD_MODEL", BIM_MODEL: "BIM_MODEL", OTHER: "OTHER",
};

/** Canonical layer vocabulary. Pages never declare their own layer list. */
export const TWIN_LAYERS = [
  "BASE_GEOMETRY", "RGB_TEXTURE", "THERMAL", "ROOF", "EXTERIOR_ENVELOPE",
  "WINDOWS", "DOORS", "HVAC", "ELECTRICAL", "PLUMBING", "FOUNDATION",
  "DRAINAGE", "MEASUREMENTS", "FINDINGS", "PROJECTS", "REPAIRS",
  "MAINTENANCE", "EVIDENCE", "CORTEX", "PASSPORT",
];

/**
 * A layer is never silently "fine". Absence of observation is its own state,
 * distinct from a system that was observed and found healthy.
 */
export const LAYER_STATE = {
  AVAILABLE: "AVAILABLE", PARTIAL: "PARTIAL", NOT_OBSERVED: "NOT_OBSERVED",
  NOT_PROCESSED: "NOT_PROCESSED", NOT_APPLICABLE: "NOT_APPLICABLE",
  PROVIDER_UNAVAILABLE: "PROVIDER_UNAVAILABLE",
};

/** Systems concealed inside the structure are never "directly observed". */
export const OBSERVATION_CLASS = {
  KNOWN: "KNOWN", DERIVED: "DERIVED", PROBABLE: "PROBABLE", UNKNOWN: "UNKNOWN",
};

export const TWIN_VERSION_STATE = {
  DRAFT: "DRAFT", PROCESSING: "PROCESSING", REVIEW_REQUIRED: "REVIEW_REQUIRED",
  APPROVED: "APPROVED", APPROVED_WITH_WARNINGS: "APPROVED_WITH_WARNINGS",
  FAILED: "FAILED", SUPERSEDED: "SUPERSEDED", ARCHIVED: "ARCHIVED",
};

/** Only these states may become the current Passport reference. */
export const PASSPORT_ELIGIBLE_STATES = [
  TWIN_VERSION_STATE.APPROVED, TWIN_VERSION_STATE.APPROVED_WITH_WARNINGS,
];

export const PROCESSING_STATE = {
  QUEUED: "QUEUED", PREPARING: "PREPARING", RUNNING: "RUNNING", VALIDATING: "VALIDATING",
  COMPLETE: "COMPLETE", COMPLETE_WITH_WARNINGS: "COMPLETE_WITH_WARNINGS",
  FAILED: "FAILED", CANCELLED: "CANCELLED",
};

export const PROCESSOR_TYPE = [
  "PHOTOGRAMMETRY", "POINT_CLOUD_GENERATION", "POINT_CLOUD_NORMALIZATION",
  "MESH_GENERATION", "TEXTURE_GENERATION", "THERMAL_ALIGNMENT",
  "ORTHOMOSAIC_GENERATION", "ROOF_GEOMETRY", "EXTERIOR_GEOMETRY",
  "MEASUREMENT_EXTRACTION", "SYSTEM_LAYER_GENERATION", "CAD_PREPARATION",
  "BIM_PREPARATION", "CHANGE_DETECTION", "OTHER",
];

export const QUALITY_STATE = {
  NOT_EVALUATED: "NOT_EVALUATED", PASS: "PASS",
  PASS_WITH_WARNINGS: "PASS_WITH_WARNINGS", FAIL: "FAIL", UNKNOWN: "UNKNOWN",
};

export const COMPLETENESS_STATE = {
  COMPLETE: "COMPLETE", COMPLETE_WITH_WARNINGS: "COMPLETE_WITH_WARNINGS",
  PARTIAL: "PARTIAL", INCOMPLETE: "INCOMPLETE", UNKNOWN: "UNKNOWN",
};

export const MESH_QUALITY = {
  COMPLETE: "COMPLETE", PARTIAL: "PARTIAL", HOLES_PRESENT: "HOLES_PRESENT",
  LOW_CONFIDENCE_AREAS: "LOW_CONFIDENCE_AREAS", UNKNOWN: "UNKNOWN",
};

/** Capture method is never merged away — a fused cloud is not a LiDAR cloud. */
export const POINT_CLOUD_SOURCE = {
  PHOTOGRAMMETRIC_POINT_CLOUD: "PHOTOGRAMMETRIC_POINT_CLOUD",
  LIDAR_POINT_CLOUD: "LIDAR_POINT_CLOUD",
  FUSED_POINT_CLOUD: "FUSED_POINT_CLOUD",
  FIXTURE_POINT_CLOUD: "FIXTURE_POINT_CLOUD",
};

export const THERMAL_ALIGNMENT_STATE = {
  NOT_STARTED: "NOT_STARTED", PROCESSING: "PROCESSING", ALIGNED: "ALIGNED",
  ALIGNED_WITH_WARNINGS: "ALIGNED_WITH_WARNINGS", PARTIAL: "PARTIAL",
  FAILED: "FAILED", UNKNOWN: "UNKNOWN",
};

export const COORDINATE_SYSTEM = {
  LOCAL_PROPERTY: "LOCAL_PROPERTY", WGS84: "WGS84",
  PROJECTED: "PROJECTED", UNKNOWN: "UNKNOWN",
};

export const UNIT_SYSTEM = { IMPERIAL: "IMPERIAL", METRIC: "METRIC" };

export const MEASUREMENT_METHOD = {
  DIRECT_SENSOR: "DIRECT_SENSOR", PHOTOGRAMMETRIC: "PHOTOGRAMMETRIC",
  LIDAR_DERIVED: "LIDAR_DERIVED", MANUAL: "MANUAL",
  GEOMETRIC_DERIVATION: "GEOMETRIC_DERIVATION", OTHER: "OTHER",
};

/**
 * Only a direct sensor reading yields a MEASURED value. Photogrammetric and
 * LiDAR dimensions are computed from evidence and are therefore DERIVED —
 * a dimension does not become "measured" because it looks precise.
 */
export function truthClassForMethod(method) {
  return method === MEASUREMENT_METHOD.DIRECT_SENSOR ? "MEASURED" : "DERIVED";
}

export const COMPARISON_STATE = {
  QUEUED: "QUEUED", PROCESSING: "PROCESSING", COMPLETE: "COMPLETE",
  COMPLETE_WITH_WARNINGS: "COMPLETE_WITH_WARNINGS",
  FAILED: "FAILED", INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
};

export const CHANGE_CLASS = {
  ADDED: "ADDED", REMOVED: "REMOVED", MODIFIED: "MODIFIED", MOVED: "MOVED",
  DIMENSION_CHANGED: "DIMENSION_CHANGED", THERMAL_CHANGED: "THERMAL_CHANGED",
  CONDITION_CHANGED: "CONDITION_CHANGED", UNKNOWN: "UNKNOWN",
};

/* ------------------------------------------------------ twin type registry */

/**
 * THREE CANONICAL TWIN TYPES.
 *
 * `displayLabel` is a neutral working label. `permanentNameLocked: false` on
 * every entry is the machine-checkable assertion that no product name has been
 * invented here — a test enforces it.
 */
export const TWIN_TYPES = {
  TWIN_TYPE_A: {
    typeId: "TWIN_TYPE_A",
    displayLabel: "TWIN A",
    permanentNameLocked: false,
    description:
      "Full spatial reconstruction. The heaviest type: geometry, texture and measurements derived from a complete capture.",
    requiredInputs: ["RGB_IMAGE"],
    requiredOutputs: [
      SPATIAL_ARTIFACT_TYPE.POINT_CLOUD,
      SPATIAL_ARTIFACT_TYPE.MESH,
      SPATIAL_ARTIFACT_TYPE.TEXTURED_MESH,
      SPATIAL_ARTIFACT_TYPE.ROOF_GEOMETRY,
    ],
    optionalOutputs: [SPATIAL_ARTIFACT_TYPE.ORTHOMOSAIC, SPATIAL_ARTIFACT_TYPE.CAD_MODEL, SPATIAL_ARTIFACT_TYPE.BIM_MODEL],
    supportedLayers: TWIN_LAYERS,
    projectionRules: { passport: true, cortex: true, core: true, pro: true, habitat: true },
    versioningPolicy: "PROPERTY_AND_TYPE_SCOPED",
  },

  TWIN_TYPE_B: {
    typeId: "TWIN_TYPE_B",
    displayLabel: "TWIN B",
    permanentNameLocked: false,
    description:
      "Thermal-spatial reality. Requires radiometric source evidence aligned to geometry; does not require a textured mesh.",
    requiredInputs: ["THERMAL_RJPEG"],
    requiredOutputs: [
      SPATIAL_ARTIFACT_TYPE.MESH,
      SPATIAL_ARTIFACT_TYPE.THERMAL_SPATIAL_LAYER,
    ],
    optionalOutputs: [SPATIAL_ARTIFACT_TYPE.POINT_CLOUD, SPATIAL_ARTIFACT_TYPE.ROOF_GEOMETRY],
    supportedLayers: TWIN_LAYERS.filter((l) => l !== "CAD" && l !== "BIM"),
    projectionRules: { passport: true, cortex: true, core: false, pro: true, habitat: true },
    versioningPolicy: "PROPERTY_AND_TYPE_SCOPED",
  },

  TWIN_TYPE_C: {
    typeId: "TWIN_TYPE_C",
    displayLabel: "TWIN C",
    permanentNameLocked: false,
    description:
      "Lightweight exterior representation. Orthomosaic and roof geometry only — suitable where a full reconstruction was not captured.",
    requiredInputs: ["RGB_IMAGE"],
    requiredOutputs: [
      SPATIAL_ARTIFACT_TYPE.ORTHOMOSAIC,
      SPATIAL_ARTIFACT_TYPE.ROOF_GEOMETRY,
    ],
    optionalOutputs: [SPATIAL_ARTIFACT_TYPE.EXTERIOR_GEOMETRY],
    supportedLayers: ["BASE_GEOMETRY", "RGB_TEXTURE", "ROOF", "EXTERIOR_ENVELOPE", "MEASUREMENTS", "FINDINGS", "EVIDENCE", "PASSPORT"],
    projectionRules: { passport: true, cortex: true, core: true, pro: true, habitat: false },
    versioningPolicy: "PROPERTY_AND_TYPE_SCOPED",
  },
};

export const twinTypeIds = () => Object.keys(TWIN_TYPES);
export const twinType = (id) => TWIN_TYPES[id] || null;

/** Completeness is evaluated against the TYPE's policy, never a global list. */
export function evaluateCompleteness(typeId, presentArtifactTypes) {
  const type = twinType(typeId);
  if (!type) return { state: COMPLETENESS_STATE.UNKNOWN, missing: [], required: [] };

  const present = new Set(presentArtifactTypes);
  const missing = type.requiredOutputs.filter((o) => !present.has(o));
  const optionalMissing = type.optionalOutputs.filter((o) => !present.has(o));

  let state;
  if (missing.length === 0 && optionalMissing.length === 0) state = COMPLETENESS_STATE.COMPLETE;
  else if (missing.length === 0) state = COMPLETENESS_STATE.COMPLETE_WITH_WARNINGS;
  else if (missing.length < type.requiredOutputs.length) state = COMPLETENESS_STATE.PARTIAL;
  else state = COMPLETENESS_STATE.INCOMPLETE;

  return { state, missing, optionalMissing, required: type.requiredOutputs };
}
