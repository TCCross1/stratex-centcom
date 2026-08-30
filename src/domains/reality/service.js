/**
 * PROPERTY REALITY ENGINE
 *
 * Converts validated evidence into versioned spatial understanding.
 *
 *   PROPERTY → MISSION → CAPTURE → EVIDENCE → PROCESSING
 *           → PROPERTY REALITY VERSION → PASSPORT → PROJECTIONS
 *
 * Rules enforced here:
 *   1. Reality reads evidence. It never rewrites an EvidenceAsset.
 *   2. An APPROVED twin version is immutable. New reality creates a new version.
 *   3. Only approved evidence enters a reality manifest; exclusions are named.
 *   4. Version numbering is scoped to property AND twin type.
 *   5. Draft, failed and rejected versions never become Passport current state.
 */
import { serve } from "../shared/transport.js";
import MissionService from "../mission/service.js";
import EvidenceVault from "../evidence/vault.js";
import { ELIGIBILITY } from "../evidence/model.js";
import {
  TWIN_TYPES, twinType, twinTypeIds, TWIN_VERSION_STATE, PASSPORT_ELIGIBLE_STATES,
  PROCESSING_STATE, QUALITY_STATE, COMPLETENESS_STATE, COMPARISON_STATE,
  SPATIAL_ARTIFACT_TYPE, LAYER_STATE, THERMAL_ALIGNMENT_STATE,
  evaluateCompleteness, truthClassForMethod, TWIN_LAYERS,
} from "./types.js";
import { PropertyRealityProcessingProvider, realityProviderHealth } from "./providers.js";
import {
  realityModels, twinVersions, spatialArtifacts, thermalLayers, roofGeometries,
  measurementSets, qualityAssessments, layerSets, comparisons, changeSets, realityJobs,
} from "./fixtures.js";

const store = {
  models: realityModels.map((m) => ({ ...m })),
  versions: twinVersions.map((v) => ({ ...v })),
  artifacts: spatialArtifacts.map((a) => ({ ...a })),
  thermal: thermalLayers.map((t) => ({ ...t })),
  roof: roofGeometries.map((r) => ({ ...r })),
  measurements: measurementSets.map((m) => ({ ...m })),
  quality: qualityAssessments.map((q) => ({ ...q })),
  layers: layerSets.map((l) => ({ ...l })),
  comparisons: comparisons.map((c) => ({ ...c })),
  changes: changeSets.map((c) => ({ ...c })),
  jobs: realityJobs.map((j) => ({ ...j })),
  manifests: [],
  events: [],
  audit: [],
};

let seq = 0;
const nid = (p) => p + "-" + String(++seq).padStart(4, "0");
const now = () => new Date().toISOString();

function emit(type, { propertyId = null, twinVersionId = null, actor = "system", reason = null, from = null, to = null } = {}) {
  store.events.push({ eventId: nid("RE"), type, at: now(), propertyId, twinVersionId, actor, reason });
  store.audit.push({
    auditId: nid("RA"), at: now(), actor,
    actorType: actor.startsWith("u-") ? "OPERATOR" : "SYSTEM",
    domain: "PROPERTY_REALITY", action: type,
    objectType: twinVersionId ? "TwinVersion" : "PropertyRealityModel",
    objectId: twinVersionId, propertyId,
    previousState: from, newState: to, reason, sourceSystem: "reality.engine",
  });
}

const findVersion = (id) => store.versions.find((v) => v.twinVersionId === id);
const artifactsOf = (versionId) => store.artifacts.filter((a) => a.twinVersionId === versionId);

export const RealityEngine = {
  /* --------------------------------------------------------- twin types -- */

  listTwinTypes: () => serve(() => twinTypeIds().map((id) => TWIN_TYPES[id])),
  getTwinType: (id) => serve(() => twinType(id)),

  /* ------------------------------------------------------------- models -- */

  listModels: () => serve(() => store.models),
  getModel: (propertyId) => serve(() => store.models.find((m) => m.propertyId === propertyId) || null),

  /* ----------------------------------------------------------- versions -- */

  listVersions: (propertyId, typeId) =>
    serve(() =>
      store.versions
        .filter((v) => v.propertyId === propertyId && (!typeId || v.twinType === typeId))
        .sort((a, b) => b.versionNumber - a.versionNumber)
    ),

  getVersion: (id) =>
    serve(() => {
      const v = findVersion(id);
      if (!v) throw new Error("Twin version not found.");
      const arts = artifactsOf(id);
      return {
        version: v,
        artifacts: arts,
        thermal: store.thermal.find((t) => t.twinVersionId === id) || null,
        roof: store.roof.find((r) => r.twinVersionId === id) || null,
        measurements: store.measurements.find((m) => m.twinVersionId === id) || null,
        quality: store.quality.find((q) => q.twinVersionId === id) || null,
        layers: store.layers.find((l) => l.layerSetId === v.layerSetId) || null,
        jobs: store.jobs.filter((j) => j.twinVersionId === id),
        completeness: evaluateCompleteness(v.twinType, arts.map((a) => a.artifactType)),
        supersedes: v.supersedesTwinVersionId ? findVersion(v.supersedesTwinVersionId) : null,
        supersededBy: v.supersededByTwinVersionId ? findVersion(v.supersededByTwinVersionId) : null,
      };
    }),

  /** The current approved version for a property and type. Never a draft. */
  getCurrentVersion: (propertyId, typeId) =>
    serve(() =>
      store.versions
        .filter((v) => v.propertyId === propertyId && v.twinType === typeId &&
                       PASSPORT_ELIGIBLE_STATES.includes(v.status))
        .sort((a, b) => b.versionNumber - a.versionNumber)[0] || null
    ),

  /* ----------------------------------------------------------- manifest -- */

  /**
   * Build reality inputs from the Evidence Vault. Only approved evidence is
   * admitted; everything excluded is named with its reason. A cross-property
   * artifact can never enter, because the source list is property-scoped at
   * the vault before it is filtered here.
   */
  buildInputManifest: async (propertyId, { missionIds = [], requestedTwinTypes = [], actor = "system" } = {}) => {
    const assets = await EvidenceVault.listByProperty(propertyId);
    const scoped = missionIds.length ? assets.filter((a) => missionIds.includes(a.missionId)) : assets;

    const approved = [];
    const derived = [];
    const excluded = [];
    const reasons = {};

    for (const a of scoped) {
      const e = EvidenceVault.eligibilityOf(a);
      if (e.state === ELIGIBILITY.ELIGIBLE || e.state === ELIGIBILITY.ELIGIBLE_WITH_WARNINGS) {
        (a.origin === "DERIVED" ? derived : approved).push(a.evidenceId);
      } else {
        excluded.push(a.evidenceId);
        reasons[a.evidenceId] = e.reasons.join(" ") || e.state;
      }
    }

    const manifest = {
      manifestId: nid("RIM"), propertyId,
      missionIds: [...new Set(scoped.map((a) => a.missionId))],
      capturePackageIds: [...new Set(scoped.map((a) => a.capturePackageId).filter(Boolean))],
      approvedEvidenceIds: approved, derivedEvidenceIds: derived,
      excludedEvidenceIds: excluded, exclusionReasons: reasons,
      requestedTwinTypes, requestedOutputs: requestedTwinTypes.flatMap((t) => twinType(t)?.requiredOutputs || []),
      createdAt: now(),
      validationState: approved.length ? "VALID" : "INSUFFICIENT_EVIDENCE",
      sourceVersions: { vault: "1.0", engine: "1.0" },
    };
    store.manifests.push(manifest);
    emit("REALITY_MANIFEST_CREATED", { propertyId, actor,
      reason: approved.length + " approved, " + excluded.length + " excluded" });
    return manifest;
  },

  listManifests: (propertyId) =>
    serve(() => store.manifests.filter((m) => !propertyId || m.propertyId === propertyId)),

  /* --------------------------------------------------------- processing -- */

  queueJob: (input, { actor = "system" } = {}) =>
    serve(() => {
      const job = {
        jobId: nid("RJOB"), propertyId: input.propertyId, manifestId: input.manifestId || null,
        twinVersionId: input.twinVersionId || null, twinType: input.twinType,
        processorType: input.processorType, processorVersion: input.processorVersion || "fixture-1.0",
        status: PROCESSING_STATE.QUEUED, inputEvidenceIds: input.inputEvidenceIds || [],
        inputArtifactIds: input.inputArtifactIds || [], outputArtifactIds: [],
        startedAt: null, completedAt: null, progress: 0, warningCodes: [],
        failureReason: null, provider: PropertyRealityProcessingProvider.name,
        sourceMode: "FIXTURE",
      };
      store.jobs.push(job);
      emit("REALITY_JOB_QUEUED", { propertyId: job.propertyId, actor, reason: job.processorType });
      return job;
    }),

  runJob: async (jobId, { actor = "system" } = {}) => {
    const job = store.jobs.find((j) => j.jobId === jobId);
    if (!job) throw new Error("Reality job not found.");
    job.status = PROCESSING_STATE.RUNNING;
    job.startedAt = now();
    emit("REALITY_JOB_STARTED", { propertyId: job.propertyId, actor, reason: job.processorType });

    const result = await PropertyRealityProcessingProvider.runJob(job);
    job.status = result.status;
    job.progress = 100;
    job.completedAt = now();
    return job;
  },

  listJobs: (propertyId) => serve(() => store.jobs.filter((j) => !propertyId || j.propertyId === propertyId)),

  /* ---------------------------------------------------- spatial artifact -- */

  /** Every artifact must name a job, source evidence and its twin version. */
  createArtifact: async (input, { actor = "system" } = {}) => {
    const version = findVersion(input.twinVersionId);
    if (!version) throw new Error("Cannot create a spatial artifact without a twin version.");
    if (version.propertyId !== input.propertyId)
      throw new Error("Spatial artifact property does not match its twin version's property.");
    if (!input.processingJobId) throw new Error("A spatial artifact must reference the processing job that produced it.");
    if (!input.sourceEvidenceIds?.length) throw new Error("A spatial artifact must reference its source evidence.");

    // Source evidence must belong to the same property.
    const propertyAssets = await EvidenceVault.listByProperty(input.propertyId);
    const known = new Set(propertyAssets.map((a) => a.evidenceId));
    const foreign = input.sourceEvidenceIds.filter((id) => !known.has(id));
    if (foreign.length)
      throw new Error("Source evidence does not belong to this property: " + foreign.join(", ") + ".");

    const descriptor = await PropertyRealityProcessingProvider.produceDescriptor(
      input.processorType || "OTHER", input.artifactType
    );

    const artifact = {
      spatialArtifactId: nid("SPA"), propertyId: input.propertyId,
      twinVersionId: input.twinVersionId, artifactType: input.artifactType,
      sourceEvidenceIds: input.sourceEvidenceIds, processingJobId: input.processingJobId,
      format: descriptor.format, storageReference: "reality/" + input.propertyId + "/" + input.twinVersionId + "/" + input.artifactType,
      coordinateSystem: descriptor.coordinateSystem, unitSystem: input.unitSystem || "IMPERIAL",
      bounds: input.bounds || null,
      pointCount: descriptor.pointCount, vertexCount: descriptor.vertexCount, faceCount: descriptor.faceCount,
      resolution: descriptor.resolution, pointCloudSource: descriptor.pointCloudSource,
      qualityState: QUALITY_STATE.NOT_EVALUATED, isSimulated: descriptor.isSimulated,
      notice: descriptor.notice, sourceMode: "FIXTURE", createdAt: now(),
    };
    store.artifacts.push(artifact);

    const job = store.jobs.find((j) => j.jobId === input.processingJobId);
    if (job) job.outputArtifactIds.push(artifact.spatialArtifactId);

    emit("SPATIAL_ARTIFACT_CREATED", { propertyId: artifact.propertyId, twinVersionId: artifact.twinVersionId,
      actor, reason: artifact.artifactType });
    return artifact;
  },

  listArtifacts: (propertyId) => serve(() => store.artifacts.filter((a) => !propertyId || a.propertyId === propertyId)),

  /* ----------------------------------------------------- version create -- */

  createVersion: async (input, { actor = "u-001" } = {}) => {
    const { propertyId, twinType: typeId } = input;
    if (!twinType(typeId)) throw new Error("Unknown twin type: " + typeId + ".");

    // Version numbers are scoped to property AND type.
    const siblings = store.versions.filter((v) => v.propertyId === propertyId && v.twinType === typeId);
    const versionNumber = siblings.length + 1;

    // Mission lineage must resolve to this property.
    for (const mid of input.sourceMissionIds || []) {
      const m = await MissionService.get(mid);
      if (m.propertyId !== propertyId)
        throw new Error("Source mission " + mid + " belongs to " + m.propertyId + ", not " + propertyId + ".");
    }

    const version = {
      twinVersionId: nid("TWV"), propertyRealityId: input.propertyRealityId || null,
      propertyId, twinType: typeId, versionNumber, versionLabel: "V" + versionNumber,
      status: TWIN_VERSION_STATE.DRAFT,
      sourceMissionIds: input.sourceMissionIds || [],
      sourceCapturePackageIds: input.sourceCapturePackageIds || [],
      sourceEvidenceIds: input.sourceEvidenceIds || [],
      sourceProcessingJobIds: [],
      createdAt: now(), createdBy: actor, approvedAt: null, approvedBy: null,
      supersedesTwinVersionId: null, supersededByTwinVersionId: null,
      qualityState: QUALITY_STATE.NOT_EVALUATED, completenessState: COMPLETENESS_STATE.UNKNOWN,
      coordinateSystem: "LOCAL_PROPERTY", originReference: null, bounds: null, unitSystem: "IMPERIAL",
      geometryArtifactIds: [], textureArtifactIds: [], thermalArtifactIds: [],
      measurementSetIds: [], layerSetId: null, passportRevisionId: null,
      sourceMode: "FIXTURE", notes: input.notes || null,
    };
    store.versions.push(version);
    emit("TWIN_VERSION_CREATED", { propertyId, twinVersionId: version.twinVersionId, actor,
      reason: typeId + " " + version.versionLabel, to: TWIN_VERSION_STATE.DRAFT });
    return version;
  },

  /* ------------------------------------------------------------- review -- */

  /**
   * Approval locks content identity. Any later change produces a NEW version;
   * approved reality is never rewritten.
   */
  review: (versionId, decision, { actor = "u-001", reason = null } = {}) =>
    serve(() => {
      const v = findVersion(versionId);
      if (!v) throw new Error("Twin version not found.");
      if (PASSPORT_ELIGIBLE_STATES.includes(v.status))
        throw new Error("This version is already approved. Approved reality is immutable — create a new version instead.");

      const map = {
        APPROVE: TWIN_VERSION_STATE.APPROVED,
        APPROVE_WITH_WARNINGS: TWIN_VERSION_STATE.APPROVED_WITH_WARNINGS,
        REJECT: TWIN_VERSION_STATE.FAILED,
        REQUEST_REPROCESSING: TWIN_VERSION_STATE.PROCESSING,
      };
      const next = map[decision];
      if (!next) throw new Error("Unknown review decision.");

      const from = v.status;
      v.status = next;
      if (PASSPORT_ELIGIBLE_STATES.includes(next)) {
        v.approvedAt = now();
        v.approvedBy = actor;

        // Supersede the prior approved version of the SAME type on this property.
        const prior = store.versions
          .filter((x) => x.propertyId === v.propertyId && x.twinType === v.twinType &&
                         x.twinVersionId !== v.twinVersionId && PASSPORT_ELIGIBLE_STATES.includes(x.status))
          .sort((a, b) => b.versionNumber - a.versionNumber)[0];
        if (prior) {
          prior.status = TWIN_VERSION_STATE.SUPERSEDED;
          prior.supersededByTwinVersionId = v.twinVersionId;
          v.supersedesTwinVersionId = prior.twinVersionId;
          emit("TWIN_SUPERSEDED", { propertyId: v.propertyId, twinVersionId: prior.twinVersionId, actor,
            reason: "Superseded by " + v.versionLabel, from: prior.status, to: TWIN_VERSION_STATE.SUPERSEDED });
        }
      }

      const eventName = { APPROVE: "TWIN_APPROVED", APPROVE_WITH_WARNINGS: "TWIN_APPROVED_WITH_WARNING",
                          REJECT: "TWIN_REJECTED", REQUEST_REPROCESSING: "TWIN_REVIEW_STARTED" }[decision];
      emit(eventName, { propertyId: v.propertyId, twinVersionId: v.twinVersionId, actor, reason, from, to: next });
      return v;
    }),

  /** Guarded mutation. Approved versions refuse content changes outright. */
  updateVersion: (versionId, patch, { actor = "u-001" } = {}) =>
    serve(() => {
      const v = findVersion(versionId);
      if (!v) throw new Error("Twin version not found.");
      if (PASSPORT_ELIGIBLE_STATES.includes(v.status)) {
        const content = ["geometryArtifactIds", "textureArtifactIds", "thermalArtifactIds",
                         "measurementSetIds", "sourceEvidenceIds", "bounds", "coordinateSystem", "versionNumber"];
        const attempted = Object.keys(patch).filter((k) => content.includes(k));
        if (attempted.length)
          throw new Error("Approved twin versions are immutable. Cannot change: " + attempted.join(", ") + ". Create a new version.");
      }
      Object.assign(v, patch);
      return v;
    }),

  listReviewQueue: () =>
    serve(() => ({
      processing: store.versions.filter((v) => [TWIN_VERSION_STATE.PROCESSING, TWIN_VERSION_STATE.DRAFT].includes(v.status)),
      reviewRequired: store.versions.filter((v) => v.status === TWIN_VERSION_STATE.REVIEW_REQUIRED),
      warnings: store.versions.filter((v) => v.status === TWIN_VERSION_STATE.APPROVED_WITH_WARNINGS),
      failed: store.versions.filter((v) => v.status === TWIN_VERSION_STATE.FAILED),
      approved: store.versions.filter((v) => v.status === TWIN_VERSION_STATE.APPROVED),
      superseded: store.versions.filter((v) => v.status === TWIN_VERSION_STATE.SUPERSEDED),
    })),

  /* --------------------------------------------------------- comparison -- */

  /**
   * Compare two versions of the SAME type on the SAME property. Cross-property
   * and cross-type comparisons are refused. When the artifacts needed for a
   * real difference do not exist, the result is INSUFFICIENT_DATA — never
   * "zero changes found".
   */
  compare: (baseId, comparisonId, { actor = "u-001" } = {}) =>
    serve(() => {
      const base = findVersion(baseId);
      const comp = findVersion(comparisonId);
      if (!base || !comp) throw new Error("Both twin versions must exist.");
      if (base.propertyId !== comp.propertyId)
        throw new Error("Cannot compare twin versions from different properties.");
      if (base.twinType !== comp.twinType)
        throw new Error("Cannot compare different twin types.");

      const baseArts = artifactsOf(baseId);
      const compArts = artifactsOf(comparisonId);
      const geometric = (list) => list.some((a) =>
        [SPATIAL_ARTIFACT_TYPE.MESH, SPATIAL_ARTIFACT_TYPE.POINT_CLOUD, SPATIAL_ARTIFACT_TYPE.ROOF_GEOMETRY].includes(a.artifactType));

      const record = {
        comparisonId: nid("TCMP"), propertyId: base.propertyId, twinType: base.twinType,
        baseTwinVersionId: baseId, comparisonTwinVersionId: comparisonId,
        status: COMPARISON_STATE.QUEUED, changeSetId: null, createdAt: now(),
        processorVersion: "fixture-1.0", sourceMode: "FIXTURE", reason: null,
      };

      if (!geometric(baseArts) || !geometric(compArts)) {
        record.status = COMPARISON_STATE.INSUFFICIENT_DATA;
        record.reason = "One or both versions have no geometric artifact to compare. No differences are claimed.";
        store.comparisons.push(record);
        emit("COMPARISON_COMPLETE", { propertyId: base.propertyId, actor, reason: record.reason,
          to: COMPARISON_STATE.INSUFFICIENT_DATA });
        return record;
      }

      // Fixture comparison: the architecture is real, the differences are not computed.
      const changeSet = {
        changeSetId: nid("RCS"), propertyId: base.propertyId, comparisonId: record.comparisonId,
        isSimulated: true, sourceMode: "FIXTURE",
        notice: "SIMULATED COMPARISON — no geometric difference computation was performed.",
        changes: (store.changes.find((c) => c.baseTwinVersionId === baseId)?.changes || []).map((c) => ({ ...c })),
        createdAt: now(), reviewState: "PENDING",
      };
      store.changes.push({ ...changeSet, baseTwinVersionId: baseId, comparisonTwinVersionId: comparisonId });
      record.changeSetId = changeSet.changeSetId;
      record.status = COMPARISON_STATE.COMPLETE_WITH_WARNINGS;
      record.reason = changeSet.notice;
      store.comparisons.push(record);
      emit("CHANGE_SET_CREATED", { propertyId: base.propertyId, actor, reason: changeSet.changes.length + " simulated changes" });
      return record;
    }),

  listComparisons: (propertyId) => serve(() => store.comparisons.filter((c) => !propertyId || c.propertyId === propertyId)),
  getChangeSet: (id) => serve(() => store.changes.find((c) => c.changeSetId === id) || null),

  /* ------------------------------------------------------------ quality -- */

  assessQuality: (versionId, input, { actor = "u-001" } = {}) =>
    serve(() => {
      const v = findVersion(versionId);
      if (!v) throw new Error("Twin version not found.");
      const checks = input.checks || [];
      const failed = checks.filter((c) => c.state === "FAIL");
      const warned = checks.filter((c) => c.state === "WARNING");
      const overall = failed.length ? QUALITY_STATE.FAIL
        : warned.length ? QUALITY_STATE.PASS_WITH_WARNINGS
        : checks.length ? QUALITY_STATE.PASS : QUALITY_STATE.UNKNOWN;

      const record = {
        assessmentId: nid("TQA"), propertyId: v.propertyId, twinVersionId: versionId,
        geometryQuality: input.geometryQuality || QUALITY_STATE.UNKNOWN,
        textureQuality: input.textureQuality || QUALITY_STATE.UNKNOWN,
        thermalAlignmentQuality: input.thermalAlignmentQuality || QUALITY_STATE.UNKNOWN,
        measurementQuality: input.measurementQuality || QUALITY_STATE.UNKNOWN,
        coverageQuality: input.coverageQuality || QUALITY_STATE.UNKNOWN,
        overallState: overall, checks, warnings: warned.map((w) => w.label),
        reviewedAt: now(), reviewedBy: actor, sourceMode: "FIXTURE",
      };
      store.quality = store.quality.filter((q) => q.twinVersionId !== versionId).concat(record);
      v.qualityState = overall;
      return record;
    }),

  getLayerSet: (layerSetId) => serve(() => store.layers.find((l) => l.layerSetId === layerSetId) || null),
  getThermal: (versionId) => serve(() => store.thermal.find((t) => t.twinVersionId === versionId) || null),
  getRoof: (versionId) => serve(() => store.roof.find((r) => r.twinVersionId === versionId) || null),
  getMeasurements: (versionId) => serve(() => store.measurements.find((m) => m.twinVersionId === versionId) || null),

  /* ------------------------------------------------------------ command -- */

  getDirectory: () =>
    serve(() =>
      store.models.map((m) => {
        const versions = store.versions.filter((v) => v.propertyId === m.propertyId);
        const current = {};
        for (const id of twinTypeIds()) {
          current[id] = versions
            .filter((v) => v.twinType === id && PASSPORT_ELIGIBLE_STATES.includes(v.status))
            .sort((a, b) => b.versionNumber - a.versionNumber)[0] || null;
        }
        return { model: m, versions, current,
          comparisonAvailable: versions.filter((v) => PASSPORT_ELIGIBLE_STATES.includes(v.status) || v.status === "SUPERSEDED").length >= 2 };
      })
    ),

  getSummary: () =>
    serve(() => {
      const V = store.versions;
      return {
        propertiesWithReality: new Set(V.map((v) => v.propertyId)).size,
        processing: V.filter((v) => [TWIN_VERSION_STATE.PROCESSING, TWIN_VERSION_STATE.DRAFT].includes(v.status)).length,
        reviewRequired: V.filter((v) => v.status === TWIN_VERSION_STATE.REVIEW_REQUIRED).length,
        warnings: V.filter((v) => v.status === TWIN_VERSION_STATE.APPROVED_WITH_WARNINGS).length,
        failed: V.filter((v) => v.status === TWIN_VERSION_STATE.FAILED).length,
        approved: V.filter((v) => v.status === TWIN_VERSION_STATE.APPROVED).length,
        superseded: V.filter((v) => v.status === TWIN_VERSION_STATE.SUPERSEDED).length,
        comparisonsAvailable: store.comparisons.filter((c) => c.status !== COMPARISON_STATE.INSUFFICIENT_DATA).length,
        thermalAvailable: store.thermal.filter((t) => t.alignmentState === THERMAL_ALIGNMENT_STATE.ALIGNED ||
                                                      t.alignmentState === THERMAL_ALIGNMENT_STATE.ALIGNED_WITH_WARNINGS).length,
        cadAvailable: store.artifacts.filter((a) => a.artifactType === SPATIAL_ARTIFACT_TYPE.CAD_MODEL).length,
        processingFailures: store.jobs.filter((j) => j.status === PROCESSING_STATE.FAILED).length,
      };
    }),

  providerHealth: () => serve(() => realityProviderHealth()),
  listEvents: (propertyId) => serve(() => store.events.filter((e) => !propertyId || e.propertyId === propertyId)),
  listAudit: (propertyId) => serve(() => store.audit.filter((e) => !propertyId || e.propertyId === propertyId)),

  __store: store,
};

export default RealityEngine;
