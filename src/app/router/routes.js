/**
 * ROUTE MAP — the single source of truth for CENTCOM navigation.
 *
 * No component builds a route string by hand. Every link goes through the
 * helpers below, so a URL scheme change happens in one file.
 */

export const ROUTES = {
  dashboard: "/centcom",
  live: "/live",
  missions: "/missions",
  missionCreate: (propertyId) => "/missions/new" + (propertyId ? "?property=" + propertyId : ""),
  mission: (id, tab) => "/missions/" + id + (tab ? "/" + tab : ""),
  properties: "/properties",
  property: (id, tab) => "/properties/" + id + (tab ? "/" + tab : ""),
  reality: "/reality",
  realityProperty: (propertyId, twinType, tab) =>
    "/reality/" + propertyId + "/" + (twinType || "TWIN_TYPE_A") + (tab ? "/" + tab : ""),
  atc: "/atc",
  atcMission: (id, tab) => "/atc/missions/" + id + (tab ? "/" + tab : ""),
  evidence: "/evidence",
  evidenceReview: "/evidence/review",
  capturePackage: (id) => "/captures/" + id,
  evidenceAsset: (id) => "/evidence/" + id,
  cortex: "/cortex",
  cortexAnalysis: (id) => "/cortex/" + id,
  findings: "/findings",
  finding: (id) => "/findings/" + id,
  passport: "/passport",
  passportDetail: (passportId, tab) => "/passport/" + passportId + (tab ? "/" + tab : ""),
  passportRevision: (passportId, revisionId) => "/passport/" + passportId + "/revisions/" + revisionId,
  passportIngestion: (passportId, ingestionId) => "/passport/" + passportId + "/ingestions/" + ingestionId,
  passportConflict: (passportId, conflictId) => "/passport/" + passportId + "/conflicts/" + conflictId,
  passportProjection: (passportId, projectionType) => "/passport/" + passportId + "/projections/" + projectionType,
  core: "/core",
  pro: "/pro",
  habitat: "/habitat",
  reports: "/reports",
  operations: "/operations",
  systems: "/systems",
  admin: "/admin",
};

/**
 * Primary command navigation. `sub` is the operator-facing description of what
 * the module is for — not a restatement of its name.
 */
export const NAV = [
  { key: "centcom", label: "CENTCOM", sub: "Overview", route: ROUTES.dashboard, glyph: "target" },
  { key: "live", label: "Live Operations", sub: "Air Traffic Control", route: ROUTES.live, glyph: "target" },
  { key: "missions", label: "Missions", sub: "15-Stage Workflow", route: ROUTES.missions, glyph: "grid" },
  { key: "properties", label: "Properties", sub: "Intelligence Database", route: ROUTES.properties, glyph: "home" },
  { key: "atc", label: "ATC", sub: "Readiness & Telemetry", route: ROUTES.atc, glyph: "signal" },
  { key: "evidence", label: "Evidence", sub: "Vault & Provenance", route: ROUTES.evidence, glyph: "shield" },
  { key: "reality", label: "Reality", sub: "Property Digital Twins", route: ROUTES.reality, glyph: "home" },
  { key: "cortex", label: "Cortex", sub: "AI Intelligence", route: ROUTES.cortex, glyph: "chart" },
  { key: "passport", label: "Passport", sub: "The Record", route: ROUTES.passport, glyph: "lock" },
  { key: "core", label: "Core", sub: "Work Engine", route: ROUTES.core, glyph: "wrench" },
  { key: "pro", label: "Pro", sub: "Professional Oversight", route: ROUTES.pro, glyph: "briefcase" },
  { key: "habitat", label: "Habitat", sub: "Homeowner Oversight", route: ROUTES.habitat, glyph: "home" },
  { key: "reports", label: "Reports", sub: "Intelligence Outputs", route: ROUTES.reports, glyph: "doc" },
  { key: "systems", label: "Systems", sub: "Integrations & Health", route: ROUTES.systems, glyph: "gear" },
  { key: "admin", label: "Admin", sub: "Users, Roles, Policy", route: ROUTES.admin, glyph: "gear" },
];

/** Property Reality Detail sections, in operator order. */
export const REALITY_TABS = [
  "Overview", "Viewer", "Versions", "Evidence", "Processing", "Geometry",
  "Thermal", "Measurements", "Layers", "Quality", "Comparison", "Cortex",
  "Passport", "Projections", "Audit",
];

/** Evidence Detail sections, in operator order. */
export const EVIDENCE_TABS = [
  "Overview", "Source", "Integrity", "Metadata", "Quality", "Coverage",
  "Processing", "Lineage", "Custody", "Storage", "Review", "Cortex", "Audit",
];

/** ATC Mission Detail sections, in operator order. */
export const ATC_TABS = [
  "Overview", "Readiness", "Weather", "Airspace", "Aircraft", "Sensors",
  "Operator", "Mission Plan", "Thermal", "Launch", "Live Ops", "Post-Flight",
  "Timeline", "Audit",
];

/** Mission Detail sections, in operator order. */
export const MISSION_TABS = [
  "Overview", "Authorization", "Schedule", "Resources", "ATC", "Capture",
  "Evidence", "Processing", "Cortex", "Passport", "Reports", "Timeline", "Audit",
];

/** The authoritative property section list, in operator order. */
export const PROPERTY_TABS = [
  "Overview", "Identity", "Current State", "Reality Twin", "Missions", "Evidence",
  "Cortex", "Passport", "AWE", "Systems", "Measurements", "Findings", "Projects",
  "Repairs", "Maintenance", "Reports", "Documents", "Timeline", "Sharing", "Audit",
  "Core", "Pro", "Habitat",
];

export const PASSPORT_TABS = [
  "Overview", "Current State", "Revisions", "Ingestions", "Conflicts", "Identity",
  "Ownership", "Components", "Systems", "Measurements", "Twins", "Conditions",
  "Projects", "Repairs", "Maintenance", "Documents", "Cortex", "Timeline",
  "Sharing", "Audit", "Integrity",
];

/** Parse a hash route into its segments. */
export function parseRoute(route) {
  const [, segment, id, sub] = route.split("/");
  return { segment: segment || "centcom", id, sub };
}
