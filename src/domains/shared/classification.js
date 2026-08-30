/**
 * SHARED TRUTH + REVIEW MODEL
 *
 * These are declared exactly once and imported everywhere. Evidence, findings,
 * measurements, Cortex output, reports and Passport all speak this vocabulary.
 * Re-declaring any of it inside a domain is an architectural error.
 */

/**
 * Truth classification is constitutional. It survives every hop through the
 * system and is never silently upgraded.
 *
 *   MEASURED  directly captured or instrumentally measured
 *   DERIVED   calculated from measured evidence
 *   PROBABLE  an inference that carries uncertainty
 *
 * PROBABLE is never presented as MEASURED. Confidence is meaningful only on
 * PROBABLE values — attaching a confidence score to a MEASURED fact is a bug.
 */
export const TRUTH_CLASS = {
  MEASURED: "MEASURED",
  DERIVED: "DERIVED",
  PROBABLE: "PROBABLE",
};

export const TRUTH_CLASS_STYLE = {
  MEASURED: { fg: "#9CC6FF", bg: "rgba(30,107,255,0.16)", bd: "rgba(30,107,255,0.45)" },
  DERIVED: { fg: "#C9D8E8", bg: "rgba(160,185,210,0.12)", bd: "rgba(160,185,210,0.35)" },
  PROBABLE: { fg: "#FFD873", bg: "rgba(240,180,41,0.14)", bd: "rgba(240,180,41,0.45)" },
};

/** Confidence is only meaningful for PROBABLE values. */
export const confidenceApplies = (truthClass) => truthClass === TRUTH_CLASS.PROBABLE;

/**
 * ARTIFACT CATEGORY is a separate fact from truth classification.
 * A DERIVED mesh can carry a MEASURED surface area. An ORIGINAL photograph can
 * support only a PROBABLE conclusion. Neither implies the other — never
 * collapse these two axes into one field.
 */
export const ARTIFACT_KIND = {
  ORIGINAL: "ORIGINAL",
  PROCESSED: "PROCESSED",
  DERIVED: "DERIVED",
  ANNOTATION: "ANNOTATION",
  AI_GENERATED: "AI_GENERATED",
};

/** One review lifecycle, used by findings, Cortex output, evidence validation
 *  and Passport promotion alike. */
export const REVIEW_STATE = {
  NOT_REQUIRED: "NOT_REQUIRED",
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  NEEDS_MORE_EVIDENCE: "NEEDS_MORE_EVIDENCE",
};

export const REVIEW_STATE_LABEL = {
  NOT_REQUIRED: { label: "Not Required", tone: "mute", mark: "○" },
  PENDING: { label: "Pending", tone: "info", mark: "◐" },
  IN_REVIEW: { label: "In Review", tone: "info", mark: "◐" },
  VERIFIED: { label: "Verified", tone: "ok", mark: "●" },
  REJECTED: { label: "Rejected", tone: "bad", mark: "✕" },
  NEEDS_MORE_EVIDENCE: { label: "Needs More Evidence", tone: "warn", mark: "▲" },
};

/**
 * GOLD EVIDENCE — human-reviewed, high-quality evidence eligible for future
 * model evaluation work. A candidate must reach an appropriate review state
 * first; nothing is promoted for merely looking good.
 */
export const GOLD_STATE = {
  NONE: "NONE",
  CANDIDATE: "CANDIDATE",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

export const goldEligible = (reviewState) =>
  reviewState === REVIEW_STATE.VERIFIED;

/** Prediction-versus-reality outcomes. Cortex learns from these later. */
export const VERIFICATION_RESULT = {
  CONFIRMED: "CONFIRMED",
  PARTIALLY_CONFIRMED: "PARTIALLY_CONFIRMED",
  NOT_CONFIRMED: "NOT_CONFIRMED",
  INCONCLUSIVE: "INCONCLUSIVE",
};
