process.env.STRATEX_QUALIFICATION_PERSIST = "1";

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import RealityEngine from "../src/domains/reality/service.js";

const rawArgs = process.argv.slice(2);
const args = {};
for (let i = 0; i < rawArgs.length; i += 1) {
  const arg = rawArgs[i];
  if (!arg.startsWith("--")) continue;
  const eqIndex = arg.indexOf("=");
  if (eqIndex >= 0) {
    const key = arg.slice(2, eqIndex);
    const value = arg.slice(eqIndex + 1);
    args[key] = value;
  } else {
    const key = arg.slice(2);
    const value = rawArgs[i + 1] && !rawArgs[i + 1].startsWith("--") ? rawArgs[i + 1] : "";
    args[key] = value;
    if (value !== "") i += 1;
  }
}

const datasetRoot = args.dataset || args.d;
const propertyId = args.property || args.p;
const missionId = args.mission || args.m;
const name = args.name || "JOB-1-M4E-QUALIFICATION";
const source = args.source || "PUBLIC_QUALIFICATION_DATASET";
const license = args.license || "UNKNOWN";
const aircraft = args.aircraft || "DJI MATRICE 4E";

if (!datasetRoot || !propertyId || !missionId) {
  console.error("Usage: npm run reality:ingest -- --dataset \"/path/to/source-folder\" --property \"SXP-...\" --mission \"M-...\" [--name \"JOB-1-M4E-QUALIFICATION\"] [--source \"PUBLIC_QUALIFICATION_DATASET\"] [--license \"...\"] [--aircraft \"DJI MATRICE 4E\"]");
  process.exit(1);
}

try {
  const dataset = await RealityEngine.prepareQualificationDataset({
    propertyId,
    missionId,
    sourceRoot: datasetRoot,
    sourceType: source,
    actor: "operator:cli",
  });

  const result = await RealityEngine.registerSourceFilesForDataset({
    propertyId,
    missionId,
    sourceRoot: datasetRoot,
    sourceType: source,
    datasetId: dataset.datasetId,
    actor: "operator:cli",
    datasetName: name,
    license,
  });

  const job = await RealityEngine.queueJob({
    propertyId,
    missionId,
    datasetId: dataset.datasetId,
    twinType: "TWIN_TYPE_A",
    processorType: "MESH_GENERATION",
    inputEvidenceIds: result.sourceFiles.map((f) => f.evidenceId),
    manifestId: null,
  }, { actor: "operator:cli" });

  console.log("DATASET ID: " + dataset.datasetId);
  console.log("PROPERTY: " + propertyId);
  console.log("MISSION: " + missionId);
  console.log("SOURCE FILE COUNT: " + dataset.sourceFiles.length);
  console.log("FILES REGISTERED: " + result.filesRegistered);
  console.log("DUPLICATES: " + result.duplicates.length);
  console.log("FILES FAILED: " + result.failed.length);
  console.log("TOTAL BYTES: " + result.sourceFiles.reduce((sum, file) => sum + (file.byteSize || 0), 0));
  console.log("HASH STATUS: " + result.hashStatus);
  console.log("CAMERA MODEL: " + (result.sourceFiles[0]?.metadata?.cameraModel || "UNKNOWN"));
  console.log("RTK STATE: " + (result.sourceFiles[0]?.metadata?.rtkState || "NOT_AVAILABLE"));
  console.log("CRS STATE: " + (result.sourceFiles[0]?.metadata?.crsState || "NOT_AVAILABLE"));
  console.log("REALITY JOB ID: " + job.jobId);
  console.log("NEXT ACTION: " + (result.failed.length ? "REVIEW FAILED FILES" : "RUN IMPORTED ASSET QA"));
  console.log("AIRCRAFT: " + aircraft);
  console.log("SOURCE: " + source);
  console.log("LICENSE: " + license);
  process.exit(0);
} catch (error) {
  console.error("REALITY INGEST FAILED");
  console.error(error.message);
  process.exit(1);
}
