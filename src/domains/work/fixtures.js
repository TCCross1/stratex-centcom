/**
 * WORK DOMAINS — PROJECTS, REPAIRS, MAINTENANCE.
 *
 * These are three different things and are never merged into a generic "job":
 *   PROJECT      work to be performed on the property
 *   REPAIR       completed corrective work, with completion evidence
 *   MAINTENANCE  recurring upkeep, distinct from both
 *
 * A MISSION is Stratex acquiring data. A PROJECT is work on the house. They are
 * unrelated concepts that both happen to touch a property.
 */
import { ago, iso } from "../../utils/format.js";

export const PROJECT_STATUS = ["PLANNING","AUTHORIZED","ESTIMATING","PROPOSED","SCHEDULED","ACTIVE","COMPLETION_PENDING","COMPLETE","CANCELLED"];

/** Origin matters enormously once Pro and Habitat connect — it drives whose
 *  cost intelligence is visible to whom. */
export const PROJECT_ORIGIN = ["HOMEOWNER","PROFESSIONAL","STRATEX_RECOMMENDATION","MAINTENANCE","OTHER"];

export const REPAIR_VERIFIED_STATE = ["UNVERIFIED","EVIDENCE_RECEIVED","REVIEW_PENDING","VERIFIED","REJECTED"];

export const MAINTENANCE_STATUS = ["UPCOMING","DUE","OVERDUE","IN_PROGRESS","COMPLETE","DISMISSED"];

/** Roadmap horizons. Timing is never stated more precisely than the source
 *  intelligence supports. */
export const MAINTENANCE_HORIZON = ["IMMEDIATE","0-6 MONTHS","6-12 MONTHS","1-3 YEARS","3-5 YEARS","5+ YEARS"];

export const projects = [
  { projectId: "PJ-0181", propertyId: "SXP-004182", title: "Roof replacement — full tear-off", category: "ROOF",
    status: "COMPLETE", origin: "STRATEX_RECOMMENDATION", createdAt: iso("2026-07-19"), targetCompletion: iso("2026-08-15"),
    authorizedProfessionalOrgId: "ORG-BLUEGRASS", relatedFindingIds: ["FD-7776"], relatedSharingGrantId: "SG-041",
    coreWorkIds: ["CW-4410","CW-4411"], estimateIds: ["EST-2291"], completionEvidenceIds: ["EA-90295"] },
  { projectId: "PJ-0190", propertyId: "SXP-004182", title: "Attic moisture investigation", category: "MOISTURE",
    status: "PLANNING", origin: "STRATEX_RECOMMENDATION", createdAt: ago(28), targetCompletion: null,
    authorizedProfessionalOrgId: null, relatedFindingIds: ["FD-7781"], relatedSharingGrantId: null,
    coreWorkIds: [], estimateIds: [], completionEvidenceIds: [] },
  { projectId: "PJ-0150", propertyId: "SXP-004150", title: "Rear plane decking replacement", category: "ROOF",
    status: "COMPLETE", origin: "PROFESSIONAL", createdAt: iso("2026-05-02"), targetCompletion: iso("2026-08-10"),
    authorizedProfessionalOrgId: "ORG-BLUEGRASS", relatedFindingIds: ["FD-6602"], relatedSharingGrantId: "SG-018",
    coreWorkIds: ["CW-3300"], estimateIds: ["EST-1880"], completionEvidenceIds: ["EA-41501"] },
];

export const repairs = [
  { repairId: "RP-0181", propertyId: "SXP-004182", projectId: "PJ-0181", title: "Roof replacement completed",
    completedAt: iso("2026-08-12"), professionalOrgId: "ORG-BLUEGRASS", completionEvidenceIds: ["EA-90295"],
    verifiedState: "VERIFIED", relatedFindingIds: ["FD-7776"], passportRevisionId: "r13",
    notes: "Decking condition documented during tear-off and returned to Passport." },
  { repairId: "RP-0150", propertyId: "SXP-004150", projectId: "PJ-0150", title: "Rear decking replaced",
    completedAt: iso("2026-08-10"), professionalOrgId: "ORG-BLUEGRASS", completionEvidenceIds: ["EA-41501"],
    verifiedState: "VERIFIED", relatedFindingIds: ["FD-6602"], passportRevisionId: "r12",
    notes: "Verification scan confirmed the predicted saturated zone." },
];

export const maintenance = [
  { maintenanceId: "MT-0301", propertyId: "SXP-004182", systemId: "sys-plumbing", task: "Plumbing system inspection",
    status: "DUE", priority: "medium", horizon: "IMMEDIATE", recommendedAt: ago(120), dueDate: iso("2026-09-05"),
    completedAt: null, sourceFindingId: null, sourceAnalysisId: null, evidenceIds: [], recurrenceRule: "annual" },
  { maintenanceId: "MT-0302", propertyId: "SXP-004182", systemId: "sys-hvac", task: "HVAC service — efficiency degradation observed",
    status: "UPCOMING", priority: "medium", horizon: "0-6 MONTHS", recommendedAt: ago(30), dueDate: iso("2026-11-01"),
    completedAt: null, sourceFindingId: "FD-7768", sourceAnalysisId: "CX-0330", evidenceIds: ["EA-90212"], recurrenceRule: "annual" },
  { maintenanceId: "MT-0303", propertyId: "SXP-004182", systemId: "sys-attic", task: "Re-inspect attic after moisture remediation",
    status: "UPCOMING", priority: "high", horizon: "0-6 MONTHS", recommendedAt: ago(28), dueDate: iso("2026-12-01"),
    completedAt: null, sourceFindingId: "FD-7781", sourceAnalysisId: "CX-0330", evidenceIds: ["EA-90291"], recurrenceRule: null },
  { maintenanceId: "MT-0304", propertyId: "SXP-004182", systemId: "sys-drainage", task: "Gutter and downspout clearing",
    status: "COMPLETE", priority: "low", horizon: "IMMEDIATE", recommendedAt: iso("2026-05-02"), dueDate: iso("2026-06-01"),
    completedAt: iso("2026-05-28"), sourceFindingId: null, sourceAnalysisId: null, evidenceIds: [], recurrenceRule: "semiannual" },
  { maintenanceId: "MT-0305", propertyId: "SXP-004182", systemId: "sys-envelope", task: "Exterior sealant review",
    status: "UPCOMING", priority: "low", horizon: "1-3 YEARS", recommendedAt: ago(30), dueDate: null,
    completedAt: null, sourceFindingId: null, sourceAnalysisId: null, evidenceIds: [], recurrenceRule: null },
];

export const DOCUMENT_TYPE = ["PERMIT","WARRANTY","MANUAL","PLAN","CONTRACT","MANUFACTURER_DOCUMENT","INSURANCE_DOCUMENT","OTHER"];

/** Documents are REFERENCES. Binaries live in object storage, never in UI
 *  state or a relational field. */
export const documents = [
  { documentId: "DOC-0441", propertyId: "SXP-004182", title: "Roof replacement permit", type: "PERMIT",
    artifactReference: "obj://stratex-docs/SXP-004182/permit-2026-0719.pdf", uploadedAt: iso("2026-07-19"),
    source: "Professional — Bluegrass Roofing LLC", relatedProjectId: "PJ-0181", relatedRepairId: "RP-0181",
    relatedSystemId: "sys-roof", accessScope: "CENTCOM + authorized professional", version: 1 },
  { documentId: "DOC-0442", propertyId: "SXP-004182", title: "Shingle manufacturer warranty", type: "WARRANTY",
    artifactReference: "obj://stratex-docs/SXP-004182/warranty-2026-0812.pdf", uploadedAt: iso("2026-08-12"),
    source: "Professional — Bluegrass Roofing LLC", relatedProjectId: "PJ-0181", relatedRepairId: "RP-0181",
    relatedSystemId: "sys-roof", accessScope: "CENTCOM + homeowner", version: 1 },
  { documentId: "DOC-0443", propertyId: "SXP-004182", title: "HVAC unit installation manual", type: "MANUAL",
    artifactReference: "obj://stratex-docs/SXP-004182/hvac-manual.pdf", uploadedAt: iso("2026-02-14"),
    source: "Homeowner upload", relatedProjectId: null, relatedRepairId: null,
    relatedSystemId: "sys-hvac", accessScope: "CENTCOM + homeowner", version: 1 },
];
