/**
 * EVIDENCE VAULT SERVICE
 *
 * Ingest, custody, quality, coverage, review, processing lineage and the
 * Cortex handoff. The rules enforced here:
 *
 *   1. An original, once stored, is never overwritten. Review changes metadata;
 *      it never touches the captured file.
 *   2. Custody history is append-only.
 *   3. Nothing reaches Cortex except through a scoped manifest.
 *   4. Rejected and quarantined evidence is preserved, never deleted.
 */
import { serve } from "../shared/transport.js";
import MissionService from "../mission/service.js";
import { readQualificationRegistry, mergeQualificationRegistry } from "../shared/qualification-store.js";
import { computeHash, verifyHash, fixtureHash, HASH_STATE } from "./integrity.js";
import {
  EvidenceStorageProvider, EvidenceSourceProvider, STORAGE_TIER,
  originalPath, derivedPath,
} from "./storage.js";
import {
  PACKAGE_STATUS, ARTIFACT_ORIGIN, INGEST_STATE, IMMUTABILITY, QUALITY_STATE,
  CHECK_SOURCE, COVERAGE_STATE, EVIDENCE_REVIEW, CUSTODY_ACTION, PROCESSING_STATE,
  ELIGIBILITY, requiredAreasFor,
} from "./model.js";
import {
  capturePackages as seedPackages, evidenceAssets as seedAssets,
  qualityAssessments as seedQuality, coverageAssessments as seedCoverage,
  processingJobs as seedJobs, custodyEvents as seedCustody,
} from "./vault-fixtures.js";

const makeStore = (persisted = null) => ({
  packages: (persisted?.evidence?.packages || seedPackages).map((p) => ({ ...p })),
  assets: (persisted?.evidence?.assets || seedAssets).map((a) => ({ ...a })),
  quality: (persisted?.evidence?.quality || seedQuality).map((q) => ({ ...q })),
  coverage: (persisted?.evidence?.coverage || seedCoverage).map((c) => ({ ...c })),
  jobs: (persisted?.evidence?.jobs || seedJobs).map((j) => ({ ...j })),
  custody: (persisted?.evidence?.custody || seedCustody).map((c) => ({ ...c })),
  manifests: persisted?.evidence?.manifests || [],
  events: persisted?.evidence?.events || [],
  audit: persisted?.evidence?.audit || [],
  __qualificationLoaded: false,
});

let store = makeStore();

const ensureEvidenceStateLoaded = async () => {
  if (store.__qualificationLoaded) return store;
  const persisted = await readQualificationRegistry();
  if (persisted) {
    Object.assign(store, makeStore(persisted));
  }
  store.__qualificationLoaded = true;
  return store;
};

const persistEvidenceState = async () => {
  await ensureEvidenceStateLoaded();
  await mergeQualificationRegistry({
    evidence: {
      packages: store.packages,
      assets: store.assets,
      quality: store.quality,
      coverage: store.coverage,
      jobs: store.jobs,
      custody: store.custody,
      manifests: store.manifests,
      events: store.events,
      audit: store.audit,
    },
  });
};

let seq = 0;
const nid = (p) => p + "-" + String(++seq).padStart(4, "0");
const now = () => new Date().toISOString();

function emit(type, { evidenceId = null, propertyId = null, missionId = null, actor = "system", reason = null, from = null, to = null } = {}) {
  store.events.push({ eventId: nid("EVE"), type, at: now(), evidenceId, propertyId, missionId, actor, reason });
  store.audit.push({
    auditId: nid("EVA"), at: now(), actor,
    actorType: actor.startsWith("u-") || actor.startsWith("OP-") ? "OPERATOR" : "SYSTEM",
    domain: "EVIDENCE", action: type, objectType: evidenceId ? "EvidenceAsset" : "CapturePackage",
    objectId: evidenceId, propertyId, missionId,
    previousState: from, newState: to, reason, sourceSystem: "evidence.vault",
  });
}

/** Custody is append-only. Nothing in this file removes a custody event. */
function custody(asset, action, extra = {}) {
  store.custody.push({
    custodyEventId: nid("CUS"), evidenceId: asset.evidenceId,
    propertyId: asset.propertyId, missionId: asset.missionId,
    actor: extra.actor || "system",
    actorType: (extra.actor || "system").startsWith("u-") ? "OPERATOR" : "SYSTEM",
    action, timestamp: now(), sourceSystem: extra.sourceSystem || "evidence.vault",
    storageReference: asset.storageReference || null,
    priorHash: extra.priorHash || null, currentHash: extra.currentHash || null,
    notes: extra.notes || null,
  });
}

const findAsset = (id) => store.assets.find((a) => a.evidenceId === id);
const findPackage = (id) => store.packages.find((p) => p.capturePackageId === id);

export const EvidenceVault = {
  /* ------------------------------------------------------ capture package */

  createCapturePackage: async (missionId, { actor = "system" } = {}) => {
    const mission = await MissionService.get(missionId);
    const prior = store.packages.filter((p) => p.missionId === missionId);
    const pkg = {
      capturePackageId: nid("CP"), propertyId: mission.propertyId, missionId,
      captureSessionId: null, attemptNumber: prior.length + 1,
      createdAt: now(), closedAt: null,
      operatorId: mission.operatorId, aircraftId: mission.aircraftId,
      sensorPackageId: mission.sensorPackageId,
      status: PACKAGE_STATUS.OPEN,
      expectedArtifactTypes: [], receivedArtifactCount: 0, requiredArtifactCount: 0,
      coverageState: COVERAGE_STATE.NOT_EVALUATED,
      validationState: "NOT_REVIEWED", ingestState: INGEST_STATE.NOT_STARTED,
      sourceMode: "FIXTURE", notes: null,
    };
    store.packages.push(pkg);
    emit("CAPTURE_PACKAGE_CREATED", { propertyId: pkg.propertyId, missionId, actor, reason: "Attempt " + pkg.attemptNumber });
    return pkg;
  },

  listPackages: () => serve(() => store.packages),
  listPackagesByMission: (missionId) => serve(() => store.packages.filter((p) => p.missionId === missionId)),
  listPackagesByProperty: (propertyId) => serve(() => store.packages.filter((p) => p.propertyId === propertyId)),
  getPackage: (id) =>
    serve(() => {
      const p = findPackage(id);
      if (!p) throw new Error("Capture package not found.");
      return {
        pkg: p,
        assets: store.assets.filter((a) => a.capturePackageId === id),
        coverage: store.coverage.find((c) => c.capturePackageId === id) || null,
        attempts: store.packages.filter((x) => x.missionId === p.missionId).sort((a, b) => a.attemptNumber - b.attemptNumber),
      };
    }),

  closePackage: (id, { actor = "u-001" } = {}) =>
    serve(() => {
      const p = findPackage(id);
      if (!p) throw new Error("Capture package not found.");
      p.status = PACKAGE_STATUS.CLOSED;
      p.closedAt = now();
      emit("CAPTURE_PACKAGE_CLOSED", { propertyId: p.propertyId, missionId: p.missionId, actor });
      return p;
    }),

  /* --------------------------------------------------------------- ingest */

  /**
   * Ingest one artifact. Validates the relationship first — an asset whose
   * property and mission disagree is quarantined, never stored as truth.
   */
  ingest: async (input, { actor = "system", bytes = null } = {}) => {
    await ensureEvidenceStateLoaded();
    const { propertyId, missionId, capturePackageId, artifactType, origin = ARTIFACT_ORIGIN.ORIGINAL } = input;

    if (!propertyId) throw new Error("Ingest rejected: evidence must name a property.");
    if (!missionId) throw new Error("Ingest rejected: evidence must name a mission.");

    let mission;
    try { mission = await MissionService.get(missionId); }
    catch { throw new Error("Ingest rejected: mission " + missionId + " does not exist."); }
    if (mission.propertyId !== propertyId)
      throw new Error("Ingest rejected: mission " + missionId + " belongs to " + mission.propertyId + ", not " + propertyId + ".");

    const pkg = capturePackageId ? findPackage(capturePackageId) : null;
    if (capturePackageId && !pkg) throw new Error("Ingest rejected: capture package not found.");
    if (pkg && pkg.propertyId !== propertyId)
      throw new Error("Ingest rejected: capture package belongs to a different property.");

    if (origin === ARTIFACT_ORIGIN.DERIVED && !input.parentEvidenceId)
      throw new Error("Ingest rejected: a derived artifact must name its source evidence.");

    const evidenceId = input.evidenceId || nid("EA");
    const captureId = input.captureSessionId || pkg?.captureSessionId || "CAP-UNKNOWN";
    const ref = origin === ARTIFACT_ORIGIN.ORIGINAL
      ? originalPath(propertyId, missionId, captureId, evidenceId)
      : derivedPath(propertyId, missionId, captureId, evidenceId);

    // Hash real bytes. With none, say so — never invent a digest.
    const hash = bytes ? await computeHash(bytes) : fixtureHash();

    const asset = {
      evidenceId, propertyId, missionId,
      captureSessionId: captureId, capturePackageId: capturePackageId || null,
      parentEvidenceId: input.parentEvidenceId || null,
      origin, artifactType,
      thermalKind: input.thermalKind || null,
      mediaType: input.mediaType || null, sensorType: input.sensorType || null,
      filename: input.filename, originalFilename: input.originalFilename || input.filename,
      extension: (input.filename || "").split(".").pop() || null,
      byteSize: input.byteSize ?? (bytes ? bytes.length : null),
      capturedAt: input.capturedAt || null, ingestedAt: now(),
      deviceId: input.deviceId || null, aircraftId: input.aircraftId || mission.aircraftId,
      sensorId: input.sensorId || null, operatorId: input.operatorId || mission.operatorId,
      location: input.location || null, pose: input.pose || null,
      heading: input.heading ?? null, altitude: input.altitude ?? null,
      sourceMode: input.sourceMode || "FIXTURE",
      storageReference: ref, storageTier: origin === ARTIFACT_ORIGIN.ORIGINAL ? STORAGE_TIER.ARCHIVE : STORAGE_TIER.WARM,
      hashAlgorithm: hash.algorithm, contentHash: hash.value, hashState: hash.state,
      hashVerifiedAt: null,
      immutabilityState: origin === ARTIFACT_ORIGIN.ORIGINAL ? IMMUTABILITY.IMMUTABLE : IMMUTABILITY.MUTABLE_METADATA,
      ingestState: INGEST_STATE.COMPLETE,
      reviewState: EVIDENCE_REVIEW.NOT_REVIEWED,
      qualityState: QUALITY_STATE.NOT_EVALUATED,
      coverageState: COVERAGE_STATE.NOT_EVALUATED,
      // Truth classification is NOT implied by file type.
      truthClassification: input.truthClassification || null,
      metadata: input.metadata || {},
      createdAt: now(),
    };

    try {
      if (origin === ARTIFACT_ORIGIN.ORIGINAL) await EvidenceStorageProvider.putOriginal(ref, bytes, { evidenceId });
      else await EvidenceStorageProvider.putDerived(ref, bytes, { evidenceId });
    } catch (e) {
      asset.ingestState = INGEST_STATE.FAILED;
      asset.ingestFailure = { reason: e.message, attempt: 1, at: now(), sourceReference: ref };
      store.assets.push(asset);
      emit("EVIDENCE_INGEST_FAILED", { evidenceId, propertyId, missionId, actor, reason: e.message });
      throw e;
    }

    store.assets.push(asset);
    custody(asset, CUSTODY_ACTION.RECEIVED, { actor });
    if (hash.state === HASH_STATE.COMPUTED) {
      custody(asset, CUSTODY_ACTION.HASHED, { actor, currentHash: hash.value });
      emit("EVIDENCE_HASHED", { evidenceId, propertyId, missionId, actor });
    }
    custody(asset, CUSTODY_ACTION.STORED, { actor });
    custody(asset, CUSTODY_ACTION.INGESTED, { actor });
    if (origin === ARTIFACT_ORIGIN.DERIVED) custody(asset, CUSTODY_ACTION.DERIVED, { actor, notes: "from " + asset.parentEvidenceId });

    emit("EVIDENCE_RECEIVED", { evidenceId, propertyId, missionId, actor });
    emit("EVIDENCE_INGESTED", { evidenceId, propertyId, missionId, actor, to: INGEST_STATE.COMPLETE });

    if (pkg) { pkg.receivedArtifactCount += 1; pkg.ingestState = INGEST_STATE.COMPLETE; }
    await persistEvidenceState();
    return asset;
  },

  /** Quarantine preserves the asset and keeps it away from Cortex. */
  quarantine: (evidenceId, reason, { actor = "u-001" } = {}) =>
    serve(() => {
      const a = findAsset(evidenceId);
      if (!a) throw new Error("Evidence not found.");
      const from = a.reviewState;
      a.ingestState = INGEST_STATE.QUARANTINED;
      a.reviewState = EVIDENCE_REVIEW.QUARANTINED;
      a.quarantineReason = reason;
      custody(a, CUSTODY_ACTION.QUARANTINED, { actor, notes: reason });
      emit("EVIDENCE_QUARANTINED", { evidenceId, propertyId: a.propertyId, missionId: a.missionId, actor, reason, from, to: EVIDENCE_REVIEW.QUARANTINED });
      return a;
    }),

  release: (evidenceId, reason, { actor = "u-001" } = {}) =>
    serve(() => {
      const a = findAsset(evidenceId);
      if (!a) throw new Error("Evidence not found.");
      a.ingestState = INGEST_STATE.COMPLETE;
      a.reviewState = EVIDENCE_REVIEW.NOT_REVIEWED;
      a.quarantineReason = null;
      custody(a, CUSTODY_ACTION.RELEASED, { actor, notes: reason });
      emit("EVIDENCE_RELEASED", { evidenceId, propertyId: a.propertyId, missionId: a.missionId, actor, reason });
      return a;
    }),

  /* ------------------------------------------------------------ integrity */

  verify: async (evidenceId) => {
    const a = findAsset(evidenceId);
    if (!a) throw new Error("Evidence not found.");
    const mat = await EvidenceStorageProvider.materialize(a.storageReference);
    const result = await verifyHash(a.contentHash, mat.materialized ? mat.bytes : null);
    if (result.state === HASH_STATE.VERIFIED) {
      a.hashState = HASH_STATE.VERIFIED;
      a.hashVerifiedAt = result.verifiedAt;
    } else if (result.state === HASH_STATE.MISMATCH) {
      a.hashState = HASH_STATE.MISMATCH;
      emit("HASH_MISMATCH", { evidenceId, propertyId: a.propertyId, missionId: a.missionId, reason: result.reason });
    }
    return result;
  },

  /** Metadata is updatable. Captured content is not. */
  updateMetadata: (evidenceId, patch, { actor = "u-001" } = {}) =>
    serve(() => {
      const a = findAsset(evidenceId);
      if (!a) throw new Error("Evidence not found.");
      const forbidden = ["contentHash", "storageReference", "capturedAt", "originalFilename", "origin", "byteSize"];
      const attempted = Object.keys(patch).filter((k) => forbidden.includes(k));
      if (attempted.length)
        throw new Error("Original evidence is immutable. These fields cannot be changed: " + attempted.join(", ") + ".");
      Object.assign(a, patch);
      return a;
    }),

  changeTier: async (evidenceId, tier, { actor = "u-001", reason = null } = {}) => {
    const a = findAsset(evidenceId);
    if (!a) throw new Error("Evidence not found.");
    const previous = a.storageTier;
    await EvidenceStorageProvider.changeTier(a.storageReference, tier);
    a.storageTier = tier;
    custody(a, CUSTODY_ACTION.MOVED_TIER, { actor, notes: previous + " → " + tier });
    emit("STORAGE_TIER_CHANGED", { evidenceId, propertyId: a.propertyId, missionId: a.missionId, actor, reason, from: previous, to: tier });
    return a;
  },

  /* -------------------------------------------------------------- reading */

  listAll: () => serve(() => store.assets),
  listByProperty: (propertyId) => serve(() => store.assets.filter((a) => a.propertyId === propertyId)),
  listByMission: (missionId) => serve(() => store.assets.filter((a) => a.missionId === missionId)),
  listByPackage: (pkgId) => serve(() => store.assets.filter((a) => a.capturePackageId === pkgId)),
  listDerivedFrom: (evidenceId) => serve(() => store.assets.filter((a) => a.parentEvidenceId === evidenceId)),
  listCustody: (evidenceId) => serve(() => store.custody.filter((c) => c.evidenceId === evidenceId)),

  get: (evidenceId) =>
    serve(() => {
      const a = findAsset(evidenceId);
      if (!a) throw new Error("Evidence not found.");
      return {
        asset: a,
        custody: store.custody.filter((c) => c.evidenceId === evidenceId),
        quality: store.quality.find((q) => q.evidenceId === evidenceId) || null,
        derived: store.assets.filter((x) => x.parentEvidenceId === evidenceId),
        parent: a.parentEvidenceId ? findAsset(a.parentEvidenceId) : null,
        pkg: a.capturePackageId ? findPackage(a.capturePackageId) : null,
        jobs: store.jobs.filter((j) => j.inputEvidenceIds.includes(evidenceId) || j.outputEvidenceIds.includes(evidenceId)),
        eligibility: EvidenceVault.eligibilityOf(a),
      };
    }),

  /* -------------------------------------------------------------- quality */

  assessQuality: (evidenceId, checks, { actor = "u-001", source = CHECK_SOURCE.HUMAN } = {}) =>
    serve(() => {
      const a = findAsset(evidenceId);
      if (!a) throw new Error("Evidence not found.");
      const failed = checks.filter((c) => c.state === "FAIL");
      const warned = checks.filter((c) => c.state === "WARNING");
      const state = failed.length ? QUALITY_STATE.FAIL
        : warned.length ? QUALITY_STATE.PASS_WITH_WARNINGS
        : checks.length ? QUALITY_STATE.PASS : QUALITY_STATE.UNKNOWN;

      const record = {
        assessmentId: nid("EQ"), evidenceId, propertyId: a.propertyId, missionId: a.missionId,
        qualityState: state, checks: checks.map((c) => ({ ...c, source: c.source || source })),
        reviewedAt: now(), reviewedBy: actor, sourceMode: "FIXTURE", notes: null,
      };
      store.quality = store.quality.filter((q) => q.evidenceId !== evidenceId).concat(record);
      a.qualityState = state;
      emit("EVIDENCE_QUALITY_EVALUATED", { evidenceId, propertyId: a.propertyId, missionId: a.missionId, actor, to: state });
      return record;
    }),

  /* ------------------------------------------------------------- coverage */

  assessCoverage: async (capturePackageId, capturedAreas, { actor = "u-001" } = {}) => {
    const pkg = findPackage(capturePackageId);
    if (!pkg) throw new Error("Capture package not found.");
    const mission = await MissionService.get(pkg.missionId);
    const required = requiredAreasFor(mission);
    const missing = required.filter((r) => !capturedAreas.includes(r));
    const percent = required.length ? Math.round(((required.length - missing.length) / required.length) * 100) : null;
    const state = missing.length === 0 ? COVERAGE_STATE.COMPLETE
      : missing.length <= 1 ? COVERAGE_STATE.COMPLETE_WITH_WARNINGS
      : COVERAGE_STATE.INCOMPLETE;

    const record = {
      assessmentId: nid("CA"), capturePackageId, missionId: pkg.missionId, propertyId: pkg.propertyId,
      requiredAreas: required, capturedAreas, missingAreas: missing,
      coverageState: state, completionPercent: percent,
      sourceMode: "FIXTURE", reviewedBy: actor, reviewedAt: now(),
    };
    store.coverage = store.coverage.filter((c) => c.capturePackageId !== capturePackageId).concat(record);
    pkg.coverageState = state;
    emit("COVERAGE_EVALUATED", { propertyId: pkg.propertyId, missionId: pkg.missionId, actor, to: state,
      reason: missing.length ? "Missing: " + missing.join(", ") : "All required areas captured" });
    return record;
  },

  getCoverage: (capturePackageId) => serve(() => store.coverage.find((c) => c.capturePackageId === capturePackageId) || null),

  /* --------------------------------------------------------------- review */

  review: (evidenceId, decision, { actor = "u-001", reason = null } = {}) =>
    serve(() => {
      const a = findAsset(evidenceId);
      if (!a) throw new Error("Evidence not found.");
      if (!Object.values(EVIDENCE_REVIEW).includes(decision)) throw new Error("Unknown review decision.");
      const from = a.reviewState;
      // Review changes state. It never touches the captured artifact.
      a.reviewState = decision;
      a.reviewedBy = actor;
      a.reviewedAt = now();
      a.reviewReason = reason;
      custody(a, CUSTODY_ACTION.REVIEWED, { actor, notes: decision + (reason ? " — " + reason : "") });

      const eventMap = {
        [EVIDENCE_REVIEW.APPROVED]: "EVIDENCE_APPROVED",
        [EVIDENCE_REVIEW.APPROVED_WITH_WARNINGS]: "EVIDENCE_APPROVED_WITH_WARNING",
        [EVIDENCE_REVIEW.REJECTED]: "EVIDENCE_REJECTED",
        [EVIDENCE_REVIEW.RECAPTURE_REQUIRED]: "RECAPTURE_REQUESTED",
        [EVIDENCE_REVIEW.QUARANTINED]: "EVIDENCE_QUARANTINED",
      };
      emit(eventMap[decision] || "EVIDENCE_REVIEWED", { evidenceId, propertyId: a.propertyId, missionId: a.missionId, actor, reason, from, to: decision });
      return a;
    }),

  listReviewQueue: () =>
    serve(() => ({
      needsReview: store.assets.filter((a) => a.reviewState === EVIDENCE_REVIEW.NOT_REVIEWED),
      warnings: store.assets.filter((a) => a.qualityState === QUALITY_STATE.PASS_WITH_WARNINGS),
      failedQuality: store.assets.filter((a) => a.qualityState === QUALITY_STATE.FAIL),
      quarantined: store.assets.filter((a) => a.reviewState === EVIDENCE_REVIEW.QUARANTINED),
      recapture: store.assets.filter((a) => a.reviewState === EVIDENCE_REVIEW.RECAPTURE_REQUIRED),
      approved: store.assets.filter((a) => [EVIDENCE_REVIEW.APPROVED, EVIDENCE_REVIEW.APPROVED_WITH_WARNINGS].includes(a.reviewState)),
      rejected: store.assets.filter((a) => a.reviewState === EVIDENCE_REVIEW.REJECTED),
    })),

  /* ----------------------------------------------------------- processing */

  createProcessingJob: (input, { actor = "system" } = {}) =>
    serve(() => {
      const job = {
        processingJobId: nid("PJOB"), propertyId: input.propertyId, missionId: input.missionId,
        capturePackageId: input.capturePackageId || null,
        processorType: input.processorType, processorVersion: input.processorVersion,
        inputEvidenceIds: input.inputEvidenceIds || [], outputEvidenceIds: [],
        status: PROCESSING_STATE.QUEUED, startedAt: null, completedAt: null,
        failureReason: null, sourceMode: "FIXTURE",
      };
      store.jobs.push(job);
      emit("PROCESSING_QUEUED", { propertyId: job.propertyId, missionId: job.missionId, actor, reason: job.processorType });
      return job;
    }),

  listJobs: (propertyId) => serve(() => propertyId ? store.jobs.filter((j) => j.propertyId === propertyId) : store.jobs),

  /* -------------------------------------------------- cortex eligibility */

  /**
   * Whether Cortex may consume an asset. Quarantined and rejected evidence is
   * never eligible; unreviewed evidence is PENDING_REVIEW, not eligible.
   */
  eligibilityOf(asset) {
    if (!asset) return { state: ELIGIBILITY.NOT_ELIGIBLE, reasons: ["No asset."] };
    const reasons = [];
    if (asset.reviewState === EVIDENCE_REVIEW.QUARANTINED) reasons.push("Evidence is quarantined.");
    if (asset.reviewState === EVIDENCE_REVIEW.REJECTED) reasons.push("Evidence was rejected in review.");
    if (asset.ingestState === INGEST_STATE.FAILED) reasons.push("Ingest failed.");
    if (asset.qualityState === QUALITY_STATE.FAIL) reasons.push("Quality assessment failed.");
    if (asset.hashState === HASH_STATE.MISMATCH) reasons.push("Content hash mismatch — integrity cannot be established.");
    if (reasons.length) return { state: ELIGIBILITY.NOT_ELIGIBLE, reasons };

    if (asset.reviewState === EVIDENCE_REVIEW.NOT_REVIEWED || asset.reviewState === EVIDENCE_REVIEW.REVIEWING)
      return { state: ELIGIBILITY.PENDING_REVIEW, reasons: ["Awaiting human review."] };

    if (asset.reviewState === EVIDENCE_REVIEW.APPROVED_WITH_WARNINGS || asset.qualityState === QUALITY_STATE.PASS_WITH_WARNINGS)
      return { state: ELIGIBILITY.ELIGIBLE_WITH_WARNINGS, reasons: ["Approved with warnings attached."] };

    if (asset.reviewState === EVIDENCE_REVIEW.APPROVED)
      return { state: ELIGIBILITY.ELIGIBLE, reasons: [] };

    return { state: ELIGIBILITY.PENDING_REVIEW, reasons: ["Review state " + asset.reviewState + "."] };
  },

  /**
   * The Cortex handoff. Cortex receives a scoped manifest — it never scans the
   * vault. A manifest contains only assets from one property, mission and
   * capture package.
   */
  buildCortexManifest: async (capturePackageId, { actor = "system" } = {}) => {
    await ensureEvidenceStateLoaded();
    const pkg = findPackage(capturePackageId);
    if (!pkg) throw new Error("Capture package not found.");
    const scoped = store.assets.filter((a) => a.capturePackageId === capturePackageId);
    const warnings = [];

    const eligible = scoped.filter((a) => {
      const e = EvidenceVault.eligibilityOf(a);
      if (e.state === ELIGIBILITY.ELIGIBLE_WITH_WARNINGS) warnings.push(a.evidenceId + ": " + e.reasons.join(" "));
      return [ELIGIBILITY.ELIGIBLE, ELIGIBILITY.ELIGIBLE_WITH_WARNINGS].includes(e.state);
    });

    const coverage = store.coverage.find((c) => c.capturePackageId === capturePackageId);
    if (coverage && coverage.missingAreas.length) warnings.push("Coverage incomplete: " + coverage.missingAreas.join(", "));

    const manifest = {
      manifestId: nid("CXM"), propertyId: pkg.propertyId, missionId: pkg.missionId,
      capturePackageId,
      evidenceIds: eligible.filter((a) => a.origin === ARTIFACT_ORIGIN.ORIGINAL).map((a) => a.evidenceId),
      derivedArtifactIds: eligible.filter((a) => a.origin === ARTIFACT_ORIGIN.DERIVED).map((a) => a.evidenceId),
      excludedIds: scoped.filter((a) => !eligible.includes(a)).map((a) => a.evidenceId),
      warnings,
      validationState: pkg.validationState,
      createdAt: now(),
      sourceVersions: { vault: "1.0", storage: EvidenceStorageProvider.mode },
    };
    store.manifests.push(manifest);
    emit("CORTEX_MANIFEST_CREATED", { propertyId: pkg.propertyId, missionId: pkg.missionId, actor,
      reason: manifest.evidenceIds.length + " originals, " + manifest.derivedArtifactIds.length + " derived" });
    return manifest;
  },

  listManifests: () => serve(() => store.manifests),

  /* --------------------------------------------------------------- health */

  getVaultSummary: () =>
    serve(() => {
      const A = store.assets;
      return {
        total: A.length,
        originals: A.filter((a) => a.origin === ARTIFACT_ORIGIN.ORIGINAL).length,
        derived: A.filter((a) => a.origin === ARTIFACT_ORIGIN.DERIVED).length,
        ingesting: A.filter((a) => a.ingestState === INGEST_STATE.INGESTING).length,
        ingestFailures: A.filter((a) => a.ingestState === INGEST_STATE.FAILED).length,
        needsReview: A.filter((a) => a.reviewState === EVIDENCE_REVIEW.NOT_REVIEWED).length,
        warnings: A.filter((a) => a.qualityState === QUALITY_STATE.PASS_WITH_WARNINGS).length,
        quarantined: A.filter((a) => a.reviewState === EVIDENCE_REVIEW.QUARANTINED).length,
        hashMismatches: A.filter((a) => a.hashState === HASH_STATE.MISMATCH).length,
        recapture: A.filter((a) => a.reviewState === EVIDENCE_REVIEW.RECAPTURE_REQUIRED).length,
        approved: A.filter((a) => [EVIDENCE_REVIEW.APPROVED, EVIDENCE_REVIEW.APPROVED_WITH_WARNINGS].includes(a.reviewState)).length,
        cortexEligible: A.filter((a) => [ELIGIBILITY.ELIGIBLE, ELIGIBILITY.ELIGIBLE_WITH_WARNINGS].includes(EvidenceVault.eligibilityOf(a).state)).length,
        processingFailures: store.jobs.filter((j) => j.status === PROCESSING_STATE.FAILED).length,
        hot: A.filter((a) => a.storageTier === STORAGE_TIER.HOT).length,
        warm: A.filter((a) => a.storageTier === STORAGE_TIER.WARM).length,
        cold: A.filter((a) => a.storageTier === STORAGE_TIER.COLD).length,
        archive: A.filter((a) => a.storageTier === STORAGE_TIER.ARCHIVE).length,
      };
    }),

  listEvents: (evidenceId) => serve(() => store.events.filter((e) => !evidenceId || e.evidenceId === evidenceId)),
  listAudit: (evidenceId) => serve(() => store.audit.filter((e) => !evidenceId || e.objectId === evidenceId)),

  providerHealth: () => serve(() => [EvidenceStorageProvider.health(), EvidenceSourceProvider.health()]),

  __store: store,
};

export default EvidenceVault;
