/**
 * EVIDENCE STORAGE PROVIDER
 *
 * The Evidence domain never talks to S3, GCS or Azure directly. It talks to
 * this contract. Swapping in a real object store means implementing these
 * operations — nothing above this file changes.
 *
 * The current provider is IN-MEMORY FIXTURE storage. It says so. It will not
 * report "S3 CONNECTED", and it will not claim an artifact is downloadable
 * when no bytes exist.
 */
import { serve } from "../shared/transport.js";

export const STORAGE_MODE = {
  CONNECTED: "CONNECTED",
  FIXTURE_STORAGE: "FIXTURE_STORAGE",
  IN_MEMORY_STORAGE: "IN_MEMORY_STORAGE",
  DISCONNECTED: "DISCONNECTED",
  ERROR: "ERROR",
};

export const STORAGE_TIER = {
  HOT: "HOT",       // active workflows need it now
  WARM: "WARM",     // recent mission evidence, likely to be reviewed
  COLD: "COLD",     // historical, not routinely accessed
  ARCHIVE: "ARCHIVE", // immutable originals and superseded source data
};

export const TIER_DESCRIPTION = {
  HOT: "Current property evidence and projections needed by active workflows.",
  WARM: "Recent mission evidence likely to be reviewed or processed.",
  COLD: "Historical evidence not routinely accessed.",
  ARCHIVE: "Long-term immutable originals and superseded source data. Archived is not deleted.",
};

/** Deterministic logical paths. UI never depends on physical layout. */
export const originalPath = (propertyId, missionId, captureId, evidenceId) =>
  `properties/${propertyId}/missions/${missionId}/captures/${captureId}/originals/${evidenceId}`;

export const derivedPath = (propertyId, missionId, captureId, evidenceId) =>
  `properties/${propertyId}/missions/${missionId}/captures/${captureId}/derived/${evidenceId}`;

/** In-memory byte store. Real bytes when a test or upload supplies them. */
const bytes = new Map();
const objects = new Map();

export const EvidenceStorageProvider = {
  name: "EvidenceStorageProvider",
  mode: STORAGE_MODE.IN_MEMORY_STORAGE,
  vendor: "in-memory development store",

  isLive: () => EvidenceStorageProvider.mode === STORAGE_MODE.CONNECTED,

  putOriginal: (ref, data, meta = {}) =>
    serve(() => {
      if (objects.has(ref) && objects.get(ref).immutable)
        throw new Error("Original evidence is immutable. " + ref + " already exists and cannot be overwritten.");
      if (data) bytes.set(ref, data);
      objects.set(ref, { ref, immutable: true, tier: STORAGE_TIER.ARCHIVE, materialized: Boolean(data), ...meta });
      return { ref, stored: true, materialized: Boolean(data), mode: EvidenceStorageProvider.mode };
    }),

  putDerived: (ref, data, meta = {}) =>
    serve(() => {
      if (data) bytes.set(ref, data);
      objects.set(ref, { ref, immutable: false, tier: STORAGE_TIER.WARM, materialized: Boolean(data), ...meta });
      return { ref, stored: true, materialized: Boolean(data), mode: EvidenceStorageProvider.mode };
    }),

  getMetadata: (ref) => serve(() => objects.get(ref) || null),
  verifyExists: (ref) => serve(() => objects.has(ref)),

  /** Returns bytes only when they genuinely exist. Never a placeholder. */
  materialize: (ref) =>
    serve(() => {
      if (!bytes.has(ref))
        return { ref, materialized: false, bytes: null,
                 reason: "No bytes are stored for this reference. Fixture evidence has metadata only." };
      return { ref, materialized: true, bytes: bytes.get(ref) };
    }),

  copy: (from, to) =>
    serve(() => {
      if (bytes.has(from)) bytes.set(to, bytes.get(from));
      objects.set(to, { ...(objects.get(from) || {}), ref: to, immutable: false });
      return { from, to, copied: true };
    }),

  changeTier: (ref, tier) =>
    serve(() => {
      const o = objects.get(ref);
      if (!o) throw new Error("No stored object at " + ref + ".");
      const previous = o.tier;
      o.tier = tier;
      return { ref, previousTier: previous, tier };
    }),

  /** A signed URL requires a real provider. There is none. */
  getSignedAccessReference: () =>
    Promise.reject(new Error("Signed access requires a connected object storage provider. None is configured.")),

  health: () => ({
    id: "EvidenceStorageProvider",
    name: "Evidence Storage",
    mode: EvidenceStorageProvider.mode,
    vendor: EvidenceStorageProvider.vendor,
    isLive: EvidenceStorageProvider.isLive(),
    objectCount: objects.size,
    materializedCount: bytes.size,
    detail: EvidenceStorageProvider.isLive()
      ? "Connected object storage"
      : "In-memory development store — not production object storage",
  }),

  __reset: () => { bytes.clear(); objects.clear(); },
};

/**
 * EVIDENCE SOURCE PROVIDER — where captured artifacts come from.
 * No DJI connection exists. This is the seam one would implement.
 */
export const EVIDENCE_SOURCE = {
  DJI: "DJI", MANIFOLD: "MANIFOLD", LOCAL_UPLOAD: "LOCAL_UPLOAD",
  MOBILE_UPLOAD: "MOBILE_UPLOAD", API: "API",
  OBJECT_STORAGE_IMPORT: "OBJECT_STORAGE_IMPORT", FIXTURE: "FIXTURE",
};

export const EvidenceSourceProvider = {
  name: "EvidenceSourceProvider",
  mode: "FIXTURE",
  source: EVIDENCE_SOURCE.FIXTURE,
  vendor: "development fixture",
  isLive: () => false,

  pull: () =>
    Promise.reject(new Error("No capture source is connected. DJI, Manifold and upload ingestion are not configured.")),

  health: () => ({
    id: "EvidenceSourceProvider",
    name: "Evidence Source",
    mode: "FIXTURE",
    vendor: "development fixture",
    isLive: false,
    detail: "Fixture source — no DJI, Manifold or upload pipeline is connected",
  }),
};
