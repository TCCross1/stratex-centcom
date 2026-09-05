/**
 * CORE INTELLIGENCE PACKET — bind + lint
 *
 * AI agents in Core compose the packet from Passport + Core EstimateRevision +
 * Reality projections. CENTCOM previews the same contract. It never invents
 * takeoff, openings, thermal indices, or Austin/Ridgeview identity.
 *
 * Missing values are null here and render as "—" in textFaint. Zero is a
 * measured zero, not a stand-in for "we do not have this."
 */
import { CoreAdapter } from "../core/adapter.js";
import { CoreReportAdapter } from "./service.js";
import { VISIBILITY_AUDIENCE } from "../core/visibility.js";
import { HABITAT_SKIP_PAGES, PACKET_AUDIENCE, PACKET_PAGE, PACKET_TOTAL_PAGES } from "./packet-contract.js";

export { HABITAT_SKIP_PAGES, PACKET_AUDIENCE, PACKET_PAGE, PACKET_TOTAL_PAGES };
export { PACKET_CHROME, PACKET_TITLES } from "./packet-contract.js";

export const MISSING = "—";

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const text = (v) => {
  if (v == null) return null;
  const s = String(v).trim();
  return s && s !== MISSING ? s : null;
};

export function displayCell(value, { unit = null, suffix = "" } = {}) {
  if (value == null || value === "" || value === MISSING) return MISSING;
  if (typeof value === "number" && !Number.isFinite(value)) return MISSING;
  const body = typeof value === "number" ? formatNumber(value) : String(value);
  if (unit) return body + " " + unit;
  return body + suffix;
}

export function formatNumber(n) {
  if (n == null || !Number.isFinite(n)) return MISSING;
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

export function formatMoney(n) {
  if (n == null || !Number.isFinite(n)) return MISSING;
  return "$" + Math.round(n).toLocaleString("en-US");
}

export function formatPct(n) {
  if (n == null || !Number.isFinite(n)) return MISSING;
  const pct = n <= 1 ? n * 100 : n;
  return Math.round(pct) + "/100";
}

/** Twin A roofGeometry feature totals. Twin B never rules area, pitch, or length. */
export function tickerFromTwinA(twinA) {
  const roof = twinA?.roofGeometry || twinA || null;
  if (!roof) return { roofAreaSqFt: null, ridgeLf: null, eaveLf: null, southPitch: null, source: null };
  const sections = roof.sections || [];
  const area = sections.reduce((n, s) => n + (num(s.areaSqFt) || 0), 0) || null;
  const ridge = (roof.ridges || []).reduce((n, r) => n + (num(r.lengthFt) || 0), 0) || null;
  const eave = (roof.eaves || []).reduce((n, r) => n + (num(r.lengthFt) || 0), 0) || null;
  const south = sections.find((s) => /south/i.test(s.label || "")) || sections[0];
  let pitch = null;
  if (south?.pitch) {
    const parsed = parseFloat(String(south.pitch));
    pitch = Number.isFinite(parsed) ? parsed : null;
  }
  return {
    roofAreaSqFt: area,
    ridgeLf: ridge,
    eaveLf: eave,
    southPitch: pitch,
    source: roof.roofGeometryId || null,
  };
}

export function canMountSkeletonC(visibility, estimateRevision) {
  const audience = visibility?.visibilityAudience;
  const entitled = audience === VISIBILITY_AUDIENCE.PRO_ORG || audience === VISIBILITY_AUDIENCE.CENTCOM_ONLY;
  return !!(entitled && estimateRevision);
}

function meas(rows, name) {
  return (rows || []).find((m) => m.name === name) || null;
}

function measVal(rows, name) {
  const row = meas(rows, name);
  return row ? num(row.value) : null;
}

function aweDim(rows, dimension) {
  return (rows || []).find((d) => d.dimension === dimension) || null;
}

function currentOwner(ownership = []) {
  return ownership.find((o) => o.isCurrent) || null;
}

function moistureFinding(findings = []) {
  return findings.find((f) => f.category === "Moisture") || null;
}

function twinLabel(twins = []) {
  const current = twins.find((t) => t.isCurrent || t.status === "current") || twins[0] || null;
  if (!current) return null;
  return current.version || current.versionLabel || current.id || null;
}

function addressOf(property) {
  const idn = property?.identity || {};
  const line1 = text(idn.addressLine1);
  const city = [text(idn.city), text(idn.region)].filter(Boolean).join(", ");
  const postal = text(idn.postalCode);
  return {
    line1,
    cityLine: [city, postal].filter(Boolean).join(" ") || null,
    full: [line1, city, postal].filter(Boolean).join(", ") || null,
  };
}

export function pagesForAudience(audience) {
  const pages = [PACKET_PAGE.OPENINGS_ENERGY, PACKET_PAGE.AWE, PACKET_PAGE.BID_DESK, PACKET_PAGE.TWIN_THERMAL];
  if (audience === PACKET_AUDIENCE.HABITAT)
    return pages.filter((p) => !HABITAT_SKIP_PAGES.includes(p));
  return pages;
}

/**
 * Bind a preview packet. Core estimate/takeoff is attached only when Core is
 * connected AND an EstimateRevision is supplied. Otherwise money is null.
 */
export function bindPacket({
  property,
  passport,
  twinA = null,
  twinBThermal = null,
  measurements = [],
  awe = [],
  findings = [],
  twins = [],
  ownership = [],
  audience = PACKET_AUDIENCE.PRO,
  coreEstimate = null,
  estimateRevision = null,
  visibility = null,
  sourceMode = "PASSPORT",
  session = null,
  operator = null,
  nextScanLabel = null,
  nextScanDetail = null,
  preparedAt = null,
} = {}) {
  const propertyId = property?.stratexPropertyId || passport?.propertyId || null;
  const addr = addressOf(property);
  const ticker = tickerFromTwinA(twinA);
  const roofArea = ticker.roofAreaSqFt ?? measVal(measurements, "Roof area — total");
  const ridge = ticker.ridgeLf ?? measVal(measurements, "Ridge length");
  const pitch = ticker.southPitch ?? measVal(measurements, "Roof pitch — south plane");
  const eave = ticker.eaveLf ?? measVal(measurements, "Eave length — total");
  const floor = measVal(measurements, "Conditioned floor area") ?? num(property?.identity?.squareFeet);
  const saturated = meas(measurements, "Potential saturated area");
  const ambient = meas(measurements, "Ambient temperature at capture");
  const moisture = moistureFinding(findings);
  const air = aweDim(awe, "AIR");
  const water = aweDim(awe, "WATER");
  const energy = aweDim(awe, "ENERGY");
  const revisionInput = estimateRevision || coreEstimate;
  const habitat = audience === PACKET_AUDIENCE.HABITAT;
  const coreLive = !!(CoreAdapter.connected && CoreReportAdapter.connected && revisionInput);
  const mountC = !habitat && canMountSkeletonC(visibility, revisionInput) && coreLive;
  const estimate =
    habitat || !coreLive || !mountC
      ? emptyEstimate(
          habitat
            ? "Habitat packets never include materials or labor desks."
            : revisionInput
              ? "Core report service not connected."
              : "Required processing output does not exist yet."
        )
      : normalizeEstimate(revisionInput);
  const openings = {
    windows: scheduleFromMeasurements(measurements, "WINDOWS"),
    doors: scheduleFromMeasurements(measurements, "DOORS"),
  };
  const revision =
    text(passport?.currentRevisionId) ||
    text(passport?.currentRevision) ||
    text(property?.passportRevision) ||
    null;
  const twin = ticker.source ? (twinA?.versionLabel || twinLabel(twins)) : twinLabel(twins) || text(property?.twinVersion) || null;
  const owner = currentOwner(ownership);
  const reportId =
    sourceMode === "VISUAL_CANON"
      ? "STRX-CANON-LAYOUT"
      : sourceMode === "FIXTURE" && propertyId === "SXP-004182"
        ? "RG-A182-2"
        : propertyId
          ? "STRX-PREVIEW-" + propertyId
          : null;

  const packet = {
    kind: sourceMode === "VISUAL_CANON" ? "VISUAL_CANON_FIXTURE" : "CENTCOM_PACKET_PREVIEW",
    sourceMode,
    coreGenerated: false,
    coreConnected: !!(CoreAdapter.connected && CoreReportAdapter.connected),
    audience,
    visibility,
    reportId,
    totalPages: PACKET_TOTAL_PAGES,
    pages: pagesForAudience(audience),
    identity: {
      propertyId,
      displayId: text(property?.displayId),
      passportId: text(passport?.passportId) || (propertyId ? "PP-" + propertyId : null),
      revision,
      twinVersion: twin,
      addressLine1: addr.line1,
      cityLine: addr.cityLine,
      addressFull: addr.full,
      yearBuilt: num(property?.identity?.yearBuilt),
      parcelId: text(property?.identity?.parcelId),
      propertyType: text(property?.propertyType),
      ownerLabel: text(owner?.displayName),
    },
    preparedBy: text(operator?.name) || text(session?.name) || null,
    preparedAt,
    operator: operator || {
      name: text(session?.name),
      certId: text(session?.station),
      role: text(session?.role),
    },
    passportSyncedAt: text(passport?.latestAcceptedAt) || null,
    nextScanLabel,
    nextScanDetail,
    reviewComplete: false,
    titlePackage: "COMPREHENSIVE PROPERTY INTELLIGENCE",
    classification: "OPERATIONS // CONTROLLED",
    ticker: { roofAreaSqFt: roofArea, ridgeLf: ridge, eaveLf: eave, southPitch: pitch, source: ticker.source },
    measurements: {
      roofAreaSqFt: roofArea,
      ridgeLf: ridge,
      southPitch: pitch,
      eaveLf: eave,
      conditionedSqFt: floor,
      saturatedSqFt: saturated ? num(saturated.value) : null,
      saturatedTruth: saturated?.truthClassification || null,
      ambientF: ambient ? num(ambient.value) : null,
    },
    openings,
    awe: {
      air: bindAwe(air),
      water: bindAwe(water),
      energy: bindAwe(energy),
    },
    thermal: {
      coreMoistureIndex: null,
      twinBLayer: twinBThermal ? "THERMAL" : null,
      cortexFindingId: moisture?.findingId || null,
      cortexConfidence: moisture ? num(moisture.confidence) : null,
      zone: text(moisture?.zone),
      title: text(moisture?.title),
      detail: text(moisture?.detail),
      truthClassification: moisture?.truthClassification || null,
    },
    estimate,
    lint: [],
  };

  packet.lint = lintPacket(packet);
  return packet;
}

function bindAwe(row) {
  if (!row) {
    return {
      dimension: null,
      status: "Not Observed",
      score: null,
      scoreIsFixture: true,
      summary: null,
      truthClassification: null,
    };
  }
  return {
    dimension: row.dimension,
    status: row.status || "Not Observed",
    score: num(row.score),
    scoreIsFixture: row.scoreIsFixture !== false,
    summary: text(row.summary),
    truthClassification: row.truthClassification || null,
    changeFromPrior: text(row.changeFromPrior),
  };
}

function scheduleFromMeasurements(rows, category) {
  return (rows || [])
    .filter((m) => m.category === category)
    .map((m) => ({
      id: m.measurementId,
      name: m.name,
      value: num(m.value),
      unit: m.unit || null,
      zone: m.zone || null,
      truthClassification: m.truthClassification || null,
    }));
}

function emptyEstimate(reason = "Core estimate service not connected.") {
  return {
    available: false,
    reason,
    materials: null,
    labor: null,
    tax: null,
    total: null,
    lines: [],
  };
}

function normalizeEstimate(rev) {
  const lines = Array.isArray(rev.lines) ? rev.lines : [];
  const materials = num(rev.materials);
  const labor = num(rev.labor);
  const tax = num(rev.tax);
  const total = num(rev.total);
  return { available: true, reason: null, materials, labor, tax, total, lines };
}

export function lintPacket(packet) {
  const issues = [];
  const id = packet?.identity || {};
  if (!id.addressLine1) issues.push({ code: "ADDRESS_MISSING", field: "identity.addressLine1" });
  if (!id.propertyId) issues.push({ code: "PROPERTY_ID_MISSING", field: "identity.propertyId" });
  if (!packet?.reportId) issues.push({ code: "REPORT_ID_MISSING", field: "reportId" });

  if (packet?.audience === PACKET_AUDIENCE.HABITAT) {
    const forbidden = (packet.pages || []).filter((p) => HABITAT_SKIP_PAGES.includes(p));
    if (forbidden.length)
      issues.push({ code: "HABITAT_TAKEOFF_LEAK", field: "pages", detail: forbidden.join(",") });
    if (packet.estimate?.available)
      issues.push({ code: "HABITAT_ESTIMATE_LEAK", field: "estimate" });
  }

  if (packet?.estimate?.available) {
    const lines = packet.estimate.lines || [];
    if (lines.length) {
      const sum = lines.reduce((n, line) => n + (num(line.amount) || 0), 0);
      if (packet.estimate.total != null && Math.abs(sum - packet.estimate.total) > 0.5)
        issues.push({ code: "TOTALS_MISMATCH", field: "estimate.total", detail: sum + " vs " + packet.estimate.total });
    }
  }

  const moneyFields = ["materials", "labor", "tax", "total"];
  if (!packet?.estimate?.available) {
    for (const key of moneyFields) {
      if (packet?.estimate?.[key] === 0)
        issues.push({ code: "MISSING_AS_ZERO", field: "estimate." + key });
    }
  }

  if (packet?.thermal?.coreMoistureIndex === 0)
    issues.push({ code: "MISSING_AS_ZERO", field: "thermal.coreMoistureIndex" });

  const ticker = packet?.ticker || packet?.measurements || {};
  if (ticker.planarSqFt != null && ticker.surfaceSqFt != null && ticker.planarSqFt === ticker.surfaceSqFt)
    issues.push({ code: "PLANAR_SURFACE_SWAP", field: "ticker" });

  if (packet?.sourceMode === "VISUAL_CANON" && packet?.identity?.propertyId === "SXP-004182")
    issues.push({ code: "FIXTURE_BLEND", field: "sourceMode", detail: "visual canon must not bind SXP-004182" });

  return issues;
}

export function bindPacketFromDomains(bundle, opts = {}) {
  return bindPacket({ ...bundle, ...opts });
}

export default { bindPacket, lintPacket, displayCell, formatMoney, formatPct, pagesForAudience };
