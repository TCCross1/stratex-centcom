/**
 * PROPERTY FIXTURES — development seed data only.
 *
 * Nothing outside this domain imports this file directly. Pages call the
 * service; the service reads fixtures. When a real API exists, only the
 * service changes.
 */
import { iso, ago } from "../../utils/format.js";
import { BLOCKER } from "../shared/states.js";

export const properties = [
  {
    stratexPropertyId: "SXP-004182", displayId: "STX-KY-LEX-00001842",
    propertyType: "Single Family Detached",
    identity: { addressLine1: "1234 Bridlewood Way", city: "Lexington", region: "KY", postalCode: "40509", lat: 38.0106, lng: -84.4258, yearBuilt: 2003, squareFeet: 3140, parcelId: "41-22-108.00" },
    createdAt: iso("2026-02-11"), updatedAt: ago(28), healthScore: 84,
    status: "PROJECT_ACTIVE", currentStage: "in_flight", blocker: null,
    latestScanAt: ago(45), latestMissionId: "M-2026-0829-018",
    missionCount: 3, evidenceCount: 1284, findingCount: 17, openAlerts: 3,
    twinVersion: "V3", passportRevision: "r14",
    passportState: "CURRENT", cortexState: "PROCESSING", coreState: "WORK_ACTIVE",
    proState: "PROJECT_ACTIVE", habitatState: "SYNCED",
  },
  {
    stratexPropertyId: "SXP-004179", displayId: "STX-KY-LEX-00001839",
    propertyType: "Single Family Detached",
    identity: { addressLine1: "456 Oakview Dr", city: "Lexington", region: "KY", postalCode: "40515", lat: 37.9721, lng: -84.4901, yearBuilt: 1996, squareFeet: 2410, parcelId: "41-19-044.00" },
    createdAt: iso("2026-01-04"), updatedAt: ago(5), healthScore: 91,
    status: "MONITORING", currentStage: "closed", blocker: null,
    latestScanAt: ago(320), latestMissionId: "M-2026-0829-017",
    missionCount: 2, evidenceCount: 902, findingCount: 6, openAlerts: 1,
    twinVersion: "V2", passportRevision: "r09",
    passportState: "CURRENT", cortexState: "COMPLETE", coreState: "IDLE",
    proState: "NONE", habitatState: "SYNCED",
  },
  {
    stratexPropertyId: "SXP-004188", displayId: "STX-KY-NIC-00001888",
    propertyType: "Single Family Detached",
    identity: { addressLine1: "321 Stonegate Dr", city: "Nicholasville", region: "KY", postalCode: "40356", lat: 37.8809, lng: -84.5730, yearBuilt: 2011, squareFeet: 2880, parcelId: "13-07-221.00" },
    createdAt: iso("2026-06-20"), updatedAt: ago(39), healthScore: 76,
    status: "ATTENTION", currentStage: "cortex_analysis", blocker: null,
    latestScanAt: ago(400), latestMissionId: "M-2026-0829-016",
    missionCount: 1, evidenceCount: 611, findingCount: 12, openAlerts: 2,
    twinVersion: "V1", passportRevision: "r03",
    passportState: "PENDING", cortexState: "REVIEW_REQUIRED", coreState: "IDLE",
    proState: "NONE", habitatState: "SYNCED",
  },
  {
    stratexPropertyId: "SXP-004190", displayId: "STX-KY-GTN-00001890",
    propertyType: "Single Family Detached",
    identity: { addressLine1: "789 Maplecrest Ln", city: "Georgetown", region: "KY", postalCode: "40324", lat: 38.2098, lng: -84.5588, yearBuilt: 1978, squareFeet: 1960, parcelId: "22-04-013.00" },
    createdAt: iso("2026-08-14"), updatedAt: ago(1190), healthScore: 63,
    status: "ATTENTION", currentStage: "capture_validation", blocker: BLOCKER.EVIDENCE_INCOMPLETE,
    latestScanAt: ago(1400), latestMissionId: "M-2026-0829-015",
    missionCount: 1, evidenceCount: 388, findingCount: 0, openAlerts: 1,
    twinVersion: "—", passportRevision: "r01",
    passportState: "PENDING", cortexState: "IDLE", coreState: "BLOCKED",
    proState: "NONE", habitatState: "SYNC_ERROR",
  },
  {
    stratexPropertyId: "SXP-004191", displayId: "STX-KY-VER-00001891",
    propertyType: "Single Family Detached",
    identity: { addressLine1: "62 Harrodsburg Rd", city: "Versailles", region: "KY", postalCode: "40383", lat: 38.0525, lng: -84.7300, yearBuilt: 1962, squareFeet: 2240, parcelId: "08-11-072.00" },
    createdAt: iso("2026-08-22"), updatedAt: ago(60), healthScore: 58,
    status: "ATTENTION", currentStage: "atc_readiness", blocker: BLOCKER.WEATHER,
    latestScanAt: null, latestMissionId: "M-2026-0830-019",
    missionCount: 1, evidenceCount: 0, findingCount: 0, openAlerts: 1,
    twinVersion: "—", passportRevision: "r01",
    passportState: "PENDING", cortexState: "IDLE", coreState: "IDLE",
    proState: "NONE", habitatState: "NOT_CONNECTED",
  },
  {
    stratexPropertyId: "SXP-004193", displayId: "STX-KY-LEX-00001893",
    propertyType: "Single Family Detached",
    identity: { addressLine1: "1580 Man O War Blvd", city: "Lexington", region: "KY", postalCode: "40513", lat: 38.0000, lng: -84.5500, yearBuilt: 2018, squareFeet: 3620, parcelId: "41-30-119.00" },
    createdAt: iso("2026-08-27"), updatedAt: ago(2300), healthScore: 88,
    status: "ATTENTION", currentStage: "passport_commit", blocker: BLOCKER.PASSPORT_CONFLICT,
    latestScanAt: ago(2600), latestMissionId: "M-2026-0828-014",
    missionCount: 1, evidenceCount: 744, findingCount: 9, openAlerts: 2,
    twinVersion: "V1", passportRevision: "r02",
    passportState: "CONFLICT", cortexState: "COMPLETE", coreState: "IDLE",
    proState: "AUTHORIZED", habitatState: "SYNC_PENDING",
  },
  {
    stratexPropertyId: "SXP-003044", displayId: "STX-KY-LEX-00000944",
    propertyType: "Single Family Detached",
    identity: { addressLine1: "88 Ashland Terrace", city: "Lexington", region: "KY", postalCode: "40502", lat: 38.0250, lng: -84.4780, yearBuilt: 1924, squareFeet: 4180, parcelId: "41-08-002.00" },
    createdAt: iso("2026-02-02"), updatedAt: iso("2026-08-12"), healthScore: 79,
    status: "MONITORING", currentStage: "closed", blocker: null,
    latestScanAt: iso("2026-08-05"), latestMissionId: "M-2026-0805-009",
    missionCount: 5, evidenceCount: 4120, findingCount: 34, openAlerts: 0,
    twinVersion: "V5", passportRevision: "r31",
    passportState: "CURRENT", cortexState: "COMPLETE", coreState: "IDLE",
    proState: "NONE", habitatState: "SYNCED",
  },
  {
    stratexPropertyId: "SXP-004150", displayId: "STX-KY-WIN-00001850",
    propertyType: "Single Family Detached",
    identity: { addressLine1: "27 Redbud Hollow", city: "Winchester", region: "KY", postalCode: "40391", lat: 37.9900, lng: -84.1800, yearBuilt: 1988, squareFeet: 2050, parcelId: "05-14-031.00" },
    createdAt: iso("2026-04-18"), updatedAt: ago(880), healthScore: 86,
    status: "ACTIVE", currentStage: "closed", blocker: null,
    latestScanAt: ago(900), latestMissionId: "M-2026-0812-011",
    missionCount: 2, evidenceCount: 1010, findingCount: 8, openAlerts: 0,
    twinVersion: "V2", passportRevision: "r12",
    passportState: "CURRENT", cortexState: "COMPLETE", coreState: "PROCESSING",
    proState: "COMPLETION_PENDING", habitatState: "SYNCED",
  },
];

export const twins = [
  // SXP-004182 — three captures, most recent verifies a roof replacement
  { id: "TW-004182-V3", propertyId: "SXP-004182", version: "V3", versionNumber: 3, sourceMissionId: "M-2026-0827-012", generatedAt: iso("2026-08-29"), status: "current", captureMethod: "Photogrammetry + LiDAR", reason: "Roof replacement verification scan", notes: "Post-tear-off decking documented during repair.", supersedes: "TW-004182-V2", isCurrent: true, projections: { master: "12.4 GB", core: "1.8 GB", cortex: "3.1 GB", habitat: "184 MB" } },
  { id: "TW-004182-V2", propertyId: "SXP-004182", version: "V2", versionNumber: 2, sourceMissionId: "M-2026-0827-012", generatedAt: iso("2026-05-02"), status: "superseded", captureMethod: "Photogrammetry + LiDAR", reason: "Annual rescan", notes: "", supersedes: "TW-004182-V1", isCurrent: false, projections: { master: "11.9 GB", core: "1.7 GB", cortex: "2.9 GB", habitat: "176 MB" } },
  { id: "TW-004182-V1", propertyId: "SXP-004182", version: "V1", versionNumber: 1, sourceMissionId: "M-2026-0827-012", generatedAt: iso("2026-02-11"), status: "superseded", captureMethod: "Photogrammetry", reason: "Initial property capture", notes: "Baseline geometry for the property record.", supersedes: null, isCurrent: false, projections: { master: "11.2 GB", core: "1.6 GB", cortex: "2.7 GB", habitat: "168 MB" } },

  // SXP-004179 — two captures
  { id: "TW-004179-V2", propertyId: "SXP-004179", version: "V2", versionNumber: 2, sourceMissionId: "M-2026-0829-017", generatedAt: iso("2026-08-29"), status: "current", captureMethod: "Photogrammetry + LiDAR", reason: "Annual rescan", notes: "", supersedes: "TW-004179-V1", isCurrent: true, projections: { master: "9.8 GB", core: "1.4 GB", cortex: "2.2 GB", habitat: "142 MB" } },
  { id: "TW-004179-V1", propertyId: "SXP-004179", version: "V1", versionNumber: 1, sourceMissionId: "M-2026-0829-017", generatedAt: iso("2026-01-04"), status: "superseded", captureMethod: "Photogrammetry", reason: "Initial property capture", notes: "", supersedes: null, isCurrent: false, projections: { master: "9.1 GB", core: "1.3 GB", cortex: "2.0 GB", habitat: "138 MB" } },

  // SXP-004188 — single capture
  { id: "TW-004188-V1", propertyId: "SXP-004188", version: "V1", versionNumber: 1, sourceMissionId: "M-2026-0829-016", generatedAt: iso("2026-06-20"), status: "current", captureMethod: "Photogrammetry + Thermal", reason: "Initial property capture", notes: "Thermal pass flagged for review.", supersedes: null, isCurrent: true, projections: { master: "7.4 GB", core: "1.1 GB", cortex: "1.9 GB", habitat: "121 MB" } },

  // SXP-004193 — single capture, Passport commit is in conflict
  { id: "TW-004193-V1", propertyId: "SXP-004193", version: "V1", versionNumber: 1, sourceMissionId: "M-2026-0828-014", generatedAt: iso("2026-08-28"), status: "current", captureMethod: "Photogrammetry + LiDAR", reason: "Initial property capture", notes: "Geometry accepted; Passport commit unresolved.", supersedes: null, isCurrent: true, projections: { master: "13.8 GB", core: "2.0 GB", cortex: "3.4 GB", habitat: "196 MB" } },

  // SXP-003044 — the historic property, five versions across the year
  { id: "TW-003044-V5", propertyId: "SXP-003044", version: "V5", versionNumber: 5, sourceMissionId: "M-2026-0805-009", generatedAt: iso("2026-08-05"), status: "current", captureMethod: "Photogrammetry + LiDAR + Thermal", reason: "Annual rescan", notes: "", supersedes: "TW-003044-V4", isCurrent: true, projections: { master: "22.1 GB", core: "3.2 GB", cortex: "5.6 GB", habitat: "288 MB" } },
  { id: "TW-003044-V4", propertyId: "SXP-003044", version: "V4", versionNumber: 4, sourceMissionId: "M-2026-0805-009", generatedAt: iso("2026-06-16"), status: "superseded", captureMethod: "Photogrammetry + LiDAR", reason: "Rear addition completed", notes: "Footprint changed; measurements recomputed.", supersedes: "TW-003044-V3", isCurrent: false, projections: { master: "21.4 GB", core: "3.1 GB", cortex: "5.4 GB", habitat: "281 MB" } },
  { id: "TW-003044-V3", propertyId: "SXP-003044", version: "V3", versionNumber: 3, sourceMissionId: "M-2026-0805-009", generatedAt: iso("2026-05-04"), status: "superseded", captureMethod: "Photogrammetry + LiDAR", reason: "Slate roof restoration", notes: "", supersedes: "TW-003044-V2", isCurrent: false, projections: { master: "19.8 GB", core: "2.9 GB", cortex: "5.0 GB", habitat: "268 MB" } },
  { id: "TW-003044-V2", propertyId: "SXP-003044", version: "V2", versionNumber: 2, sourceMissionId: "M-2026-0805-009", generatedAt: iso("2026-03-30"), status: "superseded", captureMethod: "Photogrammetry", reason: "Chimney and masonry survey", notes: "", supersedes: "TW-003044-V1", isCurrent: false, projections: { master: "18.2 GB", core: "2.7 GB", cortex: "4.6 GB", habitat: "254 MB" } },
  { id: "TW-003044-V1", propertyId: "SXP-003044", version: "V1", versionNumber: 1, sourceMissionId: "M-2026-0805-009", generatedAt: iso("2026-02-02"), status: "superseded", captureMethod: "Photogrammetry", reason: "Initial property capture", notes: "1924 structure; baseline geometry.", supersedes: null, isCurrent: false, projections: { master: "17.6 GB", core: "2.6 GB", cortex: "4.4 GB", habitat: "249 MB" } },

  // SXP-004150 — two captures, most recent verifies a completed repair
  { id: "TW-004150-V2", propertyId: "SXP-004150", version: "V2", versionNumber: 2, sourceMissionId: "M-2026-0812-011", generatedAt: iso("2026-08-12"), status: "current", captureMethod: "Photogrammetry + Thermal", reason: "Repair completion verification", notes: "Before/after comparison available to Cortex.", supersedes: "TW-004150-V1", isCurrent: true, projections: { master: "8.6 GB", core: "1.2 GB", cortex: "2.1 GB", habitat: "134 MB" } },
  { id: "TW-004150-V1", propertyId: "SXP-004150", version: "V1", versionNumber: 1, sourceMissionId: "M-2026-0812-011", generatedAt: iso("2026-04-18"), status: "superseded", captureMethod: "Photogrammetry", reason: "Initial property capture", notes: "", supersedes: null, isCurrent: false, projections: { master: "8.1 GB", core: "1.1 GB", cortex: "1.9 GB", habitat: "129 MB" } },

  // SXP-004190 and SXP-004191 hold no twin versions. Neither has a validated
  // capture yet, and a property without evidence must not display geometry.
];

export const systemsByProperty = {
  default: [
    { id: "sys-roof", name: "Roof", status: "Attention", tone: "warn", mark: "▲", lastObserved: ago(45) },
    { id: "sys-envelope", name: "Exterior Envelope", status: "Good", tone: "ok", mark: "●", lastObserved: ago(45) },
    { id: "sys-hvac", name: "HVAC", status: "Aging", tone: "warn", mark: "▲", lastObserved: ago(45) },
    { id: "sys-electrical", name: "Electrical", status: "Good", tone: "ok", mark: "●", lastObserved: ago(320) },
    { id: "sys-plumbing", name: "Plumbing", status: "Service Due", tone: "info", mark: "◐", lastObserved: ago(320) },
    { id: "sys-attic", name: "Attic", status: "Moisture Suspected", tone: "bad", mark: "✕", lastObserved: ago(45) },
    { id: "sys-foundation", name: "Foundation", status: "Good", tone: "ok", mark: "●", lastObserved: ago(2900) },
    { id: "sys-windows", name: "Windows & Doors", status: "Good", tone: "ok", mark: "●", lastObserved: ago(45) },
    { id: "sys-drainage", name: "Drainage", status: "Not Observed", tone: "mute", mark: "○", lastObserved: ago(2900) },
  ],
};

/**
 * OWNERSHIP RELATIONSHIPS — separate from SharingGrant, and separate from the
 * property record itself. A transfer ends one relationship and begins another.
 * It never deletes history.
 *
 * Party details are referenced by ID only. Personally identifying information
 * belongs in the Identity Vault, not in the property intelligence record.
 */
export const ownership = [
  { relationshipId: "OWN-2", propertyId: "SXP-004182", partyId: "P-8841",
    displayName: "Owner of record", relationshipType: "OWNER",
    startDate: "2026-02-11", endDate: null, isCurrent: true },
  { relationshipId: "OWN-1", propertyId: "SXP-004182", partyId: "P-6120",
    displayName: "Prior owner of record", relationshipType: "OWNER",
    startDate: "2011-06-01", endDate: "2026-02-10", isCurrent: false },
  { relationshipId: "OWN-3", propertyId: "SXP-003044", partyId: "P-4410",
    displayName: "Owner of record", relationshipType: "OWNER",
    startDate: "2019-03-04", endDate: null, isCurrent: true },
  { relationshipId: "OWN-4", propertyId: "SXP-004150", partyId: "P-7702",
    displayName: "Property manager", relationshipType: "MANAGER",
    startDate: "2026-04-18", endDate: null, isCurrent: true },

];
