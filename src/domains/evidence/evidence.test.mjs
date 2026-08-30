/**
 * EVIDENCE VAULT TEST SUITE
 *
 * These tests exist to keep the vault honest: originals stay immutable, custody
 * is append-only, hashes are never faked, and nothing reaches Cortex except
 * through a scoped manifest.
 *
 * Run:  node src/domains/evidence/evidence.test.mjs
 */
import EvidenceVault from "./vault.js";
import { computeHash, verifyHash, fixtureHash, HASH_STATE } from "./integrity.js";
import { EvidenceStorageProvider, EvidenceSourceProvider, STORAGE_TIER, STORAGE_MODE } from "./storage.js";
import { ARTIFACT_ORIGIN, EVIDENCE_REVIEW, ELIGIBILITY, QUALITY_STATE, COVERAGE_STATE, requiredAreasFor } from "./model.js";
import MissionService from "../mission/service.js";
import { properties } from "../property/fixtures.js";

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log("  ok   " + m); };
const no = (m) => { fail++; console.log("  FAIL " + m); };
const check = (c, m) => (c ? ok(m) : no(m));
const section = (t) => console.log("\n=== " + t + " ===");

/* ------------------------------------------------------------ 1. hashing -- */
section("1. HASHING — REAL SHA-256");

const h1 = await computeHash("stratex evidence bytes");
const h2 = await computeHash("stratex evidence bytes");
const h3 = await computeHash("stratex evidence byteS");
check(h1.value === h2.value, "identical bytes produce an identical SHA-256");
check(h1.value !== h3.value, "a single changed byte produces a different SHA-256");
check(h1.value.length === 64, "the digest is a full 64-character SHA-256");
check(h1.state === HASH_STATE.COMPUTED, "a real hash reports COMPUTED");

const v1 = await verifyHash(h1.value, "stratex evidence bytes");
check(v1.state === HASH_STATE.VERIFIED && v1.matches === true, "matching bytes verify");
const v2 = await verifyHash(h1.value, "tampered bytes");
check(v2.state === HASH_STATE.MISMATCH && v2.matches === false, "tampered bytes report MISMATCH");

const v3 = await verifyHash(h1.value, null);
check(v3.state === HASH_STATE.UNAVAILABLE, "absent bytes report UNAVAILABLE, not VERIFIED");
check(v3.matches === null, "absent bytes make no claim about matching");

const fx = fixtureHash();
check(fx.state === HASH_STATE.NOT_COMPUTED_FIXTURE && fx.value === null,
  "fixture evidence has no hash value at all — no invented digest");
const v4 = await verifyHash(null, "bytes");
check(v4.state === HASH_STATE.NOT_COMPUTED, "verifying with no recorded hash reports NOT_COMPUTED");

/* ------------------------------------------------------------- 2. ingest -- */
section("2. INGEST");

const bytes = new TextEncoder().encode("real rgb frame bytes for testing");
const ingested = await EvidenceVault.ingest({
  propertyId: "SXP-004182", missionId: "M-2026-0827-012", capturePackageId: "CP-012-1",
  artifactType: "RGB_IMAGE", filename: "TEST_0001.JPG", sensorType: "RGB",
  capturedAt: "2026-08-27T09:30:00Z",
}, { bytes });

check(ingested.evidenceId && ingested.ingestState === "COMPLETE", "a valid original ingests");
check(ingested.hashState === HASH_STATE.COMPUTED && ingested.contentHash.length === 64,
  "ingesting real bytes computes a real hash");
check(ingested.origin === ARTIFACT_ORIGIN.ORIGINAL && ingested.parentEvidenceId === null,
  "an original claims no processing parent");
check(ingested.storageReference.includes("/originals/"), "an original is stored on the originals path");
check(ingested.truthClassification === null,
  "an RGB photo is NOT automatically classified MEASURED — file type does not set truth class");

let rejected = [];
const tryIngest = async (input, label) => {
  try { await EvidenceVault.ingest(input); rejected.push([label, false]); }
  catch { rejected.push([label, true]); }
};
await tryIngest({ missionId: "M-2026-0827-012", artifactType: "RGB_IMAGE", filename: "x.jpg" }, "no property");
await tryIngest({ propertyId: "SXP-004182", artifactType: "RGB_IMAGE", filename: "x.jpg" }, "no mission");
await tryIngest({ propertyId: "SXP-004182", missionId: "M-DOES-NOT-EXIST", artifactType: "RGB_IMAGE", filename: "x.jpg" }, "unknown mission");
// The important one: property and mission must agree.
await tryIngest({ propertyId: "SXP-004179", missionId: "M-2026-0827-012", artifactType: "RGB_IMAGE", filename: "x.jpg" }, "mismatched property/mission");
await tryIngest({ propertyId: "SXP-004182", missionId: "M-2026-0827-012", artifactType: "MESH", origin: ARTIFACT_ORIGIN.DERIVED, filename: "x.obj" }, "derived without parent");

for (const [label, wasRejected] of rejected) check(wasRejected, "ingest rejected: " + label);

/* -------------------------------------------------------- 3. immutability -- */
section("3. IMMUTABILITY");

let overwriteBlocked = false;
try {
  await EvidenceStorageProvider.putOriginal(ingested.storageReference, new TextEncoder().encode("different"), {});
} catch { overwriteBlocked = true; }
check(overwriteBlocked, "storing over an existing original is refused");

let fieldBlocked = false;
try { await EvidenceVault.updateMetadata(ingested.evidenceId, { contentHash: "0".repeat(64) }); }
catch { fieldBlocked = true; }
check(fieldBlocked, "the content hash cannot be edited through the update path");

let originBlocked = false;
try { await EvidenceVault.updateMetadata(ingested.evidenceId, { capturedAt: "2020-01-01" }); }
catch { originBlocked = true; }
check(originBlocked, "the capture timestamp cannot be rewritten");

const hashBefore = ingested.contentHash;
await EvidenceVault.updateMetadata(ingested.evidenceId, { metadata: { reviewerNote: "looks good" } });
const after = (await EvidenceVault.get(ingested.evidenceId)).asset;
check(after.metadata.reviewerNote === "looks good", "metadata may be updated");
check(after.contentHash === hashBefore, "updating metadata leaves the content identity unchanged");

const derived = await EvidenceVault.ingest({
  propertyId: "SXP-004182", missionId: "M-2026-0827-012", capturePackageId: "CP-012-1",
  artifactType: "THUMBNAIL", origin: ARTIFACT_ORIGIN.DERIVED, parentEvidenceId: ingested.evidenceId,
  filename: "TEST_0001_thumb.jpg", truthClassification: "DERIVED",
});
check(derived.parentEvidenceId === ingested.evidenceId, "a derived artifact names its source");
check(derived.storageReference.includes("/derived/"), "a derived artifact is stored on the derived path");
check((await EvidenceVault.get(ingested.evidenceId)).asset.contentHash === hashBefore,
  "creating a derived artifact does not alter the original");

/* ----------------------------------------------------------- 4. integrity -- */
section("4. HASH VERIFICATION");

const verified = await EvidenceVault.verify(ingested.evidenceId);
check(verified.state === HASH_STATE.VERIFIED, "an ingested asset with real bytes verifies");

const fixtureVerify = await EvidenceVault.verify("EA-90211");
check(fixtureVerify.state !== HASH_STATE.VERIFIED,
  "a fixture asset with no bytes never reports VERIFIED");
check([HASH_STATE.NOT_COMPUTED, HASH_STATE.UNAVAILABLE].includes(fixtureVerify.state),
  "a fixture asset reports NOT_COMPUTED or UNAVAILABLE honestly");

/* -------------------------------------------------------------- 5. custody */
section("5. CHAIN OF CUSTODY");

const custody = await EvidenceVault.listCustody(ingested.evidenceId);
check(custody.length >= 4, "ingest writes a custody chain");
check(custody.some((c) => c.action === "RECEIVED") && custody.some((c) => c.action === "STORED") &&
      custody.some((c) => c.action === "INGESTED") && custody.some((c) => c.action === "HASHED"),
  "custody records received, hashed, stored and ingested");

const before = custody.length;
await EvidenceVault.review(ingested.evidenceId, EVIDENCE_REVIEW.APPROVED, { reason: "Clean frame." });
const afterReview = await EvidenceVault.listCustody(ingested.evidenceId);
check(afterReview.length === before + 1, "review appends a custody event");
check(afterReview.slice(0, before).every((e, i) => e.custodyEventId === custody[i].custodyEventId),
  "earlier custody events are unchanged — history is append-only");

await EvidenceVault.changeTier(ingested.evidenceId, STORAGE_TIER.COLD);
const tiered = await EvidenceVault.listCustody(ingested.evidenceId);
check(tiered.some((c) => c.action === "MOVED_TIER"), "a tier change is recorded in custody");

/* -------------------------------------------------------------- 6. storage */
section("6. STORAGE");

check(EvidenceStorageProvider.isLive() === false, "the storage provider does not claim to be connected");
check(EvidenceStorageProvider.mode === STORAGE_MODE.IN_MEMORY_STORAGE,
  "storage reports IN_MEMORY_STORAGE, never S3 CONNECTED");
check(/not production object storage/i.test(EvidenceStorageProvider.health().detail),
  "storage health states plainly that it is not production storage");

let signedRefused = false;
try { await EvidenceStorageProvider.getSignedAccessReference("x"); } catch { signedRefused = true; }
check(signedRefused, "a signed access URL is refused without a real provider");

const mat = await EvidenceStorageProvider.materialize("properties/none/x");
check(mat.materialized === false && mat.bytes === null,
  "an unmaterialized reference returns no bytes and says why");
check(EvidenceSourceProvider.isLive() === false, "the evidence source provider does not claim a DJI connection");
let pullRefused = false;
try { await EvidenceSourceProvider.pull(); } catch { pullRefused = true; }
check(pullRefused, "pulling from a capture source is refused — nothing is connected");

/* -------------------------------------------------------------- 7. quality */
section("7. QUALITY");

const q = await EvidenceVault.assessQuality(ingested.evidenceId, [
  { code: "READABLE", label: "File readable", state: "PASS", source: "AUTOMATED" },
  { code: "BLUR", label: "Sharpness", state: "PASS", source: "HUMAN" },
]);
check(q.qualityState === QUALITY_STATE.PASS, "all-pass checks produce PASS");
check(q.checks.every((c) => ["AUTOMATED", "HUMAN", "FIXTURE", "PROVIDER"].includes(c.source)),
  "every quality check names who judged it");
check(q.checks.some((c) => c.source === "HUMAN") && q.checks.some((c) => c.source === "AUTOMATED"),
  "human judgment is not attributed to automation");

const qw = await EvidenceVault.assessQuality("EA-16001", [
  { code: "READABLE", label: "File readable", state: "PASS", source: "AUTOMATED" },
  { code: "EXPOSURE", label: "Exposure", state: "WARNING", source: "HUMAN" },
]);
check(qw.qualityState === QUALITY_STATE.PASS_WITH_WARNINGS, "a warning produces PASS_WITH_WARNINGS");

const qf = await EvidenceVault.assessQuality("EA-15001", [
  { code: "CORRUPTION", label: "Corruption", state: "FAIL", source: "AUTOMATED" },
]);
check(qf.qualityState === QUALITY_STATE.FAIL, "a failed check produces FAIL");
check((await EvidenceVault.assessQuality("EA-15002", [])).qualityState === QUALITY_STATE.UNKNOWN,
  "no checks produce UNKNOWN, not PASS");

/* ------------------------------------------------------------- 8. coverage */
section("8. COVERAGE");

const roofMission = { assessmentObjective: "ROOF", focusAreas: [{ area: "Chimney" }] };
check(requiredAreasFor(roofMission).includes("Chimney"),
  "a mission focus area becomes a coverage requirement");
const roofAreas = requiredAreasFor({ assessmentObjective: "ROOF", focusAreas: [] });
const homeAreas = requiredAreasFor({ assessmentObjective: "WHOLE_HOME", focusAreas: [] });
// Compare content, not length — two lists can coincidentally be the same size.
check(JSON.stringify(roofAreas) !== JSON.stringify(homeAreas),
  "coverage requirements differ by mission objective — not one global list");
check(roofAreas.includes("Ridge") && !homeAreas.includes("Ridge"),
  "a roof mission requires roof-specific areas a whole-home mission does not");
check(homeAreas.includes("Site context") && !roofAreas.includes("Site context"),
  "a whole-home mission requires areas a roof mission does not");

const covFull = await EvidenceVault.assessCoverage("CP-012-1",
  ["North roof plane", "South roof plane", "East roof plane", "West roof plane", "Ridge", "Valleys"]);
check(covFull.coverageState === COVERAGE_STATE.COMPLETE, "all required areas captured → COMPLETE");
check(covFull.missingAreas.length === 0, "a complete assessment lists no missing areas");

const covShort = await EvidenceVault.assessCoverage("CP-015-1", ["North elevation", "South elevation"]);
check(covShort.coverageState === COVERAGE_STATE.INCOMPLETE, "missing areas → INCOMPLETE");
check(covShort.missingAreas.length > 0, "missing areas are named explicitly, not hidden behind a percentage");
check(typeof covShort.completionPercent === "number", "a percentage is reported alongside the named gaps");

/* --------------------------------------------------------------- 9. review */
section("9. HUMAN REVIEW");

await EvidenceVault.review("EA-16001", EVIDENCE_REVIEW.APPROVED_WITH_WARNINGS, { reason: "Slight exposure drift." });
check((await EvidenceVault.get("EA-16001")).asset.reviewState === EVIDENCE_REVIEW.APPROVED_WITH_WARNINGS,
  "approve-with-warning is recorded");

const rejectedAsset = (await EvidenceVault.get("EA-16003")).asset;
check(rejectedAsset.reviewState === EVIDENCE_REVIEW.REJECTED, "rejected evidence keeps its state");
check(EvidenceVault.__store.assets.some((a) => a.evidenceId === "EA-16003"),
  "rejected evidence is preserved, never deleted");

const quarantined = (await EvidenceVault.get("EA-16002")).asset;
check(quarantined.reviewState === EVIDENCE_REVIEW.QUARANTINED, "quarantined evidence keeps its state");
check(Boolean(quarantined.quarantineReason), "quarantine records a reason");

const queue = await EvidenceVault.listReviewQueue();
check(queue.quarantined.length >= 1 && queue.rejected.length >= 1 && queue.approved.length >= 1,
  "the review queue separates quarantined, rejected and approved");

/* ---------------------------------------------------------- 10. processing */
section("10. PROCESSING LINEAGE");

const jobs = await EvidenceVault.listJobs("SXP-004182");
const renderJob = jobs.find((j) => j.processorType === "THERMAL_RENDER");
check(renderJob && renderJob.processorVersion, "a processing job records its processor and version");
check(renderJob.inputEvidenceIds.includes("EA-90212") && renderJob.outputEvidenceIds.includes("EA-90260"),
  "a job links its input evidence to its output artifact");

const renderAsset = (await EvidenceVault.get("EA-90260")).asset;
check(renderAsset.parentEvidenceId === "EA-90212", "the rendered thermal names the radiometric source as parent");
check(renderAsset.thermalKind === "RENDERED_THERMAL_IMAGE", "a rendered thermal image is typed as rendered");
check((await EvidenceVault.get("EA-90212")).asset.thermalKind === "RADIOMETRIC_SOURCE",
  "the radiometric source is typed distinctly from the render");
check(renderAsset.thermalKind !== (await EvidenceVault.get("EA-90212")).asset.thermalKind,
  "radiometric source and rendered image are never merged");

const failedJob = (await EvidenceVault.listJobs("SXP-004190")).find((j) => j.status === "FAILED");
check(failedJob && failedJob.failureReason, "a failed processing job preserves its reason");

/* ------------------------------------------------------- 11. cortex handoff */
section("11. CORTEX ELIGIBILITY & MANIFEST");

check(EvidenceVault.eligibilityOf({ reviewState: EVIDENCE_REVIEW.APPROVED }).state === ELIGIBILITY.ELIGIBLE,
  "approved clean evidence is ELIGIBLE");
check(EvidenceVault.eligibilityOf({ reviewState: EVIDENCE_REVIEW.APPROVED_WITH_WARNINGS }).state === ELIGIBILITY.ELIGIBLE_WITH_WARNINGS,
  "approved-with-warnings is ELIGIBLE_WITH_WARNINGS");
check(EvidenceVault.eligibilityOf({ reviewState: EVIDENCE_REVIEW.QUARANTINED }).state === ELIGIBILITY.NOT_ELIGIBLE,
  "quarantined evidence is NOT_ELIGIBLE");
check(EvidenceVault.eligibilityOf({ reviewState: EVIDENCE_REVIEW.REJECTED }).state === ELIGIBILITY.NOT_ELIGIBLE,
  "rejected evidence is NOT_ELIGIBLE");
check(EvidenceVault.eligibilityOf({ reviewState: EVIDENCE_REVIEW.NOT_REVIEWED }).state === ELIGIBILITY.PENDING_REVIEW,
  "unreviewed evidence is PENDING_REVIEW, never eligible by default");
check(EvidenceVault.eligibilityOf({ reviewState: EVIDENCE_REVIEW.APPROVED, hashState: HASH_STATE.MISMATCH }).state === ELIGIBILITY.NOT_ELIGIBLE,
  "a hash mismatch makes evidence ineligible even if approved");

const manifest = await EvidenceVault.buildCortexManifest("CP-012-1");
const all = [...manifest.evidenceIds, ...manifest.derivedArtifactIds];
const assets = await EvidenceVault.listAll();
const byId = Object.fromEntries(assets.map((a) => [a.evidenceId, a]));

check(all.length > 0, "a manifest contains eligible evidence");
check(all.every((id) => byId[id].propertyId === "SXP-004182"), "the manifest contains only one property's evidence");
check(all.every((id) => byId[id].missionId === "M-2026-0827-012"), "the manifest contains only one mission's evidence");
check(all.every((id) => byId[id].capturePackageId === "CP-012-1"), "the manifest contains only one capture package");
check(manifest.evidenceIds.every((id) => byId[id].origin === ARTIFACT_ORIGIN.ORIGINAL),
  "originals and derived artifacts are listed separately");

const badManifest = await EvidenceVault.buildCortexManifest("CP-016-1");
const badAll = [...badManifest.evidenceIds, ...badManifest.derivedArtifactIds];
check(!badAll.includes("EA-16002"), "quarantined evidence never enters a Cortex manifest");
check(!badAll.includes("EA-16003"), "rejected evidence never enters a Cortex manifest");
check(badManifest.excludedIds.includes("EA-16002") && badManifest.excludedIds.includes("EA-16003"),
  "excluded evidence is named, not silently dropped");

/* --------------------------------------------------------- 12. recapture -- */
section("12. RECAPTURE");

const pkgs = await EvidenceVault.listPackagesByMission("M-2026-0829-015");
check(pkgs.length >= 2, "a mission may hold multiple capture packages");
check(pkgs.some((p) => p.attemptNumber === 1) && pkgs.some((p) => p.attemptNumber === 2),
  "attempt numbers increment across packages");

const missionsNow = await MissionService.listAll();
check(missionsNow.filter((m) => m.id === "M-2026-0829-015").length === 1,
  "recapture creates no duplicate mission");
check((await EvidenceVault.listByPackage("CP-015-1")).length > 0,
  "the original capture package's evidence is preserved after recapture");

const newPkg = await EvidenceVault.createCapturePackage("M-2026-0829-015");
check(newPkg.attemptNumber === pkgs.length + 1, "a new package increments the attempt number");
check(newPkg.propertyId === "SXP-004190", "the new package stays on the same property");
check((await EvidenceVault.getPackage("CP-015-1")).pkg.status === "RECAPTURE_REQUIRED",
  "the prior package keeps its own status");

/* ----------------------------------------------------------- 13. isolation */
section("13. PROPERTY & MISSION ISOLATION");

const propertyIds = properties.map((p) => p.stratexPropertyId);
const missionProperty = Object.fromEntries(missionsNow.map((m) => [m.id, m.propertyId]));
const S = EvidenceVault.__store;

check(S.assets.every((a) => propertyIds.includes(a.propertyId)), "every asset belongs to a known property");
check(S.assets.every((a) => missionProperty[a.missionId] === a.propertyId),
  "every asset's property matches its mission's property");
check(S.packages.every((p) => missionProperty[p.missionId] === p.propertyId),
  "every capture package's property matches its mission's property");
check(S.custody.every((c) => propertyIds.includes(c.propertyId)), "every custody event carries a known property");
check(S.quality.every((q) => propertyIds.includes(q.propertyId)), "every quality assessment carries a known property");
check(S.coverage.every((c) => propertyIds.includes(c.propertyId)), "every coverage assessment carries a known property");
check(S.jobs.every((j) => propertyIds.includes(j.propertyId)), "every processing job carries a known property");
check(S.manifests.every((m) => propertyIds.includes(m.propertyId)), "every manifest carries a known property");

for (const pid of propertyIds) {
  const mine = await EvidenceVault.listByProperty(pid);
  if (mine.some((a) => a.propertyId !== pid)) no("property " + pid + " received foreign evidence");
}
ok("listByProperty never returns another property's evidence");

// Cross-mission isolation within one property.
const p182 = await EvidenceVault.listByProperty("SXP-004182");
const m012 = await EvidenceVault.listByMission("M-2026-0827-012");
check(p182.length >= m012.length, "a property may hold evidence from several missions");
check(m012.every((a) => a.missionId === "M-2026-0827-012"),
  "Mission A never receives Mission B's evidence, even on the same property");

/* ------------------------------------------------- 14. truth discipline --- */
section("14. TRUTH DISCIPLINE");

check(byId["EA-90211"].truthClassification === null,
  "an RGB original carries no truth classification — evidence type is not truth class");
check(byId["EA-90280"].truthClassification === "DERIVED",
  "a computed orthomosaic is classified DERIVED");
check(!S.assets.some((a) => a.truthClassification === "MEASURED" && a.origin === ARTIFACT_ORIGIN.ORIGINAL),
  "no original photo has been promoted to MEASURED merely for existing");
check(EvidenceVault.eligibilityOf(byId["EA-16003"]).state === ELIGIBILITY.NOT_ELIGIBLE,
  "rejected evidence cannot flow downstream toward Passport truth");

console.log("\n" + (fail ? `RESULT: ${fail} FAILURE(S), ${pass} passed\n` : `RESULT: ALL ${pass} TESTS PASS\n`));
process.exit(fail ? 1 : 0);
