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
import { analyses, findings, predictions, goldCandidates } from "./fixtures.js";
import { serve } from "../shared/transport.js";
import { TRUTH_CLASS, REVIEW_STATE } from "../shared/classification.js";

export const CortexService = {
  // ---- analyses -----------------------------------------------------------
  listAnalyses: () => serve(() => analyses),
  listAnalysesByProperty: (propertyId) =>
    serve(() => analyses.filter((a) => a.propertyId === propertyId)),
  listAnalysesByMission: (missionId) =>
    serve(() => analyses.filter((a) => a.missionId === missionId)),

  getAnalysis: (analysisId) =>
    serve(() => {
      const analysis = analyses.find((a) => a.analysisId === analysisId);
      if (!analysis) throw new Error("Analysis not found.");
      return {
        analysis,
        findings: findings.filter((f) => f.cortexAnalysisId === analysisId),
        previous: analyses.find((a) => a.analysisId === analysis.previousAnalysisId) || null,
        comparison: analyses.find((a) => a.analysisId === analysis.comparisonTargetId) || null,
      };
    }),

  // ---- findings -----------------------------------------------------------
  listFindings: () => serve(() => findings),
  listFindingsByProperty: (propertyId) =>
    serve(() => findings.filter((f) => f.propertyId === propertyId)),
  listFindingsByMission: (missionId) =>
    serve(() => findings.filter((f) => f.missionId === missionId)),
  listFindingsByEvidence: (evidenceId) =>
    serve(() => findings.filter((f) => f.sourceEvidenceIds.includes(evidenceId))),

  getFinding: (findingId) =>
    serve(() => {
      const finding = findings.find((f) => f.findingId === findingId);
      if (!finding) throw new Error("Finding not found.");
      return {
        finding,
        analysis: analyses.find((a) => a.analysisId === finding.cortexAnalysisId) || null,
        prediction: predictions.find((p) => p.findingId === findingId) || null,
      };
    }),

  // ---- command surface summary -------------------------------------------
  getCommandSummary: () =>
    serve(() => ({
      queued: analyses.filter((a) => a.status === "QUEUED").length,
      running: analyses.filter((a) => a.status === "RUNNING").length,
      complete: analyses.filter((a) => a.status === "COMPLETE").length,
      failed: analyses.filter((a) => a.status === "FAILED").length,
      reviewRequired: analyses.filter((a) =>
        [REVIEW_STATE.PENDING, REVIEW_STATE.IN_REVIEW, REVIEW_STATE.NEEDS_MORE_EVIDENCE].includes(a.reviewState)
      ).length,
      openProbableFindings: findings.filter(
        (f) => f.truthClassification === TRUTH_CLASS.PROBABLE && f.reviewState !== REVIEW_STATE.VERIFIED
      ).length,
      goldCandidates: goldCandidates.filter((g) => g.state === "CANDIDATE").length,
      modelVersions: [...new Set(analyses.map((a) => a.modelName + " " + a.modelVersion))],
    })),

  // ---- longitudinal -------------------------------------------------------
  listPredictions: () => serve(() => predictions),
  listPredictionsByProperty: (propertyId) =>
    serve(() => predictions.filter((p) => p.propertyId === propertyId)),
  listGoldCandidates: () => serve(() => goldCandidates),
  listGoldCandidatesByProperty: (propertyId) =>
    serve(() => goldCandidates.filter((g) => g.propertyId === propertyId)),
};

export default CortexService;
