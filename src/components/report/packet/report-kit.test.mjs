/**
 * Report kit — Twin A ticker, fixture isolation, lint defects, chrome copy.
 * Run: node src/components/report/packet/report-kit.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { properties } from "../../../domains/property/fixtures.js";
import { passportRecord } from "../../../domains/passport/fixtures.js";
import { measurements } from "../../../domains/measurements/fixtures.js";
import { aweByProperty } from "../../../domains/awe/fixtures.js";
import { findings } from "../../../domains/cortex/fixtures.js";
import { twins, ownership } from "../../../domains/property/fixtures.js";
import { roofGeometries } from "../../../domains/reality/fixtures.js";
import { bindPacket, lintPacket, tickerFromTwinA, PACKET_AUDIENCE, PACKET_CHROME } from "../../../domains/reports/packet.js";
import { HABITAT_SKIP_PAGES } from "../../../domains/reports/packet-contract.js";
import { previewPages } from "./pageSequence.js";

let failed = 0;
const check = (cond, msg) => {
  try {
    assert.ok(cond, msg);
    console.log("  ok   " + msg);
  } catch (e) {
    failed++;
    console.log("  FAIL " + msg + " :: " + (e.message || e));
  }
};

const house = properties.find((p) => p.stratexPropertyId === "SXP-004182");
const twinA = roofGeometries.find((r) => r.roofGeometryId === "RG-A182-2");
const ticker = tickerFromTwinA(twinA);

console.log("\n=== TWIN A RG-A182-2 ===");
check(ticker.roofAreaSqFt === 2856, "Twin A area 1424+1432=2856");
check(ticker.ridgeLf === 86, "Twin A ridge 86");
check(ticker.eaveLf === 168, "Twin A eave 168");
check(ticker.southPitch === 6.5, "south pitch 6.5");
check(ticker.source === "RG-A182-2", "ticker source RG-A182-2");

const packet = bindPacket({
  property: house,
  passport: passportRecord,
  twinA,
  measurements: measurements.filter((m) => m.propertyId === "SXP-004182"),
  awe: aweByProperty["SXP-004182"],
  findings: findings.filter((f) => f.propertyId === "SXP-004182"),
  twins: twins.filter((t) => t.propertyId === "SXP-004182"),
  ownership: ownership.filter((o) => o.propertyId === "SXP-004182"),
  audience: PACKET_AUDIENCE.PRO,
  sourceMode: "FIXTURE",
});

console.log("\n=== FIXTURE SXP-004182 ===");
check(packet.identity.addressLine1 === "1234 Bridlewood Way", "Bridlewood");
check(packet.identity.propertyId === "SXP-004182", "property id");
check(packet.reportId === "RG-A182-2", "fixture report id");
check(packet.measurements.roofAreaSqFt === 2856, "bound roof area");
check(packet.coreGenerated === false, "not a Core PDF");
check(packet.coreConnected === false, "Core report adapter disconnected");
check(packet.estimate.available === false, "no invented takeoff");
check(packet.estimate.total === null, "money is null not 0");
check(packet.thermal.coreMoistureIndex === null, "no Core moisture index");

const habitat = bindPacket({
  property: house,
  passport: passportRecord,
  twinA,
  audience: PACKET_AUDIENCE.HABITAT,
  sourceMode: "FIXTURE",
  coreEstimate: { total: 13880, materials: 6450, labor: 7130, tax: 300, lines: [] },
});
check(!habitat.pages.includes(4), "habitat skips bid desk");
check(habitat.estimate.available === false, "habitat never mounts Skeleton C");
check(previewPages(PACKET_AUDIENCE.HABITAT).every((p) => !HABITAT_SKIP_PAGES.includes(p)), "preview walk skips habitat pages");

console.log("\n=== LINT ===");
const totals = lintPacket({
  identity: { addressLine1: "x", propertyId: "SXP-1" },
  reportId: "R",
  audience: PACKET_AUDIENCE.PRO,
  estimate: { available: true, total: 13880, lines: [{ amount: 6450 }, { amount: 7130 }] },
});
check(totals.some((i) => i.code === "TOTALS_MISMATCH"), "$13880 vs $13580 is a defect");

const blend = lintPacket({
  identity: { addressLine1: "1234 Bridlewood Way", propertyId: "SXP-004182" },
  reportId: "STRX-CANON-LAYOUT",
  sourceMode: "VISUAL_CANON",
  estimate: { available: false, total: null },
});
check(blend.some((i) => i.code === "FIXTURE_BLEND"), "visual canon must not bind SXP-004182");

const sxpFixture = JSON.parse(readFileSync(new URL("./fixture-sxp-004182.json", import.meta.url), "utf8"));
const canon = JSON.parse(readFileSync(new URL("./fixture-visual-canon.json", import.meta.url), "utf8"));
check(sxpFixture.propertyId === "SXP-004182", "sxp fixture id");
check(canon.propertyId == null, "canon fixture has no SXP id");
check(canon.identity.propertyId !== "SXP-004182", "canon identity not Bridlewood");
check(canon.banner.includes("NOT PROPERTY TRUTH"), "canon banner");

console.log("\n=== CHROME COPY ===");
check(PACKET_CHROME.productLeft === "STRATEX", "product left");
check(PACKET_CHROME.productRight === "CORE", "product right");
check(PACKET_CHROME.tagline === "EVIDENCE. INSIGHT. ACTION.", "tagline");
check(PACKET_CHROME.chambers.map((c) => c.key).join(",") === "CUSTODY,PASSPORT,AI,NEXT,PREPARED", "chambers");

const footer = readFileSync(new URL("../chrome/ReportFooterStamps.jsx", import.meta.url), "utf8");
check(footer.includes("OperatorSeal"), "footer uses C-23 seal");
check(footer.includes("CUSTODY"), "footer custody chamber");

const skelC = readFileSync(new URL("../skeletons/SkeletonC.jsx", import.meta.url), "utf8");
check(skelC.includes("HABITAT"), "Skeleton C habitat guard");

console.log("\nRESULT " + (failed ? failed + " FAIL" : "PASS"));
process.exit(failed ? 1 : 0);
