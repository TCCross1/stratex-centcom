/**
 * AUDIT SERVICE — who, what, when, from which state, to which state.
 * Canonical truth never changes without a record of the change.
 */
import { auditEvents, AUDIT_DOMAINS } from "./fixtures.js";
import { serve } from "../shared/transport.js";

export const AuditService = {
  list: () => serve(() => auditEvents),
  listByProperty: (propertyId) =>
    serve(() => auditEvents.filter((e) => e.propertyId === propertyId)),
  domains: () => AUDIT_DOMAINS,
};
export default AuditService;
