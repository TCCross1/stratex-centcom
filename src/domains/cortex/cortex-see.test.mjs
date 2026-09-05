import assert from "node:assert/strict";
import { CortexService, FINDING_TREATMENT } from "./service.js";
import EvidenceService from "../evidence/service.js";
import PassportService from "../passport/service.js";
import { evidenceAssets } from "../evidence/fixtures.js";

const evidence = evidenceAssets.find((a) => a.missionId === "M-2026-0827-012") || evidenceAssets[0];

const baseDraft = {
  missionId: evidence.missionId,
  propertyId: evidence.propertyId,
  evidenceAssetId: evidence.evidenceId,
  bbox: { x: 12, y: 18, width: 80, height: 90 },
  crop: { x: 0, y: 0, width: 100, height: 100 },
  label: "MOISTURE",
  whatISee: "Thermal anomaly showing retained moisture in the roof deck.",
  likelyCause: "Moisture trapped beneath the roof membrane.",
  treatment: null,
};

const run = async () => {
  await assert.rejects(
    () => CortexService.createSeeFinding({ ...baseDraft, treatment: null }),
    /treatment/i,
    "cannot save without treatment"
  );

  const tear = await CortexService.createSeeFinding({
    ...baseDraft,
    treatment: FINDING_TREATMENT.TEAR_OFF_REPLACE,
    repairDetail: "",
    userMaterialNotes: "Use same deck profile on repair.",
  });
  assert.equal(tear.treatment, FINDING_TREATMENT.TEAR_OFF_REPLACE, "tear-off/replace saves without repairDetail");

  const overlay = await CortexService.createSeeFinding({
    ...baseDraft,
    treatment: FINDING_TREATMENT.OVERLAY,
    repairDetail: "redundant detail",
    userMaterialNotes: "Overlay acceptable with same insulation system.",
  });
  assert.equal(overlay.treatment, FINDING_TREATMENT.OVERLAY, "overlay saves without repairDetail requirement");

  await assert.rejects(
    () => CortexService.createSeeFinding({
      ...baseDraft,
      treatment: FINDING_TREATMENT.REPAIR,
      repairDetail: "",
      userMaterialNotes: "Use fresh decking and underlayment.",
    }),
    /repairDetail/i,
    "repair without repairDetail fails"
  );

  const before = await EvidenceService.get(evidence.evidenceId);
  const saved = await CortexService.createSeeFinding({
    ...baseDraft,
    treatment: FINDING_TREATMENT.REPAIR,
    repairDetail: "Replace wet decking and verify underlayment moisture content.",
    userMaterialNotes: "Match the deck profile and seal all penetrations.",
  });
  const after = await EvidenceService.get(evidence.evidenceId);
  assert.deepEqual(after, before, "save does not mutate the evidence asset");
  assert.equal(saved.passportVersionId, null, "finding is not a Passport field until Cortex commits a version");
  assert.equal(saved.committedToPassport, false, "save still does not set committedToPassport");

  const hashBefore = after.sha256;
  const committed = await CortexService.commitSeeToPassport(saved.findingId);
  assert.ok(committed.version?.revisionId, "commit creates a Passport version");
  assert.equal(committed.version.sourceType, "cortex-see");
  assert.equal(committed.findings.every((f) => f.committedToPassport), true, "commit sets committedToPassport");
  assert.ok(committed.findings.every((f) => f.passportVersionId === committed.version.revisionId));
  const hashAfter = (await EvidenceService.get(evidence.evidenceId)).sha256;
  assert.equal(hashAfter, hashBefore, "evidence hash unchanged");

  const passport = await PassportService.getByProperty(evidence.propertyId);
  assert.equal(passport.currentRevisionId, committed.version.revisionId);
  const treatments = new Set((passport.seeFindings || []).map((f) => f.treatment));
  assert.ok(treatments.has(FINDING_TREATMENT.TEAR_OFF_REPLACE), "tear-off survives into the version");
  assert.ok(treatments.has(FINDING_TREATMENT.OVERLAY), "overlay survives into the version");
  assert.ok(treatments.has(FINDING_TREATMENT.REPAIR), "repair survives into the version");
  const blob = JSON.stringify(committed.version.content);
  assert.equal(/dollars|hours|price|cost|estimate/i.test(blob), false, "commit does not write dollars or hours");

  console.log("RESULT: ALL CORTEX SEE TESTS PASS");
};

run().catch((err) => {
  console.error(err);
  console.log("RESULT: CORTEX SEE TESTS FAILED");
  process.exit(1);
});
