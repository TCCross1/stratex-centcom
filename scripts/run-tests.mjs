/**
 * Runs every domain test suite and reports a combined result.
 *   npm test
 */
import { spawnSync } from "node:child_process";

const SUITES = [
  ["Mission", "src/domains/mission/mission.test.mjs"],
  ["ATC", "src/domains/atc/atc.test.mjs"],
  ["Evidence Vault", "src/domains/evidence/evidence.test.mjs"],
  ["Property Reality", "src/domains/reality/reality.test.mjs"],
  ["Cortex", "src/domains/cortex/cortex.test.mjs"],
  ["Cortex See", "src/domains/cortex/cortex-see.test.mjs"],
  ["Ops Board / Day Map", "src/domains/ops/ops.test.mjs"],
  ["Passport", "src/domains/passport/passport.test.mjs"],
  ["Property Isolation", "src/domains/isolation.test.mjs"],
  ["Core Packet", "src/domains/reports/packet.test.mjs"],
  ["Report Kit", "src/components/report/packet/report-kit.test.mjs"],
];

let failed = 0;
for (const [name, path] of SUITES) {
  const r = spawnSync("node", [path], { encoding: "utf8" });
  const line = (r.stdout || "").split("\n").find((l) => l.startsWith("RESULT")) || "NO RESULT LINE";
  const ok = r.status === 0;
  if (!ok) failed++;
  console.log((ok ? "  PASS  " : "  FAIL  ") + name.padEnd(20) + line);
  if (!ok) console.log((r.stdout || "").split("\n").filter((l) => l.includes("FAIL")).join("\n"));
}
console.log("\n" + (failed ? failed + " SUITE(S) FAILED" : "ALL SUITES PASS"));
process.exit(failed ? 1 : 0);
