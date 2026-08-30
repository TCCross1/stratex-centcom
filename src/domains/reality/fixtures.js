/**
 * PROPERTY REALITY FIXTURES — development data only.
 *
 * Every geometric artifact here is a DESCRIPTOR, not a model. No photogrammetry
 * ran, no LiDAR was fused, no CAD was generated. Counts that a real processor
 * would report — points, vertices, faces — are null rather than invented, and
 * every record carries `isSimulated: true`.
 */
import { iso, ago } from "../../utils/format.js";

const SIM = {
  sourceMode: "FIXTURE",
  isSimulated: true,
  notice: "SIMULATED DERIVED ARTIFACT — no reconstruction was performed.",
};

/** No counts are fabricated. A fixture cannot know them. */
const NO_COUNTS = { pointCount: null, vertexCount: null, faceCount: null, resolution: null };

export const realityModels = [
  { propertyRealityId: "PR-004182", propertyId: "SXP-004182", currentVersionId: "TWV-A182-2",
    status: "ACTIVE", createdAt: iso("2026-02-11"), updatedAt: ago(28),
    availableTwinTypes: ["TWIN_TYPE_A", "TWIN_TYPE_B"],
    latestValidatedMissionId: "M-2026-0827-012", latestEvidenceManifestId: "CXM-0001",
    currentPassportRevisionId: "r14", overallQualityState: "PASS",
    overallCompletenessState: "COMPLETE", processingState: "COMPLETE", reviewState: "APPROVED" },

  { propertyRealityId: "PR-004179", propertyId: "SXP-004179", currentVersionId: "TWV-C179-1",
    status: "ACTIVE", createdAt: iso("2026-01-04"), updatedAt: ago(300),
    availableTwinTypes: ["TWIN_TYPE_C"],
    latestValidatedMissionId: "M-2026-0829-017", latestEvidenceManifestId: null,
    currentPassportRevisionId: "r09", overallQualityState: "PASS_WITH_WARNINGS",
    overallCompletenessState: "COMPLETE_WITH_WARNINGS", processingState: "COMPLETE", reviewState: "APPROVED_WITH_WARNINGS" },

  { propertyRealityId: "PR-004188", propertyId: "SXP-004188", currentVersionId: null,
    status: "PROCESSING", createdAt: ago(380), updatedAt: ago(30),
    availableTwinTypes: ["TWIN_TYPE_B"],
    latestValidatedMissionId: "M-2026-0829-016", latestEvidenceManifestId: null,
    currentPassportRevisionId: null, overallQualityState: "NOT_EVALUATED",
    overallCompletenessState: "PARTIAL", processingState: "RUNNING", reviewState: "REVIEW_REQUIRED" },

  // A property with a validated capture that failed reconstruction.
  { propertyRealityId: "PR-004190", propertyId: "SXP-004190", currentVersionId: null,
    status: "FAILED", createdAt: ago(1300), updatedAt: ago(1290),
    availableTwinTypes: [], latestValidatedMissionId: null, latestEvidenceManifestId: null,
    currentPassportRevisionId: null, overallQualityState: "FAIL",
    overallCompletenessState: "INCOMPLETE", processingState: "FAILED", reviewState: "NOT_REVIEWED" },

  // A property with no reality at all.
  { propertyRealityId: "PR-004191", propertyId: "SXP-004191", currentVersionId: null,
    status: "NO_REALITY", createdAt: ago(60), updatedAt: ago(60),
    availableTwinTypes: [], latestValidatedMissionId: null, latestEvidenceManifestId: null,
    currentPassportRevisionId: null, overallQualityState: "NOT_EVALUATED",
    overallCompletenessState: "UNKNOWN", processingState: "NOT_STARTED", reviewState: "NOT_REVIEWED" },
];

const v = (o) => ({
  propertyRealityId: null, sourceProcessingJobIds: [], approvedAt: null, approvedBy: null,
  supersedesTwinVersionId: null, supersededByTwinVersionId: null,
  coordinateSystem: "LOCAL_PROPERTY", originReference: "Property centroid (fixture)",
  bounds: null, unitSystem: "IMPERIAL",
  geometryArtifactIds: [], textureArtifactIds: [], thermalArtifactIds: [],
  measurementSetIds: [], layerSetId: null, passportRevisionId: null,
  sourceMode: "FIXTURE", notes: null, ...o,
});

export const twinVersions = [
  // SXP-004182 — Twin A V1 superseded by V2
  v({ twinVersionId: "TWV-A182-1", propertyRealityId: "PR-004182", propertyId: "SXP-004182",
      twinType: "TWIN_TYPE_A", versionNumber: 1, versionLabel: "V1", status: "SUPERSEDED",
      sourceMissionIds: ["M-2026-0827-012"], sourceCapturePackageIds: ["CP-012-1"],
      sourceEvidenceIds: ["EA-90211"], createdAt: iso("2026-02-11"), createdBy: "u-001",
      approvedAt: iso("2026-02-12"), approvedBy: "u-001",
      supersededByTwinVersionId: "TWV-A182-2",
      qualityState: "PASS", completenessState: "COMPLETE",
      layerSetId: "LS-A182-1", passportRevisionId: "r09" }),

  v({ twinVersionId: "TWV-A182-2", propertyRealityId: "PR-004182", propertyId: "SXP-004182",
      twinType: "TWIN_TYPE_A", versionNumber: 2, versionLabel: "V2", status: "APPROVED",
      sourceMissionIds: ["M-2026-0827-012"], sourceCapturePackageIds: ["CP-012-1"],
      sourceEvidenceIds: ["EA-90211", "EA-90212"], createdAt: iso("2026-08-27"), createdBy: "u-001",
      approvedAt: iso("2026-08-28"), approvedBy: "u-001",
      supersedesTwinVersionId: "TWV-A182-1",
      qualityState: "PASS", completenessState: "COMPLETE",
      layerSetId: "LS-A182-2", passportRevisionId: "r14",
      measurementSetIds: ["TMS-A182-2"] }),

  // SXP-004182 — Twin B, thermal, approved with warnings
  v({ twinVersionId: "TWV-B182-1", propertyRealityId: "PR-004182", propertyId: "SXP-004182",
      twinType: "TWIN_TYPE_B", versionNumber: 1, versionLabel: "V1", status: "APPROVED_WITH_WARNINGS",
      sourceMissionIds: ["M-2026-0827-012"], sourceCapturePackageIds: ["CP-012-1"],
      sourceEvidenceIds: ["EA-90212"], createdAt: iso("2026-08-27"), createdBy: "u-001",
      approvedAt: iso("2026-08-28"), approvedBy: "u-001",
      qualityState: "PASS_WITH_WARNINGS", completenessState: "COMPLETE_WITH_WARNINGS",
      layerSetId: "LS-B182-1", passportRevisionId: "r14",
      notes: "Thermal alignment partial on the north plane." }),

  // SXP-004179 — Twin C, lightweight
  v({ twinVersionId: "TWV-C179-1", propertyRealityId: "PR-004179", propertyId: "SXP-004179",
      twinType: "TWIN_TYPE_C", versionNumber: 1, versionLabel: "V1", status: "APPROVED",
      sourceMissionIds: ["M-2026-0829-017"], sourceCapturePackageIds: [],
      sourceEvidenceIds: [], createdAt: iso("2026-08-29"), createdBy: "u-001",
      approvedAt: iso("2026-08-29"), approvedBy: "u-001",
      qualityState: "PASS", completenessState: "COMPLETE",
      layerSetId: "LS-C179-1", passportRevisionId: "r09" }),

  // SXP-004188 — Twin B awaiting review
  v({ twinVersionId: "TWV-B188-1", propertyRealityId: "PR-004188", propertyId: "SXP-004188",
      twinType: "TWIN_TYPE_B", versionNumber: 1, versionLabel: "V1", status: "REVIEW_REQUIRED",
      sourceMissionIds: ["M-2026-0829-016"], sourceCapturePackageIds: ["CP-016-1"],
      sourceEvidenceIds: ["EA-16001"], createdAt: ago(300), createdBy: "u-001",
      qualityState: "NOT_EVALUATED", completenessState: "PARTIAL",
      layerSetId: "LS-B188-1" }),

  // SXP-004190 — failed reconstruction
  v({ twinVersionId: "TWV-A190-1", propertyRealityId: "PR-004190", propertyId: "SXP-004190",
      twinType: "TWIN_TYPE_A", versionNumber: 1, versionLabel: "V1", status: "FAILED",
      sourceMissionIds: ["M-2026-0829-015"], sourceCapturePackageIds: ["CP-015-1"],
      sourceEvidenceIds: ["EA-15001"], createdAt: ago(1300), createdBy: "u-001",
      qualityState: "FAIL", completenessState: "INCOMPLETE",
      notes: "Insufficient overlap — reconstruction could not resolve roof planes." }),
];

const art = (o) => ({ ...SIM, ...NO_COUNTS, coordinateSystem: "LOCAL_PROPERTY", unitSystem: "IMPERIAL",
  bounds: null, qualityState: "NOT_EVALUATED", pointCloudSource: null, createdAt: ago(2700), ...o });

export const spatialArtifacts = [
  // Twin A V2 — full set
  art({ spatialArtifactId: "SPA-A182-PC", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
        artifactType: "POINT_CLOUD", sourceEvidenceIds: ["EA-90211"], processingJobId: "RJOB-A182-1",
        format: "LAS/LAZ (descriptor only)", storageReference: "reality/SXP-004182/TWV-A182-2/POINT_CLOUD",
        pointCloudSource: "FIXTURE_POINT_CLOUD", qualityState: "PASS" }),
  art({ spatialArtifactId: "SPA-A182-MESH", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
        artifactType: "MESH", sourceEvidenceIds: ["EA-90211"], processingJobId: "RJOB-A182-2",
        format: "OBJ (descriptor only)", storageReference: "reality/SXP-004182/TWV-A182-2/MESH",
        meshQuality: "HOLES_PRESENT", qualityState: "PASS_WITH_WARNINGS" }),
  art({ spatialArtifactId: "SPA-A182-TEX", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
        artifactType: "TEXTURED_MESH", sourceEvidenceIds: ["EA-90211"], processingJobId: "RJOB-A182-3",
        format: "glTF (descriptor only)", storageReference: "reality/SXP-004182/TWV-A182-2/TEXTURED_MESH",
        textureSourceEvidenceIds: ["EA-90211"], qualityState: "PASS" }),
  art({ spatialArtifactId: "SPA-A182-ROOF", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
        artifactType: "ROOF_GEOMETRY", sourceEvidenceIds: ["EA-90211"], processingJobId: "RJOB-A182-4",
        format: "GeoJSON (descriptor only)", storageReference: "reality/SXP-004182/TWV-A182-2/ROOF_GEOMETRY",
        qualityState: "PASS" }),
  art({ spatialArtifactId: "SPA-A182-ORTHO", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
        artifactType: "ORTHOMOSAIC", sourceEvidenceIds: ["EA-90211"], processingJobId: "RJOB-A182-5",
        format: "GeoTIFF (descriptor only)", storageReference: "reality/SXP-004182/TWV-A182-2/ORTHOMOSAIC",
        qualityState: "PASS" }),

  // Twin A V1 — the earlier, superseded reality still exists
  art({ spatialArtifactId: "SPA-A182-PC-V1", propertyId: "SXP-004182", twinVersionId: "TWV-A182-1",
        artifactType: "POINT_CLOUD", sourceEvidenceIds: ["EA-90211"], processingJobId: "RJOB-A182-0",
        format: "LAS/LAZ (descriptor only)", storageReference: "reality/SXP-004182/TWV-A182-1/POINT_CLOUD",
        pointCloudSource: "FIXTURE_POINT_CLOUD", qualityState: "PASS", createdAt: iso("2026-02-11") }),
  art({ spatialArtifactId: "SPA-A182-MESH-V1", propertyId: "SXP-004182", twinVersionId: "TWV-A182-1",
        artifactType: "MESH", sourceEvidenceIds: ["EA-90211"], processingJobId: "RJOB-A182-0",
        format: "OBJ (descriptor only)", storageReference: "reality/SXP-004182/TWV-A182-1/MESH",
        meshQuality: "COMPLETE", qualityState: "PASS", createdAt: iso("2026-02-11") }),

  // Twin B — mesh + thermal spatial layer, no textured mesh required
  art({ spatialArtifactId: "SPA-B182-MESH", propertyId: "SXP-004182", twinVersionId: "TWV-B182-1",
        artifactType: "MESH", sourceEvidenceIds: ["EA-90211"], processingJobId: "RJOB-B182-1",
        format: "OBJ (descriptor only)", storageReference: "reality/SXP-004182/TWV-B182-1/MESH",
        meshQuality: "PARTIAL", qualityState: "PASS_WITH_WARNINGS" }),
  art({ spatialArtifactId: "SPA-B182-THERM", propertyId: "SXP-004182", twinVersionId: "TWV-B182-1",
        artifactType: "THERMAL_SPATIAL_LAYER", sourceEvidenceIds: ["EA-90212"], processingJobId: "RJOB-B182-2",
        format: "GeoJSON (descriptor only)", storageReference: "reality/SXP-004182/TWV-B182-1/THERMAL",
        qualityState: "PASS_WITH_WARNINGS" }),

  // Twin C — orthomosaic + roof only
  art({ spatialArtifactId: "SPA-C179-ORTHO", propertyId: "SXP-004179", twinVersionId: "TWV-C179-1",
        artifactType: "ORTHOMOSAIC", sourceEvidenceIds: [], processingJobId: "RJOB-C179-1",
        format: "GeoTIFF (descriptor only)", storageReference: "reality/SXP-004179/TWV-C179-1/ORTHOMOSAIC",
        qualityState: "PASS" }),
  art({ spatialArtifactId: "SPA-C179-ROOF", propertyId: "SXP-004179", twinVersionId: "TWV-C179-1",
        artifactType: "ROOF_GEOMETRY", sourceEvidenceIds: [], processingJobId: "RJOB-C179-2",
        format: "GeoJSON (descriptor only)", storageReference: "reality/SXP-004179/TWV-C179-1/ROOF_GEOMETRY",
        qualityState: "PASS" }),

  // Twin B on 004188 — partial: mesh missing, so completeness is PARTIAL
  art({ spatialArtifactId: "SPA-B188-THERM", propertyId: "SXP-004188", twinVersionId: "TWV-B188-1",
        artifactType: "THERMAL_SPATIAL_LAYER", sourceEvidenceIds: ["EA-16001"], processingJobId: "RJOB-B188-1",
        format: "GeoJSON (descriptor only)", storageReference: "reality/SXP-004188/TWV-B188-1/THERMAL",
        qualityState: "NOT_EVALUATED" }),
];

export const thermalLayers = [
  { thermalLayerId: "TSL-B182-1", propertyId: "SXP-004182", twinVersionId: "TWV-B182-1",
    sourceThermalEvidenceIds: ["EA-90260"], sourceRadiometricEvidenceIds: ["EA-90212"],
    alignmentMethod: "FIXTURE_REGISTRATION", alignmentState: "ALIGNED_WITH_WARNINGS",
    processingVersion: "fixture-1.0", qualityState: "PASS_WITH_WARNINGS", coverageState: "PARTIAL",
    radiometricAvailable: true, sourceMode: "FIXTURE",
    notes: "North plane alignment is partial. Radiometric source is present but no calibrated surface temperatures are published." },

  { thermalLayerId: "TSL-B188-1", propertyId: "SXP-004188", twinVersionId: "TWV-B188-1",
    sourceThermalEvidenceIds: [], sourceRadiometricEvidenceIds: [],
    alignmentMethod: null, alignmentState: "NOT_STARTED",
    processingVersion: null, qualityState: "NOT_EVALUATED", coverageState: "UNKNOWN",
    radiometricAvailable: false, sourceMode: "FIXTURE",
    notes: "No radiometric source has been associated. No temperature values can be claimed." },
];

export const roofGeometries = [
  { roofGeometryId: "RG-A182-2", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
    qualityState: "PASS", sourceMode: "FIXTURE", isSimulated: true,
    sections: [
      { featureId: "ROOF-PLANE-01", label: "North plane", areaSqFt: 1424, pitch: "6.5:12", derived: true },
      { featureId: "ROOF-PLANE-02", label: "South plane", areaSqFt: 1432, pitch: "6.5:12", derived: true },
    ],
    ridges: [{ featureId: "ROOF-RIDGE-01", label: "Main ridge", lengthFt: 86 }],
    hips: [], valleys: [{ featureId: "ROOF-VALLEY-01", label: "East valley", lengthFt: 18 }],
    eaves: [{ featureId: "ROOF-EAVE-01", label: "Perimeter eave", lengthFt: 168 }],
    rakes: [], penetrations: [{ featureId: "ROOF-PEN-01", label: "Chimney", count: 1 }] },
];

export const measurementSets = [
  { measurementSetId: "TMS-A182-2", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
    sourceEvidenceIds: ["EA-90211"], sourceSpatialArtifactIds: ["SPA-A182-ROOF", "SPA-A182-MESH"],
    processorVersion: "fixture-1.0", qualityState: "PASS", createdAt: iso("2026-08-27"), sourceMode: "FIXTURE",
    measurements: [
      { measurementId: "TM-0001", featureId: "ROOF-PLANE-01", name: "North plane area", value: 1424, unit: "sq ft",
        category: "ROOF", method: "PHOTOGRAMMETRIC", truthClassification: "DERIVED",
        sourceEvidenceIds: ["EA-90211"], sourceArtifactIds: ["SPA-A182-ROOF"],
        precision: "±2%", qualityState: "PASS", createdAt: iso("2026-08-27") },
      { measurementId: "TM-0002", featureId: "ROOF-RIDGE-01", name: "Main ridge length", value: 86, unit: "lf",
        category: "ROOF", method: "GEOMETRIC_DERIVATION", truthClassification: "DERIVED",
        sourceEvidenceIds: ["EA-90211"], sourceArtifactIds: ["SPA-A182-ROOF"],
        precision: "±1%", qualityState: "PASS", createdAt: iso("2026-08-27") },
      { measurementId: "TM-0003", featureId: null, name: "Ambient temperature at capture", value: 72, unit: "°F",
        category: "THERMAL", method: "DIRECT_SENSOR", truthClassification: "MEASURED",
        sourceEvidenceIds: ["EA-90212"], sourceArtifactIds: [],
        precision: null, qualityState: "PASS", createdAt: iso("2026-08-27") },
    ] },
];

export const qualityAssessments = [
  { assessmentId: "TQA-A182-2", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2",
    geometryQuality: "PASS", textureQuality: "PASS", thermalAlignmentQuality: "NOT_EVALUATED",
    measurementQuality: "PASS", coverageQuality: "PASS", overallState: "PASS",
    checks: [
      { code: "GEOM", label: "Geometry closure", state: "PASS", source: "FIXTURE" },
      { code: "TEX", label: "Texture coverage", state: "PASS", source: "FIXTURE" },
      { code: "MESH_HOLES", label: "Mesh holes", state: "WARNING", source: "FIXTURE", detail: "Small holes under the eave overhang." },
    ],
    warnings: ["Mesh holes"], reviewedAt: iso("2026-08-28"), reviewedBy: "u-001", sourceMode: "FIXTURE" },
];

const layerRow = (state, obs = "KNOWN", note = null) => ({ state, observation: obs, note });

export const layerSets = [
  { layerSetId: "LS-A182-2", propertyId: "SXP-004182", twinVersionId: "TWV-A182-2", sourceMode: "FIXTURE",
    layers: {
      BASE_GEOMETRY: layerRow("AVAILABLE"), RGB_TEXTURE: layerRow("AVAILABLE"),
      THERMAL: layerRow("NOT_PROCESSED", "UNKNOWN", "Thermal belongs to the Twin B version for this property."),
      ROOF: layerRow("AVAILABLE"), EXTERIOR_ENVELOPE: layerRow("AVAILABLE"),
      WINDOWS: layerRow("PARTIAL", "DERIVED", "Openings inferred from geometry, not individually verified."),
      DOORS: layerRow("PARTIAL", "DERIVED"),
      // Concealed systems are never rendered as observed.
      HVAC: layerRow("NOT_OBSERVED", "UNKNOWN", "Concealed equipment was not observed by this capture."),
      ELECTRICAL: layerRow("NOT_OBSERVED", "UNKNOWN", "Wiring inside walls cannot be observed from an exterior capture."),
      PLUMBING: layerRow("NOT_OBSERVED", "UNKNOWN", "Concealed plumbing cannot be observed from an exterior capture."),
      FOUNDATION: layerRow("PARTIAL", "DERIVED", "Only the visible foundation band was captured."),
      DRAINAGE: layerRow("NOT_OBSERVED", "UNKNOWN"),
      MEASUREMENTS: layerRow("AVAILABLE"), FINDINGS: layerRow("AVAILABLE"),
      PROJECTS: layerRow("AVAILABLE"), REPAIRS: layerRow("AVAILABLE"),
      MAINTENANCE: layerRow("AVAILABLE"), EVIDENCE: layerRow("AVAILABLE"),
      CORTEX: layerRow("AVAILABLE"), PASSPORT: layerRow("AVAILABLE"),
    } },

  { layerSetId: "LS-B182-1", propertyId: "SXP-004182", twinVersionId: "TWV-B182-1", sourceMode: "FIXTURE",
    layers: {
      BASE_GEOMETRY: layerRow("AVAILABLE"), RGB_TEXTURE: layerRow("NOT_APPLICABLE", "UNKNOWN", "Twin B does not require texture."),
      THERMAL: layerRow("PARTIAL", "DERIVED", "Alignment partial on the north plane."),
      ROOF: layerRow("PARTIAL"), EXTERIOR_ENVELOPE: layerRow("PARTIAL"),
      WINDOWS: layerRow("NOT_OBSERVED", "UNKNOWN"), DOORS: layerRow("NOT_OBSERVED", "UNKNOWN"),
      HVAC: layerRow("PROBABLE" === "PROBABLE" ? "PARTIAL" : "PARTIAL", "PROBABLE", "Thermal signature suggests register locations. Inferred, not observed."),
      ELECTRICAL: layerRow("NOT_OBSERVED", "UNKNOWN"), PLUMBING: layerRow("NOT_OBSERVED", "UNKNOWN"),
      FOUNDATION: layerRow("NOT_OBSERVED", "UNKNOWN"), DRAINAGE: layerRow("NOT_OBSERVED", "UNKNOWN"),
      MEASUREMENTS: layerRow("NOT_PROCESSED"), FINDINGS: layerRow("AVAILABLE"),
      PROJECTS: layerRow("AVAILABLE"), REPAIRS: layerRow("AVAILABLE"),
      MAINTENANCE: layerRow("AVAILABLE"), EVIDENCE: layerRow("AVAILABLE"),
      CORTEX: layerRow("AVAILABLE"), PASSPORT: layerRow("AVAILABLE"),
    } },

  { layerSetId: "LS-C179-1", propertyId: "SXP-004179", twinVersionId: "TWV-C179-1", sourceMode: "FIXTURE",
    layers: {
      BASE_GEOMETRY: layerRow("PARTIAL"), RGB_TEXTURE: layerRow("AVAILABLE"),
      ROOF: layerRow("AVAILABLE"), EXTERIOR_ENVELOPE: layerRow("PARTIAL"),
      MEASUREMENTS: layerRow("NOT_PROCESSED"), FINDINGS: layerRow("AVAILABLE"),
      EVIDENCE: layerRow("AVAILABLE"), PASSPORT: layerRow("AVAILABLE"),
    } },

  { layerSetId: "LS-B188-1", propertyId: "SXP-004188", twinVersionId: "TWV-B188-1", sourceMode: "FIXTURE",
    layers: {
      BASE_GEOMETRY: layerRow("NOT_PROCESSED"), THERMAL: layerRow("NOT_PROCESSED"),
      ROOF: layerRow("NOT_OBSERVED", "UNKNOWN"), EVIDENCE: layerRow("AVAILABLE"),
    } },

  { layerSetId: "LS-A182-1", propertyId: "SXP-004182", twinVersionId: "TWV-A182-1", sourceMode: "FIXTURE",
    layers: { BASE_GEOMETRY: layerRow("AVAILABLE"), RGB_TEXTURE: layerRow("AVAILABLE"), ROOF: layerRow("AVAILABLE") } },
];

export const comparisons = [];

export const changeSets = [
  { changeSetId: "RCS-SEED-1", propertyId: "SXP-004182",
    baseTwinVersionId: "TWV-A182-1", comparisonTwinVersionId: "TWV-A182-2",
    isSimulated: true, sourceMode: "FIXTURE",
    notice: "SIMULATED COMPARISON — no geometric difference computation was performed.",
    reviewState: "PENDING", createdAt: iso("2026-08-28"),
    changes: [
      { changeId: "CH-0001", changeClass: "MODIFIED", baseFeatureId: "ROOF-PLANE-01",
        newFeatureId: "ROOF-PLANE-01", description: "Roof covering replaced between versions.",
        sourceArtifactIds: ["SPA-A182-MESH-V1", "SPA-A182-MESH"], processorVersion: "fixture-1.0", isSimulated: true },
      { changeId: "CH-0002", changeClass: "THERMAL_CHANGED", baseFeatureId: "ROOF-PLANE-01",
        newFeatureId: "ROOF-PLANE-01", description: "Thermal behaviour differs from the prior version.",
        sourceArtifactIds: ["SPA-B182-THERM"], processorVersion: "fixture-1.0", isSimulated: true },
    ] },
];

export const realityJobs = [
  { jobId: "RJOB-A182-1", propertyId: "SXP-004182", manifestId: null, twinVersionId: "TWV-A182-2",
    twinType: "TWIN_TYPE_A", processorType: "POINT_CLOUD_GENERATION", processorVersion: "fixture-1.0",
    status: "COMPLETE", inputEvidenceIds: ["EA-90211"], inputArtifactIds: [],
    outputArtifactIds: ["SPA-A182-PC"], startedAt: iso("2026-08-27T12:00:00"),
    completedAt: iso("2026-08-27T12:40:00"), progress: 100, warningCodes: [],
    failureReason: null, provider: "PropertyRealityProcessingProvider", sourceMode: "FIXTURE" },

  { jobId: "RJOB-A182-2", propertyId: "SXP-004182", manifestId: null, twinVersionId: "TWV-A182-2",
    twinType: "TWIN_TYPE_A", processorType: "MESH_GENERATION", processorVersion: "fixture-1.0",
    status: "COMPLETE_WITH_WARNINGS", inputEvidenceIds: ["EA-90211"], inputArtifactIds: ["SPA-A182-PC"],
    outputArtifactIds: ["SPA-A182-MESH"], startedAt: iso("2026-08-27T12:41:00"),
    completedAt: iso("2026-08-27T13:10:00"), progress: 100, warningCodes: ["MESH_HOLES"],
    failureReason: null, provider: "PropertyRealityProcessingProvider", sourceMode: "FIXTURE" },

  { jobId: "RJOB-B182-2", propertyId: "SXP-004182", manifestId: null, twinVersionId: "TWV-B182-1",
    twinType: "TWIN_TYPE_B", processorType: "THERMAL_ALIGNMENT", processorVersion: "fixture-1.0",
    status: "COMPLETE_WITH_WARNINGS", inputEvidenceIds: ["EA-90212"], inputArtifactIds: ["SPA-B182-MESH"],
    outputArtifactIds: ["SPA-B182-THERM"], startedAt: iso("2026-08-27T13:20:00"),
    completedAt: iso("2026-08-27T13:35:00"), progress: 100, warningCodes: ["PARTIAL_ALIGNMENT"],
    failureReason: null, provider: "PropertyRealityProcessingProvider", sourceMode: "FIXTURE" },

  { jobId: "RJOB-A190-1", propertyId: "SXP-004190", manifestId: null, twinVersionId: "TWV-A190-1",
    twinType: "TWIN_TYPE_A", processorType: "PHOTOGRAMMETRY", processorVersion: "fixture-1.0",
    status: "FAILED", inputEvidenceIds: ["EA-15001"], inputArtifactIds: [], outputArtifactIds: [],
    startedAt: ago(1300), completedAt: ago(1298), progress: 0, warningCodes: [],
    failureReason: "Insufficient overlap — capture coverage was 71%.",
    provider: "PropertyRealityProcessingProvider", sourceMode: "FIXTURE" },

  { jobId: "RJOB-B188-1", propertyId: "SXP-004188", manifestId: null, twinVersionId: "TWV-B188-1",
    twinType: "TWIN_TYPE_B", processorType: "THERMAL_ALIGNMENT", processorVersion: "fixture-1.0",
    status: "RUNNING", inputEvidenceIds: ["EA-16001"], inputArtifactIds: [], outputArtifactIds: ["SPA-B188-THERM"],
    startedAt: ago(30), completedAt: null, progress: 45, warningCodes: [],
    failureReason: null, provider: "PropertyRealityProcessingProvider", sourceMode: "FIXTURE" },
];
