import assert from "node:assert/strict";
import {
  PASS_PORT_STATUS,
  PASSPORT_REVISION_STATE,
  PASSPORT_CHANGE_OPERATION,
  PASSPORT_INGESTION_STATE,
  PASSPORT_CONFLICT_STATE,
  PassportRebaseService,
  buildPassportRecord,
  createPassportRevision,
  createPassportChangeSet,
  createPassportConflict,
  createPassportMeasurementHistory,
  createPassportConditionHistory,
  createPassportRepairHistory,
  createPassportTimelineEntry,
  createPassportTwinReference,
  createPassportAuditEvent,
  PassportIntegrityService,
  validatePropertyScopedPassportRecord,
  validatePassportCandidate,
  createPassportIngestionRequest,
  evaluateTruthAcceptance,
  rebuildCurrentProjection,
  transferPassportOwnership,
  createPassportComponent,
} from "./service.js";

const record = buildPassportRecord({
  propertyId: "SXP-004182",
  createdByType: "SYSTEM",
  createdById: "system:passport-bootstrap",
});

const directory = await import("./service.js").then((m) => m.default.listPassportDirectory());
const directoryRows = await directory;
assert.ok(Array.isArray(directoryRows), "passport directory should return rows");
assert.ok(directoryRows.some((row) => row.propertyId === "SXP-004182"), "directory should include the canonical property");
assert.ok(Array.isArray(directoryRows[0].filterKeys), "passport directory rows should expose filter keys");
assert.ok(directoryRows[0].filterKeys.includes("ALL"), "directory row filter keys should include ALL");

const revisionDetail = await import("./service.js").then((m) => m.default.getRevisionDetail("SXP-004182", "r1"));
assert.ok(revisionDetail, "revision detail should resolve for a valid revision");
assert.equal(revisionDetail.propertyId, "SXP-004182");
assert.equal(revisionDetail.revisionId, "r1");

assert.equal(record.propertyId, "SXP-004182");
assert.equal(record.status, PASS_PORT_STATUS.ACTIVE);
assert.equal(record.currentRevisionId, "r1");

const rev1 = createPassportRevision({
  passportId: record.passportId,
  propertyId: record.propertyId,
  revisionNumber: 1,
  parentRevisionId: null,
  baseRevisionId: null,
  createdByType: "SYSTEM",
  createdById: "system:passport-bootstrap",
  sourceType: "property-identity",
  sourceManifestId: "PM-001",
  status: PASSPORT_REVISION_STATE.ACCEPTED,
  changeCount: 2,
  warningCount: 0,
  reason: "Initial canonical property bootstrap",
});

assert.equal(rev1.revisionNumber, 1);
assert.equal(rev1.previousIntegrityHash, null);
assert.ok(rev1.integrityHash);

const rev2 = createPassportRevision({
  passportId: record.passportId,
  propertyId: record.propertyId,
  revisionNumber: 2,
  parentRevisionId: rev1.revisionId,
  baseRevisionId: rev1.revisionId,
  createdByType: "CORTEX",
  createdById: "manifest:pcm-001",
  sourceType: "cortex-manifest",
  sourceManifestId: "PCM-SXP-004182-001",
  status: PASSPORT_REVISION_STATE.ACCEPTED,
  changeCount: 1,
  warningCount: 0,
  reason: "Accepted probable roof condition",
});

assert.equal(rev2.revisionNumber, 2);
assert.ok(rev2.integrityHash !== rev1.integrityHash);
assert.ok(rev2.previousIntegrityHash === rev1.integrityHash);

const changeset = createPassportChangeSet({
  propertyId: record.propertyId,
  baseRevisionId: rev1.revisionId,
  sourceType: "cortex-manifest",
  sourceId: "PCM-SXP-004182-001",
  changes: [
    { changeId: "C-1", entityType: "condition", entityId: "COND-ROOF-07", fieldPath: "status", operation: PASSPORT_CHANGE_OPERATION.UPDATE, priorValue: "ACTIVE", proposedValue: "WATCH", truthClassification: "PROBABLE", sourceRefs: ["FD-0001"], reason: "Candidate review", conflictState: "OPEN" },
  ],
  conflicts: [],
  warnings: [],
  eligibilityState: "READY",
});

assert.equal(changeset.changes[0].operation, PASSPORT_CHANGE_OPERATION.UPDATE);
assert.equal(changeset.baseRevisionId, rev1.revisionId);

const candidate = {
  manifestId: "PCM-SXP-004182-001",
  propertyId: "SXP-004182",
  sourceFindingIds: ["FD-0001"],
  sourceAnalysisIds: ["CX-0001"],
  truthClasses: ["PROBABLE"],
  warnings: [],
  reviewState: "VERIFIED",
  sourceVersions: ["TWIN-V3"],
  candidateSourceRefs: {
    evidenceIds: ["E-0001"],
    missionIds: ["M-2026-0829-018"],
    analysisIds: ["CX-0001"],
    findingIds: ["FD-0001"],
    twinVersionIds: ["TWIN-V3"],
  },
};

const valid = validatePassportCandidate(candidate, record, [rev1, rev2]);
assert.equal(valid.ok, true);
assert.equal(valid.reason, "OK");

const blocked = validatePassportCandidate({
  ...candidate,
  propertyId: "SXP-999999",
}, record, [rev1, rev2]);
assert.equal(blocked.ok, false);
assert.equal(blocked.state, PASSPORT_INGESTION_STATE.BLOCKED);

const request = createPassportIngestionRequest({
  propertyId: record.propertyId,
  candidateManifestId: candidate.manifestId,
  baseRevisionId: rev2.revisionId,
  status: PASSPORT_INGESTION_STATE.READY_FOR_REVIEW,
  warnings: [],
  conflictCount: 0,
  proposedChangeSetId: changeset.changeSetId,
});

assert.equal(request.status, PASSPORT_INGESTION_STATE.READY_FOR_REVIEW);

const accepted = evaluateTruthAcceptance({
  truthClassification: "PROBABLE",
  confidence: 0.86,
  modelVersion: "cortex-core-3.2",
  reviewState: "VERIFIED",
  sourceLineageValid: true,
  conflicts: 0,
  currentCanonicalState: "ACTIVE",
  candidateFreshness: true,
  supersession: false,
});
assert.equal(accepted.truthClassification, "PROBABLE");
assert.equal(accepted.confidence, 0.86);
assert.equal(accepted.humanVerificationState, "CONFIRMED");

const conflict = createPassportConflict({
  propertyId: record.propertyId,
  baseRevisionId: rev1.revisionId,
  candidateSourceId: "PCM-SXP-004182-001",
  entityType: "condition",
  entityId: "COND-ROOF-07",
  fieldPath: "status",
  canonicalValue: "ACTIVE",
  candidateValue: "WATCH",
  canonicalSourceRefs: ["E-0009"],
  candidateSourceRefs: ["FD-0001"],
  truthClasses: ["MEASURED", "PROBABLE"],
  severity: "medium",
  status: PASSPORT_CONFLICT_STATE.OPEN,
  reason: "Candidate conflicts with the accepted status",
});

assert.equal(conflict.status, PASSPORT_CONFLICT_STATE.OPEN);
assert.equal(conflict.entityType, "condition");

const cleanRebase = PassportRebaseService.rebase({
  candidateBaseRevisionId: rev1.revisionId,
  currentHeadRevisionId: rev2.revisionId,
  candidateTouches: { window: true },
  canonicalFields: { roof: "ACTIVE" },
  candidateFields: { window: "NEW" },
});
assert.equal(cleanRebase.state, "CLEAN");

const conflictedRebase = PassportRebaseService.rebase({
  candidateBaseRevisionId: rev1.revisionId,
  currentHeadRevisionId: rev2.revisionId,
  candidateTouches: { roof: true },
  canonicalFields: { roof: "ACTIVE" },
  candidateFields: { roof: "WATCH" },
});
assert.equal(conflictedRebase.state, "CONFLICTED");

const projection = rebuildCurrentProjection({
  propertyId: record.propertyId,
  revisions: [rev1, rev2],
  currentRevisionId: rev2.revisionId,
  currentState: {
    propertyIdentity: { address: "1234 Bridlewood Way" },
    activeConditions: 1,
    ownershipState: "CURRENT",
    twinCoverage: 3,
  },
});

assert.equal(projection.currentRevisionId, rev2.revisionId);
assert.equal(projection.propertyId, record.propertyId);
assert.equal(projection.currentState.activeConditions, 1);

const transfer = transferPassportOwnership({
  propertyId: record.propertyId,
  previousOwnerRef: "P-OLD-1",
  nextOwnerRef: "P-NEW-1",
  source: "passport:ownership-transfer",
});

assert.equal(transfer.priorOwnerRelationship.isCurrent, false);
assert.equal(transfer.newOwnerRelationship.isCurrent, true);
assert.equal(transfer.passportId, `PP-${record.propertyId}`);

const legacyComponent = createPassportComponent({
  propertyId: record.propertyId,
  componentType: "HVAC",
  name: "HVAC Unit A",
  status: "ACTIVE",
});
const replacementComponent = createPassportComponent({
  propertyId: record.propertyId,
  componentType: "HVAC",
  name: "HVAC Unit B",
  status: "REPLACED",
  parentComponentId: legacyComponent.componentId,
  sourceRefs: ["E-0002"],
  createdRevisionId: rev2.revisionId,
});

assert.notEqual(legacyComponent.componentId, replacementComponent.componentId);
assert.equal(replacementComponent.parentComponentId, legacyComponent.componentId);
assert.equal(replacementComponent.propertyId, record.propertyId);

const measurementHistory = createPassportMeasurementHistory({
  propertyId: record.propertyId,
  passportId: record.passportId,
  measurementId: "MEAS-ROOF-AREA-1",
  measurementType: "roof_area",
  truthClassification: "MEASURED",
  acceptedValue: 1824,
  unit: "sq_ft",
  acceptedRevisionId: rev2.revisionId,
  evidenceIds: ["E-0001"],
  twinVersionIds: ["TW-004182-V3"],
});
assert.equal(measurementHistory.truthClassification, "MEASURED");
assert.equal(measurementHistory.propertyId, record.propertyId);

const twinRef = createPassportTwinReference({
  propertyId: record.propertyId,
  passportId: record.passportId,
  twinType: "TWIN_TYPE_A",
  twinReferenceId: "TW-004182-V3",
  status: "APPROVED",
  approvedAt: new Date().toISOString(),
  revisionId: rev2.revisionId,
});
assert.equal(twinRef.twinType, "TWIN_TYPE_A");
assert.equal(twinRef.propertyId, record.propertyId);

const conditionHistory = createPassportConditionHistory({
  propertyId: record.propertyId,
  passportId: record.passportId,
  conditionId: "COND-ROOF-07",
  status: "RESOLVED",
  sourceFindingId: "FD-7776",
  acceptedRevisionId: rev2.revisionId,
  resolvedAt: new Date().toISOString(),
});
assert.equal(conditionHistory.status, "RESOLVED");

const repairHistory = createPassportRepairHistory({
  propertyId: record.propertyId,
  passportId: record.passportId,
  repairId: "RP-0181",
  projectId: "PJ-0181",
  relatedFindingIds: ["FD-7776"],
  completionEvidenceId: "EA-90295",
  status: "VERIFIED",
  revisionId: rev2.revisionId,
});
assert.equal(repairHistory.status, "VERIFIED");

const timelineEntry = createPassportTimelineEntry({
  propertyId: record.propertyId,
  passportId: record.passportId,
  type: "PASSPORT_REVISION_ACCEPTED",
  summary: "Roof condition accepted",
  sourceDomain: "CORTEX",
  sourceRef: "FD-7776",
  revisionId: rev2.revisionId,
});
assert.equal(timelineEntry.type, "PASSPORT_REVISION_ACCEPTED");

const auditEntry = createPassportAuditEvent({
  propertyId: record.propertyId,
  passportId: record.passportId,
  revisionId: rev2.revisionId,
  actorType: "CORTEX",
  actorId: "cortex:analysis:001",
  action: "REVISION_ACCEPTED",
  entityType: "revision",
  entityId: rev2.revisionId,
  reason: "Finding accepted into property canonical state",
});
assert.equal(auditEntry.actorType, "CORTEX");

const integrity = PassportIntegrityService.verify({
  propertyId: record.propertyId,
  passportId: record.passportId,
  revisions: [rev1, rev2],
  currentHeadRevisionId: rev2.revisionId,
  orphanCount: 0,
  brokenSourceCount: 0,
  warnings: [],
});
assert.equal(integrity.status, "CLEAN");
assert.equal(integrity.currentHeadState, "OK");

assert.throws(() => validatePropertyScopedPassportRecord({
  propertyId: record.propertyId,
  entityPropertyId: "SXP-999999",
  entityType: "ownership",
}), /Cross-property ownership reference refused/);

console.log("RESULT: PASSPORT TESTS PASS");
