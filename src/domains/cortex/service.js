/**
 * CORTEX SERVICE
 *
 * Cortex is the property intelligence engine. It interprets evidence, compares
 * history and produces findings with stated confidence. It is not a chatbot and
 * it never rewrites raw evidence.
 *
 *   CORTEX ANALYSIS 1 → MANY FINDINGS
 *   PROPERTY        1 → MANY FINDINGS   (no bleed between properties)
 */
import { analyses as legacyAnalyses, findings as legacyFindings, predictions as legacyPredictions, goldCandidates as legacyGoldCandidates } from "./fixtures.js";
import { serve } from "../shared/transport.js";
import { TRUTH_CLASS, REVIEW_STATE } from "../shared/classification.js";

export const MODEL_TASK_TYPES = {
  ANOMALY_DETECTION: "ANOMALY_DETECTION",
  THERMAL_ANALYSIS: "THERMAL_ANALYSIS",
  MOISTURE_INFERENCE: "MOISTURE_INFERENCE",
  ROOF_CONDITION: "ROOF_CONDITION",
  ENVELOPE_ANALYSIS: "ENVELOPE_ANALYSIS",
  GEOMETRY_ANALYSIS: "GEOMETRY_ANALYSIS",
  CHANGE_DETECTION: "CHANGE_DETECTION",
  SYSTEM_CONDITION: "SYSTEM_CONDITION",
  DAMAGE_CLASSIFICATION: "DAMAGE_CLASSIFICATION",
  MATERIAL_CLASSIFICATION: "MATERIAL_CLASSIFICATION",
  MAINTENANCE_RISK: "MAINTENANCE_RISK",
  PROJECT_OPPORTUNITY: "PROJECT_OPPORTUNITY",
  PREDICTION: "PREDICTION",
  OTHER: "OTHER",
};

export const MODEL_STATUS = {
  DEVELOPMENT: "DEVELOPMENT",
  VALIDATING: "VALIDATING",
  ACTIVE: "ACTIVE",
  DEGRADED: "DEGRADED",
  PAUSED: "PAUSED",
  RETIRED: "RETIRED",
  ERROR: "ERROR",
};

export const MODEL_SOURCE_MODE = {
  PRODUCTION: "PRODUCTION",
  FIXTURE: "FIXTURE",
  SIMULATION: "SIMULATION",
  MANUAL_RULE: "MANUAL_RULE",
  EXTERNAL_PROVIDER: "EXTERNAL_PROVIDER",
};

export const CORTEX_ANALYSIS_STATUS = {
  QUEUED: "QUEUED",
  PREPARING: "PREPARING",
  RUNNING: "RUNNING",
  AWAITING_REVIEW: "AWAITING_REVIEW",
  COMPLETE: "COMPLETE",
  COMPLETE_WITH_WARNINGS: "COMPLETE_WITH_WARNINGS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
};

export const CORTEX_TASK_STATE = {
  PENDING: "PENDING",
  RUNNING: "RUNNING",
  COMPLETE: "COMPLETE",
  COMPLETE_WITH_WARNINGS: "COMPLETE_WITH_WARNINGS",
  FAILED: "FAILED",
  SKIPPED: "SKIPPED",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
};

export const PASSPORT_ELIGIBILITY = {
  NOT_ELIGIBLE: "NOT_ELIGIBLE",
  PENDING_REVIEW: "PENDING_REVIEW",
  ELIGIBLE: "ELIGIBLE",
  ELIGIBLE_WITH_WARNING: "ELIGIBLE_WITH_WARNING",
  BLOCKED: "BLOCKED",
};

export const GOLD_VALIDATION_METHOD = {
  HUMAN_CONFIRMED: "HUMAN_CONFIRMED",
  DIRECT_MEASUREMENT: "DIRECT_MEASUREMENT",
  DESTRUCTIVE_VERIFICATION: "DESTRUCTIVE_VERIFICATION",
  REPAIR_OBSERVATION: "REPAIR_OBSERVATION",
  FOLLOWUP_SCAN: "FOLLOWUP_SCAN",
  LAB_TEST: "LAB_TEST",
  OTHER: "OTHER",
};

export const PREDICTION_STATE = {
  ACTIVE: "ACTIVE",
  VALIDATED: "VALIDATED",
  PARTIALLY_VALIDATED: "PARTIALLY_VALIDATED",
  DISPROVEN: "DISPROVEN",
  EXPIRED: "EXPIRED",
  INSUFFICIENT_FOLLOWUP: "INSUFFICIENT_FOLLOWUP",
};

export const VALIDATION_RESULT = {
  CONFIRMED: "CONFIRMED",
  PARTIALLY_CONFIRMED: "PARTIALLY_CONFIRMED",
  DISPROVEN: "DISPROVEN",
  INCONCLUSIVE: "INCONCLUSIVE",
};

export const PROVIDER_STATE = {
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  FIXTURE: "FIXTURE",
  DEGRADED: "DEGRADED",
  ERROR: "ERROR",
};

export const CORTEX_REANALYSIS_STATUS = {
  REQUESTED: "REQUESTED",
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  COMPLETE: "COMPLETE",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

export const CONFLICT_STATE = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
  ACCEPTED_DIFFERENCE: "ACCEPTED_DIFFERENCE",
  INSUFFICIENT_DATA: "INSUFFICIENT_DATA",
};

const defineDefaultModel = (overrides = {}) => ({
  modelId: "CX-MODEL-THERMAL-01",
  name: "Cortex Thermal Fixture",
  version: "1.0.0",
  provider: "FIXTURE_PROVIDER",
  taskType: MODEL_TASK_TYPES.THERMAL_ANALYSIS,
  status: MODEL_STATUS.ACTIVE,
  sourceMode: MODEL_SOURCE_MODE.FIXTURE,
  createdAt: new Date().toISOString(),
  releasedAt: new Date().toISOString(),
  retiredAt: null,
  capabilities: [MODEL_TASK_TYPES.THERMAL_ANALYSIS, MODEL_TASK_TYPES.MOISTURE_INFERENCE],
  requiredInputs: ["thermal_source", "spatial_layer"],
  outputTypes: ["analysis", "finding"],
  validationState: "FIXTURE_VALIDATED",
  notes: "Fixture model used for simulated intelligence. It is not production AI.",
  ...overrides,
});

const MODEL_REGISTRY = [
  defineDefaultModel(),
  defineDefaultModel({
    modelId: "CX-MODEL-ROOF-01",
    name: "Cortex Roof Condition Fixture",
    version: "1.0.0",
    provider: "FIXTURE_PROVIDER",
    taskType: MODEL_TASK_TYPES.ROOF_CONDITION,
    capabilities: [MODEL_TASK_TYPES.ROOF_CONDITION, MODEL_TASK_TYPES.GEOMETRY_ANALYSIS],
    requiredInputs: ["geometry", "visual_evidence"],
    outputTypes: ["analysis", "finding"],
    notes: "Fixture model used for development and governance tests.",
  }),
  defineDefaultModel({
    modelId: "CX-MODEL-GEOM-01",
    name: "Cortex Geometry Fixture",
    version: "1.0.0",
    provider: "FIXTURE_PROVIDER",
    taskType: MODEL_TASK_TYPES.GEOMETRY_ANALYSIS,
    capabilities: [MODEL_TASK_TYPES.GEOMETRY_ANALYSIS, MODEL_TASK_TYPES.CHANGE_DETECTION],
    requiredInputs: ["twin_version", "measurements"],
    outputTypes: ["analysis"],
  }),
];

const runtimeAnalyses = [...legacyAnalyses];
const runtimeFindings = [...legacyFindings];
const runtimePredictions = [...legacyPredictions];
const runtimeGoldCandidates = [...legacyGoldCandidates];

const makeFindingId = (propertyId) => `FD-${propertyId.slice(-4)}-${Date.now().toString().slice(-4)}`;
const makeAnalysisJobId = () => `CJ-${Date.now().toString().slice(-6)}`;
const makeTaskId = () => `CT-${Date.now().toString().slice(-6)}`;
const makeFindingRecord = (input) => ({
  ...input,
  findingId: input.findingId || makeFindingId(input.propertyId),
  status: input.status || "DRAFT",
  passportEligibility: input.passportEligibility || PASSPORT_ELIGIBILITY.PENDING_REVIEW,
  createdAt: input.createdAt || new Date().toISOString(),
  reviewState: input.reviewState || REVIEW_STATE.PENDING,
});

export const CortexModelRegistry = {
  list: () => MODEL_REGISTRY.map((m) => ({ ...m })),
  getById: (modelId) => MODEL_REGISTRY.find((m) => m.modelId === modelId) || null,
  getByTask: (taskType) => MODEL_REGISTRY.filter((m) => m.taskType === taskType),
  register: (entry) => {
    const next = { ...defineDefaultModel(), ...entry };
    MODEL_REGISTRY.push(next);
    return next;
  },
};

export const CortexAnalysisProvider = {
  getStatus: () => ({
    mode: MODEL_SOURCE_MODE.FIXTURE,
    status: PROVIDER_STATE.FIXTURE,
    detail: "Fixture-only provider active; this environment is intentionally simulated and not connected to a live inference service.",
  }),
  validateInputs: (job) => {
    if (!job || !job.requestedAnalysisTypes?.length) return { ok: false, code: "INSUFFICIENT_DATA" };
    const noThermal = job.requestedAnalysisTypes.includes(MODEL_TASK_TYPES.THERMAL_ANALYSIS)
      && (!job.inputEvidenceIds || !job.inputEvidenceIds.some((id) => /thermal|radiometric|infrared/i.test(String(id))));
    return noThermal ? { ok: false, code: "INSUFFICIENT_DATA" } : { ok: true, code: null };
  },
  executeTask: async (task) => ({ ok: true, taskId: task.taskId, status: CORTEX_TASK_STATE.COMPLETE }),
  getModelInfo: (modelId) => CortexModelRegistry.getById(modelId),
  getStatusForModel: (modelId) => ({ modelId, ...CortexModelRegistry.getById(modelId) }),
};

export const CortexAnalysisJob = {
  create: ({
    propertyId,
    missionId,
    evidenceManifestId,
    spatialManifestId,
    requestedAnalysisTypes = [],
    modelAssignments = [],
    sourceMode = MODEL_SOURCE_MODE.FIXTURE,
    forceNoThermal = false,
  }) => {
    const modelList = modelAssignments.length ? modelAssignments : requestedAnalysisTypes.map((type) => {
      const model = CortexModelRegistry.getByTask(type)[0] || CortexModelRegistry.list()[0];
      return { type, modelId: model.modelId, modelVersion: model.version, status: MODEL_STATUS.ACTIVE };
    });

    const thermalRequired = requestedAnalysisTypes.includes(MODEL_TASK_TYPES.THERMAL_ANALYSIS);
    const hasThermalInput = forceNoThermal ? false : !thermalRequired || !!evidenceManifestId;

    const next = {
      analysisJobId: makeAnalysisJobId(),
      propertyId,
      missionId,
      evidenceManifestId,
      spatialManifestId,
      requestedAnalysisTypes,
      modelAssignments: modelList,
      status: thermalRequired && !hasThermalInput ? CORTEX_ANALYSIS_STATUS.INSUFFICIENT_DATA : CORTEX_ANALYSIS_STATUS.QUEUED,
      priority: "normal",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      warnings: thermalRequired && !hasThermalInput ? ["THERMAL_ANALYSIS requested without a valid thermal source."] : [],
      failureReason: null,
      retryCount: 0,
      sourceMode,
    };

    runtimeAnalyses.push({
      ...next,
      analysisId: next.analysisJobId,
      analysisType: requestedAnalysisTypes.join(", "),
      modelName: modelList[0]?.modelId || "fixture-model",
      modelVersion: modelList[0]?.modelVersion || "1.0.0",
      analysisVersion: "av-fixture",
      inputEvidenceIds: [],
      findingIds: [],
      confidenceSummary: null,
      reviewState: REVIEW_STATE.NOT_REQUIRED,
      previousAnalysisId: null,
      comparisonTargetId: null,
      createdBySystem: "pipeline:cortex",
    });
    return next;
  },
  listByProperty: (propertyId) => runtimeAnalyses.filter((a) => a.propertyId === propertyId),
};

export const CortexAnalysisTask = {
  create: ({
    analysisJobId,
    propertyId,
    analysisType,
    modelId,
    modelVersion,
    inputEvidenceIds = [],
    inputSpatialArtifactIds = [],
    inputMeasurementIds = [],
    status = CORTEX_TASK_STATE.PENDING,
  }) => {
    const required = analysisType === MODEL_TASK_TYPES.THERMAL_ANALYSIS ? ["thermal_source", "spatial_layer"] : [];
    const insufficient = required.length && !inputEvidenceIds.length && !inputSpatialArtifactIds.length;
    return {
      taskId: makeTaskId(),
      analysisJobId,
      propertyId,
      analysisType,
      modelId,
      modelVersion,
      status: insufficient ? CORTEX_TASK_STATE.INSUFFICIENT_DATA : status,
      inputEvidenceIds,
      inputSpatialArtifactIds,
      inputMeasurementIds,
      startedAt: null,
      completedAt: null,
      outputAnalysisIds: [],
      warnings: insufficient ? ["Required inputs missing for " + analysisType] : [],
      failureReason: insufficient ? "INSUFFICIENT_DATA" : null,
    };
  },
  validateRequiredInputs: (analysisType, evidenceIds = [], spatialIds = []) => {
    if (analysisType === MODEL_TASK_TYPES.THERMAL_ANALYSIS && (!evidenceIds.length || !spatialIds.length)) {
      return { valid: false, code: "INSUFFICIENT_DATA" };
    }
    return { valid: true, code: null };
  },
};

export const CortexAnalysis = {
  create: (input) => {
    const record = {
      analysisId: input.analysisId || `CX-${Date.now().toString().slice(-6)}`,
      propertyId: input.propertyId,
      missionId: input.missionId,
      analysisJobId: input.analysisJobId,
      taskId: input.taskId || null,
      analysisType: input.analysisType,
      modelId: input.modelId,
      modelVersion: input.modelVersion,
      sourceEvidenceIds: input.sourceEvidenceIds || [],
      sourceSpatialArtifactIds: input.sourceSpatialArtifactIds || [],
      sourceTwinVersionIds: input.sourceTwinVersionIds || [],
      sourceMeasurementIds: input.sourceMeasurementIds || [],
      status: input.status || "DRAFT",
      summary: input.summary || "Analysis created.",
      outputs: input.outputs || [],
      warnings: input.warnings || [],
      createdAt: input.createdAt || new Date().toISOString(),
      sourceMode: input.sourceMode || MODEL_SOURCE_MODE.FIXTURE,
      reviewState: input.reviewState || REVIEW_STATE.PENDING,
    };
    runtimeAnalyses.push(record);
    return record;
  },
  list: () => runtimeAnalyses.map((r) => ({ ...r })),
};

export const CortexFinding = {
  create: (input) => {
    const truth = input.truthClassification || TRUTH_CLASS.MEASURED;
    if (truth === TRUTH_CLASS.PROBABLE && (input.confidence == null || Number(input.confidence) < 0 || Number(input.confidence) > 1)) {
      throw new Error("PROBABLE finding requires a confidence value between 0 and 1.");
    }
    const confidence = truth === TRUTH_CLASS.PROBABLE ? Number(input.confidence) : null;
    const record = makeFindingRecord({
      ...input,
      truthClassification: truth,
      confidence,
      sourceEvidenceIds: input.sourceEvidenceIds || [],
      sourceSpatialArtifactIds: input.sourceSpatialArtifactIds || [],
      sourceTwinVersionIds: input.sourceTwinVersionIds || [],
      featureId: input.featureId || null,
      surfaceId: input.surfaceId || null,
      zoneId: input.zoneId || null,
      bounds: input.bounds || null,
      measurementIds: input.measurementIds || [],
      passportEligibility: input.passportEligibility || (() => {
        if (input.reviewState === REVIEW_STATE.REJECTED) return PASSPORT_ELIGIBILITY.NOT_ELIGIBLE;
        if (truth === TRUTH_CLASS.PROBABLE && input.reviewState !== REVIEW_STATE.VERIFIED) return PASSPORT_ELIGIBILITY.PENDING_REVIEW;
        if (truth === TRUTH_CLASS.PROBABLE && input.reviewState === REVIEW_STATE.VERIFIED) return PASSPORT_ELIGIBILITY.ELIGIBLE;
        return PASSPORT_ELIGIBILITY.ELIGIBLE;
      })(),
      status: input.status || "OPEN",
      title: input.title || "Cortex finding",
      description: input.description || "",
      modelId: input.modelId || "CX-MODEL-THERMAL-01",
      modelVersion: input.modelVersion || "1.0.0",
      reviewState: input.reviewState || REVIEW_STATE.PENDING,
    });
    runtimeFindings.push(record);
    return record;
  },
  review: (findingId, decision, note = "") => {
    const finding = runtimeFindings.find((f) => f.findingId === findingId);
    if (!finding) throw new Error("Finding not found.");
    if (decision === "APPROVE") finding.reviewState = REVIEW_STATE.VERIFIED;
    if (decision === "APPROVE_WITH_NOTE") finding.reviewState = REVIEW_STATE.VERIFIED;
    if (decision === "REJECT") finding.reviewState = REVIEW_STATE.REJECTED;
    if (decision === "REQUEST_MORE_EVIDENCE") finding.reviewState = REVIEW_STATE.NEEDS_MORE_EVIDENCE;
    if (decision === "REQUEST_REANALYSIS") finding.reviewState = REVIEW_STATE.PENDING;
    if (decision === "MARK_NOT_OBSERVED") finding.reviewState = REVIEW_STATE.VERIFIED;
    if (decision === "SUPERSEDE") finding.reviewState = REVIEW_STATE.VERIFIED;
    if (note) finding.notes = `${(finding.notes || "").trim()} ${note}`.trim();
    finding.passportEligibility = decision === "REJECT" ? PASSPORT_ELIGIBILITY.NOT_ELIGIBLE :
      finding.truthClassification === TRUTH_CLASS.PROBABLE && finding.reviewState !== REVIEW_STATE.VERIFIED ? PASSPORT_ELIGIBILITY.PENDING_REVIEW : PASSPORT_ELIGIBILITY.ELIGIBLE;
    return finding;
  },
  list: () => runtimeFindings.map((f) => ({ ...f })),
};

export const PassportCandidateManifest = {
  build: ({
    propertyId,
    sourceFindingIds,
    sourceAnalysisIds,
    reviewState,
    truthClasses,
    warnings,
    sourceVersions,
  }) => ({
    manifestId: `PCM-${propertyId}-${Date.now().toString().slice(-6)}`,
    propertyId,
    sourceFindingIds: sourceFindingIds || [],
    sourceAnalysisIds: sourceAnalysisIds || [],
    truthClasses: truthClasses || [],
    warnings: warnings || [],
    reviewState: reviewState || REVIEW_STATE.PENDING,
    createdAt: new Date().toISOString(),
    sourceVersions: sourceVersions || [],
  }),
};

export const GoldEvidenceRecord = {
  create: ({
    propertyId,
    sourcePredictionFindingId,
    sourceMissionId,
    sourceEvidenceIds,
    sourceTwinVersionIds,
    validatedOutcome,
    validationMethod,
    validatedBy,
    validatedAt,
    qualityState,
    notes,
  }) => {
    if (!sourcePredictionFindingId || !validatedOutcome || !validationMethod) {
      throw new Error("Gold evidence requires validated outcome and validation method.");
    }
    return {
      goldEvidenceId: `GE-${Date.now().toString().slice(-6)}`,
      propertyId,
      sourcePredictionFindingId,
      sourceMissionId,
      sourceEvidenceIds: sourceEvidenceIds || [],
      sourceTwinVersionIds: sourceTwinVersionIds || [],
      validatedOutcome,
      validationMethod,
      validatedBy,
      validatedAt,
      qualityState: qualityState || "PASS",
      notes: notes || "",
    };
  },
};

export const CortexPrediction = {
  create: ({
    propertyId,
    findingId,
    analysisId,
    predictionType,
    targetFeatureId,
    predictedState,
    confidence,
    predictedAt,
    validFrom,
    validUntil,
    modelId,
    modelVersion,
    status = PREDICTION_STATE.ACTIVE,
  }) => ({
    predictionId: `CP-${Date.now().toString().slice(-6)}`,
    propertyId,
    findingId,
    analysisId,
    predictionType: predictionType || "INTELLIGENCE_PREDICTION",
    targetFeatureId: targetFeatureId || null,
    predictedState,
    confidence: confidence == null ? null : Number(confidence),
    predictedAt: predictedAt || new Date().toISOString(),
    validFrom: validFrom || new Date().toISOString(),
    validUntil: validUntil || null,
    modelId: modelId || "CX-MODEL-THERMAL-01",
    modelVersion: modelVersion || "1.0.0",
    status,
  }),
};

export const PredictionValidation = {
  create: ({
    predictionId,
    propertyId,
    followupMissionId,
    followupEvidenceIds,
    followupTwinVersionIds,
    goldEvidenceId,
    actualOutcome,
    result,
    validatedAt,
    validatedBy,
    notes,
  }) => ({
    validationId: `PV-${Date.now().toString().slice(-6)}`,
    predictionId,
    propertyId,
    followupMissionId: followupMissionId || null,
    followupEvidenceIds: followupEvidenceIds || [],
    followupTwinVersionIds: followupTwinVersionIds || [],
    goldEvidenceId: goldEvidenceId || null,
    actualOutcome: actualOutcome || "",
    result: result || VALIDATION_RESULT.INCONCLUSIVE,
    validatedAt: validatedAt || new Date().toISOString(),
    validatedBy: validatedBy || "system",
    notes: notes || "",
  }),
};

export const CortexLongitudinalProfile = {
  compute: ({ propertyId, findings = [], predictions = [], validatedOutcomes = [], twinVersions = [], repairEvents = [], maintenanceEvents = [], changes = [] }) => {
    const hasBaseline = findings.length > 0 || predictions.length > 0 || twinVersions.length > 0;
    const hasFollowUp = validatedOutcomes.length > 0 || repairEvents.length > 0 || maintenanceEvents.length > 0 || changes.length > 0;
    let trendClass = "UNKNOWN";
    if (hasBaseline && hasFollowUp) {
      const worsening = findings.some((f) => f.severity === "high" || f.severity === "critical");
      trendClass = worsening ? "WORSENING" : "PERSISTENT";
    } else if (!hasBaseline && !hasFollowUp) {
      trendClass = "UNKNOWN";
    }
    return {
      propertyId,
      findings: findings.map((f) => f.findingId),
      predictions: predictions.map((p) => p.predictionId),
      validatedOutcomes: validatedOutcomes.map((o) => o.validationId || o.id || "outcome"),
      twinVersions: twinVersions.map((v) => v.twinVersionId || v.id),
      repairEvents: repairEvents.map((r) => r.eventId || r.id || "repair"),
      maintenanceEvents: maintenanceEvents.map((m) => m.maintenanceId || m.id || "maintenance"),
      changes: changes.map((c) => c.changeId || c.id || "change"),
      trendClass,
      computedAt: new Date().toISOString(),
    };
  },
};

export const CortexModelPerformance = {
  create: ({
    modelId,
    modelVersion,
    taskType,
    evaluationWindow,
    validatedPredictionCount,
    confirmedCount,
    partialCount,
    disprovenCount,
    inconclusiveCount,
    precisionMetric,
    recallMetric,
    calibrationMetric,
    dataQualityState,
    sourceMode,
  }) => {
    const insufficient = Number(validatedPredictionCount || 0) === 0;
    return {
      modelId,
      modelVersion,
      taskType,
      evaluationWindow,
      validatedPredictionCount: Number(validatedPredictionCount || 0),
      confirmedCount: Number(confirmedCount || 0),
      partialCount: Number(partialCount || 0),
      disprovenCount: Number(disprovenCount || 0),
      inconclusiveCount: Number(inconclusiveCount || 0),
      precisionMetric: insufficient ? null : precisionMetric,
      recallMetric: insufficient ? null : recallMetric,
      calibrationMetric: insufficient ? null : calibrationMetric,
      dataQualityState: insufficient ? "INSUFFICIENT_VALIDATED_DATA" : (dataQualityState || "UNKNOWN"),
      sourceMode: sourceMode || MODEL_SOURCE_MODE.FIXTURE,
      generatedAt: new Date().toISOString(),
    };
  },
};

export const CortexConflict = {
  create: ({
    propertyId,
    title,
    description,
    sourceAnalysisIds,
    sourceFindingIds,
    state = CONFLICT_STATE.OPEN,
  }) => ({
    conflictId: `CF-${Date.now().toString().slice(-6)}`,
    propertyId,
    title,
    description,
    sourceAnalysisIds: sourceAnalysisIds || [],
    sourceFindingIds: sourceFindingIds || [],
    state,
    createdAt: new Date().toISOString(),
  }),
};

export const CortexReanalysisRequest = {
  create: ({
    propertyId,
    analysisId,
    reason,
    requestedBy,
    requestedAt,
    targetModelVersion,
    status = CORTEX_REANALYSIS_STATUS.REQUESTED,
  }) => ({
    requestId: `CRR-${Date.now().toString().slice(-6)}`,
    propertyId,
    analysisId,
    reason,
    requestedBy,
    requestedAt: requestedAt || new Date().toISOString(),
    targetModelVersion: targetModelVersion || null,
    status,
  }),
};

export const analyses = runtimeAnalyses;
export const findings = runtimeFindings;
export const predictions = runtimePredictions;
export const goldCandidates = runtimeGoldCandidates;

export const CortexService = {
  listAnalyses: () => serve(() => runtimeAnalyses),
  listAnalysesByProperty: (propertyId) =>
    serve(() => runtimeAnalyses.filter((a) => a.propertyId === propertyId)),
  listAnalysesByMission: (missionId) =>
    serve(() => runtimeAnalyses.filter((a) => a.missionId === missionId)),

  getAnalysis: (analysisId) =>
    serve(() => {
      const analysis = runtimeAnalyses.find((a) => a.analysisId === analysisId);
      if (!analysis) throw new Error("Analysis not found.");
      return {
        analysis,
        findings: runtimeFindings.filter((f) => f.cortexAnalysisId === analysisId || f.analysisId === analysisId),
        previous: runtimeAnalyses.find((a) => a.analysisId === analysis.previousAnalysisId) || null,
        comparison: runtimeAnalyses.find((a) => a.analysisId === analysis.comparisonTargetId) || null,
      };
    }),

  listFindings: () => serve(() => runtimeFindings),
  listFindingsByProperty: (propertyId) =>
    serve(() => runtimeFindings.filter((f) => f.propertyId === propertyId)),
  listFindingsByMission: (missionId) =>
    serve(() => runtimeFindings.filter((f) => f.missionId === missionId)),
  listFindingsByEvidence: (evidenceId) =>
    serve(() => runtimeFindings.filter((f) => f.sourceEvidenceIds.includes(evidenceId))),

  getFinding: (findingId) =>
    serve(() => {
      const finding = runtimeFindings.find((f) => f.findingId === findingId);
      if (!finding) throw new Error("Finding not found.");
      return {
        finding,
        analysis: runtimeAnalyses.find((a) => a.analysisId === finding.cortexAnalysisId || a.analysisId === finding.analysisId) || null,
        prediction: runtimePredictions.find((p) => p.findingId === findingId) || null,
      };
    }),

  getCommandSummary: () =>
    serve(() => ({
      queued: runtimeAnalyses.filter((a) => a.status === "QUEUED").length,
      running: runtimeAnalyses.filter((a) => a.status === "RUNNING").length,
      complete: runtimeAnalyses.filter((a) => a.status === "COMPLETE").length,
      failed: runtimeAnalyses.filter((a) => a.status === "FAILED").length,
      reviewRequired: runtimeFindings.filter((f) =>
        [REVIEW_STATE.PENDING, REVIEW_STATE.IN_REVIEW, REVIEW_STATE.NEEDS_MORE_EVIDENCE].includes(f.reviewState)
      ).length,
      openProbableFindings: runtimeFindings.filter(
        (f) => f.truthClassification === TRUTH_CLASS.PROBABLE && f.reviewState !== REVIEW_STATE.VERIFIED
      ).length,
      goldCandidates: runtimeGoldCandidates.filter((g) => g.state === "CANDIDATE").length,
      modelVersions: [...new Set(runtimeAnalyses.map((a) => (a.modelName || a.modelId || "fixture") + " " + (a.modelVersion || "1.0.0")))],
    })),

  listPredictions: () => serve(() => runtimePredictions),
  listPredictionsByProperty: (propertyId) =>
    serve(() => runtimePredictions.filter((p) => p.propertyId === propertyId)),
  listGoldCandidates: () => serve(() => runtimeGoldCandidates),
  listGoldCandidatesByProperty: (propertyId) =>
    serve(() => runtimeGoldCandidates.filter((g) => g.propertyId === propertyId)),
};

export default CortexService;
