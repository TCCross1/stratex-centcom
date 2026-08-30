/**
 * PROPERTY ISOLATION + RELATIONSHIP INTEGRITY TESTS
 *
 * The invariant this protects: Property A can never see Property B's data, and
 * no record may point at an object belonging to a different property.
 *
 * Run:  node src/domains/isolation.test.mjs
 */
import { properties, twins, ownership } from "./property/fixtures.js";
import { evidenceAssets, evidencePackages } from "./evidence/fixtures.js";
import { findings, analyses, predictions, goldCandidates } from "./cortex/fixtures.js";
import { measurements } from "./measurements/fixtures.js";
import { aweByProperty } from "./awe/fixtures.js";
import { projects, repairs, maintenance, documents } from "./work/fixtures.js";
import { missions } from "./mission/fixtures.js";
import { grants } from "./sharing/fixtures.js";
import { auditEvents } from "./audit/fixtures.js";

let failures = 0;
const fail = (msg) => { console.log("  FAIL " + msg); failures++; };
const ok = (msg) => console.log("  ok   " + msg);

const propertyIds = properties.map((p) => p.stratexPropertyId);
const missionById = Object.fromEntries(missions.map((m) => [m.id, m]));
const evidenceById = Object.fromEntries(evidenceAssets.map((e) => [e.evidenceId, e]));
const analysisById = Object.fromEntries(analyses.map((a) => [a.analysisId, a]));
const projectById = Object.fromEntries(projects.map((p) => [p.projectId, p]));
const twinById = Object.fromEntries(twins.map((t) => [t.id, t]));

console.log("\n=== 1. PROPERTY SCOPING — no orphans, no bleed ===");
const scoped = {
  twins, evidenceAssets, evidencePackages, findings, analyses, predictions,
  goldCandidates, measurements, projects, repairs, maintenance, documents,
  missions, grants, auditEvents, ownership,
};
for (const [name, rows] of Object.entries(scoped)) {
  const orphans = rows.filter((r) => !propertyIds.includes(r.propertyId));
  if (orphans.length) fail(`${name}: ${orphans.length} row(s) with unknown propertyId`);
  else ok(`${name.padEnd(18)} ${String(rows.length).padStart(3)} rows, every one scoped to a known property`);
}
for (const key of Object.keys(aweByProperty)) {
  if (!propertyIds.includes(key)) fail(`aweByProperty: unknown property ${key}`);
}
ok("aweByProperty     keyed only by known properties");

console.log("\n=== 2. CROSS-PROPERTY LEAK CHECK ===");
for (const pid of propertyIds) {
  for (const [name, rows] of Object.entries(scoped)) {
    const mine = rows.filter((r) => r.propertyId === pid);
    if (mine.some((r) => r.propertyId !== pid)) fail(`${name} leaked into ${pid}`);
  }
}
ok(`no dataset bleeds across any of the ${propertyIds.length} properties`);

console.log("\n=== 3. RELATIONSHIP INTEGRITY ===");
const sameProperty = (label, rows, refField, lookup, refName) => {
  let bad = 0;
  for (const r of rows) {
    const refs = Array.isArray(r[refField]) ? r[refField] : [r[refField]];
    for (const ref of refs.filter(Boolean)) {
      const target = lookup[ref];
      if (!target) { fail(`${label}: ${refName} "${ref}" does not exist`); bad++; continue; }
      if (target.propertyId !== r.propertyId) {
        fail(`${label}: ${refName} "${ref}" belongs to ${target.propertyId}, not ${r.propertyId}`); bad++;
      }
    }
  }
  if (!bad) ok(`${label} — every ${refName} resolves to the same property`);
};

sameProperty("Measurement → Mission", measurements, "missionId", missionById, "mission");
sameProperty("Measurement → Evidence", measurements, "sourceEvidenceIds", evidenceById, "evidence");
sameProperty("Measurement → Twin", measurements.filter((m) => m.sourceTwinVersionId), "sourceTwinVersionId", twinById, "twin");
sameProperty("Finding → Evidence", findings, "sourceEvidenceIds", evidenceById, "evidence");
sameProperty("Finding → Analysis", findings, "cortexAnalysisId", analysisById, "analysis");
sameProperty("Finding → Mission", findings, "missionId", missionById, "mission");
sameProperty("Evidence → Mission", evidenceAssets, "missionId", missionById, "mission");
sameProperty("Analysis → Mission", analyses, "missionId", missionById, "mission");
sameProperty("Twin → Source Mission", twins.filter((t) => missionById[t.sourceMissionId]), "sourceMissionId", missionById, "mission");
sameProperty("Repair → Project", repairs, "projectId", projectById, "project");
sameProperty("Repair → Evidence", repairs, "completionEvidenceIds", evidenceById, "evidence");
sameProperty("Project → Findings", projects, "relatedFindingIds", Object.fromEntries(findings.map((f) => [f.findingId, f])), "finding");
sameProperty("Maintenance → Finding", maintenance.filter((m) => m.sourceFindingId), "sourceFindingId", Object.fromEntries(findings.map((f) => [f.findingId, f])), "finding");
sameProperty("Document → Project", documents.filter((d) => d.relatedProjectId), "relatedProjectId", projectById, "project");
sameProperty("Gold → Finding", goldCandidates, "linkedFindingId", Object.fromEntries(findings.map((f) => [f.findingId, f])), "finding");
sameProperty("Prediction → Finding", predictions.filter((p) => findings.some((f) => f.findingId === p.findingId)), "findingId", Object.fromEntries(findings.map((f) => [f.findingId, f])), "finding");

console.log("\n=== 4. TRUTH DISCIPLINE ===");
const badConfidence = [...findings, ...measurements].filter(
  (r) => r.truthClassification !== "PROBABLE" && r.confidence != null
);
if (badConfidence.length) fail(`${badConfidence.length} non-probable record(s) carry a confidence score`);
else ok("no MEASURED or DERIVED record carries a confidence score");

const probableNoConfidence = [...findings, ...measurements].filter(
  (r) => r.truthClassification === "PROBABLE" && r.confidence == null
);
if (probableNoConfidence.length) fail(`${probableNoConfidence.length} probable record(s) missing confidence`);
else ok("every PROBABLE record states its confidence");

console.log(failures ? `\nRESULT: ${failures} FAILURE(S)\n` : "\nRESULT: ALL TESTS PASS\n");
process.exit(failures ? 1 : 0);
