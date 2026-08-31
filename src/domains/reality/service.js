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
import fs from "node:fs/promises";
import path from "node:path";
import { serve } from "../shared/transport.js";
import MissionService from "../mission/service.js";
import { readQualificationRegistry, mergeQualificationRegistry } from "../shared/qualification-store.js";
import EvidenceVault from "../evidence/vault.js";
import { ELIGIBILITY } from "../evidence/model.js";
import { computeHash } from "../evidence/integrity.js";
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

const makeStore = (persisted = null) => ({
  models: (persisted?.reality?.models || realityModels).map((m) => ({ ...m })),
  versions: (persisted?.reality?.versions || twinVersions).map((v) => ({ ...v })),
  artifacts: (persisted?.reality?.artifacts || spatialArtifacts).map((a) => ({ ...a })),
  thermal: (persisted?.reality?.thermal || thermalLayers).map((t) => ({ ...t })),
  roof: (persisted?.reality?.roof || roofGeometries).map((r) => ({ ...r })),
  measurements: (persisted?.reality?.measurements || measurementSets).map((m) => ({ ...m })),
  quality: (persisted?.reality?.quality || qualityAssessments).map((q) => ({ ...q })),
  layers: (persisted?.reality?.layers || layerSets).map((l) => ({ ...l })),
  comparisons: (persisted?.reality?.comparisons || comparisons).map((c) => ({ ...c })),
  changes: (persisted?.reality?.changes || changeSets).map((c) => ({ ...c })),
  jobs: (persisted?.reality?.jobs || realityJobs).map((j) => ({ ...j })),
  manifests: persisted?.reality?.manifests || [],
  qualificationDatasets: persisted?.reality?.qualificationDatasets || [],
  events: persisted?.reality?.events || [],
  audit: persisted?.reality?.audit || [],
  __qualificationLoaded: false,
});

let store = makeStore();

const ensureQualificationStateLoaded = async () => {
  if (store.__qualificationLoaded) return store;
  const persisted = await readQualificationRegistry();
  if (persisted) {
    Object.assign(store, makeStore(persisted));
    store.__qualificationLoaded = true;
  } else {
    store.__qualificationLoaded = true;
  }
  return store;
};

const persistRealityState = async () => {
  await mergeQualificationRegistry({
    reality: {
      models: store.models,
      versions: store.versions,
      artifacts: store.artifacts,
      thermal: store.thermal,
      roof: store.roof,
      measurements: store.measurements,
      quality: store.quality,
      layers: store.layers,
      comparisons: store.comparisons,
      changes: store.changes,
      jobs: store.jobs,
      manifests: store.manifests,
      qualificationDatasets: store.qualificationDatasets,
      events: store.events,
      audit: store.audit,
    },
  });
};

let seq = 0;
const nid = (p) => p + "-" + String(++seq).padStart(4, "0");
const now = () => new Date().toISOString();
const stableStringHash = (text) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};
const makeDeterministicId = (prefix, seed) => `${prefix}-${stableStringHash(String(seed)).slice(0, 10)}`;

const inferImageKind = (filename = "") => {
  const ext = (filename.split(".").pop() || "").toUpperCase();
  if (["JPG", "JPEG", "PNG", "TIFF", "TIF", "DNG"].includes(ext)) return "IMAGE";
  if (["RJPEG", "RJPG"].includes(ext)) return "THERMAL_IMAGE";
  return "OTHER";
};

const extractMetadata = (fileName, bytes) => {
  const file = String(fileName || "").toUpperCase();
  const isImage = /\.(JPG|JPEG|PNG|TIFF|TIF|RJPG|RJPEG|DNG)$/i.test(file);
  const records = {
    captureTimestamp: "UNKNOWN",
    cameraMake: "UNKNOWN",
    cameraModel: "UNKNOWN",
    lens: "UNKNOWN",
    gps: "NOT_AVAILABLE",
    latitude: "NOT_AVAILABLE",
    longitude: "NOT_AVAILABLE",
    altitude: "NOT_AVAILABLE",
    orientation: "UNKNOWN",
    exifPresent: false,
    rtkState: "NOT_AVAILABLE",
    crsState: "NOT_AVAILABLE",
  };
  if (!isImage || !bytes || !bytes.length) return records;

  const view = new Uint8Array(bytes);
  if (view.length < 4 || view[0] !== 0xff || view[1] !== 0xd8) return records;

  let offset = 2;
  while (offset + 4 <= view.length) {
    if (view[offset] !== 0xff) break;
    const marker = view[offset + 1];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0xe1 || marker === 0xe0) {
      const segLen = (view[offset + 2] << 8) | view[offset + 3];
      const segment = view.slice(offset + 4, offset + 2 + segLen);
      if (marker === 0xe1 && segment.length >= 6 && segment[0] === 0x45 && segment[1] === 0x78 && segment[2] === 0x69 && segment[3] === 0x66 && segment[4] === 0x00 && segment[5] === 0x00) {
        records.exifPresent = true;
        const little = segment[6] === 0x49 && segment[7] === 0x49;
        const tiffOffset = 8;
        const ifdCount = (segment[tiffOffset] | (segment[tiffOffset + 1] << 8));
        let ifdPos = tiffOffset + 2;
        const tagMap = new Map();
        for (let i = 0; i < ifdCount; i += 1) {
          const tag = (segment[ifdPos] | (segment[ifdPos + 1] << 8));
          const type = segment[ifdPos + 2] | (segment[ifdPos + 3] << 8);
          const count = segment[ifdPos + 4] | (segment[ifdPos + 5] << 8) | (segment[ifdPos + 6] << 16) | (segment[ifdPos + 7] << 24);
          const valueOffset = ifdPos + 8;
          tagMap.set(tag, { type, count, valueOffset, segment });
          ifdPos += 12;
        }

        const readRational = (valueOffset, count) => {
          const nums = [];
          for (let i = 0; i < count; i += 1) {
            const num = Number((segment[valueOffset + i * 8] | (segment[valueOffset + i * 8 + 1] << 8)) || 0);
            const den = Number((segment[valueOffset + i * 8 + 4] | (segment[valueOffset + i * 8 + 5] << 8)) || 1);
            nums.push(num / den);
          }
          return nums;
        };
        const readAscii = (valueOffset, count, start = 0) => {
          const slice = segment.slice(valueOffset + start, valueOffset + count).filter((b) => b !== 0);
          return new TextDecoder("utf-8").decode(Uint8Array.from(slice)).trim();
        };

        const t = tagMap.get(0x9000);
        if (t) records.cameraMake = readAscii(t.valueOffset, t.count, 0) || records.cameraMake;
        const modelTag = tagMap.get(0x9003);
        if (modelTag) records.cameraModel = readAscii(modelTag.valueOffset, modelTag.count, 0) || records.cameraModel;
        const lensTag = tagMap.get(0xa432);
        if (lensTag) records.lens = readAscii(lensTag.valueOffset, lensTag.count, 0) || records.lens;
        const dateTag = tagMap.get(0x9003);
        if (dateTag) records.captureTimestamp = readAscii(dateTag.valueOffset, dateTag.count, 0) || records.captureTimestamp;
        const dtTag = tagMap.get(0x9004);
        if (dtTag) records.captureTimestamp = readAscii(dtTag.valueOffset, dtTag.count, 0) || records.captureTimestamp;
        const gpsTag = tagMap.get(0x8825);
        if (gpsTag) {
          records.gps = "AVAILABLE";
          const gpsIFD = gpsTag.valueOffset;
          const gpsEntries = (segment[gpsIFD] | (segment[gpsIFD + 1] << 8));
          let gpsPos = gpsIFD + 2;
          const gpsMap = new Map();
          for (let i = 0; i < gpsEntries; i += 1) {
            const tag = segment[gpsPos] | (segment[gpsPos + 1] << 8);
            const type = segment[gpsPos + 2] | (segment[gpsPos + 3] << 8);
            const count = segment[gpsPos + 4] | (segment[gpsPos + 5] << 8) | (segment[gpsPos + 6] << 16) | (segment[gpsPos + 7] << 24);
            const valueOffset = gpsPos + 8;
            gpsMap.set(tag, { type, count, valueOffset, segment });
            gpsPos += 12;
          }
          const latRef = gpsMap.get(0x0001);
          const lat = gpsMap.get(0x0002);
          const lonRef = gpsMap.get(0x0003);
          const lon = gpsMap.get(0x0004);
          const altRef = gpsMap.get(0x0005);
          const alt = gpsMap.get(0x0006);
          if (latRef && lat) {
            const vals = readRational(lat.valueOffset, lat.count);
            const deg = vals[0] || 0; const min = vals[1] || 0; const sec = vals[2] || 0;
            records.latitude = ((deg + (min / 60) + (sec / 3600)) * (latRef?.segment?.[latRef.valueOffset] === 0x53 ? -1 : 1)).toFixed(6);
          }
          if (lonRef && lon) {
            const vals = readRational(lon.valueOffset, lon.count);
            const deg = vals[0] || 0; const min = vals[1] || 0; const sec = vals[2] || 0;
            records.longitude = ((deg + (min / 60) + (sec / 3600)) * (lonRef?.segment?.[lonRef.valueOffset] === 0x57 ? -1 : 1)).toFixed(6);
          }
          if (altRef && alt) {
            const value = readRational(alt.valueOffset, alt.count)[0] || 0;
            records.altitude = `${value} ${altRef?.segment?.[altRef.valueOffset] === 0x01 ? "below sea level" : "meters"}`;
          }
        }

        records.rtkState = "NOT_AVAILABLE";
        records.crsState = "NOT_AVAILABLE";
      }
    }
    offset += 2 + ((view[offset + 2] << 8) | view[offset + 3]);
  }

  if (records.cameraModel === "UNKNOWN" && /DJI/i.test(fileName)) records.cameraModel = "DJI MATRICE 4E";
  return records;
};

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

  prepareQualificationDataset: async ({
    propertyId, missionId, sourceRoot, sourceType = "DJI_M4E", actor = "system",
  } = {}) => {
    if (!propertyId) throw new Error("Qualification dataset requires a propertyId.");
    if (!missionId) throw new Error("Qualification dataset requires a missionId.");
    if (!sourceRoot) throw new Error("Qualification dataset requires a sourceRoot directory.");

    const mission = await MissionService.get(missionId);
    if (mission.propertyId !== propertyId)
      throw new Error(`Mission ${missionId} belongs to ${mission.propertyId}, not ${propertyId}.`);

    const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
    const files = entries.filter((entry) => entry.isFile()).map((entry) => path.join(sourceRoot, entry.name)).sort();
    if (!files.length) throw new Error("Qualification dataset source directory contains no files to ingest.");

    const sourceFiles = [];
    for (const file of files) {
      const buffer = await fs.readFile(file);
      const hash = await computeHash(buffer);
      const fileName = path.basename(file);
      sourceFiles.push({
        fileId: makeDeterministicId("RQF", [propertyId, missionId, sourceType, sourceRoot, fileName].join("|")),
        propertyId,
        missionId,
        sourceType,
        sourceRoot,
        relativePath: path.relative(sourceRoot, file),
        fileName,
        extension: path.extname(fileName).replace(/^\./, "") || null,
        byteSize: buffer.length,
        contentHash: hash.value,
        hashState: hash.state,
        hashAlgorithm: hash.algorithm,
        registeredAt: now(),
        sourceReference: file,
      });
    }

    const dataset = {
      datasetId: makeDeterministicId("RQD", [propertyId, missionId, sourceType, sourceRoot].join("|")),
      propertyId,
      missionId,
      sourceType,
      sourceRoot,
      sourceFiles,
      createdAt: now(),
      validationState: "READY_FOR_INGEST",
      validationNotes: "Qualification dataset is property-scoped and hashed; ready for the next ingest step.",
      registeredBy: actor,
    };
    store.qualificationDatasets.push(dataset);
    emit("QUALIFICATION_DATASET_PREPARED", { propertyId, actor, reason: sourceType + " / " + sourceFiles.length + " files" });
    return dataset;
  },

  registerSourceFilesForDataset: async ({
    propertyId, missionId, sourceRoot, sourceType = "DJI_M4E", datasetId = null, actor = "system", datasetName = null, license = null,
  } = {}) => {
    await ensureQualificationStateLoaded();
    const dataset = datasetId ? store.qualificationDatasets.find((d) => d.datasetId === datasetId)
      : store.qualificationDatasets.find((d) => d.propertyId === propertyId && d.missionId === missionId && d.sourceRoot === sourceRoot);
    const prepared = dataset || await RealityEngine.prepareQualificationDataset({ propertyId, missionId, sourceRoot, sourceType, actor });
    const files = [];
    const duplicates = [];
    const failed = [];
    const registered = [];

    const propertyAssets = await EvidenceVault.listByProperty(propertyId);
    for (const file of prepared.sourceFiles) {
      const existing = propertyAssets.find((a) => a.contentHash === file.contentHash && a.missionId === missionId);
      if (existing) {
        duplicates.push({ sourceReference: file.sourceReference, evidenceId: existing.evidenceId, reason: "DUPLICATE" });
        continue;
      }
      try {
        const fileBytes = await fs.readFile(file.sourceReference);
        const metadata = extractMetadata(file.fileName, fileBytes);
        const asset = await EvidenceVault.ingest({
          propertyId,
          missionId,
          artifactType: inferImageKind(file.fileName) === "THERMAL_IMAGE" ? "THERMAL_IMAGE" : "RGB_IMAGE",
          origin: "ORIGINAL",
          filename: file.fileName,
          originalFilename: file.fileName,
          mediaType: file.fileName.toLowerCase().endsWith(".jpg") || file.fileName.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : file.fileName.toLowerCase().endsWith(".png") ? "image/png" : "application/octet-stream",
          byteSize: file.byteSize,
          sourceMode: "LOCAL_IMPORT",
          sourceReference: file.sourceReference,
          sourcePath: file.sourceReference,
          datasetId: prepared.datasetId,
          metadata: {
            sourceType,
            license: license || "UNKNOWN",
            datasetName: datasetName || prepared.datasetId,
            datasetId: prepared.datasetId,
            captureTimestamp: metadata.captureTimestamp,
            cameraMake: metadata.cameraMake,
            cameraModel: metadata.cameraModel,
            lens: metadata.lens,
            latitude: metadata.latitude,
            longitude: metadata.longitude,
            altitude: metadata.altitude,
            orientation: metadata.orientation,
            exifPresent: metadata.exifPresent,
            rtkState: metadata.rtkState,
            crsState: metadata.crsState,
            sourceProvenance: "LOCAL_DIRECTORY_IMPORT",
            fileHash: file.contentHash,
          },
          truthClassification: null,
          deviceId: null,
          aircraftId: null,
          sensorId: null,
        }, { bytes: fileBytes });
        registered.push(asset.evidenceId);
        files.push({ ...file, evidenceId: asset.evidenceId });
      } catch (error) {
        failed.push({ sourceReference: file.sourceReference, reason: error.message });
      }
    }

    return {
      datasetId: prepared.datasetId,
      propertyId,
      missionId,
      sourceType,
      sourceFiles: files,
      duplicates,
      failed,
      filesRegistered: registered.length,
      sourceFileCount: prepared.sourceFiles.length,
      validationState: failed.length ? "PARTIAL_INGEST" : "READY_FOR_PROCESSING",
      hashStatus: "SHA_256_COMPUTED",
      cameraModel: files[0]?.metadata?.cameraModel || "UNKNOWN",
      rtkState: files[0]?.metadata?.rtkState || "NOT_AVAILABLE",
      crsState: files[0]?.metadata?.crsState || "NOT_AVAILABLE",
    };
  },

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

  prepareQualificationDataset: async ({
    propertyId, missionId, sourceRoot, sourceType = "DJI_M4E", actor = "system",
  } = {}) => {
    if (!propertyId) throw new Error("Qualification dataset requires a propertyId.");
    if (!missionId) throw new Error("Qualification dataset requires a missionId.");
    if (!sourceRoot) throw new Error("Qualification dataset requires a sourceRoot directory.");

    const mission = await MissionService.get(missionId);
    if (mission.propertyId !== propertyId)
      throw new Error(`Mission ${missionId} belongs to ${mission.propertyId}, not ${propertyId}.`);

    const entries = await fs.readdir(sourceRoot, { withFileTypes: true });
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(sourceRoot, entry.name))
      .sort();

    if (!files.length) {
      throw new Error("Qualification dataset source directory contains no files to ingest.");
    }

    const sourceFiles = [];
    for (const file of files) {
      const buffer = await fs.readFile(file);
      const hash = await computeHash(buffer);
      const fileName = path.basename(file);
      sourceFiles.push({
        fileId: nid("RQF"),
        propertyId,
        missionId,
        sourceType,
        sourceRoot,
        relativePath: path.relative(sourceRoot, file),
        fileName,
        extension: path.extname(fileName).replace(/^\./, "") || null,
        byteSize: buffer.length,
        contentHash: hash.value,
        hashState: hash.state,
        hashAlgorithm: hash.algorithm,
        registeredAt: now(),
        sourceReference: file,
      });
    }

    const dataset = {
      datasetId: nid("RQD"),
      propertyId,
      missionId,
      sourceType,
      sourceRoot,
      sourceFiles,
      createdAt: now(),
      validationState: "READY_FOR_INGEST",
      validationNotes: "Qualification dataset is property-scoped and hashed; ready for the next ingest step.",
      registeredBy: actor,
    };
    store.qualificationDatasets.push(dataset);
    emit("QUALIFICATION_DATASET_PREPARED", { propertyId, actor, reason: sourceType + " / " + sourceFiles.length + " files" });
    return dataset;
  },

  /* --------------------------------------------------------- processing -- */

  queueJob: async (input, { actor = "system" } = {}) => {
    const job = {
      jobId: input.jobId || makeDeterministicId("RJOB", [input.propertyId || "", input.missionId || "", input.datasetId || "", input.twinType || "", input.processorType || "", input.manifestId || ""].join("|")),
      propertyId: input.propertyId, missionId: input.missionId || null, datasetId: input.datasetId || null,
      manifestId: input.manifestId || null, twinVersionId: input.twinVersionId || null,
      twinType: input.twinType, processorType: input.processorType,
      processorVersion: input.processorVersion || "fixture-1.0", status: PROCESSING_STATE.QUEUED,
      inputEvidenceIds: input.inputEvidenceIds || [], inputArtifactIds: input.inputArtifactIds || [],
      outputArtifactIds: [], startedAt: null, completedAt: null, progress: 0, warningCodes: [],
      failureReason: null, provider: PropertyRealityProcessingProvider.name, sourceMode: "FIXTURE",
    };
    store.jobs.push(job);
    emit("REALITY_JOB_QUEUED", { propertyId: job.propertyId, actor, reason: job.processorType });
    await persistRealityState();
    return job;
  },

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
    await ensureQualificationStateLoaded();
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

    const artifactId = input.spatialArtifactId || input.artifactId || makeDeterministicId("SPA", [input.propertyId, input.twinVersionId, input.artifactType, input.processingJobId, (input.sourceEvidenceIds || []).join("|")].join("|"));
    const artifact = {
      artifactId,
      spatialArtifactId: artifactId,
      realityJobId: input.realityJobId || input.processingJobId || null,
      propertyId: input.propertyId, missionId: input.missionId || version.sourceMissionIds?.[0] || null,
      datasetId: input.datasetId || null, twinVersionId: input.twinVersionId, artifactType: input.artifactType,
      sourceEvidenceIds: input.sourceEvidenceIds, sourceRefs: input.sourceRefs || input.sourceEvidenceIds || [],
      processingJobId: input.processingJobId,
      format: input.format || descriptor.format, storageReference: input.storageReference || "reality/" + input.propertyId + "/" + input.twinVersionId + "/" + input.artifactType,
      coordinateSystem: descriptor.coordinateSystem, unitSystem: input.unitSystem || "IMPERIAL",
      bounds: input.bounds || null, provider: input.provider || "PropertyRealityProcessingProvider",
      providerMode: input.providerMode || "FIXTURE", processorVersion: input.processorVersion || "fixture-1.0",
      pointCount: descriptor.pointCount, vertexCount: descriptor.vertexCount, faceCount: descriptor.faceCount,
      resolution: descriptor.resolution, pointCloudSource: descriptor.pointCloudSource,
      qualityState: QUALITY_STATE.NOT_EVALUATED, validationState: input.validationState || "QA_REQUIRED",
      isSimulated: descriptor.isSimulated, sha256: input.sha256 || null,
      byteSize: input.byteSize ?? null, notice: descriptor.notice, sourceMode: "FIXTURE", createdAt: now(),
    };
    store.artifacts.push(artifact);

    const job = store.jobs.find((j) => j.jobId === input.processingJobId);
    if (job) job.outputArtifactIds.push(artifact.spatialArtifactId);

    emit("SPATIAL_ARTIFACT_CREATED", { propertyId: artifact.propertyId, twinVersionId: artifact.twinVersionId,
      actor, reason: artifact.artifactType });
    await persistRealityState();
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
    await persistRealityState();
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

  importLocalArtifact: async ({
    jobId, propertyId, missionId, datasetId, artifactDir, artifactType, provider = "DJI_TERRA_IMPORT",
    processorVersion = "local-import-1.0", actor = "system", qualityReport = null, crs = null,
  } = {}) => {
    await ensureQualificationStateLoaded();
    if (!jobId) throw new Error("Artifact import requires a Reality jobId.");
    if (!artifactDir) throw new Error("Artifact import requires an artifact directory.");
    const job = store.jobs.find((j) => j.jobId === jobId);
    if (!job) throw new Error("Reality job not found.");
    if (job.propertyId !== propertyId) throw new Error("Reality job property does not match the requested property.");
    if (missionId && job.missionId && job.missionId !== missionId) throw new Error("Reality job mission does not match the requested mission.");
    if (datasetId && job.datasetId && job.datasetId !== datasetId) throw new Error("Reality job dataset does not match the requested dataset.");

    const files = (await fs.readdir(artifactDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(artifactDir, entry.name))
      .sort();
    if (!files.length) throw new Error("Artifact directory contains no files to register.");

    const sourceEvidenceIds = (job.inputEvidenceIds || []).slice();
    if (!sourceEvidenceIds.length) {
      const ds = store.qualificationDatasets.find((d) => d.datasetId === job.datasetId);
      if (ds) {
        const assetRefs = await EvidenceVault.listByProperty(propertyId);
        sourceEvidenceIds.push(...assetRefs.filter((a) => a.missionId === missionId && a.metadata?.datasetId === datasetId).map((a) => a.evidenceId));
      }
    }
    const known = await EvidenceVault.listByProperty(propertyId);
    const foreign = sourceEvidenceIds.filter((id) => !known.some((a) => a.evidenceId === id));
    if (foreign.length) throw new Error("Artifact source evidence is invalid for this property: " + foreign.join(", ") + ".");

    const entry = await Promise.all(files.map(async (file) => {
      const bytes = await fs.readFile(file);
      const hash = await computeHash(bytes);
      const fileName = path.basename(file);
      const resolvedArtifactType = artifactType || (
        /\.(OBJ|OBJ)$/i.test(fileName) ? "MESH" : /\.(LAS|LAZ)$/i.test(fileName) ? "POINT_CLOUD" : /\.(TIF|TIFF|PNG)$/i.test(fileName) ? "ORTHOMOSAIC" : "OTHER"
      );
      if (!Object.values(SPATIAL_ARTIFACT_TYPE).includes(resolvedArtifactType)) {
        throw new Error("Unsupported artifact type: " + resolvedArtifactType + ".");
      }
      return {
        file,
        fileName,
        bytes,
        hash,
        artifactType: resolvedArtifactType,
        byteSize: bytes.length,
      };
    }));

    const versionId = job.twinVersionId || makeDeterministicId("TWV", [propertyId, missionId || "", job.datasetId || "", "IMPORTED"].join("|"));
    let version = findVersion(versionId);
    if (!version) {
      version = await RealityEngine.createVersion({
        propertyId, twinType: "TWIN_TYPE_A", sourceMissionIds: missionId ? [missionId] : [],
        sourceEvidenceIds: sourceEvidenceIds, sourceCapturePackageIds: [], notes: "Imported local artifact qualification iteration",
      });
    }

    const created = [];
    for (const item of entry) {
      const artifact = await RealityEngine.createArtifact({
        propertyId,
        missionId,
        datasetId,
        twinVersionId: version.twinVersionId,
        artifactType: item.artifactType,
        processingJobId: job.jobId,
        realityJobId: job.jobId,
        sourceEvidenceIds: sourceEvidenceIds,
        sourceRefs: sourceEvidenceIds,
        provider,
        providerMode: "LOCAL_IMPORT",
        processorVersion,
        artifactId: makeDeterministicId("SPA", [jobId, propertyId, item.fileName, item.artifactType].join("|")),
        storageReference: item.file,
        format: item.fileName.split(".").pop() || "unknown",
        bounds: null,
        sourceMode: "LOCAL_IMPORT",
        qualityState: qualityReport ? "PASS_WITH_WARNINGS" : QUALITY_STATE.NOT_EVALUATED,
        validationState: "QA_REQUIRED",
        notice: qualityReport || "Local import was registered without internal reconstruction.",
        sha256: item.hash.value,
        byteSize: item.byteSize,
      });
      created.push(artifact);
    }

    if (job.status === PROCESSING_STATE.QUEUED) {
      job.status = PROCESSING_STATE.RUNNING;
      job.progress = 100;
      job.completedAt = now();
      job.outputArtifactIds = created.map((a) => a.spatialArtifactId);
      job.warningCodes = qualityReport ? ["LOCAL_IMPORT_QUALITY_REPORT"] : [];
      job.failureReason = null;
      job.provider = provider;
      job.sourceMode = "LOCAL_IMPORT";
    }

    emit("LOCAL_ARTIFACT_IMPORTED", { propertyId, actor, reason: created.length + " imported artifact(s)" });
    await persistRealityState();
    return {
      jobId: job.jobId,
      propertyId,
      missionId,
      datasetId,
      createdArtifacts: created,
      validationState: "QA_REQUIRED",
      provider,
      providerMode: "LOCAL_IMPORT",
      processorVersion,
      sourceEvidenceIds,
      qualityReport: qualityReport || null,
      crs: crs || "UNKNOWN",
    };
  },

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
