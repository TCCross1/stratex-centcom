/**
 * CORTEX FIXTURES
 *
 * SCOPING FIX (Directive 004 §5/§7): every analysis and every finding names its
 * property and mission. No finding bleeds between properties.
 *
 *   CORTEX ANALYSIS 1 → MANY FINDINGS
 *   PROPERTY        1 → MANY FINDINGS
 *
 * Every ID below corresponds to a real object in the other domains — the
 * evidence → analysis → finding → Passport chain resolves for real.
 */
import { ago, iso } from "../../utils/format.js";
import { TRUTH_CLASS, REVIEW_STATE, GOLD_STATE, VERIFICATION_RESULT } from "../shared/classification.js";

export const analyses = [
  { analysisId: "CX-0330", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    analysisType: "Thermal & Envelope Assessment", status: "COMPLETE",
    startedAt: ago(60), completedAt: ago(30),
    modelName: "cortex-core", modelVersion: "3.2", analysisVersion: "av-118",
    inputEvidenceIds: ["EA-90211", "EA-90212", "EA-90280"],
    findingIds: ["FD-7781", "FD-7776", "FD-7770", "FD-7768"],
    confidenceSummary: "2 probable findings, mean confidence 0.80",
    reviewState: REVIEW_STATE.PENDING, failureReason: null,
    previousAnalysisId: "CX-0221", comparisonTargetId: "CX-0221", createdBySystem: "pipeline:cortex" },

  { analysisId: "CX-0331", propertyId: "SXP-004188", missionId: "M-2026-0829-016",
    analysisType: "Initial Property Assessment", status: "RUNNING",
    startedAt: ago(39), completedAt: null,
    modelName: "cortex-core", modelVersion: "3.2", analysisVersion: "av-118",
    inputEvidenceIds: ["EA-88010", "EA-88044"],
    findingIds: ["FD-8102"],
    confidenceSummary: "In progress",
    reviewState: REVIEW_STATE.NEEDS_MORE_EVIDENCE, failureReason: null,
    previousAnalysisId: null, comparisonTargetId: null, createdBySystem: "pipeline:cortex" },

  { analysisId: "CX-0332", propertyId: "SXP-004182", missionId: "M-2026-0829-018",
    analysisType: "Roof Verification", status: "QUEUED",
    startedAt: null, completedAt: null,
    modelName: "cortex-core", modelVersion: "3.2", analysisVersion: "av-118",
    inputEvidenceIds: [], findingIds: [],
    confidenceSummary: null, reviewState: REVIEW_STATE.NOT_REQUIRED, failureReason: null,
    previousAnalysisId: "CX-0330", comparisonTargetId: "CX-0330", createdBySystem: "pipeline:cortex" },

  { analysisId: "CX-0329", propertyId: "SXP-004193", missionId: "M-2026-0828-014",
    analysisType: "Initial Property Assessment", status: "COMPLETE",
    startedAt: ago(2400), completedAt: ago(2300),
    modelName: "cortex-core", modelVersion: "3.1", analysisVersion: "av-117",
    inputEvidenceIds: [], findingIds: [],
    confidenceSummary: "9 findings committed",
    reviewState: REVIEW_STATE.VERIFIED, failureReason: null,
    previousAnalysisId: null, comparisonTargetId: null, createdBySystem: "pipeline:cortex" },

  { analysisId: "CX-0318", propertyId: "SXP-004150", missionId: "M-2026-0812-011",
    analysisType: "Repair Completion Verification", status: "COMPLETE",
    startedAt: ago(880), completedAt: ago(870),
    modelName: "cortex-core", modelVersion: "3.1", analysisVersion: "av-117",
    inputEvidenceIds: ["EA-41501"], findingIds: ["FD-6602"],
    confidenceSummary: "Prior prediction confirmed",
    reviewState: REVIEW_STATE.VERIFIED, failureReason: null,
    previousAnalysisId: "CX-0290", comparisonTargetId: "CX-0290", createdBySystem: "pipeline:cortex" },

  { analysisId: "CX-0327", propertyId: "SXP-004190", missionId: "M-2026-0829-015",
    analysisType: "Initial Property Assessment", status: "FAILED",
    startedAt: ago(1180), completedAt: ago(1175),
    modelName: "cortex-core", modelVersion: "3.2", analysisVersion: "av-118",
    inputEvidenceIds: [], findingIds: [],
    confidenceSummary: null, reviewState: REVIEW_STATE.NOT_REQUIRED,
    failureReason: "Capture coverage 71% — below the 95% threshold for assessment.",
    previousAnalysisId: null, comparisonTargetId: null, createdBySystem: "pipeline:cortex" },
];

export const findings = [
  { findingId: "FD-7781", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    cortexAnalysisId: "CX-0330", title: "Moisture signature — attic zone, 2nd floor",
    category: "Moisture", zone: "North roof plane / attic",
    detail: "Thermal delta of 6.2°F across a 41 sq ft region on the north roof plane, persisting 40 minutes after sunset. The pattern is consistent with retained moisture in the decking.",
    truthClassification: TRUTH_CLASS.PROBABLE, confidence: 0.86, severity: "high",
    sourceEvidenceIds: ["EA-90212", "EA-90291"],
    reviewState: REVIEW_STATE.PENDING, passportState: "PENDING", createdAt: ago(30) },

  { findingId: "FD-7776", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    cortexAnalysisId: "CX-0330", title: "Roof remaining service life under 5 years",
    category: "Roof", zone: "South roof plane",
    detail: "Granule loss and edge curl measured across 62% of the south plane. The projection uses the install date from Passport r09 and the observed degradation rate between Twin V1 and Twin V3.",
    truthClassification: TRUTH_CLASS.PROBABLE, confidence: 0.74, severity: "medium",
    sourceEvidenceIds: ["EA-90211", "EA-90280"],
    reviewState: REVIEW_STATE.PENDING, passportState: "PENDING", createdAt: ago(30) },

  { findingId: "FD-7770", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    cortexAnalysisId: "CX-0330", title: "Roof plane surface area — north",
    category: "Measurement", zone: "North roof plane",
    detail: "Photogrammetric surface area of the north roof plane, computed from Twin V3 geometry.",
    truthClassification: TRUTH_CLASS.MEASURED, confidence: null, severity: "low",
    sourceEvidenceIds: ["EA-90280"],
    reviewState: REVIEW_STATE.VERIFIED, passportState: "COMMITTED", createdAt: ago(30) },

  { findingId: "FD-7768", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    cortexAnalysisId: "CX-0330", title: "HVAC efficiency degradation",
    category: "HVAC", zone: "Interior — supply registers",
    detail: "Supply-register thermal spread widened 3.1°F versus the 2026 baseline capture. System aging is indicated.",
    truthClassification: TRUTH_CLASS.DERIVED, confidence: null, severity: "medium",
    sourceEvidenceIds: ["EA-90212"],
    reviewState: REVIEW_STATE.VERIFIED, passportState: "COMMITTED", createdAt: ago(30) },

  { findingId: "FD-8102", propertyId: "SXP-004188", missionId: "M-2026-0829-016",
    cortexAnalysisId: "CX-0331", title: "Envelope thermal anomaly — west elevation",
    category: "Envelope", zone: "West elevation",
    detail: "A recurring cold band along the west elevation may indicate insulation displacement. Coverage of this elevation was partial; a recapture is required before this can be raised above a preliminary inference.",
    truthClassification: TRUTH_CLASS.PROBABLE, confidence: 0.52, severity: "medium",
    sourceEvidenceIds: ["EA-88010", "EA-88044"],
    reviewState: REVIEW_STATE.NEEDS_MORE_EVIDENCE, passportState: "NOT_COMMITTED", createdAt: ago(35) },

  { findingId: "FD-6602", propertyId: "SXP-004150", missionId: "M-2026-0812-011",
    cortexAnalysisId: "CX-0318", title: "Repair verified — decking replacement",
    category: "Repair Verification", zone: "Rear roof plane",
    detail: "Post-repair thermal behavior returned to the expected profile. The moisture signature predicted in April is no longer present.",
    truthClassification: TRUTH_CLASS.MEASURED, confidence: null, severity: "low",
    sourceEvidenceIds: ["EA-41501"],
    reviewState: REVIEW_STATE.VERIFIED, passportState: "COMMITTED", createdAt: ago(870) },
];

/**
 * PREDICTION VALIDATION — the foundation for Cortex learning from reality.
 * No learning algorithm runs yet. These records simply preserve what was
 * predicted and what was later physically observed, so that comparison
 * becomes possible instead of being reconstructed after the fact.
 */
export const predictions = [
  { predictionId: "PR-0041", propertyId: "SXP-004150", sourceAnalysisId: "CX-0290",
    findingId: "FD-6410", predictedCondition: "Probable saturated decking, rear roof plane",
    confidence: 0.81, predictedAt: iso("2026-04-18"),
    verification: {
      verificationEvidenceId: "EA-41501", verifiedCondition: "Saturated decking confirmed during tear-off",
      verifiedAt: iso("2026-08-12"), result: VERIFICATION_RESULT.CONFIRMED,
      note: "Contractor tear-off photos matched the predicted zone within roughly two feet.",
    } },

  { predictionId: "PR-0052", propertyId: "SXP-004182", sourceAnalysisId: "CX-0330",
    findingId: "FD-7781", predictedCondition: "Retained moisture in north decking",
    confidence: 0.86, predictedAt: ago(30), verification: null },
];

/** Gold Evidence requires a review state, never a good-looking image. */
export const goldCandidates = [
  { evidenceId: "EA-90212", propertyId: "SXP-004182", state: GOLD_STATE.CANDIDATE,
    reviewer: null, reviewedAt: null, reason: "Clear thermal signature with a pending field verification.",
    linkedFindingId: "FD-7781", linkedAnalysisId: "CX-0330" },
  { evidenceId: "EA-41501", propertyId: "SXP-004150", state: GOLD_STATE.APPROVED,
    reviewer: "u-001", reviewedAt: ago(860), reason: "Prediction confirmed against tear-off reality.",
    linkedFindingId: "FD-6602", linkedAnalysisId: "CX-0318" },
];
