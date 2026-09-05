/**
 * Core intelligence packet — chrome copy, Habitat exclusion, missing cells, totals lint.
 * Run: node src/domains/reports/packet.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { properties } from "../property/fixtures.js";
import { passportRecord } from "../passport/fixtures.js";
import { measurements } from "../measurements/fixtures.js";
import { aweByProperty } from "../awe/fixtures.js";
import { findings } from "../cortex/fixtures.js";
import { twins, ownership } from "../property/fixtures.js";
import {
  bindPacket,
  displayCell,
  formatMoney,
  lintPacket,
  pagesForAudience,
  MISSING,
} from "./packet.js";
import { HABITAT_SKIP_PAGES, PACKET_AUDIENCE, PACKET_CHROME, PACKET_TITLES } from "./packet-contract.js";

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
const packet = bindPacket({
  property: house,
  passport: passportRecord,
  measurements: measurements.filter((m) => m.propertyId === "SXP-004182"),
  awe: aweByProperty["SXP-004182"],
  findings: findings.filter((f) => f.propertyId === "SXP-004182"),
  twins: twins.filter((t) => t.propertyId === "SXP-004182"),
  ownership: ownership.filter((o) => o.propertyId === "SXP-004182"),
  audience: PACKET_AUDIENCE.PRO,
});

console.log("\n=== 1. CHROME COPY ===");
check(PACKET_CHROME.product === "STRATEX CORE", "product lock");
check(PACKET_CHROME.tagline === "EVIDENCE. INSIGHT. ACTION.", "tagline lock");
check(PACKET_CHROME.chambers.map((c) => c.key).join(",") === "CUSTODY,PASSPORT,AI,NEXT,PREPARED", "five chambers");
check(PACKET_TITLES[2] && PACKET_TITLES[5], "page titles 2 and 5 exist");

console.log("\n=== 2. LEXINGTON IDENTITY — never Austin ===");
check(packet.identity.addressLine1 === "1234 Bridlewood Way", "Bridlewood address");
check(packet.identity.addressFull.includes("Lexington"), "Lexington city");
check(!String(packet.identity.addressFull).includes("Ridgeview"), "not Ridgeview");
check(!String(packet.identity.addressFull).includes("Austin"), "not Austin");
check(packet.identity.propertyId === "SXP-004182", "property id");
check(packet.reportId === "STRX-PREVIEW-SXP-004182", "preview report id");
check(packet.coreGenerated === false, "preview is not a Core PDF");

console.log("\n=== 3. MISSING CELLS ARE EM DASH, NEVER ZERO ===");
check(packet.estimate.available === false, "Core estimate disconnected");
check(packet.estimate.total === null, "total is null not 0");
check(packet.estimate.materials === null, "materials null");
check(packet.thermal.coreMoistureIndex === null, "no invented Core moisture index");
check(displayCell(null) === MISSING, "displayCell null");
check(formatMoney(null) === MISSING, "formatMoney null");
check(packet.openings.windows.length === 0, "no fabricated window schedule");
check(packet.openings.doors.length === 0, "no fabricated door schedule");
check(packet.measurements.roofAreaSqFt === 2856, "roof area from measurements");
check(packet.measurements.southPitch === 6.5, "south pitch from measurements");

console.log("\n=== 4. HABITAT NEVER GETS TAKEOFF ===");
const habitatPages = pagesForAudience(PACKET_AUDIENCE.HABITAT);
check(!habitatPages.includes(4), "habitat skips page 4");
check(HABITAT_SKIP_PAGES.includes(4) && HABITAT_SKIP_PAGES.includes(21) && HABITAT_SKIP_PAGES.includes(22), "skip 4/21/22");
const habitat = bindPacket({
  property: house,
  passport: passportRecord,
  measurements: [],
  awe: [],
  findings: [],
  twins: [],
  ownership: [],
  audience: PACKET_AUDIENCE.HABITAT,
  coreEstimate: { total: 13880, materials: 6450, labor: 7130, tax: 300, lines: [] },
});
check(habitat.estimate.available === false, "habitat does not attach Core money even if a revision is passed while Core is down");
check(!habitat.pages.includes(4), "habitat page list omits bid desk");
const leak = lintPacket({
  ...habitat,
  pages: [2, 3, 4, 5],
  estimate: { available: true, total: 1, lines: [] },
});
check(leak.some((i) => i.code === "HABITAT_TAKEOFF_LEAK"), "linter flags habitat takeoff leak");

console.log("\n=== 5. TOTALS LINT ===");
const bad = lintPacket({
  identity: { addressLine1: "x", propertyId: "SXP-1" },
  reportId: "R",
  audience: PACKET_AUDIENCE.PRO,
  pages: [4],
  estimate: {
    available: true,
    total: 13880,
    lines: [{ amount: 6450 }, { amount: 7130 }],
  },
  thermal: { coreMoistureIndex: null },
});
check(bad.some((i) => i.code === "TOTALS_MISMATCH"), "canon $13,880 vs line sum is a defect");

const zero = lintPacket({
  identity: { addressLine1: "x", propertyId: "SXP-1" },
  reportId: "R",
  audience: PACKET_AUDIENCE.PRO,
  estimate: { available: false, total: 0, materials: 0, labor: 0, tax: 0, lines: [] },
  thermal: { coreMoistureIndex: 0 },
});
check(zero.some((i) => i.code === "MISSING_AS_ZERO"), "0 is not an allowed stand-in for missing money");

console.log("\n=== 6. RENDERERS USE TOKENS / CHROME ===");
const header = readFileSync(new URL("../../components/report/chrome/ReportHeader.jsx", import.meta.url), "utf8");
check(header.includes("PACKET_CHROME.productLeft"), "header uses locked product left");
check(header.includes("PACKET_CHROME.tagline"), "header uses locked tagline");
check(header.includes("BRAND.centcom"), "header uses official centcom logo");
check(!/#1E6BFF/.test(header), "header jsx does not hard-roll brand blue hex");

const shell = readFileSync(new URL("../../components/report/chrome/ReportPageShell.jsx", import.meta.url), "utf8");
check(shell.includes("RT.artboardW"), "artboard width from tokens");
check(shell.includes("sx-packet-page"), "print artboard class");

const bid = readFileSync(new URL("../../components/report/pages/Page04Estimate.jsx", import.meta.url), "utf8");
check(bid.includes("Habitat packets never include"), "bid desk habitat plate");

console.log("\nRESULT " + (failed ? failed + " FAIL" : "PASS"));
process.exit(failed ? 1 : 0);
