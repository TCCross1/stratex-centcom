/**
 * PROPERTY SERVICE
 *
 * The only boundary pages touch. Every call is async and can fail — swap these
 * bodies for an HTTP client and nothing above this file changes.
 *
 * Relationship rules enforced here:
 *   PROPERTY 1 → MANY MISSIONS
 *   PROPERTY 1 → MANY DIGITAL TWIN VERSIONS
 * A mission never becomes the parent of a property.
 */
import { properties, twins, systemsByProperty, ownership } from "./fixtures.js";
import { serve } from "../shared/transport.js";

/** Directory rows are SUMMARY projections. A list row must never require the
 *  property's lifetime record to render. */
const toSummary = (p) => ({
  stratexPropertyId: p.stratexPropertyId,
  displayId: p.displayId,
  identity: p.identity,
  propertyType: p.propertyType,
  status: p.status,
  healthScore: p.healthScore,
  latestScanAt: p.latestScanAt,
  latestMissionId: p.latestMissionId,
  openAlerts: p.openAlerts,
  cortexState: p.cortexState,
  passportState: p.passportState,
  coreState: p.coreState,
  proState: p.proState,
  habitatState: p.habitatState,
  twinVersion: p.twinVersion,
  blocker: p.blocker,
  updatedAt: p.updatedAt,
});

export const PropertyService = {
  listSummaries: () => serve(() => properties.map(toSummary)),

  get: (stratexPropertyId) =>
    serve(() => {
      const p = properties.find((x) => x.stratexPropertyId === stratexPropertyId);
      if (!p) throw new Error("Property not found.");
      return p;
    }),

  getDirectorySummary: () =>
    serve(() => ({
      totalProperties: properties.length,
      openAlerts: properties.reduce((n, p) => n + p.openAlerts, 0),
      passportReview: properties.filter((p) =>
        ["CONFLICT", "REVIEW_REQUIRED", "ERROR"].includes(p.passportState)
      ).length,
      syncExceptions: properties.filter(
        (p) => p.habitatState === "SYNC_ERROR" || p.coreState === "ERROR"
      ).length,
    })),

  /** Twins are property-scoped. A version never bleeds across properties. */
  listTwins: (propertyId) =>
    serve(() =>
      twins
        .filter((t) => t.propertyId === propertyId)
        .sort((a, b) => b.versionNumber - a.versionNumber)
    ),

  listSystems: (propertyId) =>
    serve(() => systemsByProperty[propertyId] || systemsByProperty.default),

  /** Ownership is an association, not a property attribute. Transfer changes
   *  access; it never erases history. */
  listOwnership: (propertyId) =>
    serve(() => ownership.filter((o) => o.propertyId === propertyId)),
};

export default PropertyService;
