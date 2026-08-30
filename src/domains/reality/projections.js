/**
 * PROPERTY REALITY PROJECTIONS — read-only, downstream.
 *
 * Passport remembers the canonical state. Cortex interprets it. Core performs
 * work from it. Pro and Habitat receive authorized read-only views of it.
 *
 * None of them own the twin. Every function here returns a projection built
 * from an APPROVED version — a draft, failed or rejected version can never
 * become downstream truth.
 */
import { serve } from "../shared/transport.js";
import RealityEngine from "./service.js";
import { PASSPORT_ELIGIBLE_STATES, twinType, twinTypeIds } from "./types.js";

const approved = (v) => v && PASSPORT_ELIGIBLE_STATES.includes(v.status);

/** Only an approved version may be referenced by Passport. */
export const PassportRealityProjection = {
  build: async (propertyId) => {
    const versions = await RealityEngine.listVersions(propertyId);
    const current = {};
    const historical = [];

    for (const typeId of twinTypeIds()) {
      const ofType = versions.filter((v) => v.twinType === typeId);
      const cur = ofType.filter(approved).sort((a, b) => b.versionNumber - a.versionNumber)[0] || null;
      current[typeId] = cur
        ? { twinVersionId: cur.twinVersionId, versionLabel: cur.versionLabel, status: cur.status,
            approvedAt: cur.approvedAt, qualityState: cur.qualityState,
            sourceMissionIds: cur.sourceMissionIds, passportRevisionId: cur.passportRevisionId,
            measurementSetIds: cur.measurementSetIds }
        : null;
      // History includes superseded versions. Nothing is deleted.
      historical.push(...ofType.filter((v) => v.twinVersionId !== cur?.twinVersionId)
        .map((v) => ({ twinVersionId: v.twinVersionId, twinType: v.twinType,
                       versionLabel: v.versionLabel, status: v.status, approvedAt: v.approvedAt })));
    }

    return {
      propertyId,
      // Passport stores references, never geometry.
      currentTwinVersionIds: Object.fromEntries(
        Object.entries(current).map(([k, v]) => [k, v?.twinVersionId || null])
      ),
      current, historicalTwinVersions: historical,
      note: "Passport records references to approved twin versions. It never stores meshes or point clouds.",
      createdAt: new Date().toISOString(),
    };
  },
};

/** Cortex reads reality. It never mutates twin history. */
export const CortexSpatialManifest = {
  build: async (propertyId, twinVersionIds = []) => {
    const versions = await RealityEngine.listVersions(propertyId);
    const chosen = versions.filter(
      (v) => approved(v) && (twinVersionIds.length === 0 || twinVersionIds.includes(v.twinVersionId))
    );

    const artifacts = [];
    const measurementSetIds = [];
    const thermalLayerIds = [];
    const availableLayers = new Set();
    const warnings = [];

    for (const v of chosen) {
      const detail = await RealityEngine.getVersion(v.twinVersionId);
      artifacts.push(...detail.artifacts.map((a) => a.spatialArtifactId));
      if (detail.measurements) measurementSetIds.push(detail.measurements.measurementSetId);
      if (detail.thermal) thermalLayerIds.push(detail.thermal.thermalLayerId);
      if (detail.layers)
        for (const [name, row] of Object.entries(detail.layers.layers))
          if (row.state === "AVAILABLE" || row.state === "PARTIAL") availableLayers.add(name);
      if (v.status === "APPROVED_WITH_WARNINGS")
        warnings.push(v.twinVersionId + " was approved with warnings.");
    }

    if (!chosen.length) warnings.push("No approved twin version is available for this property.");

    return {
      manifestId: "CXS-" + propertyId + "-" + Date.now(),
      propertyId,
      twinVersionIds: chosen.map((v) => v.twinVersionId),
      spatialArtifactIds: artifacts, measurementSetIds, thermalLayerIds,
      availableLayers: [...availableLayers],
      evidenceManifestId: null, warnings,
      createdAt: new Date().toISOString(),
    };
  },
};

/**
 * Core consumes approved geometry to calculate work. It cannot rewrite the
 * twin, and this projection exposes no mutation surface at all.
 */
export const CoreGeometryProjection = {
  build: async (propertyId, typeId = "TWIN_TYPE_A") => {
    const type = twinType(typeId);
    if (!type?.projectionRules.core)
      return { propertyId, twinType: typeId, available: false,
               reason: "This twin type does not project to Core." };

    const current = await RealityEngine.getCurrentVersion(propertyId, typeId);
    if (!current)
      return { propertyId, twinType: typeId, available: false,
               reason: "No approved twin version exists for this property and type." };

    const detail = await RealityEngine.getVersion(current.twinVersionId);
    return {
      propertyId, twinType: typeId, available: true, readOnly: true,
      twinVersionId: current.twinVersionId, versionLabel: current.versionLabel,
      approvedAt: current.approvedAt, qualityState: current.qualityState,
      roofGeometry: detail.roof || null,
      measurements: detail.measurements?.measurements || [],
      geometryArtifacts: detail.artifacts
        .filter((a) => ["MESH", "TEXTURED_MESH", "ROOF_GEOMETRY", "EXTERIOR_GEOMETRY"].includes(a.artifactType))
        .map((a) => ({ spatialArtifactId: a.spatialArtifactId, artifactType: a.artifactType, format: a.format })),
      note: "Read-only. Core may calculate work from this geometry; it cannot alter canonical twin history.",
    };
  },
};

/**
 * Pro receives an authorized professional view. A contractor's own overlays
 * and pricing live in Pro and never become canonical property truth.
 */
export const ProRealityProjection = {
  build: async (propertyId, typeId = "TWIN_TYPE_A", { organizationId = null, authorizedScopes = [] } = {}) => {
    const type = twinType(typeId);
    if (!type?.projectionRules.pro)
      return { propertyId, available: false, reason: "This twin type does not project to Pro." };
    if (!organizationId)
      return { propertyId, available: false, reason: "No professional organization is authorized on this property." };

    const current = await RealityEngine.getCurrentVersion(propertyId, typeId);
    if (!current)
      return { propertyId, available: false, reason: "No approved twin version exists." };

    const detail = await RealityEngine.getVersion(current.twinVersionId);
    const may = (scope) => authorizedScopes.length === 0 || authorizedScopes.includes(scope);

    return {
      propertyId, twinType: typeId, available: true, readOnly: true,
      organizationId, authorizedScopes,
      twinVersionId: current.twinVersionId, versionLabel: current.versionLabel,
      layers: may("DIGITAL_TWIN") ? detail.layers?.layers || null : null,
      measurements: may("MEASUREMENTS") ? detail.measurements?.measurements || [] : [],
      roofGeometry: may("DIGITAL_TWIN") ? detail.roof : null,
      note: "Read-only authorized projection. Professional annotations and private pricing remain in Pro and are never canonical property truth.",
    };
  },
};

/** Habitat reads authorized homeowner-appropriate projections. Read-only. */
export const HabitatRealityProjection = {
  build: async (propertyId, typeId = "TWIN_TYPE_A") => {
    const type = twinType(typeId);
    if (!type?.projectionRules.habitat)
      return { propertyId, available: false, reason: "This twin type does not project to Habitat." };

    const current = await RealityEngine.getCurrentVersion(propertyId, typeId);
    if (!current)
      return { propertyId, available: false, reason: "No approved twin version exists." };

    const detail = await RealityEngine.getVersion(current.twinVersionId);
    return {
      propertyId, twinType: typeId, available: true, readOnly: true,
      twinVersionId: current.twinVersionId, versionLabel: current.versionLabel,
      approvedAt: current.approvedAt,
      availableLayers: detail.layers
        ? Object.entries(detail.layers.layers).filter(([, r]) => r.state === "AVAILABLE").map(([n]) => n)
        : [],
      measurementCount: detail.measurements?.measurements.length || 0,
      note: "Read-only projection derived from approved canonical state. Habitat does not own reality.",
    };
  },
};

/**
 * Which twin-dependent report modules this property can actually support.
 * A module whose artifact does not exist is excluded WITH A REASON — never
 * rendered as an empty page.
 */
export const ReportTwinModules = {
  evaluate: async (propertyId) => {
    const versions = await RealityEngine.listVersions(propertyId);
    const approvedVersions = versions.filter(approved);

    const present = new Set();
    let hasApproved = false;
    for (const v of approvedVersions) {
      hasApproved = true;
      const detail = await RealityEngine.getVersion(v.twinVersionId);
      for (const a of detail.artifacts) present.add(a.artifactType);
      if (detail.thermal && ["ALIGNED", "ALIGNED_WITH_WARNINGS"].includes(detail.thermal.alignmentState))
        present.add("THERMAL_ALIGNED");
      if (detail.measurements) present.add("MEASUREMENTS");
    }
    const comparisons = await RealityEngine.listComparisons(propertyId);
    const usableComparison = comparisons.some((c) => c.status !== "INSUFFICIENT_DATA");

    const rule = (module, ok, reason) => ({ module, included: ok, reason: ok ? null : reason });

    return [
      rule("DIGITAL_TWIN", hasApproved && present.has("MESH"), "REQUIRED_ARTIFACT_UNAVAILABLE — no approved mesh"),
      rule("CAD_BIM", present.has("CAD_MODEL") || present.has("BIM_MODEL"), "REQUIRED_ARTIFACT_UNAVAILABLE — no CAD or BIM artifact exists"),
      rule("ROOF_GEOMETRY", present.has("ROOF_GEOMETRY"), "REQUIRED_ARTIFACT_UNAVAILABLE — no roof geometry"),
      rule("THERMAL_SPATIAL", present.has("THERMAL_ALIGNED"), "REQUIRED_ARTIFACT_UNAVAILABLE — no aligned thermal layer"),
      rule("MEASUREMENTS", present.has("MEASUREMENTS"), "REQUIRED_ARTIFACT_UNAVAILABLE — no measurement set"),
      rule("BEFORE_AFTER", usableComparison, "INSUFFICIENT_DATA — no usable comparison between versions"),
      rule("PROPERTY_REALITY_CHANGE", usableComparison, "INSUFFICIENT_DATA — no change set available"),
    ];
  },
};

export const RealityProjections = {
  passport: (id) => serve(() => PassportRealityProjection.build(id)),
  cortex: (id, versions) => serve(() => CortexSpatialManifest.build(id, versions)),
  core: (id, type) => serve(() => CoreGeometryProjection.build(id, type)),
  pro: (id, type, opts) => serve(() => ProRealityProjection.build(id, type, opts)),
  habitat: (id, type) => serve(() => HabitatRealityProjection.build(id, type)),
  reportModules: (id) => serve(() => ReportTwinModules.evaluate(id)),
};

export default RealityProjections;
