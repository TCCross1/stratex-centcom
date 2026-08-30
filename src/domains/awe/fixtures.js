/**
 * AWE — AIR · WATER · ENERGY property health.
 *
 * Scores here are DEVELOPMENT FIXTURES. Nothing calculates them yet, and the
 * UI says so. A score is only legitimate when the evidence behind it exists;
 * inventing one would be exactly the kind of fake capability this system
 * refuses to ship.
 */
import { ago, iso } from "../../utils/format.js";
import { TRUTH_CLASS, REVIEW_STATE } from "../shared/classification.js";

export const aweByProperty = {
  "SXP-004182": [
    { dimension: "AIR", status: "Attention", score: 68, scoreIsFixture: true,
      latestObservation: ago(30), truthClassification: TRUTH_CLASS.DERIVED,
      summary: "Supply-register thermal spread widened against the 2026 baseline. Air distribution is degrading.",
      evidenceIds: ["EA-90212"], findingIds: ["FD-7768"],
      changeFromPrior: "-6 vs Twin V2", confidence: null,
      reviewState: REVIEW_STATE.VERIFIED, recommendedReview: false },
    { dimension: "WATER", status: "Action Required", score: 41, scoreIsFixture: true,
      latestObservation: ago(30), truthClassification: TRUTH_CLASS.PROBABLE,
      summary: "A persistent thermal signature on the north roof plane is consistent with retained moisture in the decking.",
      evidenceIds: ["EA-90212", "EA-90291"], findingIds: ["FD-7781"],
      changeFromPrior: "new since Twin V2", confidence: 0.86,
      reviewState: REVIEW_STATE.PENDING, recommendedReview: true },
    { dimension: "ENERGY", status: "Monitoring", score: 74, scoreIsFixture: true,
      latestObservation: ago(30), truthClassification: TRUTH_CLASS.DERIVED,
      summary: "Envelope performance is stable. Roof service life is the limiting factor on future efficiency.",
      evidenceIds: ["EA-90211"], findingIds: ["FD-7776"],
      changeFromPrior: "no change", confidence: null,
      reviewState: REVIEW_STATE.PENDING, recommendedReview: false },
  ],
  "SXP-004188": [
    { dimension: "AIR", status: "Not Observed", score: null, scoreIsFixture: true,
      latestObservation: null, truthClassification: null,
      summary: "No interior or register observation has been captured for this property.",
      evidenceIds: [], findingIds: [], changeFromPrior: null, confidence: null,
      reviewState: REVIEW_STATE.NOT_REQUIRED, recommendedReview: false },
    { dimension: "WATER", status: "Not Observed", score: null, scoreIsFixture: true,
      latestObservation: null, truthClassification: null,
      summary: "No moisture-relevant evidence has been validated for this property.",
      evidenceIds: [], findingIds: [], changeFromPrior: null, confidence: null,
      reviewState: REVIEW_STATE.NOT_REQUIRED, recommendedReview: false },
    { dimension: "ENERGY", status: "Attention", score: null, scoreIsFixture: true,
      latestObservation: ago(35), truthClassification: TRUTH_CLASS.PROBABLE,
      summary: "A cold band on the west elevation may indicate insulation displacement. Coverage was partial — a recapture is required before this rises above a preliminary inference.",
      evidenceIds: ["EA-88044"], findingIds: ["FD-8102"],
      changeFromPrior: null, confidence: 0.52,
      reviewState: REVIEW_STATE.NEEDS_MORE_EVIDENCE, recommendedReview: true },
  ],
};

/** A property with no validated capture shows nothing, not a zero. */
export const aweEmpty = [
  { dimension: "AIR", status: "Not Observed", score: null, scoreIsFixture: true, latestObservation: null, truthClassification: null, summary: "No observation on record.", evidenceIds: [], findingIds: [], changeFromPrior: null, confidence: null, reviewState: REVIEW_STATE.NOT_REQUIRED, recommendedReview: false },
  { dimension: "WATER", status: "Not Observed", score: null, scoreIsFixture: true, latestObservation: null, truthClassification: null, summary: "No observation on record.", evidenceIds: [], findingIds: [], changeFromPrior: null, confidence: null, reviewState: REVIEW_STATE.NOT_REQUIRED, recommendedReview: false },
  { dimension: "ENERGY", status: "Not Observed", score: null, scoreIsFixture: true, latestObservation: null, truthClassification: null, summary: "No observation on record.", evidenceIds: [], findingIds: [], changeFromPrior: null, confidence: null, reviewState: REVIEW_STATE.NOT_REQUIRED, recommendedReview: false },
];
