/**
 * PROPERTY REALITY ENGINE TEST SUITE
 *
 * These tests protect the things that make a digital twin trustworthy:
 * approved reality is immutable, version lineage survives, no metric is
 * invented, and nothing unapproved reaches Passport or a report.
 *
 * Run:  node src/domains/reality/reality.test.mjs
 */
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import RealityEngine from "./service.js";
import RealityProjections, {
  PassportRealityProjection, CortexSpatialManifest, CoreGeometryProjection,
  ProRealityProjection, HabitatRealityProjection, ReportTwinModules,
} from "./projections.js";
import {
  TWIN_TYPES, twinTypeIds, twinType, evaluateCompleteness, truthClassForMethod,
  TWIN_VERSION_STATE, COMPARISON_STATE, LAYER_STATE, MEASUREMENT_METHOD,
  WORKING_NAME_NOTICE, TWIN_LAYERS,
} from "./types.js";
import { PropertyRealityProcessingProvider, ComparisonProvider, realityProviderHealth, PROVIDER_MODE } from "./providers.js";
import EvidenceVault from "../evidence/vault.js";
import MissionService from "../mission/service.js";
import { properties } from "../property/fixtures.js";

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log("  ok   " + m); };
const no = (m) => { fail++; console.log("  FAIL " + m); };
const check = (c, m) => (c ? ok(m) : no(m));
const section = (t) => console.log("\n=== " + t + " ===");

/* ---------------------------------------------------------- 1. twin types */
section("1. TWIN TYPES");

check(twinTypeIds().length === 3, "exactly three canonical twin types exist");
check(twinTypeIds().every((id) => /^TWIN_TYPE_[ABC]$/.test(id)), "types use neutral working identifiers");
check(Object.values(TWIN_TYPES).every((t) => t.permanentNameLocked === false),
  "no twin type claims a locked permanent product name");
check(/WORKING TYPE NAME/.test(WORKING_NAME_NOTICE), "a working-name notice exists for the UI to display");
check(Object.values(TWIN_TYPES).every((t) => t.requiredOutputs && t.supportedLayers && t.projectionRules),
  "every type carries its own policy: outputs, layers and projection rules");

const A = twinType("TWIN_TYPE_A"), B = twinType("TWIN_TYPE_B"), C = twinType("TWIN_TYPE_C");
check(JSON.stringify(A.requiredOutputs) !== JSON.stringify(B.requiredOutputs),
  "type A and type B require different outputs");
check(!B.requiredOutputs.includes("TEXTURED_MESH"), "type B does not require a textured mesh");
check(B.requiredOutputs.includes("THERMAL_SPATIAL_LAYER"), "type B requires a thermal spatial layer");
check(C.requiredOutputs.length < A.requiredOutputs.length, "type C is a lighter product than type A");
check(C.projectionRules.habitat === false && A.projectionRules.habitat === true,
  "projection rules differ per type");

/* ------------------------------------------------------- 2. completeness */
section("2. TYPE-SPECIFIC COMPLETENESS");

check(evaluateCompleteness("TWIN_TYPE_A", ["POINT_CLOUD", "MESH", "TEXTURED_MESH", "ROOF_GEOMETRY", "ORTHOMOSAIC", "CAD_MODEL", "BIM_MODEL"]).state === "COMPLETE",
  "type A with every required and optional output is COMPLETE");
check(evaluateCompleteness("TWIN_TYPE_A", ["POINT_CLOUD", "MESH", "TEXTURED_MESH", "ROOF_GEOMETRY"]).state === "COMPLETE_WITH_WARNINGS",
  "type A missing only optional outputs is COMPLETE_WITH_WARNINGS");
check(evaluateCompleteness("TWIN_TYPE_A", ["POINT_CLOUD"]).state === "PARTIAL",
  "type A missing some required outputs is PARTIAL");
const bWithAOutputs = evaluateCompleteness("TWIN_TYPE_B", ["POINT_CLOUD", "MESH", "TEXTURED_MESH", "ROOF_GEOMETRY"]);
check(bWithAOutputs.missing.includes("THERMAL_SPATIAL_LAYER"),
  "type A's outputs do not satisfy type B — completeness is not one global definition");
check(evaluateCompleteness("TWIN_TYPE_C", ["ORTHOMOSAIC", "ROOF_GEOMETRY", "EXTERIOR_GEOMETRY"]).state === "COMPLETE",
  "type C is complete with its own smaller output set");

/* --------------------------------------------------------- 3. versioning */
section("3. VERSIONING & IMMUTABILITY");

const v182 = await RealityEngine.listVersions("SXP-004182", "TWIN_TYPE_A");
check(v182.length >= 2, "a property may hold several versions of one twin type");
check(v182.some((v) => v.status === "SUPERSEDED"), "an earlier version is retained as SUPERSEDED");
check(v182.every((v) => v.propertyId === "SXP-004182"), "versions are property-scoped");

const current = await RealityEngine.getCurrentVersion("SXP-004182", "TWIN_TYPE_A");
check(current.versionLabel === "V2", "the current version is the latest approved one");
const v1 = v182.find((v) => v.versionLabel === "V1");
check(v1 && v1.supersededByTwinVersionId === current.twinVersionId, "V1 records what superseded it");
check(current.supersedesTwinVersionId === v1.twinVersionId, "V2 records what it superseded");
check(Boolean(await RealityEngine.getVersion(v1.twinVersionId)), "the superseded version remains retrievable");

let contentBlocked = false;
try { await RealityEngine.updateVersion(current.twinVersionId, { bounds: { x: 1 } }); }
catch { contentBlocked = true; }
check(contentBlocked, "an approved version refuses a content change");

let reviewBlocked = false;
try { await RealityEngine.review(current.twinVersionId, "APPROVE"); }
catch { reviewBlocked = true; }
check(reviewBlocked, "an approved version cannot be re-approved into new reality");

await RealityEngine.updateVersion(current.twinVersionId, { notes: "Reviewer note" });
const stillV2 = await RealityEngine.getCurrentVersion("SXP-004182", "TWIN_TYPE_A");
check(stillV2.notes === "Reviewer note" && stillV2.versionNumber === 2,
  "non-content metadata may still be updated on an approved version");

// Version numbering is scoped to property AND type.
const newB = await RealityEngine.createVersion({
  propertyId: "SXP-004182", twinType: "TWIN_TYPE_B", sourceMissionIds: ["M-2026-0827-012"],
});
check(newB.versionNumber === 2, "type B numbering is independent of type A on the same property");
const otherProp = await RealityEngine.createVersion({
  propertyId: "SXP-004179", twinType: "TWIN_TYPE_A", sourceMissionIds: ["M-2026-0829-017"],
});
check(otherProp.versionNumber === 1, "a different property starts its own version sequence");

let missionLineage = false;
try {
  await RealityEngine.createVersion({ propertyId: "SXP-004179", twinType: "TWIN_TYPE_A",
    sourceMissionIds: ["M-2026-0827-012"] });
} catch { missionLineage = true; }
check(missionLineage, "a source mission from another property is refused — the Directive 006 bug stays impossible");

/* ----------------------------------------------------------- 4. manifest */
section("4. REALITY INPUT MANIFEST");

const manifest = await RealityEngine.buildInputManifest("SXP-004188", { requestedTwinTypes: ["TWIN_TYPE_B"] });
const vaultAssets = await EvidenceVault.listByProperty("SXP-004188");
const byId = Object.fromEntries(vaultAssets.map((a) => [a.evidenceId, a]));

check(manifest.propertyId === "SXP-004188", "the manifest is property-scoped");
check([...manifest.approvedEvidenceIds, ...manifest.derivedEvidenceIds, ...manifest.excludedEvidenceIds]
  .every((id) => byId[id]), "every manifest entry resolves to this property's evidence");
check(manifest.excludedEvidenceIds.includes("EA-16002"), "quarantined evidence is excluded");
check(manifest.excludedEvidenceIds.includes("EA-16003"), "rejected evidence is excluded");
check(Boolean(manifest.exclusionReasons["EA-16002"]), "each exclusion records its reason");
check(!manifest.approvedEvidenceIds.includes("EA-16002"), "quarantined evidence never enters the approved list");

const empty = await RealityEngine.buildInputManifest("SXP-004191");
check(empty.validationState === "INSUFFICIENT_EVIDENCE",
  "a property with no approved evidence reports INSUFFICIENT_EVIDENCE, not an empty success");

const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stratex-dji-"));
await fs.writeFile(path.join(tmpRoot, "DJI_0001.JPG"), Buffer.from("rgb-1"));
await fs.writeFile(path.join(tmpRoot, "DJI_0002.RJPG"), Buffer.from("thermal-1"));
const qualification = await RealityEngine.prepareQualificationDataset({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  sourceRoot: tmpRoot,
  sourceType: "DJI_M4E",
  actor: "u-001",
});
check(qualification.propertyId === "SXP-004182", "a qualification dataset is property-scoped");
check(qualification.missionId === "M-2026-0827-012", "a qualification dataset binds to its mission");
check(qualification.sourceFiles.length === 2, "the first ingest registers all files found in the directory");
check(qualification.sourceFiles.every((f) => f.contentHash && f.hashState === "COMPUTED"),
  "every registered file is hashed before the directory is handed to processing");
check(qualification.validationState === "READY_FOR_INGEST",
  "a valid DJI directory is ready for the next ingest step, not blocked");

const registration = await RealityEngine.registerSourceFilesForDataset({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  sourceRoot: tmpRoot,
  sourceType: "DJI_M4E",
  actor: "u-001",
  datasetName: "JOB-1-M4E-QUALIFICATION",
  license: "PUBLIC_QUALIFICATION_DATASET",
});
check(registration.filesRegistered === 2, "the dataset registers source files through the Evidence vault");
check(registration.duplicates.length === 0, "the same file is not duplicated on first register");
check(registration.hashStatus === "SHA_256_COMPUTED", "SHA-256 is preserved through the source registration record");
check(registration.sourceFiles.every((f) => f.evidenceId), "source files receive stable evidence identities");

const duplicateAttempt = await RealityEngine.registerSourceFilesForDataset({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  sourceRoot: tmpRoot,
  sourceType: "DJI_M4E",
  actor: "u-001",
});
check(duplicateAttempt.duplicates.length === 2, "exact duplicate source files are detected and reported");

const job = await RealityEngine.queueJob({
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  datasetId: registration.datasetId,
  twinType: "TWIN_TYPE_A",
  processorType: "MESH_GENERATION",
  inputEvidenceIds: registration.sourceFiles.map((f) => f.evidenceId),
});
check(Boolean(job.jobId), "a Reality job is created for the imported-source workflow");
check(job.datasetId === registration.datasetId, "the job carries its dataset lineage");

const artifactRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stratex-artifact-"));
await fs.writeFile(path.join(artifactRoot, "mesh.obj"), Buffer.from("OBJDATA"));
const imported = await RealityEngine.importLocalArtifact({
  jobId: job.jobId,
  propertyId: "SXP-004182",
  missionId: "M-2026-0827-012",
  datasetId: registration.datasetId,
  artifactDir: artifactRoot,
  artifactType: "MESH",
  provider: "DJI_TERRA_IMPORT",
  processorVersion: "dji-terra-import-1.0",
  qualityReport: "QA_REQUIRED",
  crs: "UNKNOWN",
});
check(imported.validationState === "QA_REQUIRED", "imported artifacts reach the existing QA workflow");
check(imported.createdArtifacts.length === 1, "the local import path registers one artifact record");
check(imported.createdArtifacts[0].sourceEvidenceIds.length > 0, "artifact provenance is retained from source evidence");
check(imported.createdArtifacts[0].providerMode === "LOCAL_IMPORT", "imported artifacts declare a local import provider mode");
check(Boolean(imported.createdArtifacts[0].realityJobId), "imported artifacts retain a direct reality job identity");
check(imported.createdArtifacts[0].realityJobId === job.jobId, "the artifact records the source reality job directly");
check(Boolean(imported.createdArtifacts[0].sha256) && imported.createdArtifacts[0].sha256.length === 64, "imported artifacts store a real SHA-256 digest");
check(imported.createdArtifacts[0].byteSize === 7 || imported.createdArtifacts[0].byteSize === Buffer.byteLength("OBJDATA"), "imported artifacts store the actual file byte size");
check(imported.createdArtifacts[0].datasetId === registration.datasetId, "the artifact retains the dataset lineage");
check(imported.createdArtifacts[0].propertyId === "SXP-004182", "the artifact stays property-scoped");
check(imported.createdArtifacts[0].missionId === "M-2026-0827-012", "the artifact stays mission-scoped");

const crossPropertyJob = await RealityEngine.queueJob({
  propertyId: "SXP-004179",
  missionId: "M-2026-0829-017",
  datasetId: "RQD-OTHER",
  twinType: "TWIN_TYPE_A",
  processorType: "MESH_GENERATION",
  inputEvidenceIds: ["EA-90211"],
});
let crossPropertyRejected = false;
try {
  await RealityEngine.importLocalArtifact({
    jobId: crossPropertyJob.jobId,
    propertyId: "SXP-004179",
    missionId: "M-2026-0829-017",
    datasetId: "RQD-OTHER",
    artifactDir: artifactRoot,
    artifactType: "MESH",
    provider: "DJI_TERRA_IMPORT",
  });
} catch {
  crossPropertyRejected = true;
}
check(crossPropertyRejected, "wrong-property artifact import is rejected");

const ready = await RealityEngine.listReviewQueue();
check(ready.processing.some((v) => v.twinType === "TWIN_TYPE_A"), "imported work lands in the existing Reality QA review flow");

await fs.rm(tmpRoot, { recursive: true, force: true });
await fs.rm(artifactRoot, { recursive: true, force: true });

/* --------------------------------------------------------- 5. processing */
section("5. PROCESSING & PROVIDER HONESTY");

check(PropertyRealityProcessingProvider.isLive() === false, "the reality processor does not claim to be connected");
check(PropertyRealityProcessingProvider.mode === PROVIDER_MODE.FIXTURE, "the processor reports FIXTURE mode");
check(/no photogrammetry|no reconstruction/i.test(PropertyRealityProcessingProvider.health().detail),
  "processor health states plainly that no reconstruction engine is connected");
check(realityProviderHealth().every((h) => h.isLive === false), "no reality provider claims to be live");
check(ComparisonProvider.isLive() === false, "the comparison provider does not claim to be live");

const descriptor = await PropertyRealityProcessingProvider.produceDescriptor("PHOTOGRAMMETRY", "POINT_CLOUD");
check(descriptor.pointCount === null, "a fixture point cloud reports NO point count — nothing is fabricated");
check(descriptor.vertexCount === null && descriptor.faceCount === null, "vertex and face counts are null too");
check(descriptor.isSimulated === true && /SIMULATED/.test(descriptor.notice),
  "every descriptor is explicitly marked simulated");

const fixtureJob = await RealityEngine.queueJob({ propertyId: "SXP-004182", twinType: "TWIN_TYPE_A", processorType: "MESH_GENERATION" });
check(fixtureJob.status === "QUEUED" && fixtureJob.sourceMode === "FIXTURE", "a queued job is marked as a fixture job");
const ran = await RealityEngine.runJob(fixtureJob.jobId);
check(ran.status === "COMPLETE" && ran.completedAt, "a fixture job completes deterministically");

const failedJob = (await RealityEngine.listJobs("SXP-004190")).find((j) => j.status === "FAILED");
check(failedJob && failedJob.failureReason, "a failed reality job preserves its reason");

/* --------------------------------------------------- 6. artifact lineage */
section("6. SPATIAL ARTIFACT LINEAGE");

const artifacts = await RealityEngine.listArtifacts("SXP-004182");
check(artifacts.every((a) => a.processingJobId), "every artifact names the job that produced it");
check(artifacts.every((a) => a.twinVersionId), "every artifact names its twin version");
check(artifacts.every((a) => a.propertyId === "SXP-004182"), "artifacts are property-scoped");
check(artifacts.every((a) => a.pointCount === null || typeof a.pointCount === "number"),
  "no artifact carries an invented count");
check(artifacts.filter((a) => a.artifactType === "POINT_CLOUD").every((a) => a.pointCloudSource),
  "a point cloud always declares its capture method");
check(artifacts.some((a) => a.pointCloudSource === "FIXTURE_POINT_CLOUD"),
  "a fixture cloud is typed as a fixture cloud, not as photogrammetric or LiDAR");

let noJob = false;
try {
  await RealityEngine.createArtifact({ propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
    artifactType: "MESH", sourceEvidenceIds: ["EA-90211"] });
} catch { noJob = true; }
check(noJob, "an artifact without a processing job is refused");

let noEvidence = false;
try {
  await RealityEngine.createArtifact({ propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
    artifactType: "MESH", processingJobId: job.jobId, sourceEvidenceIds: [] });
} catch { noEvidence = true; }
check(noEvidence, "an artifact without source evidence is refused");

let foreignEvidence = false;
try {
  await RealityEngine.createArtifact({ propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
    artifactType: "MESH", processingJobId: job.jobId, sourceEvidenceIds: ["EA-16001"] });
} catch { foreignEvidence = true; }
check(foreignEvidence, "source evidence from another property is refused");

/* ------------------------------------------------------------ 7. thermal */
section("7. THERMAL");

const thermalB = await RealityEngine.getThermal("TWV-B182-1");
check(thermalB.sourceRadiometricEvidenceIds.length > 0 && thermalB.sourceThermalEvidenceIds.length > 0,
  "a thermal layer records radiometric and rendered sources separately");
check(thermalB.sourceRadiometricEvidenceIds[0] !== thermalB.sourceThermalEvidenceIds[0],
  "radiometric source and rendered thermal are different artifacts");
check(thermalB.alignmentState === "ALIGNED_WITH_WARNINGS", "alignment state is preserved");
check(thermalB.coverageState === "PARTIAL", "partial thermal coverage is reported as partial");

const thermal188 = await RealityEngine.getThermal("TWV-B188-1");
check(thermal188.radiometricAvailable === false, "a layer with no radiometric source says so");
check(thermal188.alignmentState === "NOT_STARTED", "an unaligned layer reports NOT_STARTED, not ALIGNED");
check(/no temperature values can be claimed/i.test(thermal188.notes),
  "without radiometric data, no temperature values are claimed");

const radiometricAsset = (await EvidenceVault.get("EA-90212")).asset;
const renderedAsset = (await EvidenceVault.get("EA-90260")).asset;
check(radiometricAsset.thermalKind === "RADIOMETRIC_SOURCE" && renderedAsset.thermalKind === "RENDERED_THERMAL_IMAGE",
  "the evidence-level radiometric distinction survives into reality");

/* ----------------------------------------------------------- 8. geometry */
section("8. ROOF GEOMETRY & MEASUREMENT TRUTH");

const roof = await RealityEngine.getRoof("TWV-A182-2");
check(roof.sections.every((s) => /^ROOF-PLANE-\d+$/.test(s.featureId)), "roof planes carry stable feature IDs");
check(roof.ridges.every((r) => r.featureId) && roof.valleys.every((r) => r.featureId),
  "ridges and valleys carry stable feature IDs");

const ms = await RealityEngine.getMeasurements("TWV-A182-2");
check(ms.measurements.every((m) => m.sourceEvidenceIds && m.method),
  "every measurement records its source evidence and method");
const photogrammetric = ms.measurements.find((m) => m.method === "PHOTOGRAMMETRIC");
check(photogrammetric.truthClassification === "DERIVED",
  "a photogrammetric dimension is DERIVED, never MEASURED");
const direct = ms.measurements.find((m) => m.method === "DIRECT_SENSOR");
check(direct.truthClassification === "MEASURED", "a direct sensor reading is MEASURED");
check(truthClassForMethod(MEASUREMENT_METHOD.LIDAR_DERIVED) === "DERIVED",
  "LiDAR-derived dimensions are DERIVED");
check(ms.measurements.filter((m) => m.truthClassification === "DERIVED").every((m) => m.confidence === undefined),
  "a derived measurement carries precision metadata, not Cortex confidence");
check(photogrammetric.precision && !photogrammetric.confidence,
  "precision is stored separately from probabilistic confidence");
check(ms.measurements.every((m) => m.sourceArtifactIds !== undefined),
  "measurements trace back to the spatial artifact that produced them");

/* -------------------------------------------------------------- 9. layers */
section("9. LAYERS & OBSERVATION DISCIPLINE");

const layerSet = await RealityEngine.getLayerSet("LS-A182-2");
check(Object.keys(layerSet.layers).length > 0, "a twin version has a canonical layer set");
check(Object.keys(layerSet.layers).every((l) => TWIN_LAYERS.includes(l)),
  "layer names come from the canonical vocabulary");
check(layerSet.layers.ELECTRICAL.state === "NOT_OBSERVED",
  "concealed wiring is NOT_OBSERVED, never AVAILABLE");
check(layerSet.layers.PLUMBING.state === "NOT_OBSERVED", "concealed plumbing is NOT_OBSERVED");
check(layerSet.layers.HVAC.state === "NOT_OBSERVED", "concealed HVAC is NOT_OBSERVED on an exterior capture");
check(layerSet.layers.ELECTRICAL.observation === "UNKNOWN",
  "an unobserved system's observation class is UNKNOWN, not KNOWN");
check(layerSet.layers.WINDOWS.observation === "DERIVED",
  "openings inferred from geometry are DERIVED, not directly observed");

const thermalLayers = await RealityEngine.getLayerSet("LS-B182-1");
check(thermalLayers.layers.HVAC.observation === "PROBABLE",
  "a system inferred from a thermal signature is PROBABLE");
check(thermalLayers.layers.RGB_TEXTURE.state === "NOT_APPLICABLE",
  "a layer the type does not require is NOT_APPLICABLE, not missing");

/* -------------------------------------------------- 10. quality / review */
section("10. QUALITY & REVIEW");

const draft = await RealityEngine.createVersion({
  propertyId: "SXP-004188", twinType: "TWIN_TYPE_B", sourceMissionIds: ["M-2026-0829-016"],
});
check(draft.status === "DRAFT", "a new version begins as DRAFT");

const q = await RealityEngine.assessQuality(draft.twinVersionId, {
  geometryQuality: "PASS",
  checks: [{ code: "G", label: "Geometry", state: "PASS", source: "FIXTURE" }],
});
check(q.overallState === "PASS", "all-pass checks give PASS");
const qw = await RealityEngine.assessQuality(draft.twinVersionId, {
  checks: [{ code: "G", label: "Geometry", state: "WARNING", source: "FIXTURE" }],
});
check(qw.overallState === "PASS_WITH_WARNINGS", "a warning gives PASS_WITH_WARNINGS");
const qf = await RealityEngine.assessQuality(draft.twinVersionId, {
  checks: [{ code: "G", label: "Geometry", state: "FAIL", source: "FIXTURE" }],
});
check(qf.overallState === "FAIL", "a failed check gives FAIL");
check((await RealityEngine.assessQuality(draft.twinVersionId, { checks: [] })).overallState === "UNKNOWN",
  "no checks gives UNKNOWN, not PASS");

const approvedDraft = await RealityEngine.review(draft.twinVersionId, "APPROVE_WITH_WARNINGS", { reason: "Minor holes." });
check(approvedDraft.status === "APPROVED_WITH_WARNINGS", "approve-with-warnings is recorded");
check(approvedDraft.approvedBy && approvedDraft.approvedAt, "approval records who and when");

// A version that was never approved is NOT superseded — you cannot supersede
// reality that was never canonical. It keeps its own state.
const untouched = (await RealityEngine.listVersions("SXP-004188", "TWIN_TYPE_B"))
  .find((v) => v.twinVersionId === "TWV-B188-1");
check(untouched.status === "REVIEW_REQUIRED",
  "a version awaiting review is not superseded by a newly approved one — it keeps its own state");

// Approving a new version DOES supersede the prior APPROVED version of that type.
const priorB182 = (await RealityEngine.listVersions("SXP-004182", "TWIN_TYPE_B"))
  .find((v) => v.twinVersionId === "TWV-B182-1");
check(priorB182.status === "APPROVED_WITH_WARNINGS", "TWV-B182-1 starts as an approved version");
const promoted = await RealityEngine.review(newB.twinVersionId, "APPROVE", { reason: "Reprocessed cleanly." });
const afterB182 = (await RealityEngine.listVersions("SXP-004182", "TWIN_TYPE_B"))
  .find((v) => v.twinVersionId === "TWV-B182-1");
check(afterB182.status === "SUPERSEDED",
  "approving a new version supersedes the prior approved one of that type");
check(afterB182.supersededByTwinVersionId === promoted.twinVersionId,
  "the superseded version records which version replaced it");
check(promoted.supersedesTwinVersionId === "TWV-B182-1",
  "the new version records what it superseded");
check(Boolean(await RealityEngine.getVersion("TWV-B182-1")),
  "the superseded version is still retrievable — history is never deleted");

const rejectDraft = await RealityEngine.createVersion({ propertyId: "SXP-004190", twinType: "TWIN_TYPE_A" });
const rejected = await RealityEngine.review(rejectDraft.twinVersionId, "REJECT", { reason: "Bad geometry." });
check(rejected.status === "FAILED", "reject moves a version to FAILED");
const reproc = await RealityEngine.createVersion({ propertyId: "SXP-004190", twinType: "TWIN_TYPE_A" });
check((await RealityEngine.review(reproc.twinVersionId, "REQUEST_REPROCESSING")).status === "PROCESSING",
  "request-reprocessing returns a version to PROCESSING");

const queue = await RealityEngine.listReviewQueue();
check(queue.approved.length >= 1 && queue.failed.length >= 1 && queue.superseded.length >= 1,
  "the review queue separates approved, failed and superseded");

/* --------------------------------------------------------- 11. comparison */
section("11. COMPARISON & CHANGE");

const cmp = await RealityEngine.compare("TWV-A182-1", "TWV-A182-2");
check(cmp.status === "COMPLETE_WITH_WARNINGS", "two geometric versions of one type compare");
check(cmp.changeSetId, "a comparison produces a change set");
const cs = await RealityEngine.getChangeSet(cmp.changeSetId);
check(cs.isSimulated === true && /SIMULATED COMPARISON/.test(cs.notice),
  "the change set is explicitly marked as a simulated comparison");
check(cs.changes.every((c) => c.baseFeatureId && c.sourceArtifactIds && c.processorVersion),
  "every change references its base feature, source artifacts and processor version");

let crossProperty = false;
try { await RealityEngine.compare("TWV-A182-2", "TWV-C179-1"); } catch { crossProperty = true; }
check(crossProperty, "comparing versions from different properties is refused");

let crossType = false;
try { await RealityEngine.compare("TWV-A182-2", "TWV-B182-1"); } catch { crossType = true; }
check(crossType, "comparing different twin types is refused");

const noGeom = await RealityEngine.compare("TWV-B188-1", approvedDraft.twinVersionId);
check(noGeom.status === COMPARISON_STATE.INSUFFICIENT_DATA,
  "a comparison without geometric artifacts reports INSUFFICIENT_DATA");
check(!noGeom.changeSetId, "INSUFFICIENT_DATA produces no change set — never 'zero changes found'");

/* --------------------------------------------------------- 12. projections */
section("12. PASSPORT / CORTEX / CORE / PRO / HABITAT");

const passport = await PassportRealityProjection.build("SXP-004182");
check(passport.currentTwinVersionIds.TWIN_TYPE_A === "TWV-A182-2",
  "Passport references the current approved version per type");
check(passport.historicalTwinVersions.some((h) => h.twinVersionId === "TWV-A182-1"),
  "Passport retains historical versions");
check(/never stores meshes/i.test(passport.note), "Passport stores references, not geometry");

const draftOnly = await PassportRealityProjection.build("SXP-004190");
check(Object.values(draftOnly.currentTwinVersionIds).every((v) => v === null),
  "a property with only failed or draft versions has no current Passport twin");

const cortex = await CortexSpatialManifest.build("SXP-004182");
check(cortex.twinVersionIds.length > 0 && cortex.spatialArtifactIds.length > 0,
  "the Cortex spatial manifest carries approved versions and their artifacts");
// Check real ownership, not a substring of the ID.
const cortexVersions = await Promise.all(cortex.twinVersionIds.map((id) => RealityEngine.getVersion(id)));
check(cortexVersions.every((d) => d.version.propertyId === "SXP-004182"),
  "every version in the Cortex manifest belongs to this property");
check(cortexVersions.every((d) => ["APPROVED", "APPROVED_WITH_WARNINGS"].includes(d.version.status)),
  "the Cortex manifest contains only approved versions — no drafts or failures");
check(Array.isArray(cortex.warnings), "the manifest surfaces warnings");

const core = await CoreGeometryProjection.build("SXP-004182", "TWIN_TYPE_A");
check(core.available && core.readOnly === true, "the Core geometry projection is read-only");
check(core.measurements.length > 0 && core.roofGeometry, "Core receives measurements and roof geometry");
check(!("update" in core) && !("write" in core), "the Core projection exposes no mutation surface");
const coreB = await CoreGeometryProjection.build("SXP-004182", "TWIN_TYPE_B");
check(coreB.available === false, "a type whose policy excludes Core does not project to Core");

const proNoOrg = await ProRealityProjection.build("SXP-004182", "TWIN_TYPE_A", {});
check(proNoOrg.available === false, "Pro receives nothing without an authorized organization");
const pro = await ProRealityProjection.build("SXP-004182", "TWIN_TYPE_A",
  { organizationId: "ORG-BLUEGRASS", authorizedScopes: ["MEASUREMENTS"] });
check(pro.available && pro.readOnly === true, "an authorized Pro projection is read-only");
check(pro.measurements.length > 0 && pro.layers === null,
  "Pro sees only the scopes it was granted");
check(/never canonical property truth/i.test(pro.note),
  "the Pro projection states that professional overlays are not canonical truth");

const habitat = await HabitatRealityProjection.build("SXP-004182", "TWIN_TYPE_A");
check(habitat.available && habitat.readOnly === true, "the Habitat projection is read-only");
const habitatC = await HabitatRealityProjection.build("SXP-004179", "TWIN_TYPE_C");
check(habitatC.available === false, "a type whose policy excludes Habitat does not project to Habitat");

const modules = await ReportTwinModules.evaluate("SXP-004182");
const cad = modules.find((m) => m.module === "CAD_BIM");
check(cad.included === false && /REQUIRED_ARTIFACT_UNAVAILABLE/.test(cad.reason),
  "a CAD module with no CAD artifact is excluded with a reason, not faked");
check(modules.find((m) => m.module === "DIGITAL_TWIN").included === true,
  "a twin module with an approved mesh is included");
const noReality = await ReportTwinModules.evaluate("SXP-004191");
check(noReality.every((m) => m.included === false), "a property with no reality supports no twin report modules");

/* --------------------------------------------------------- 13. isolation */
section("13. CROSS-PROPERTY ISOLATION");

const propertyIds = properties.map((p) => p.stratexPropertyId);
const S = RealityEngine.__store;
const missions = await MissionService.listAll();
const missionProperty = Object.fromEntries(missions.map((m) => [m.id, m.propertyId]));

const sets = {
  models: S.models, versions: S.versions, artifacts: S.artifacts, thermal: S.thermal,
  roof: S.roof, measurements: S.measurements, quality: S.quality, layers: S.layers,
  comparisons: S.comparisons, changes: S.changes, jobs: S.jobs, manifests: S.manifests,
};
for (const [name, rows] of Object.entries(sets)) {
  const bad = rows.filter((r) => r.propertyId && !propertyIds.includes(r.propertyId));
  check(bad.length === 0, name + " — every record belongs to a known property");
}

const versionProperty = Object.fromEntries(S.versions.map((v) => [v.twinVersionId, v.propertyId]));
check(S.artifacts.every((a) => versionProperty[a.twinVersionId] === a.propertyId),
  "every artifact's property matches its twin version's property");
check(S.thermal.every((t) => versionProperty[t.twinVersionId] === t.propertyId),
  "every thermal layer's property matches its twin version's");
check(S.measurements.every((m) => versionProperty[m.twinVersionId] === m.propertyId),
  "every measurement set's property matches its twin version's");
check(S.versions.every((v) => (v.sourceMissionIds || []).every((mid) => !missionProperty[mid] || missionProperty[mid] === v.propertyId)),
  "every source mission resolves to the version's own property");

const vaultAll = await EvidenceVault.listAll();
const evidenceProperty = Object.fromEntries(vaultAll.map((a) => [a.evidenceId, a.propertyId]));
check(S.artifacts.every((a) => a.sourceEvidenceIds.every((id) => !evidenceProperty[id] || evidenceProperty[id] === a.propertyId)),
  "every source evidence ID resolves to the artifact's own property");
check(S.versions.every((v) => (v.sourceEvidenceIds || []).every((id) => !evidenceProperty[id] || evidenceProperty[id] === v.propertyId)),
  "every version's source evidence belongs to its own property");

console.log("\n" + (fail ? `RESULT: ${fail} FAILURE(S), ${pass} passed\n` : `RESULT: ALL ${pass} TESTS PASS\n`));
process.exit(fail ? 1 : 0);
