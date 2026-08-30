/**
 * PROPERTY REALITY PROCESSING PROVIDER
 *
 * Photogrammetry, LiDAR fusion, meshing, thermal registration and CAD/BIM
 * conversion are not implemented. This is the seam a real reconstruction
 * service would satisfy.
 *
 * The fixture provider produces deterministic METADATA DESCRIPTORS — never a
 * claim that a reconstruction ran. Counts it cannot know are null, not
 * impressive-looking numbers.
 */
import { serve } from "../shared/transport.js";
import { PROCESSING_STATE, SPATIAL_ARTIFACT_TYPE, POINT_CLOUD_SOURCE, COORDINATE_SYSTEM } from "./types.js";

export const PROVIDER_MODE = {
  CONNECTED: "CONNECTED", DISCONNECTED: "DISCONNECTED",
  FIXTURE: "FIXTURE", DEGRADED: "DEGRADED", ERROR: "ERROR",
};

export const PropertyRealityProcessingProvider = {
  name: "PropertyRealityProcessingProvider",
  mode: PROVIDER_MODE.FIXTURE,
  vendor: "development fixture — no reconstruction engine connected",
  isLive: () => PropertyRealityProcessingProvider.mode === PROVIDER_MODE.CONNECTED,

  /**
   * Produce a descriptor for an artifact this processor would create.
   * Every descriptor is marked SIMULATED, and any metric the fixture cannot
   * genuinely know is null.
   */
  produceDescriptor: (processorType, artifactType, context = {}) =>
    serve(() => {
      if (PropertyRealityProcessingProvider.mode === PROVIDER_MODE.DISCONNECTED)
        throw new Error("No reality processing provider is connected.");

      return {
        artifactType,
        format: FORMAT_FOR[artifactType] || null,
        // Nothing here counted a point, a vertex or a face. Claiming a number
        // would be inventing precision.
        pointCount: null,
        vertexCount: null,
        faceCount: null,
        resolution: null,
        coordinateSystem: COORDINATE_SYSTEM.LOCAL_PROPERTY,
        pointCloudSource:
          artifactType === SPATIAL_ARTIFACT_TYPE.POINT_CLOUD ? POINT_CLOUD_SOURCE.FIXTURE_POINT_CLOUD : null,
        sourceMode: "FIXTURE",
        isSimulated: true,
        notice: "SIMULATED DERIVED ARTIFACT — no photogrammetry, LiDAR or CAD processing was performed.",
        processorType,
        ...context,
      };
    }),

  /** A real run would stream progress. Fixture mode completes deterministically. */
  runJob: (job) =>
    serve(() => {
      if (!PropertyRealityProcessingProvider.isLive())
        return { ...job, status: PROCESSING_STATE.COMPLETE, sourceMode: "FIXTURE", progress: 100,
                 notice: "Fixture job — no computation was performed." };
      throw new Error("Live processing is not implemented.");
    }),

  health: () => ({
    id: "PropertyRealityProcessingProvider",
    name: "Reality Processing",
    mode: PropertyRealityProcessingProvider.mode,
    vendor: PropertyRealityProcessingProvider.vendor,
    isLive: PropertyRealityProcessingProvider.isLive(),
    detail: PropertyRealityProcessingProvider.isLive()
      ? "Connected reconstruction service"
      : "Development fixture — no photogrammetry, LiDAR or CAD engine is connected",
  }),
};

const FORMAT_FOR = {
  POINT_CLOUD: "LAS/LAZ (descriptor only)",
  MESH: "OBJ (descriptor only)",
  TEXTURED_MESH: "glTF (descriptor only)",
  ORTHOMOSAIC: "GeoTIFF (descriptor only)",
  ROOF_GEOMETRY: "GeoJSON (descriptor only)",
  EXTERIOR_GEOMETRY: "GeoJSON (descriptor only)",
  THERMAL_SPATIAL_LAYER: "GeoJSON (descriptor only)",
  CAD_MODEL: "DXF",
  BIM_MODEL: "IFC",
};

/** Comparison is its own processor and is equally honest about fixtures. */
export const ComparisonProvider = {
  name: "ComparisonProvider",
  mode: PROVIDER_MODE.FIXTURE,
  vendor: "development fixture",
  isLive: () => false,
  health: () => ({
    id: "ComparisonProvider", name: "Reality Comparison",
    mode: PROVIDER_MODE.FIXTURE, vendor: "development fixture", isLive: false,
    detail: "Fixture comparison — no geometric difference computation is performed",
  }),
};

export const realityProviderHealth = () => [
  PropertyRealityProcessingProvider.health(),
  ComparisonProvider.health(),
];
