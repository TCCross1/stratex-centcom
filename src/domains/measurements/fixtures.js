/**
 * MEASUREMENT FIXTURES — property-scoped.
 *
 * Truth classification is never hidden. A photogrammetric roof area is DERIVED,
 * an on-site ambient reading is MEASURED, and an inferred saturated area is
 * PROBABLE with a confidence. These are not interchangeable.
 */
import { ago, iso } from "../../utils/format.js";
import { TRUTH_CLASS, REVIEW_STATE } from "../shared/classification.js";

export const MEASUREMENT_CATEGORY = [
  "PROPERTY", "ROOF", "EXTERIOR", "STRUCTURAL", "WINDOWS", "DOORS",
  "HVAC", "PLUMBING", "ELECTRICAL", "THERMAL", "AIR", "WATER", "ENERGY",
];

export const measurements = [
  { measurementId: "MS-1001", propertyId: "SXP-004182", missionId: "M-2026-0827-012", name: "Roof area — total", category: "ROOF", value: 2856, unit: "sq ft", zone: "All roof planes", truthClassification: TRUTH_CLASS.DERIVED, method: "Photogrammetric surface integration", confidence: null, sourceEvidenceIds: ["EA-90280"], sourceTwinVersionId: "TW-004182-V3", reviewState: REVIEW_STATE.VERIFIED, createdAt: ago(30) },
  { measurementId: "MS-1002", propertyId: "SXP-004182", missionId: "M-2026-0827-012", name: "Ridge length", category: "ROOF", value: 86, unit: "lf", zone: "Main ridge", truthClassification: TRUTH_CLASS.DERIVED, method: "Twin geometry extraction", confidence: null, sourceEvidenceIds: ["EA-90280"], sourceTwinVersionId: "TW-004182-V3", reviewState: REVIEW_STATE.VERIFIED, createdAt: ago(30) },
  { measurementId: "MS-1003", propertyId: "SXP-004182", missionId: "M-2026-0827-012", name: "Roof pitch — south plane", category: "ROOF", value: 6.5, unit: ": 12", zone: "South plane", truthClassification: TRUTH_CLASS.DERIVED, method: "Plane normal from mesh", confidence: null, sourceEvidenceIds: ["EA-90280"], sourceTwinVersionId: "TW-004182-V3", reviewState: REVIEW_STATE.VERIFIED, createdAt: ago(30) },
  { measurementId: "MS-1004", propertyId: "SXP-004182", missionId: "M-2026-0827-012", name: "Ambient temperature at capture", category: "THERMAL", value: 72, unit: "°F", zone: "Site", truthClassification: TRUTH_CLASS.MEASURED, method: "Onboard sensor", confidence: null, sourceEvidenceIds: ["EA-90212"], sourceTwinVersionId: null, reviewState: REVIEW_STATE.NOT_REQUIRED, createdAt: ago(320) },
  { measurementId: "MS-1005", propertyId: "SXP-004182", missionId: "M-2026-0827-012", name: "Potential saturated area", category: "ROOF", value: 146, unit: "sq ft", zone: "North plane / attic", truthClassification: TRUTH_CLASS.PROBABLE, method: "Thermal anomaly segmentation", confidence: 0.86, sourceEvidenceIds: ["EA-90212", "EA-90291"], sourceTwinVersionId: "TW-004182-V3", reviewState: REVIEW_STATE.PENDING, createdAt: ago(30) },
  { measurementId: "MS-1006", propertyId: "SXP-004182", missionId: "M-2026-0827-012", name: "Eave length — total", category: "ROOF", value: 168, unit: "lf", zone: "Perimeter", truthClassification: TRUTH_CLASS.DERIVED, method: "Twin geometry extraction", confidence: null, sourceEvidenceIds: ["EA-90280"], sourceTwinVersionId: "TW-004182-V3", reviewState: REVIEW_STATE.VERIFIED, createdAt: ago(30) },
  { measurementId: "MS-1007", propertyId: "SXP-004182", missionId: "M-2026-0827-012", name: "Conditioned floor area", category: "PROPERTY", value: 3140, unit: "sq ft", zone: "Whole structure", truthClassification: TRUTH_CLASS.DERIVED, method: "Footprint × story count", confidence: null, sourceEvidenceIds: ["EA-90280"], sourceTwinVersionId: "TW-004182-V3", reviewState: REVIEW_STATE.VERIFIED, createdAt: ago(30) },
  { measurementId: "MS-1008", propertyId: "SXP-004182", missionId: "M-2026-0827-012", name: "Supply register thermal spread", category: "HVAC", value: 3.1, unit: "°F", zone: "Interior", truthClassification: TRUTH_CLASS.DERIVED, method: "Baseline differential", confidence: null, sourceEvidenceIds: ["EA-90212"], sourceTwinVersionId: null, reviewState: REVIEW_STATE.VERIFIED, createdAt: ago(30) },
  { measurementId: "MS-2001", propertyId: "SXP-004188", missionId: "M-2026-0829-016", name: "Roof area — total", category: "ROOF", value: 2410, unit: "sq ft", zone: "All roof planes", truthClassification: TRUTH_CLASS.DERIVED, method: "Photogrammetric surface integration", confidence: null, sourceEvidenceIds: ["EA-88010"], sourceTwinVersionId: "TW-004188-V1", reviewState: REVIEW_STATE.PENDING, createdAt: ago(35) },
  { measurementId: "MS-2002", propertyId: "SXP-004188", missionId: "M-2026-0829-016", name: "West elevation cold band area", category: "THERMAL", value: 62, unit: "sq ft", zone: "West elevation", truthClassification: TRUTH_CLASS.PROBABLE, method: "Thermal anomaly segmentation", confidence: 0.52, sourceEvidenceIds: ["EA-88044"], sourceTwinVersionId: "TW-004188-V1", reviewState: REVIEW_STATE.NEEDS_MORE_EVIDENCE, createdAt: ago(35) },
  { measurementId: "MS-3001", propertyId: "SXP-004150", missionId: "M-2026-0812-011", name: "Replaced decking area", category: "ROOF", value: 158, unit: "sq ft", zone: "Rear plane", truthClassification: TRUTH_CLASS.MEASURED, method: "Contractor completion evidence", confidence: null, sourceEvidenceIds: ["EA-41501"], sourceTwinVersionId: "TW-004150-V2", reviewState: REVIEW_STATE.VERIFIED, createdAt: ago(870) },
];
