/**
 * EVIDENCE FIXTURES
 *
 * SCOPING FIX (Directive 004 §5): every asset now names its own property,
 * mission and capture. Nothing is inferred through a package lookup, so a
 * property page can never receive another property's evidence.
 *
 *   PROPERTY 1 → MANY EVIDENCE ASSETS
 *   MISSION  1 → MANY EVIDENCE ASSETS
 *   EVIDENCE 1 → MANY RELATED FINDINGS
 *
 * Original evidence is immutable. Derived artifacts declare their parent.
 */
import { ago, iso } from "../../utils/format.js";
import { ARTIFACT_KIND, TRUTH_CLASS, REVIEW_STATE, GOLD_STATE } from "../shared/classification.js";

export const evidencePackages = [
  { id: "EP-012", missionId: "M-2026-0827-012", propertyId: "SXP-004182", state: "sealed", assetCount: 1102, coveragePct: 100, missingSurfaces: [], hashesVerified: true },
  { id: "EP-018", missionId: "M-2026-0829-018", propertyId: "SXP-004182", state: "ingesting", assetCount: 984, coveragePct: 78, missingSurfaces: ["North elevation"], hashesVerified: false },
  { id: "EP-017", missionId: "M-2026-0829-017", propertyId: "SXP-004179", state: "sealed", assetCount: 902, coveragePct: 100, missingSurfaces: [], hashesVerified: true },
  { id: "EP-016", missionId: "M-2026-0829-016", propertyId: "SXP-004188", state: "sealed", assetCount: 611, coveragePct: 98, missingSurfaces: [], hashesVerified: true },
  { id: "EP-015", missionId: "M-2026-0829-015", propertyId: "SXP-004190", state: "failed", assetCount: 388, coveragePct: 71, missingSurfaces: ["Rear roof plane", "West elevation", "Chimney"], hashesVerified: true },
  { id: "EP-011", missionId: "M-2026-0812-011", propertyId: "SXP-004150", state: "sealed", assetCount: 1010, coveragePct: 100, missingSurfaces: [], hashesVerified: true },
  { id: "EP-009", missionId: "M-2026-0805-009", propertyId: "SXP-003044", state: "sealed", assetCount: 1420, coveragePct: 100, missingSurfaces: [], hashesVerified: true },
];

export const evidenceAssets = [
  // --- SXP-004182 / M-2026-0829-017 : the moisture chain ---
  { evidenceId: "EA-90211", packageId: "EP-012", propertyId: "SXP-004182", missionId: "M-2026-0827-012", captureId: "CAP-0182-0412",
    filename: "DJI_0412.JPG", kind: ARTIFACT_KIND.ORIGINAL, truthClassification: TRUTH_CLASS.MEASURED,
    sha256: "9f2c4a1d88b0e37c5519a2f0d4e6b7189c3a5d20e8f14b6a9c07d3e51b8a24f6d", bytes: 12400000,
    captureTimestamp: ago(320), device: "AC-M4TD-02", sensor: "RGB 4/3 CMOS",
    storageTier: "cold", storageState: "archived", integrityState: "verified", objectLock: true,
    reviewState: REVIEW_STATE.NOT_REQUIRED, goldState: GOLD_STATE.NONE,
    processingLineage: [], derivedFrom: null, relatedFindingIds: ["FD-7776", "FD-7770"] },

  { evidenceId: "EA-90212", packageId: "EP-012", propertyId: "SXP-004182", missionId: "M-2026-0827-012", captureId: "CAP-0182-0412",
    filename: "DJI_0412_R.JPEG", kind: ARTIFACT_KIND.ORIGINAL, truthClassification: TRUTH_CLASS.MEASURED,
    sha256: "31be77c0a2451f8d90e3b6c47a105d2ef84b9370c6152ade8b04f79a3c2d61e5", bytes: 3100000,
    captureTimestamp: ago(320), device: "AC-M4TD-02", sensor: "Thermal 640x512",
    storageTier: "cold", storageState: "archived", integrityState: "verified", objectLock: true,
    reviewState: REVIEW_STATE.VERIFIED, goldState: GOLD_STATE.CANDIDATE,
    processingLineage: [], derivedFrom: null, relatedFindingIds: ["FD-7781", "FD-7768"] },

  { evidenceId: "EA-90280", packageId: "EP-012", propertyId: "SXP-004182", missionId: "M-2026-0827-012", captureId: "CAP-0182-0412",
    filename: "roof_plane_north.mesh", kind: ARTIFACT_KIND.DERIVED, truthClassification: TRUTH_CLASS.DERIVED,
    sha256: "c07a2b1943f8e05d6c72a4b8109e35fd7c46a2098b3e51d7f0a69c48b25d3ea1", bytes: 84000000,
    captureTimestamp: ago(300), device: "PROC-01", sensor: "Photogrammetry v2.4",
    storageTier: "warm", storageState: "online", integrityState: "verified", objectLock: false,
    reviewState: REVIEW_STATE.NOT_REQUIRED, goldState: GOLD_STATE.NONE,
    processingLineage: ["photogrammetry-2.4", "surface-segmentation-1.6"], derivedFrom: "EA-90211",
    relatedFindingIds: ["FD-7770", "FD-7776"] },

  { evidenceId: "EA-90291", packageId: "EP-012", propertyId: "SXP-004182", missionId: "M-2026-0827-012", captureId: "CAP-0182-0412",
    filename: "moisture_overlay.geojson", kind: ARTIFACT_KIND.AI_GENERATED, truthClassification: TRUTH_CLASS.PROBABLE,
    sha256: "5d419ef27c03a8b14e6d5920f7c3ab48d160e9527ac48b03f16d2e8a94c705bd", bytes: 240000,
    captureTimestamp: ago(288), device: "CORTEX", sensor: "cortex-thermal-1.8",
    storageTier: "hot", storageState: "online", integrityState: "verified", objectLock: false,
    reviewState: REVIEW_STATE.PENDING, goldState: GOLD_STATE.NONE,
    processingLineage: ["cortex-thermal-1.8"], derivedFrom: "EA-90212", relatedFindingIds: ["FD-7781"] },

  { evidenceId: "EA-90295", packageId: "EP-012", propertyId: "SXP-004182", missionId: "M-2026-0827-012", captureId: "CAP-0182-0412",
    filename: "reviewer_notes_north.json", kind: ARTIFACT_KIND.ANNOTATION, truthClassification: TRUTH_CLASS.DERIVED,
    sha256: "aa184410b26cf5039e17d8a24b6015ce93f7208da4b61e35c890f27a6d4b1e03", bytes: 12000,
    captureTimestamp: ago(120), device: "u-001", sensor: "Human review",
    storageTier: "hot", storageState: "online", integrityState: "verified", objectLock: false,
    reviewState: REVIEW_STATE.VERIFIED, goldState: GOLD_STATE.NONE,
    processingLineage: [], derivedFrom: "EA-90291", relatedFindingIds: ["FD-7781"] },

  // --- SXP-004188 / M-2026-0829-016 : thermal flagged for review ---
  { evidenceId: "EA-88010", packageId: "EP-016", propertyId: "SXP-004188", missionId: "M-2026-0829-016", captureId: "CAP-0188-0031",
    filename: "DJI_0031_R.JPEG", kind: ARTIFACT_KIND.ORIGINAL, truthClassification: TRUTH_CLASS.MEASURED,
    sha256: "7b21c9d05e4a83f16027b4de91a5c308f26b70d419e8a35c02f6d7b18e40c95a", bytes: 3050000,
    captureTimestamp: ago(400), device: "AC-M4TD-01", sensor: "Thermal 640x512",
    storageTier: "cold", storageState: "archived", integrityState: "verified", objectLock: true,
    reviewState: REVIEW_STATE.IN_REVIEW, goldState: GOLD_STATE.NONE,
    processingLineage: [], derivedFrom: null, relatedFindingIds: ["FD-8102"] },

  { evidenceId: "EA-88044", packageId: "EP-016", propertyId: "SXP-004188", missionId: "M-2026-0829-016", captureId: "CAP-0188-0031",
    filename: "envelope_anomaly.geojson", kind: ARTIFACT_KIND.AI_GENERATED, truthClassification: TRUTH_CLASS.PROBABLE,
    sha256: "e30f5a7b1c8409d26e13b7a05fc248e91d6730ba5c04e871f293da6b05c1e748", bytes: 186000,
    captureTimestamp: ago(390), device: "CORTEX", sensor: "cortex-thermal-1.8",
    storageTier: "hot", storageState: "online", integrityState: "verified", objectLock: false,
    reviewState: REVIEW_STATE.NEEDS_MORE_EVIDENCE, goldState: GOLD_STATE.NONE,
    processingLineage: ["cortex-thermal-1.8"], derivedFrom: "EA-88010", relatedFindingIds: ["FD-8102"] },

  // --- SXP-004150 / M-2026-0812-011 : repair completion verification ---
  { evidenceId: "EA-41501", packageId: "EP-011", propertyId: "SXP-004150", missionId: "M-2026-0812-011", captureId: "CAP-4150-0201",
    filename: "DJI_0201.JPG", kind: ARTIFACT_KIND.ORIGINAL, truthClassification: TRUTH_CLASS.MEASURED,
    sha256: "4c9820ab73e15d6f08c31749be25a0d3f861c470926be5d8a0f37c14e9b2650d", bytes: 11800000,
    captureTimestamp: ago(880), device: "AC-M4TD-01", sensor: "RGB 4/3 CMOS",
    storageTier: "cold", storageState: "archived", integrityState: "verified", objectLock: true,
    reviewState: REVIEW_STATE.VERIFIED, goldState: GOLD_STATE.APPROVED,
    processingLineage: [], derivedFrom: null, relatedFindingIds: ["FD-6602"] },
];
