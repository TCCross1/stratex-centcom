/**
 * SHARING FIXTURES.
 * A grant is scoped, reasoned and time-limited. It never confers authority
 * over Passport, and ownership is a separate concept entirely.
 */
import { iso, ago } from "../../utils/format.js";

export const SHARING_SCOPES = [
  "PROPERTY_SUMMARY", "REPORT", "EVIDENCE", "MEASUREMENTS", "FINDINGS",
  "PROJECT", "DIGITAL_TWIN", "ESTIMATE", "DOCUMENTS",
];

/** A grant is scoped, purposeful and time-limited. Whole-property access is
 *  never the default. */
export const grants = [
  { grantId: "SG-041", propertyId: "SXP-004182", recipient: "M. Ruiz",
    organization: "Bluegrass Roofing LLC", role: "PROFESSIONAL_ADMIN",
    scope: ["FINDINGS", "MEASUREMENTS", "REPORT"], purpose: "Roof replacement bid",
    status: "ACTIVE", grantedAt: iso("2026-07-19"), expiresAt: iso("2026-09-30"),
    revokedAt: null, accessCount: 14, lastAccessedAt: ago(2900) },

  { grantId: "SG-038", propertyId: "SXP-004182", recipient: "D. Whitaker",
    organization: "Central KY HVAC", role: "PROFESSIONAL_USER",
    scope: ["FINDINGS"], purpose: "HVAC service quote",
    status: "EXPIRED", grantedAt: iso("2026-05-10"), expiresAt: iso("2026-06-10"),
    revokedAt: null, accessCount: 3, lastAccessedAt: iso("2026-05-28") },

  { grantId: "SG-044", propertyId: "SXP-004182", recipient: "Pending recipient",
    organization: "Unassigned", role: "PROFESSIONAL_USER",
    scope: ["PROPERTY_SUMMARY"], purpose: "Attic moisture investigation",
    status: "PENDING", grantedAt: ago(28), expiresAt: iso("2026-10-31"),
    revokedAt: null, accessCount: 0, lastAccessedAt: null },

  { grantId: "SG-018", propertyId: "SXP-004150", recipient: "M. Ruiz",
    organization: "Bluegrass Roofing LLC", role: "PROFESSIONAL_ADMIN",
    scope: ["FINDINGS", "MEASUREMENTS", "DIGITAL_TWIN"], purpose: "Decking replacement",
    status: "REVOKED", grantedAt: iso("2026-05-02"), expiresAt: iso("2026-09-01"),
    revokedAt: iso("2026-08-14"), accessCount: 27, lastAccessedAt: iso("2026-08-13") },

];
