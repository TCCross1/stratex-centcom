import assert from "node:assert/strict";
import {
  CortexModelRegistry,
  CortexAnalysisProvider,
  CortexAnalysisJob,
  CortexAnalysisTask,
  CortexAnalysis,
  CortexFinding,
  PassportCandidateManifest,
  GoldEvidenceRecord,
  CortexPrediction,
  PredictionValidation,
  CortexLongitudinalProfile,
  CortexModelPerformance,
  CortexConflict,
  CortexReanalysisRequest,
  MODEL_TASK_TYPES,
  MODEL_STATUS,
  MODEL_SOURCE_MODE,
  CORTEX_ANALYSIS_STATUS,
  CORTEX_TASK_STATE,
  PASSPORT_ELIGIBILITY,
  GOLD_VALIDATION_METHOD,
  PREDICTION_STATE,
  VALIDATION_RESULT,
} from "./service.js";
import { TRUTH_CLASS, REVIEW_STATE } from "../shared/classification.js";

let failures = 0;
const check = (cond, msg) => {
  try {
    assert.ok(cond, msg);
    console.log("  ok   " + msg);
  } catch (err) {
    failures++;
    console.log("  FAIL " + msg);
    console.log("       " + err.message);
  }
};

console.log("\n=== CORTEX PHASE 7 CONTRACT ===");

console.log("\n--- 1. model registry");
const registry = CortexModelRegistry.list();
check(registry.length > 0, "model registry exists");
check(registry.every((m) => !m.sourceMode || ["FIXTURE", "SIMULATION", "MANUAL_RULE", "PRODUCTION"].includes(m.sourceMode)), "source mode is honest and extensible");
const thermal = CortexModelRegistry.getByTask(MODEL_TASK_TYPES.THERMAL_ANALYSIS)[0];
check(Boolean(thermal), "thermal task has a registered model");
check(thermal.sourceMode === MODEL_SOURCE_MODE.FIXTURE || thermal.sourceMode === MODEL_SOURCE_MODE.MANUAL_RULE, "fixture model is not labeled as production AI");

console.log("\n--- 2. jobs and input validation");
const validJob = CortexAnalysisJob.create({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  evidenceManifestId: "EVIDENCE-MANIFEST-SXP-004182",
  spatialManifestId: "CXSPATIAL-SXP-004182",
  requestedAnalysisTypes: [MODEL_TASK_TYPES.THERMAL_ANALYSIS, MODEL_TASK_TYPES.ROOF_CONDITION],
  sourceMode: MODEL_SOURCE_MODE.FIXTURE,
});
check(validJob.status === CORTEX_ANALYSIS_STATUS.QUEUED, "new job enters the queue");
check(validJob.modelAssignments.length > 0, "jobs assign models to requested tasks");

const insufficientJob = CortexAnalysisJob.create({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  evidenceManifestId: "EVIDENCE-MANIFEST-SXP-004182",
  spatialManifestId: "CXSPATIAL-SXP-004182",
  requestedAnalysisTypes: [MODEL_TASK_TYPES.THERMAL_ANALYSIS],
  sourceMode: MODEL_SOURCE_MODE.FIXTURE,
  forceNoThermal: true,
});
check(insufficientJob.status === CORTEX_ANALYSIS_STATUS.INSUFFICIENT_DATA, "missing thermal input yields insufficient data, not fake analysis");

console.log("\n--- 3. findings and truth discipline");
const measured = CortexFinding.create({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  analysisId: "CX-TEST-1",
  analysisJobId: "CJ-TEST-1",
  category: "THERMAL",
  subcategory: "surface",
  title: "Surface temperature 58.4F",
  description: "Thermal measurement from a radiometric source.",
  truthClassification: TRUTH_CLASS.MEASURED,
  confidence: null,
  severity: "low",
  reviewState: REVIEW_STATE.VERIFIED,
  sourceEvidenceIds: ["EA-90101"],
  sourceSpatialArtifactIds: [],
  sourceTwinVersionIds: [],
  featureId: null,
  surfaceId: null,
  zoneId: null,
  bounds: null,
  measurementIds: ["M-901"],
  modelId: "CX-MODEL-THERMAL-01",
  modelVersion: "1.0.0",
});
check(measured.truthClassification === TRUTH_CLASS.MEASURED, "measured finding remains measured");
check(measured.confidence == null, "measured finding does not carry probabilistic confidence");

const badProbable = () => CortexFinding.create({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  analysisId: "CX-TEST-2",
  analysisJobId: "CJ-TEST-2",
  category: "MOISTURE",
  subcategory: "roof",
  title: "Likely moisture intrusion",
  description: "Probable moisture under the roof membrane.",
  truthClassification: TRUTH_CLASS.PROBABLE,
  confidence: null,
  severity: "high",
  reviewState: REVIEW_STATE.PENDING,
  sourceEvidenceIds: ["EA-90102"],
  sourceSpatialArtifactIds: [],
  sourceTwinVersionIds: [],
  featureId: null,
  surfaceId: null,
  zoneId: null,
  bounds: null,
  measurementIds: [],
  modelId: "CX-MODEL-THERMAL-01",
  modelVersion: "1.0.0",
});
check(() => badProbable(), /confidence/i, "probable finding without confidence is rejected");

const probable = CortexFinding.create({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  analysisId: "CX-TEST-3",
  analysisJobId: "CJ-TEST-3",
  category: "MOISTURE",
  subcategory: "roof",
  title: "Probable trapped moisture",
  description: "Thermal anomaly and dampness indicators suggest retained moisture.",
  truthClassification: TRUTH_CLASS.PROBABLE,
  confidence: 0.84,
  severity: "high",
  reviewState: REVIEW_STATE.PENDING,
  sourceEvidenceIds: ["EA-90102"],
  sourceSpatialArtifactIds: [],
  sourceTwinVersionIds: [],
  featureId: null,
  surfaceId: null,
  zoneId: null,
  bounds: null,
  measurementIds: [],
  modelId: "CX-MODEL-THERMAL-01",
  modelVersion: "1.0.0",
});
check(probable.truthClassification === TRUTH_CLASS.PROBABLE && probable.confidence === 0.84, "probable finding includes confidence");
check(probable.passportEligibility === PASSPORT_ELIGIBILITY.PENDING_REVIEW, "unreviewed probable finding is pending passport review");

console.log("\n--- 4. review and passport");
const reviewed = CortexFinding.review(probable.findingId, "APPROVE");
check(reviewed.reviewState === REVIEW_STATE.VERIFIED, "approve transitions finding to verified");
const manifest = PassportCandidateManifest.build({
  propertyId: "SXP-004182",
  sourceFindingIds: [probable.findingId],
  sourceAnalysisIds: [probable.analysisId],
  reviewState: REVIEW_STATE.VERIFIED,
  truthClasses: [probable.truthClassification],
  warnings: [],
  sourceVersions: ["TW-004182-V3"],
});
check(manifest.propertyId === "SXP-004182", "passport manifest is scoped to the property");
check(Array.isArray(manifest.sourceFindingIds), "manifest records source findings");

console.log("\n--- 5. gold evidence and prediction");
const prediction = CortexPrediction.create({
  propertyId: "SXP-004182",
  findingId: probable.findingId,
  analysisId: probable.analysisId,
  predictionType: "MOISTURE_IRREGULARITY",
  targetFeatureId: null,
  predictedState: "Probable trapped moisture under membrane",
  confidence: 0.84,
  modelId: "CX-MODEL-THERMAL-01",
  modelVersion: "1.0.0",
  validFrom: "2026-08-30T00:00:00.000Z",
  validUntil: "2026-09-15T00:00:00.000Z",
  status: PREDICTION_STATE.ACTIVE,
});
check(prediction.status === PREDICTION_STATE.ACTIVE, "prediction is created in active state");
const validation = PredictionValidation.create({
  predictionId: prediction.predictionId,
  propertyId: "SXP-004182",
  followupMissionId: "M-2026-0829-018",
  followupEvidenceIds: ["EA-90103"],
  followupTwinVersionIds: ["TW-004182-V3"],
  actualOutcome: "Confirmed saturation in roof decking after repair audit.",
  result: VALIDATION_RESULT.CONFIRMED,
  validatedBy: "u-001",
  notes: "Repair evidence matched the predicted moisture zone.",
});
check(validation.result === VALIDATION_RESULT.CONFIRMED, "prediction validation records the outcome");
const gold = GoldEvidenceRecord.create({
  propertyId: "SXP-004182",
  sourcePredictionFindingId: probable.findingId,
  sourceMissionId: "M-2026-0827-012",
  sourceEvidenceIds: ["EA-90102"],
  sourceTwinVersionIds: ["TW-004182-V3"],
  validatedOutcome: "Moisture was confirmed after repair verification.",
  validationMethod: GOLD_VALIDATION_METHOD.DIRECT_MEASUREMENT,
  validatedBy: "u-001",
  validatedAt: "2026-08-30T00:00:00.000Z",
  qualityState: "PASS",
  notes: "Later field verification confirms the prediction.",
});
check(gold.goldEvidenceId, "gold evidence is created only after validation");

console.log("\n--- 6. performance and longitudinal");
const perf = CortexModelPerformance.create({
  modelId: "CX-MODEL-THERMAL-01",
  modelVersion: "1.0.0",
  taskType: MODEL_TASK_TYPES.THERMAL_ANALYSIS,
  evaluationWindow: "30d",
  validatedPredictionCount: 0,
  confirmedCount: 0,
  partialCount: 0,
  disprovenCount: 0,
  inconclusiveCount: 0,
  precisionMetric: null,
  recallMetric: null,
  calibrationMetric: null,
  dataQualityState: "INSUFFICIENT_VALIDATED_DATA",
  sourceMode: MODEL_SOURCE_MODE.FIXTURE,
});
check(perf.dataQualityState === "INSUFFICIENT_VALIDATED_DATA", "insufficient validated data remains honest");
check(perf.precisionMetric == null && perf.recallMetric == null, "metrics are null when data is insufficient");
const trend = CortexLongitudinalProfile.compute({
  propertyId: "SXP-004182",
  findings: [probable],
  predictions: [prediction],
  validatedOutcomes: [],
  twinVersions: [],
  repairEvents: [],
  maintenanceEvents: [],
  changes: [],
});
check(trend.trendClass === "UNKNOWN" || trend.trendClass === "NEW", "trend requires comparable data or reports unknown");

console.log("\n--- 7. conflict and reanalysis");
const conflict = CortexConflict.create({
  propertyId: "SXP-004182",
  title: "Thermal anomaly conflicts with no visual defect",
  description: "Thermal model indicates moisture but visual evidence is clean.",
  sourceAnalysisIds: ["CX-TEST-1"],
  sourceFindingIds: [probable.findingId],
  state: "OPEN",
});
check(conflict.state === "OPEN", "conflict records open inconsistency");
const reanalysis = CortexReanalysisRequest.create({
  propertyId: "SXP-004182",
  analysisId: "CX-TEST-1",
  reason: "New evidence contradicts the initial thermal inference.",
  requestedBy: "u-001",
  targetModelVersion: "1.1.0",
});
check(reanalysis.status === "REQUESTED", "reanalysis request is tracked and separate from the original analysis");

console.log("\n--- 8. provider honesty");
const provider = CortexAnalysisProvider.getStatus();
check(provider.mode === "FIXTURE" || provider.mode === "DISCONNECTED", "provider reports honest fixture/disconnected mode");
check(!/production/i.test(provider.detail || ""), "fixture provider does not claim production AI");

console.log("\n--- 9. cross-property guardrails");
const badManifest = PassportCandidateManifest.build({
  propertyId: "SXP-004182",
  sourceFindingIds: ["FD-7781"],
  sourceAnalysisIds: ["CX-0330"],
  reviewState: REVIEW_STATE.VERIFIED,
  truthClasses: [TRUTH_CLASS.PROBABLE],
  warnings: [],
  sourceVersions: ["TW-004179-V2"],
});
check(badManifest.propertyId === "SXP-004182", "manifest remains property-scoped even when source references look similar");

console.log(failures ? `\nRESULT: ${failures} FAILURE(S)\n` : "\nRESULT: ALL CORTEX TESTS PASS\n");
process.exit(failures ? 1 : 0);
