/**
 * EVIDENCE VAULT FIXTURES — development data only.
 *
 * Nothing here is genuine field capture. Every record carries
 * `sourceMode: "FIXTURE"`, and no fixture asset claims a computed hash: with
 * no bytes there is no digest, so hashState is NOT_COMPUTED_FIXTURE.
 */
import { iso, ago } from "../../utils/format.js";
import { originalPath, derivedPath, STORAGE_TIER } from "./storage.js";

const F = "FIXTURE";
const NO_HASH = { hashAlgorithm: "SHA-256", contentHash: null, hashState: "NOT_COMPUTED_FIXTURE", hashVerifiedAt: null };

export const capturePackages = [
  { capturePackageId: "CP-012-1", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    captureSessionId: "CAP-012-1", attemptNumber: 1, createdAt: iso("2026-08-27T11:40:00"),
    closedAt: iso("2026-08-27T11:50:00"), operatorId: "OP-01", aircraftId: "AC-M4TD-01",
    sensorPackageId: "SP-RGB-IR-LID", status: "APPROVED",
    expectedArtifactTypes: ["RGB_IMAGE", "THERMAL_RJPEG", "TELEMETRY_LOG"],
    receivedArtifactCount: 5, requiredArtifactCount: 3, coverageState: "COMPLETE",
    validationState: "APPROVED", ingestState: "COMPLETE", sourceMode: F, notes: null },

  { capturePackageId: "CP-015-1", propertyId: "SXP-004190", missionId: "M-2026-0829-015",
    captureSessionId: "CAP-015-1", attemptNumber: 1, createdAt: ago(1340),
    closedAt: ago(1330), operatorId: "OP-02", aircraftId: "AC-M4TD-02",
    sensorPackageId: "SP-RGB", status: "RECAPTURE_REQUIRED",
    expectedArtifactTypes: ["RGB_IMAGE"], receivedArtifactCount: 2, requiredArtifactCount: 1,
    coverageState: "INCOMPLETE", validationState: "RECAPTURE_REQUIRED", ingestState: "COMPLETE",
    sourceMode: F, notes: "Rear roof plane, west elevation and chimney not captured." },

  { capturePackageId: "CP-015-2", propertyId: "SXP-004190", missionId: "M-2026-0829-015",
    captureSessionId: "CAP-015-2", attemptNumber: 2, createdAt: ago(60), closedAt: null,
    operatorId: "OP-02", aircraftId: "AC-M4TD-02", sensorPackageId: "SP-RGB",
    status: "OPEN", expectedArtifactTypes: ["RGB_IMAGE"], receivedArtifactCount: 0,
    requiredArtifactCount: 1, coverageState: "NOT_EVALUATED", validationState: "NOT_REVIEWED",
    ingestState: "NOT_STARTED", sourceMode: F, notes: "Recapture attempt for the missing surfaces." },

  { capturePackageId: "CP-016-1", propertyId: "SXP-004188", missionId: "M-2026-0829-016",
    captureSessionId: "CAP-016-1", attemptNumber: 1, createdAt: ago(380), closedAt: ago(375),
    operatorId: "OP-01", aircraftId: "AC-M4TD-01", sensorPackageId: "SP-RGB-IR",
    status: "APPROVED_WITH_WARNINGS", expectedArtifactTypes: ["RGB_IMAGE", "THERMAL_RJPEG"],
    receivedArtifactCount: 3, requiredArtifactCount: 2, coverageState: "COMPLETE_WITH_WARNINGS",
    validationState: "APPROVED_WITH_WARNINGS", ingestState: "COMPLETE", sourceMode: F, notes: null },
];

const base = (id, pkg, prop, mission, capture) => ({
  evidenceId: id, capturePackageId: pkg, propertyId: prop, missionId: mission,
  captureSessionId: capture, sourceMode: F, ...NO_HASH,
  ingestState: "COMPLETE", createdAt: ago(2700), ingestedAt: ago(2700),
});

export const evidenceAssets = [
  // --- CP-012-1: a clean, approved package -------------------------------
  { ...base("EA-90211", "CP-012-1", "SXP-004182", "M-2026-0827-012", "CAP-012-1"),
    parentEvidenceId: null, origin: "ORIGINAL", artifactType: "RGB_IMAGE", thermalKind: null,
    mediaType: "image/jpeg", sensorType: "RGB", filename: "DJI_0412.JPG", originalFilename: "DJI_0412.JPG",
    extension: "JPG", byteSize: 12400000, capturedAt: iso("2026-08-27T09:22:00"),
    deviceId: "AC-M4TD-01", aircraftId: "AC-M4TD-01", sensorId: "S-RGB-4", operatorId: "OP-01",
    location: { latitude: 38.0106, longitude: -84.4258, altitudeFt: 180 },
    pose: { yaw: 45, pitch: -30, roll: 0 }, heading: 45, altitude: 180,
    storageReference: originalPath("SXP-004182", "M-2026-0827-012", "CAP-012-1", "EA-90211"),
    storageTier: STORAGE_TIER.ARCHIVE, immutabilityState: "IMMUTABLE",
    reviewState: "APPROVED", qualityState: "PASS", coverageState: "COMPLETE",
    truthClassification: null, metadata: { captureMode: "Nadir grid" } },

  { ...base("EA-90212", "CP-012-1", "SXP-004182", "M-2026-0827-012", "CAP-012-1"),
    parentEvidenceId: null, origin: "ORIGINAL", artifactType: "THERMAL_RJPEG",
    thermalKind: "RADIOMETRIC_SOURCE", mediaType: "image/jpeg", sensorType: "THERMAL",
    filename: "DJI_0412_R.JPEG", originalFilename: "DJI_0412_R.JPEG", extension: "JPEG",
    byteSize: 3100000, capturedAt: iso("2026-08-27T09:22:01"),
    deviceId: "AC-M4TD-01", aircraftId: "AC-M4TD-01", sensorId: "S-IR-4", operatorId: "OP-01",
    location: { latitude: 38.0106, longitude: -84.4258, altitudeFt: 180 },
    pose: { yaw: 45, pitch: -30, roll: 0 }, heading: 45, altitude: 180,
    storageReference: originalPath("SXP-004182", "M-2026-0827-012", "CAP-012-1", "EA-90212"),
    storageTier: STORAGE_TIER.ARCHIVE, immutabilityState: "IMMUTABLE",
    reviewState: "APPROVED", qualityState: "PASS", coverageState: "COMPLETE",
    truthClassification: null,
    metadata: { radiometric: true, note: "Radiometric source. A rendered thermal picture is not equivalent to this." } },

  { ...base("EA-90213", "CP-012-1", "SXP-004182", "M-2026-0827-012", "CAP-012-1"),
    parentEvidenceId: null, origin: "ORIGINAL", artifactType: "TELEMETRY_LOG", thermalKind: null,
    mediaType: "application/json", sensorType: null, filename: "flight_telemetry.json",
    originalFilename: "flight_telemetry.json", extension: "json", byteSize: 840000,
    capturedAt: iso("2026-08-27T11:35:00"), deviceId: "AC-M4TD-01", aircraftId: "AC-M4TD-01",
    sensorId: null, operatorId: "OP-01", location: null, pose: null, heading: null, altitude: null,
    storageReference: originalPath("SXP-004182", "M-2026-0827-012", "CAP-012-1", "EA-90213"),
    storageTier: STORAGE_TIER.COLD, immutabilityState: "IMMUTABLE",
    reviewState: "APPROVED", qualityState: "PASS", coverageState: "NOT_EVALUATED",
    truthClassification: null,
    metadata: { frames: 4820, timeAlignmentState: "NOT_ALIGNED", alignmentNote: "Per-image telemetry alignment is not implemented." } },

  // Derived: rendered thermal image. NOT the radiometric source.
  { ...base("EA-90260", "CP-012-1", "SXP-004182", "M-2026-0827-012", "CAP-012-1"),
    parentEvidenceId: "EA-90212", origin: "DERIVED", artifactType: "THERMAL_RENDER",
    thermalKind: "RENDERED_THERMAL_IMAGE", mediaType: "image/png", sensorType: "THERMAL",
    filename: "DJI_0412_render.png", originalFilename: "DJI_0412_render.png", extension: "png",
    byteSize: 1800000, capturedAt: null, deviceId: "PROC-01", aircraftId: null,
    sensorId: null, operatorId: null, location: null, pose: null, heading: null, altitude: null,
    storageReference: derivedPath("SXP-004182", "M-2026-0827-012", "CAP-012-1", "EA-90260"),
    storageTier: STORAGE_TIER.WARM, immutabilityState: "MUTABLE_METADATA",
    reviewState: "APPROVED", qualityState: "PASS", coverageState: "NOT_EVALUATED",
    truthClassification: "DERIVED",
    metadata: { processor: "THERMAL_RENDER", processorVersion: "1.4", palette: "ironbow",
                note: "A picture of temperature. Not radiometric data." } },

  // Derived: orthomosaic
  { ...base("EA-90280", "CP-012-1", "SXP-004182", "M-2026-0827-012", "CAP-012-1"),
    parentEvidenceId: "EA-90211", origin: "DERIVED", artifactType: "ORTHOMOSAIC",
    thermalKind: null, mediaType: "image/tiff", sensorType: null, filename: "ortho_roof.tif",
    originalFilename: "ortho_roof.tif", extension: "tif", byteSize: 84000000, capturedAt: null,
    deviceId: "PROC-01", aircraftId: null, sensorId: null, operatorId: null,
    location: null, pose: null, heading: null, altitude: null,
    storageReference: derivedPath("SXP-004182", "M-2026-0827-012", "CAP-012-1", "EA-90280"),
    storageTier: STORAGE_TIER.WARM, immutabilityState: "MUTABLE_METADATA",
    reviewState: "APPROVED", qualityState: "PASS", coverageState: "NOT_EVALUATED",
    truthClassification: "DERIVED",
    metadata: { processor: "PHOTOGRAMMETRY", processorVersion: "2.4" } },

  // --- CP-015-1: incomplete, recapture required --------------------------
  { ...base("EA-15001", "CP-015-1", "SXP-004190", "M-2026-0829-015", "CAP-015-1"),
    parentEvidenceId: null, origin: "ORIGINAL", artifactType: "RGB_IMAGE", thermalKind: null,
    mediaType: "image/jpeg", sensorType: "RGB", filename: "DJI_0088.JPG",
    originalFilename: "DJI_0088.JPG", extension: "JPG", byteSize: 11200000,
    capturedAt: ago(1380), deviceId: "AC-M4TD-02", aircraftId: "AC-M4TD-02",
    sensorId: "S-RGB-3", operatorId: "OP-02",
    location: { latitude: 38.2098, longitude: -84.5588, altitudeFt: 150 },
    pose: null, heading: 90, altitude: 150,
    storageReference: originalPath("SXP-004190", "M-2026-0829-015", "CAP-015-1", "EA-15001"),
    storageTier: STORAGE_TIER.COLD, immutabilityState: "IMMUTABLE",
    reviewState: "RECAPTURE_REQUIRED", qualityState: "PASS", coverageState: "INCOMPLETE",
    truthClassification: null, metadata: {} },

  // Quality warning — usable but flagged
  { ...base("EA-15002", "CP-015-1", "SXP-004190", "M-2026-0829-015", "CAP-015-1"),
    parentEvidenceId: null, origin: "ORIGINAL", artifactType: "RGB_IMAGE", thermalKind: null,
    mediaType: "image/jpeg", sensorType: "RGB", filename: "DJI_0091.JPG",
    originalFilename: "DJI_0091.JPG", extension: "JPG", byteSize: 10800000,
    capturedAt: ago(1375), deviceId: "AC-M4TD-02", aircraftId: "AC-M4TD-02",
    sensorId: "S-RGB-3", operatorId: "OP-02", location: null, pose: null, heading: null, altitude: null,
    storageReference: originalPath("SXP-004190", "M-2026-0829-015", "CAP-015-1", "EA-15002"),
    storageTier: STORAGE_TIER.COLD, immutabilityState: "IMMUTABLE",
    reviewState: "APPROVED_WITH_WARNINGS", qualityState: "PASS_WITH_WARNINGS",
    coverageState: "INCOMPLETE", truthClassification: null,
    metadata: { warning: "Motion blur detected by human review" } },

  // --- CP-016-1: one quarantined, one rejected ---------------------------
  { ...base("EA-16001", "CP-016-1", "SXP-004188", "M-2026-0829-016", "CAP-016-1"),
    parentEvidenceId: null, origin: "ORIGINAL", artifactType: "THERMAL_RJPEG",
    thermalKind: "RADIOMETRIC_SOURCE", mediaType: "image/jpeg", sensorType: "THERMAL",
    filename: "DJI_0031_R.JPEG", originalFilename: "DJI_0031_R.JPEG", extension: "JPEG",
    byteSize: 3050000, capturedAt: ago(400), deviceId: "AC-M4TD-01", aircraftId: "AC-M4TD-01",
    sensorId: "S-IR-2", operatorId: "OP-01", location: null, pose: null, heading: null, altitude: null,
    storageReference: originalPath("SXP-004188", "M-2026-0829-016", "CAP-016-1", "EA-16001"),
    storageTier: STORAGE_TIER.HOT, immutabilityState: "IMMUTABLE",
    reviewState: "NOT_REVIEWED", qualityState: "NOT_EVALUATED", coverageState: "NOT_EVALUATED",
    truthClassification: null, metadata: {} },

  { ...base("EA-16002", "CP-016-1", "SXP-004188", "M-2026-0829-016", "CAP-016-1"),
    parentEvidenceId: null, origin: "ORIGINAL", artifactType: "RGB_IMAGE", thermalKind: null,
    mediaType: "image/jpeg", sensorType: "RGB", filename: "DJI_0044.JPG",
    originalFilename: "DJI_0044.JPG", extension: "JPG", byteSize: 240,
    capturedAt: ago(398), deviceId: "AC-M4TD-01", aircraftId: "AC-M4TD-01",
    sensorId: "S-RGB-2", operatorId: "OP-01", location: null, pose: null, heading: null, altitude: null,
    storageReference: originalPath("SXP-004188", "M-2026-0829-016", "CAP-016-1", "EA-16002"),
    storageTier: STORAGE_TIER.HOT, immutabilityState: "IMMUTABLE",
    reviewState: "QUARANTINED", ingestState: "QUARANTINED",
    quarantineReason: "File truncated on transfer — metadata present but content unreadable.",
    qualityState: "FAIL", coverageState: "NOT_EVALUATED", truthClassification: null, metadata: {} },

  { ...base("EA-16003", "CP-016-1", "SXP-004188", "M-2026-0829-016", "CAP-016-1"),
    parentEvidenceId: null, origin: "ORIGINAL", artifactType: "RGB_IMAGE", thermalKind: null,
    mediaType: "image/jpeg", sensorType: "RGB", filename: "DJI_0045.JPG",
    originalFilename: "DJI_0045.JPG", extension: "JPG", byteSize: 9400000,
    capturedAt: ago(396), deviceId: "AC-M4TD-01", aircraftId: "AC-M4TD-01",
    sensorId: "S-RGB-2", operatorId: "OP-01", location: null, pose: null, heading: null, altitude: null,
    storageReference: originalPath("SXP-004188", "M-2026-0829-016", "CAP-016-1", "EA-16003"),
    storageTier: STORAGE_TIER.ARCHIVE, immutabilityState: "IMMUTABLE",
    reviewState: "REJECTED", reviewReason: "Frame is of the neighbouring parcel, not this property.",
    qualityState: "FAIL", coverageState: "NOT_EVALUATED", truthClassification: null, metadata: {} },
];

export const qualityAssessments = [
  { assessmentId: "EQ-0001", evidenceId: "EA-15002", propertyId: "SXP-004190", missionId: "M-2026-0829-015",
    qualityState: "PASS_WITH_WARNINGS", reviewedAt: ago(1200), reviewedBy: "u-001", sourceMode: F,
    notes: "Usable, but sharpness is marginal on the west frames.",
    checks: [
      { code: "READABLE", label: "File readable", state: "PASS", source: "AUTOMATED" },
      { code: "METADATA", label: "Required metadata present", state: "PASS", source: "AUTOMATED" },
      { code: "BLUR", label: "Sharpness", state: "WARNING", source: "HUMAN", detail: "Motion blur on the west elevation frames." },
      { code: "EXPOSURE", label: "Exposure", state: "PASS", source: "HUMAN" },
      { code: "LOCATION", label: "Location present", state: "WARNING", source: "AUTOMATED", detail: "No GPS on this frame." },
    ] },

  { assessmentId: "EQ-0002", evidenceId: "EA-16002", propertyId: "SXP-004188", missionId: "M-2026-0829-016",
    qualityState: "FAIL", reviewedAt: ago(390), reviewedBy: "u-001", sourceMode: F,
    notes: "Truncated file.",
    checks: [
      { code: "READABLE", label: "File readable", state: "FAIL", source: "AUTOMATED", detail: "Byte size 240 — file is truncated." },
      { code: "CORRUPTION", label: "Corruption detection", state: "FAIL", source: "AUTOMATED" },
    ] },
];

export const coverageAssessments = [
  { assessmentId: "CA-0001", capturePackageId: "CP-012-1", missionId: "M-2026-0827-012", propertyId: "SXP-004182",
    requiredAreas: ["North roof plane", "South roof plane", "East roof plane", "West roof plane", "Ridge", "Valleys"],
    capturedAreas: ["North roof plane", "South roof plane", "East roof plane", "West roof plane", "Ridge", "Valleys"],
    missingAreas: [], coverageState: "COMPLETE", completionPercent: 100,
    sourceMode: F, reviewedBy: "u-001", reviewedAt: iso("2026-08-27T11:55:00") },

  { assessmentId: "CA-0002", capturePackageId: "CP-015-1", missionId: "M-2026-0829-015", propertyId: "SXP-004190",
    requiredAreas: ["North elevation", "South elevation", "East elevation", "West elevation", "Roof planes", "Site context"],
    capturedAreas: ["North elevation", "South elevation", "East elevation"],
    missingAreas: ["West elevation", "Roof planes", "Site context"],
    coverageState: "INCOMPLETE", completionPercent: 50,
    sourceMode: F, reviewedBy: "u-001", reviewedAt: ago(1330) },
];

export const processingJobs = [
  { processingJobId: "PJOB-0001", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    capturePackageId: "CP-012-1", processorType: "THERMAL_RENDER", processorVersion: "1.4",
    inputEvidenceIds: ["EA-90212"], outputEvidenceIds: ["EA-90260"], status: "COMPLETE",
    startedAt: iso("2026-08-27T12:00:00"), completedAt: iso("2026-08-27T12:04:00"),
    failureReason: null, sourceMode: F },

  { processingJobId: "PJOB-0002", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    capturePackageId: "CP-012-1", processorType: "PHOTOGRAMMETRY", processorVersion: "2.4",
    inputEvidenceIds: ["EA-90211"], outputEvidenceIds: ["EA-90280"], status: "COMPLETE",
    startedAt: iso("2026-08-27T12:05:00"), completedAt: iso("2026-08-27T12:48:00"),
    failureReason: null, sourceMode: F },

  { processingJobId: "PJOB-0003", propertyId: "SXP-004188", missionId: "M-2026-0829-016",
    capturePackageId: "CP-016-1", processorType: "PHOTOGRAMMETRY", processorVersion: "2.4",
    inputEvidenceIds: ["EA-16001"], outputEvidenceIds: [], status: "QUEUED",
    startedAt: null, completedAt: null, failureReason: null, sourceMode: F },

  { processingJobId: "PJOB-0004", propertyId: "SXP-004190", missionId: "M-2026-0829-015",
    capturePackageId: "CP-015-1", processorType: "ROOF_GEOMETRY", processorVersion: "1.1",
    inputEvidenceIds: ["EA-15001"], outputEvidenceIds: [], status: "FAILED",
    startedAt: ago(1300), completedAt: ago(1298),
    failureReason: "Insufficient overlap — roof planes were not captured.", sourceMode: F },
];

export const custodyEvents = [
  { custodyEventId: "CUS-0001", evidenceId: "EA-90211", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    actor: "OP-01", actorType: "OPERATOR", action: "CAPTURED", timestamp: iso("2026-08-27T09:22:00"),
    sourceSystem: "field.capture", storageReference: null, priorHash: null, currentHash: null, notes: null },
  { custodyEventId: "CUS-0002", evidenceId: "EA-90211", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    actor: "system", actorType: "SYSTEM", action: "RECEIVED", timestamp: iso("2026-08-27T11:45:00"),
    sourceSystem: "evidence.ingest", storageReference: null, priorHash: null, currentHash: null, notes: null },
  { custodyEventId: "CUS-0003", evidenceId: "EA-90211", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    actor: "system", actorType: "SYSTEM", action: "STORED", timestamp: iso("2026-08-27T11:46:00"),
    sourceSystem: "evidence.vault",
    storageReference: originalPath("SXP-004182", "M-2026-0827-012", "CAP-012-1", "EA-90211"),
    priorHash: null, currentHash: null, notes: "Fixture record — no bytes materialized." },
  { custodyEventId: "CUS-0004", evidenceId: "EA-90211", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    actor: "u-001", actorType: "OPERATOR", action: "REVIEWED", timestamp: iso("2026-08-27T13:10:00"),
    sourceSystem: "evidence.review", storageReference: null, priorHash: null, currentHash: null,
    notes: "APPROVED" },
  { custodyEventId: "CUS-0005", evidenceId: "EA-90211", propertyId: "SXP-004182", missionId: "M-2026-0827-012",
    actor: "system", actorType: "SYSTEM", action: "ARCHIVED", timestamp: iso("2026-08-28T02:00:00"),
    sourceSystem: "evidence.lifecycle", storageReference: null, priorHash: null, currentHash: null,
    notes: "Moved to ARCHIVE tier. Archived is not deleted." },
];
