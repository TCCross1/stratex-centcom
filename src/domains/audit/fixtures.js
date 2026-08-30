/**
 * AUDIT FIXTURES — seeded development records. No production action occurred.
 *
 * Every event names its property so audit is property-scoped like everything
 * else. Sensitive values are referenced by ID, never inlined.
 */
import { iso, ago } from "../../utils/format.js";

export const AUDIT_DOMAINS = [
  "ALL", "PROPERTY", "MISSION", "EVIDENCE", "CORTEX", "PASSPORT",
  "CORE", "PRO", "HABITAT", "SHARING", "ADMIN",
];

export const auditEvents = [
  { auditId: "AU-9", at: ago(24), actor: "u-001", actorType: "OPERATOR", domain: "CORTEX",
    action: "FINDING_VERIFIED", objectType: "Finding", objectId: "FD-7768",
    propertyId: "SXP-004182", missionId: "M-2026-0829-017",
    previousState: "PENDING", newState: "VERIFIED",
    reason: "Thermal differential corroborated against the 2026 baseline.", sourceSystem: "centcom.ui" },

  { auditId: "AU-8", at: ago(28), actor: "pipeline:cortex", actorType: "SYSTEM", domain: "PASSPORT",
    action: "PASSPORT_REVISION_CREATED", objectType: "PassportRevision", objectId: "r14",
    propertyId: "SXP-004182", missionId: "M-2026-0829-017",
    previousState: "r13", newState: "r14",
    reason: "Analysis CX-0330 committed.", sourceSystem: "cortex.commit" },

  { auditId: "AU-7", at: iso("2026-07-19"), actor: "u-001", actorType: "OPERATOR", domain: "SHARING",
    action: "SHARING_GRANTED", objectType: "SharingGrant", objectId: "SG-041",
    propertyId: "SXP-004182", missionId: null,
    previousState: null, newState: "ACTIVE",
    reason: "Roof replacement bid — scoped to roof findings and measurements.", sourceSystem: "centcom.ui" },

  { auditId: "AU-6", at: iso("2026-08-12"), actor: "pipeline:core", actorType: "SYSTEM", domain: "CORE",
    action: "COMPLETION_EVIDENCE_ACCEPTED", objectType: "Repair", objectId: "RP-0181",
    propertyId: "SXP-004182", missionId: null,
    previousState: "EVIDENCE_RECEIVED", newState: "VERIFIED",
    reason: "41 completion assets validated against the authorized scope.", sourceSystem: "core.workflow" },

  { auditId: "AU-5", at: iso("2026-06-10"), actor: "system", actorType: "SYSTEM", domain: "SHARING",
    action: "SHARING_EXPIRED", objectType: "SharingGrant", objectId: "SG-038",
    propertyId: "SXP-004182", missionId: null,
    previousState: "ACTIVE", newState: "EXPIRED",
    reason: "Grant reached its expiration date.", sourceSystem: "centcom.scheduler" },

  { auditId: "AU-4", at: ago(1175), actor: "pipeline:cortex", actorType: "SYSTEM", domain: "CORTEX",
    action: "ANALYSIS_FAILED", objectType: "CortexAnalysis", objectId: "CX-0327",
    propertyId: "SXP-004190", missionId: "M-2026-0829-015",
    previousState: "RUNNING", newState: "FAILED",
    reason: "Capture coverage 71% — below the 95% assessment threshold.", sourceSystem: "cortex.worker" },

  { auditId: "AU-3", at: ago(870), actor: "u-001", actorType: "OPERATOR", domain: "PASSPORT",
    action: "REPAIR_VERIFIED", objectType: "Repair", objectId: "RP-0150",
    propertyId: "SXP-004150", missionId: "M-2026-0812-011",
    previousState: "REVIEW_PENDING", newState: "VERIFIED",
    reason: "Verification scan confirmed the predicted saturated zone was remediated.", sourceSystem: "centcom.ui" },
];
