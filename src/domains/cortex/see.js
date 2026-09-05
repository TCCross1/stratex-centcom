/**
 * Cortex See — inspection findings and the Passport commit door.
 * Save stays on Cortex. Commit writes Passport version N+1.
 * Evidence is never mutated. Dollars and hours are never written.
 */
import EvidenceService from "../evidence/service.js";
import { TRUTH_CLASS, REVIEW_STATE } from "../shared/classification.js";
import { PASSPORT_REVISION_STATE } from "../passport/constants.js";
import { createPassportRevision } from "../passport/builders.js";
import { appendSeeVersion, listSeeVersions } from "../passport/see-versions.js";

export const FINDING_TREATMENT = {
  REPAIR: "REPAIR",
  OVERLAY: "OVERLAY",
  TEAR_OFF_REPLACE: "TEAR_OFF_REPLACE",
};

const SEE_PREFIX = "FD-SEE-";
const BOOTSTRAP_HEAD = "r2";
const BOOTSTRAP_COUNT = 2;

export function validateSeeDraft(draft) {
  if (!draft?.missionId) throw new Error("Mission ID is required.");
  if (!draft?.evidenceAssetId) throw new Error("Evidence asset is required.");
  if (!draft?.label) throw new Error("Label is required.");
  if (!draft?.whatISee || !String(draft.whatISee).trim()) throw new Error("What I see is required.");
  if (!draft?.likelyCause || !String(draft.likelyCause).trim()) throw new Error("Likely cause is required.");
  if (!draft?.treatment) throw new Error("Treatment is required.");
  if (!draft?.bbox || !draft.bbox.width || !draft.bbox.height) throw new Error("Bounding box is required.");
  if (draft.treatment === FINDING_TREATMENT.REPAIR && (!draft.repairDetail || !String(draft.repairDetail).trim())) {
    throw new Error("repairDetail is required when treatment is REPAIR.");
  }
  return { ok: true };
}

function snapshotFinding(finding) {
  return {
    findingId: finding.findingId,
    missionId: finding.missionId,
    evidenceAssetId: finding.evidenceAssetId,
    bbox: finding.bbox,
    crop: finding.crop || null,
    label: finding.label,
    whatISee: finding.whatISee,
    likelyCause: finding.likelyCause,
    treatment: finding.treatment,
    repairDetail: finding.repairDetail || "",
    userMaterialNotes: finding.userMaterialNotes || "",
  };
}

function assertNoMoney(content) {
  const banned = ["dollars", "hours", "price", "cost", "estimate", "laborHours"];
  const blob = JSON.stringify(content);
  for (const key of banned) {
    if (Object.prototype.hasOwnProperty.call(content, key) || blob.includes(`"${key}"`)) {
      throw new Error("See commit must not write " + key + ".");
    }
  }
}

export async function createSeeFinding(draft, findings) {
  validateSeeDraft(draft);
  const asset = await EvidenceService.get(draft.evidenceAssetId);
  if (!asset || (asset.bytes ?? 0) <= 0) throw new Error("Evidence asset is missing bytes; cannot box this finding.");
  if (draft.missingBytes === true || draft.bytes === 0 || (draft.bytes == null && asset.bytes == null)) {
    throw new Error("Evidence asset is missing bytes; cannot box this finding.");
  }
  const record = {
    findingId: SEE_PREFIX + Date.now().toString().slice(-6),
    title: draft.label,
    description: draft.whatISee,
    missionId: draft.missionId,
    propertyId: draft.propertyId || asset.propertyId || null,
    evidenceAssetId: draft.evidenceAssetId,
    sourceEvidenceIds: [draft.evidenceAssetId],
    bbox: draft.bbox,
    crop: draft.crop || null,
    label: draft.label,
    whatISee: draft.whatISee,
    likelyCause: draft.likelyCause,
    treatment: draft.treatment,
    repairDetail: draft.repairDetail || "",
    userMaterialNotes: draft.userMaterialNotes || "",
    status: "OPEN",
    reviewState: REVIEW_STATE.PENDING,
    triageState: "NEW",
    truthClassification: TRUTH_CLASS.MEASURED,
    passportEligibility: "PENDING_REVIEW",
    committedToPassport: false,
    passportVersionId: null,
    createdAt: new Date().toISOString(),
    createdBy: "operator",
    bounds: draft.bbox,
    sourceMode: "FIXTURE",
  };
  findings.push(record);
  return record;
}

export async function commitSeeToPassport(target, findings) {
  const id = typeof target === "string" ? target : (target?.findingId || target?.missionId);
  if (!id) throw new Error("findingId or missionId is required.");

  const byFinding = findings.find((f) => f.findingId === id);
  const missionId = byFinding?.missionId || id;
  const pending = findings.filter(
    (f) => f.missionId === missionId && String(f.findingId || "").startsWith(SEE_PREFIX) && !f.committedToPassport
  );
  if (!pending.length) throw new Error("No uncommitted See findings to commit.");

  let propertyId = pending[0].propertyId;
  if (!propertyId) {
    const asset = await EvidenceService.get(pending[0].evidenceAssetId);
    propertyId = asset.propertyId;
  }
  if (!propertyId) throw new Error("Property ID is required to commit See findings.");

  const existing = listSeeVersions(propertyId);
  const revisionNumber = BOOTSTRAP_COUNT + existing.length + 1;
  const parentId = existing.at(-1)?.revisionId || BOOTSTRAP_HEAD;
  const seeFindings = pending.map(snapshotFinding);
  const content = { kind: "CORTEX_SEE", missionId, seeFindings };
  assertNoMoney(content);

  const version = createPassportRevision({
    passportId: "PP-" + propertyId,
    propertyId,
    revisionNumber,
    parentRevisionId: parentId,
    baseRevisionId: parentId,
    createdByType: "CORTEX",
    createdById: "cortex:see",
    sourceType: "cortex-see",
    sourceManifestId: "SEE-" + missionId,
    status: PASSPORT_REVISION_STATE.ACCEPTED,
    changeCount: seeFindings.length,
    warningCount: 0,
    reason: "Cortex See commit",
    content,
  });
  appendSeeVersion(propertyId, version);

  for (const finding of pending) {
    finding.committedToPassport = true;
    finding.passportVersionId = version.revisionId;
    finding.passportEligibility = "ELIGIBLE";
  }

  return { version, findings: pending.map((f) => ({ ...f })), propertyId, missionId };
}
