/**
 * REPORT MANIFEST FOUNDATION
 *
 * A Stratex report is not a fixed template. What appears in it is determined by
 * four independent inputs:
 *
 *   ORDERED PACKAGE  +  VALIDATED EVIDENCE  +  AVAILABLE OUTPUTS  +  ENTITLEMENTS
 *
 * The manifest answers, for a given property: which modules are eligible, which
 * are actually supported by evidence, which are included, which are excluded,
 * and why. A module is never fabricated because a template expects it — an
 * excluded module carries its reason.
 *
 * The renderer is NOT built here. This is the decision layer it will consume.
 */
import { serve } from "../shared/transport.js";

/** Every module the comprehensive report may eventually contain. */
export const REPORT_MODULES = [
  "COVER", "WELCOME", "EXECUTIVE_SUMMARY", "MISSION_OVERVIEW", "PROPERTY_OVERVIEW",
  "DIGITAL_TWIN", "CAD_BIM", "STRUCTURAL", "SHEATHING", "ROOF_DECK", "ROOFING_SYSTEM",
  "THERMAL", "AWE", "HOME_HEALTH", "WINDOW_SCHEDULE", "DOOR_SCHEDULE", "ENERGY",
  "VENTILATION", "MATERIALS", "LABOR", "DAMAGE_ASSESSMENT", "MAINTENANCE_ROADMAP",
  "CORTEX_RECOMMENDATIONS", "PASSPORT", "HABITAT", "DELIVERABLES", "FINAL_SUMMARY",
];

export const REPORT_TYPES = [
  "PROPERTY_INTELLIGENCE", "ROOF_INTELLIGENCE", "THERMAL", "AWE", "MISSION",
  "PROJECT", "REPAIR_VERIFICATION", "COMPREHENSIVE_PROPERTY_INTELLIGENCE",
];

export const EXCLUSION_REASON = {
  NOT_IN_PACKAGE: "Not included in the ordered package",
  NO_EVIDENCE: "No validated evidence supports this module",
  OUTPUT_UNAVAILABLE: "Required processing output does not exist yet",
  NOT_ENTITLED: "Entitlement required",
};

/** Which evidence or output each module depends on. */
const MODULE_REQUIREMENTS = {
  COVER: [], WELCOME: [], EXECUTIVE_SUMMARY: [], FINAL_SUMMARY: [], DELIVERABLES: [],
  PROPERTY_OVERVIEW: ["property"],
  MISSION_OVERVIEW: ["mission"],
  DIGITAL_TWIN: ["twin"],
  CAD_BIM: ["twin", "cad"],
  STRUCTURAL: ["twin", "findings"],
  SHEATHING: ["teardown_evidence"],
  ROOF_DECK: ["teardown_evidence"],
  ROOFING_SYSTEM: ["twin", "measurements"],
  THERMAL: ["thermal_evidence"],
  AWE: ["awe"],
  HOME_HEALTH: ["findings"],
  WINDOW_SCHEDULE: ["measurements"],
  DOOR_SCHEDULE: ["measurements"],
  ENERGY: ["awe"],
  VENTILATION: ["thermal_evidence"],
  MATERIALS: ["core_takeoff"],
  LABOR: ["core_estimate"],
  DAMAGE_ASSESSMENT: ["findings"],
  MAINTENANCE_ROADMAP: ["maintenance"],
  CORTEX_RECOMMENDATIONS: ["analysis"],
  PASSPORT: ["passport"],
  HABITAT: ["habitat_projection"],
};

/**
 * Build a manifest for a property.
 * @param {object} available  map of capability -> boolean, from real domain state
 * @param {string[]} packageModules  modules the ordered package covers
 * @param {string[]} entitlements  capabilities the buyer is entitled to
 */
export function buildManifest(available = {}, packageModules = REPORT_MODULES, entitlements = []) {
  return REPORT_MODULES.map((module) => {
    const requires = MODULE_REQUIREMENTS[module] || [];
    const inPackage = packageModules.includes(module);
    const supported = requires.every((r) => available[r]);
    const entitled = requires.every((r) => !entitlements.length || entitlements.includes(r) || available[r]);

    let included = inPackage && supported && entitled;
    let reason = null;
    if (!inPackage) reason = EXCLUSION_REASON.NOT_IN_PACKAGE;
    else if (!supported) reason = requires.some((r) => r.includes("evidence"))
      ? EXCLUSION_REASON.NO_EVIDENCE
      : EXCLUSION_REASON.OUTPUT_UNAVAILABLE;
    else if (!entitled) reason = EXCLUSION_REASON.NOT_ENTITLED;

    return { module, requires, eligible: inPackage, supported, included, reason };
  });
}

export const ReportManifestService = {
  getForProperty: (propertyId, available, packageModules, entitlements) =>
    serve(() => buildManifest(available, packageModules, entitlements)),
};

export default ReportManifestService;
