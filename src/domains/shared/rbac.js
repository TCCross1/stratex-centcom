/**
 * ROLES AND SCOPES
 *
 * CENTCOM is privileged operational software. Access is domain-aware: an
 * external professional with one authorized project never inherits command
 * authority, and external roles receive no CENTCOM access by default.
 */

export const ROLE = {
  ADMIN: "CENTCOM Administrator",
  OPS: "Operations Manager",
  PILOT: "Pilot / Operator",
  ANALYST: "Analyst / Reviewer",
  PRO_ADMIN: "Professional Administrator",
  PRO_USER: "Professional User",
  HOMEOWNER: "Homeowner",
  READONLY: "Support / Read-only",
};

/** Domain-aware permissions. A contractor never inherits CENTCOM authority. */
export const ROLE_SCOPES = {
  [ROLE.ADMIN]: ["centcom:*"],
  [ROLE.OPS]: [
    "centcom:read", "mission:write", "atc:approve", "evidence:read",
    "cortex:read", "passport:read", "property:read", "report:write",
  ],
  [ROLE.PILOT]: ["mission:read", "atc:read", "atc:telemetry", "evidence:submit"],
  [ROLE.ANALYST]: ["evidence:read", "cortex:write", "finding:verify", "passport:read"],
  [ROLE.PRO_ADMIN]: ["pro:admin", "pro:project", "evidence:submit"],
  [ROLE.PRO_USER]: ["pro:project", "evidence:submit"],
  [ROLE.HOMEOWNER]: ["habitat:read", "sharing:grant"],
  [ROLE.READONLY]: ["centcom:read"],
};

export const can = (session, scope) => {
  const scopes = ROLE_SCOPES[session?.role] || [];
  return scopes.includes("centcom:*") || scopes.includes(scope);
};
