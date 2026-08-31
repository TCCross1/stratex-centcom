process.env.STRATEX_QUALIFICATION_PERSIST = "1";

import fs from "node:fs/promises";
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

const jobId = args.job || args.j;
const artifactDir = args["artifact-dir"] || args.artifactDir || args.a;
const provider = args.provider || "DJI_TERRA_IMPORT";
const processorVersion = args["processor-version"] || args.processorVersion || "local-import-1.0";
const artifactType = args["artifact-type"] || args.artifactType || null;
const propertyId = args.property || null;
const missionId = args.mission || null;
const datasetId = args.dataset || null;
const crs = args.crs || "UNKNOWN";

if (!jobId || !artifactDir) {
  console.error("Usage: npm run reality:import -- --job \"<realityJobId>\" --artifact-dir \"/path/to/reconstruction-output\" [--property \"SXP-...\"] [--mission \"M-...\"] [--dataset \"<datasetId>\"] [--provider \"DJI_TERRA_IMPORT\"] [--artifact-type \"MESH\"] [--processor-version \"local-import-1.0\"] [--crs \"UNKNOWN\"]");
  process.exit(1);
}

try {
  const result = await RealityEngine.importLocalArtifact({
    jobId,
    propertyId: propertyId || undefined,
    missionId: missionId || undefined,
    datasetId: datasetId || undefined,
    artifactDir,
    artifactType: artifactType || undefined,
    provider,
    processorVersion,
    actor: "operator:cli",
    crs,
  });

  console.log("JOB ID: " + result.jobId);
  console.log("PROPERTY: " + result.propertyId);
  console.log("MISSION: " + (result.missionId || "UNKNOWN"));
  console.log("DATASET: " + (result.datasetId || "UNKNOWN"));
  console.log("CREATED ARTIFACTS: " + result.createdArtifacts.length);
  console.log("VALIDATION STATE: " + result.validationState);
  console.log("PROVIDER: " + result.provider);
  console.log("MODE: " + result.providerMode);
  console.log("PROCESSOR VERSION: " + result.processorVersion);
  console.log("CRS: " + result.crs);
  process.exit(0);
} catch (error) {
  console.error("REALITY IMPORT FAILED");
  console.error(error.message);
  process.exit(1);
}
