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
import { properties as seedProperties, twins as seedTwins, systemsByProperty, ownership } from "./fixtures.js";
import { serve } from "../shared/transport.js";

const nowIso = () => new Date().toISOString();

/** In-memory provider — pages never mutate the fixture module. */
const store = {
  properties: seedProperties.map((p) => ({ ...p, identity: { ...(p.identity || {}) } })),
  twins: seedTwins.map((t) => ({ ...t })),
};

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
  listSummaries: () => serve(() => store.properties.map(toSummary)),

  get: (stratexPropertyId) =>
    serve(() => {
      const p = store.properties.find((x) => x.stratexPropertyId === stratexPropertyId);
      if (!p) throw new Error("Property not found.");
      return p;
    }),

  getDirectorySummary: () =>
    serve(() => ({
      totalProperties: store.properties.length,
      openAlerts: store.properties.reduce((n, p) => n + (p.openAlerts || 0), 0),
      passportReview: store.properties.filter((p) =>
        ["CONFLICT", "REVIEW_REQUIRED", "ERROR"].includes(p.passportState)
      ).length,
      syncExceptions: store.properties.filter(
        (p) => p.habitatState === "SYNC_ERROR" || p.coreState === "ERROR"
      ).length,
    })),

  create: (input = {}) =>
    serve(() => {
      const id = input.stratexPropertyId;
      if (!id) throw new Error("A property id is required.");
      if (store.properties.some((p) => p.stratexPropertyId === id))
        throw new Error("Property already exists.");
      const identity = { ...(input.identity || {}) };
      const record = {
        stratexPropertyId: id,
        displayId: input.displayId || id,
        propertyType: input.propertyType || "Single Family Detached",
        identity,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        healthScore: input.healthScore ?? null,
        status: input.status || "ACTIVE",
        currentStage: input.currentStage || "scheduled",
        blocker: null,
        latestScanAt: null,
        latestMissionId: input.latestMissionId || null,
        missionCount: 0,
        evidenceCount: 0,
        findingCount: 0,
        openAlerts: 0,
        twinVersion: "—",
        passportRevision: "r01",
        passportState: "PENDING",
        cortexState: "IDLE",
        coreState: "IDLE",
        proState: "NONE",
        habitatState: "NOT_CONNECTED",
      };
      store.properties.push(record);
      return record;
    }),

  /** Move / retitle a pin. Coordinates are property identity, not mission GPS. */
  updateIdentity: (stratexPropertyId, identity = {}) =>
    serve(() => {
      const p = store.properties.find((x) => x.stratexPropertyId === stratexPropertyId);
      if (!p) throw new Error("Property not found.");
      const next = { ...p.identity, ...identity };
      if (identity.lat !== undefined)
        next.lat = Number.isFinite(identity.lat) ? identity.lat : null;
      if (identity.lng !== undefined)
        next.lng = Number.isFinite(identity.lng) ? identity.lng : null;
      p.identity = next;
      p.updatedAt = nowIso();
      return p;
    }),

  /** Twins are property-scoped. A version never bleeds across properties. */
  listTwins: (propertyId) =>
    serve(() =>
      store.twins
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
