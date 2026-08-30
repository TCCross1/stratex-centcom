/**
 * EVIDENCE SERVICE
 *
 * Property-aware and mission-aware retrieval. Property pages never receive a
 * global evidence collection — a page asks for what belongs to its subject.
 */
import { evidenceAssets, evidencePackages } from "./fixtures.js";
import { serve } from "../shared/transport.js";

export const EvidenceService = {
  listByProperty: (propertyId) =>
    serve(() => evidenceAssets.filter((a) => a.propertyId === propertyId)),

  listByMission: (missionId) =>
    serve(() => evidenceAssets.filter((a) => a.missionId === missionId)),

  listPackagesByProperty: (propertyId) =>
    serve(() => evidencePackages.filter((p) => p.propertyId === propertyId)),

  listPackages: () => serve(() => evidencePackages),

  /** Global vault view. Command surfaces may see everything; property pages
   *  must not — that is why this is a separate, explicitly named call. */
  listAll: () => serve(() => evidenceAssets),

  get: (evidenceId) =>
    serve(() => {
      const asset = evidenceAssets.find((a) => a.evidenceId === evidenceId);
      if (!asset) throw new Error("Evidence not found.");
      return asset;
    }),

  /** Derived children of an asset — the forward half of its lineage. */
  listDerivedFrom: (evidenceId) =>
    serve(() => evidenceAssets.filter((a) => a.derivedFrom === evidenceId)),
};

export default EvidenceService;
