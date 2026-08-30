/**
 * COST / ESTIMATE VISIBILITY POLICY — foundation only.
 *
 * Established now so privacy never has to be retrofitted onto Core outputs.
 *
 * The future rule this metadata exists to serve:
 *
 *   PROFESSIONAL-ORIGINATED SCAN
 *     → private cost intelligence is visible in Stratex Pro
 *     → NOT automatically visible to the homeowner
 *
 *   HOMEOWNER-ORIGINATED SCAN
 *     → applicable cost intelligence may surface in Habitat,
 *       subject to entitlement and policy
 *
 * Neither Pro nor Habitat is built yet. This is metadata and a helper, not an
 * enforcement engine.
 */

export const VISIBILITY_AUDIENCE = {
  CENTCOM_ONLY: "CENTCOM_ONLY",
  PRO_ORG: "PRO_ORG",
  HOMEOWNER: "HOMEOWNER",
  BOTH: "BOTH",
};

export const ORIGIN_TYPE = {
  PROFESSIONAL: "PROFESSIONAL",
  HOMEOWNER: "HOMEOWNER",
  STRATEX: "STRATEX",
};

/**
 * Cost fields that are NOT canonical property facts and must never be written
 * into Passport as property truth. Passport may reference a Core output and its
 * provenance; it does not own a contractor's margin.
 */
export const NON_CANONICAL_COST_FIELDS = [
  "contractorMarkup",
  "supplierDiscount",
  "privateLaborRate",
  "internalMargin",
  "privateProposalPricing",
];

/**
 * @typedef {Object} CoreOutputVisibility
 * @property {keyof VISIBILITY_AUDIENCE} visibilityAudience
 * @property {keyof ORIGIN_TYPE} originType
 * @property {string|null} ownerOrganizationId
 * @property {string} sharingPolicy
 * @property {boolean} entitlementRequired
 */

/** Default visibility for a Core output, derived from who ordered the scan. */
export function defaultVisibility(originType, ownerOrganizationId = null) {
  if (originType === ORIGIN_TYPE.PROFESSIONAL)
    return {
      visibilityAudience: VISIBILITY_AUDIENCE.PRO_ORG,
      originType,
      ownerOrganizationId,
      sharingPolicy: "Private to the ordering organization unless explicitly shared.",
      entitlementRequired: true,
    };
  if (originType === ORIGIN_TYPE.HOMEOWNER)
    return {
      visibilityAudience: VISIBILITY_AUDIENCE.HOMEOWNER,
      originType,
      ownerOrganizationId: null,
      sharingPolicy: "Visible to the property owner, subject to entitlement.",
      entitlementRequired: true,
    };
  return {
    visibilityAudience: VISIBILITY_AUDIENCE.CENTCOM_ONLY,
    originType: ORIGIN_TYPE.STRATEX,
    ownerOrganizationId: null,
    sharingPolicy: "Internal operational output.",
    entitlementRequired: false,
  };
}

/** True if a field is private cost intelligence rather than property truth. */
export const isNonCanonicalCost = (field) => NON_CANONICAL_COST_FIELDS.includes(field);
