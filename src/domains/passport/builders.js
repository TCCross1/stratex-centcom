import { TRUTH_CLASS } from "../shared/classification.js";
import {
  PASSPORT_STATUS,
  PASSPORT_REVISION_STATE,
  PASSPORT_CHANGE_OPERATION,
  PASSPORT_INGESTION_STATE,
  PASSPORT_CONFLICT_STATE,
  PASSPORT_REBASE_STATE,
  PASSPORT_RELATIONSHIP_TYPE,
  PASSPORT_COMPONENT_TYPE,
  PASSPORT_COMPONENT_LIFECYCLE,
  PASSPORT_CONDITION_STATE,
  PASSPORT_INTEGRITY,
  PASSPORT_TWIN_TYPE,
  PASSPORT_TWIN_STATUS,
} from "./constants.js";

const sumString = (text) => {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash.toString(16).padStart(8, "0");
};

const stableStringify = (value) => JSON.stringify(value, Object.keys(value || {}).sort());
export const hashCanonical = (payload) => {
  const source = typeof payload === "string" ? payload : stableStringify(payload);
  return `fixture-hash:${sumString(source)}`;
};

const stableStringHash = (text) => {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const makeId = (prefix, seed = null) => {
  if (seed !== null && seed !== undefined) {
    const source = typeof seed === "string" ? seed : JSON.stringify(seed);
    return `${prefix}-${stableStringHash(source).slice(0, 6)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
};

const PASSPORT_REVISION_STORE = new Map();
const ensureAccepted = (revision) => {
  if (!revision || !revision.status) return false;
  return revision.status === PASSPORT_REVISION_STATE.ACCEPTED || revision.status === PASSPORT_REVISION_STATE.ACCEPTED_WITH_WARNING;
};
const resolvePreviousIntegrityHash = ({ parentRevisionId, previousIntegrityHash }) => {
  if (previousIntegrityHash) return previousIntegrityHash;
  if (!parentRevisionId) return null;
  const parent = PASSPORT_REVISION_STORE.get(parentRevisionId);
  return parent ? parent.integrityHash : null;
};

export function buildPassportRecord({ propertyId, status = PASSPORT_STATUS.ACTIVE, createdByType = "SYSTEM", createdById = "system:passport-bootstrap", currentProjection = null } = {}) {
  const passportId = `PP-${propertyId || "PROP"}`;
  const baseRev = createPassportRevision({ passportId, propertyId, revisionNumber: 1, parentRevisionId: null, baseRevisionId: null, createdByType, createdById, sourceType: "property-identity", sourceManifestId: "PM-BOOTSTRAP", status: PASSPORT_REVISION_STATE.ACCEPTED, changeCount: 2, warningCount: 0, reason: "Canonical property bootstrap", content: { propertyIdentity: { propertyId } } });
  const record = { passportId, propertyId, currentRevisionId: baseRev.revisionId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), status, schemaVersion: "1.0", integrityState: "clean", latestAcceptedAt: baseRev.acceptedAt, revisions: [baseRev], currentProjection: currentProjection || { propertyId, currentRevisionId: baseRev.revisionId, currentState: { propertyIdentity: { propertyId }, activeConditions: 0, ownershipState: "CURRENT", twinCoverage: 0 } } };
  return record;
}

export function createPassportRevision({ passportId, propertyId, revisionNumber, parentRevisionId, baseRevisionId, createdByType, createdById, sourceType, sourceManifestId, status = PASSPORT_REVISION_STATE.DRAFT, changeCount = 0, warningCount = 0, reason = "", content = {}, acceptedAt = null, acceptedBy = null, previousIntegrityHash = null } = {}) {
  const revisionId = revisionNumber ? `r${revisionNumber}` : makeId("r");
  const previousHash = resolvePreviousIntegrityHash({ parentRevisionId, previousIntegrityHash });
  const integrityHash = hashCanonical({ passportId, propertyId, revisionId, revisionNumber, parentRevisionId, baseRevisionId, createdByType, createdById, sourceType, sourceManifestId, status, changeCount, warningCount, reason, content });
  const record = { revisionId, passportId, propertyId, revisionNumber, parentRevisionId, baseRevisionId, createdAt: new Date().toISOString(), createdByType, createdById, sourceType, sourceManifestId, status, changeCount, warningCount, integrityHash, previousIntegrityHash: previousHash, acceptedAt: acceptedAt || (status === PASSPORT_REVISION_STATE.ACCEPTED ? new Date().toISOString() : null), acceptedBy: acceptedBy || (status === PASSPORT_REVISION_STATE.ACCEPTED ? createdById : null), reason, schemaVersion: "1.0", content };
  if (revisionId) PASSPORT_REVISION_STORE.set(revisionId, record);
  return record;
}

export function createPassportChangeSet({ propertyId, baseRevisionId, sourceType, sourceId, createdAt = new Date().toISOString(), changes = [], conflicts = [], warnings = [], eligibilityState = "READY" } = {}) {
  if (!propertyId || !baseRevisionId || !sourceType || !sourceId) throw new Error("PassportChangeSet requires propertyId, baseRevisionId, sourceType and sourceId.");
  return { changeSetId: makeId("PCS"), propertyId, baseRevisionId, sourceType, sourceId, createdAt, changes: changes.map((change, index) => ({ changeId: change.changeId || `CH-${index + 1}`, entityType: change.entityType, entityId: change.entityId, fieldPath: change.fieldPath, operation: change.operation, priorValue: change.priorValue, proposedValue: change.proposedValue, truthClassification: change.truthClassification || TRUTH_CLASS.MEASURED, sourceRefs: change.sourceRefs || [], reason: change.reason || "", conflictState: change.conflictState || "OPEN" })), conflicts, warnings, eligibilityState };
}

export function createPassportConflict({ propertyId, baseRevisionId, candidateSourceId, entityType, entityId, fieldPath, canonicalValue, candidateValue, canonicalSourceRefs = [], candidateSourceRefs = [], truthClasses = [TRUTH_CLASS.MEASURED], createdAt = new Date().toISOString(), severity = "medium", status = PASSPORT_CONFLICT_STATE.OPEN, resolution = null, resolvedAt = null, resolvedBy = null, reason = "" } = {}) {
  const conflictId = makeId("PCF", [propertyId, baseRevisionId, candidateSourceId, entityType, entityId, fieldPath, canonicalValue, candidateValue].join("|"));
  return { conflictId, propertyId, baseRevisionId, candidateSourceId, entityType, entityId, fieldPath, canonicalValue, candidateValue, canonicalSourceRefs, candidateSourceRefs, truthClasses, createdAt, severity, status, resolution, resolvedAt, resolvedBy, reason };
}

export function validatePassportCandidate(candidate, passport, revisions = []) {
  if (!candidate || !candidate.propertyId) return { ok: false, state: PASSPORT_INGESTION_STATE.BLOCKED, reason: "MISSING_PROPERTY" };
  if (!passport || passport.propertyId !== candidate.propertyId) return { ok: false, state: PASSPORT_INGESTION_STATE.BLOCKED, reason: "PROPERTY_MISMATCH" };
  if (!candidate.candidateSourceRefs || !candidate.candidateSourceRefs.evidenceIds?.length) return { ok: false, state: PASSPORT_INGESTION_STATE.BLOCKED, reason: "MISSING_LINEAGE" };
  if (candidate.reviewState === "REJECTED") return { ok: false, state: PASSPORT_INGESTION_STATE.REJECTED, reason: "REJECTED_CANDIDATE" };
  if (candidate.reviewState === "PENDING") return { ok: false, state: PASSPORT_INGESTION_STATE.VALIDATING, reason: "PENDING_REVIEW" };
  const hasBadLineage = candidate.candidateSourceRefs.evidenceIds.some((id) => /^Q|^X/.test(String(id))) || !candidate.candidateSourceRefs.analysisIds?.length || !candidate.candidateSourceRefs.twinVersionIds?.length;
  if (hasBadLineage) return { ok: false, state: PASSPORT_INGESTION_STATE.BLOCKED, reason: "BAD_LINEAGE" };
  const base = revisions.find((r) => r.revisionId === candidate.baseRevisionId || r.revisionId === passport.currentRevisionId);
  if (!base && revisions.length) return { ok: false, state: PASSPORT_INGESTION_STATE.BLOCKED, reason: "UNKNOWN_BASE" };
  return { ok: true, state: PASSPORT_INGESTION_STATE.READY_FOR_REVIEW, reason: "OK" };
}

export function createPassportIngestionRequest({ propertyId, candidateManifestId, baseRevisionId, status = PASSPORT_INGESTION_STATE.RECEIVED, createdAt = new Date().toISOString(), reviewedAt = null, warnings = [], conflictCount = 0, proposedChangeSetId } = {}) {
  const ingestionId = makeId("PI", [propertyId, candidateManifestId, baseRevisionId, status].join("|"));
  return { ingestionId, propertyId, candidateManifestId, baseRevisionId, status, createdAt, reviewedAt, warnings, conflictCount, proposedChangeSetId };
}

export function evaluateTruthAcceptance({ truthClassification, confidence = null, modelVersion = null, reviewState = "VERIFIED", sourceLineageValid = true, conflicts = 0, currentCanonicalState = "ACTIVE", candidateFreshness = true, supersession = false } = {}) {
  const next = { truthClassification, confidence, modelVersion, reviewState, sourceLineageValid, conflicts, currentCanonicalState, candidateFreshness, supersession, humanVerificationState: reviewState === "VERIFIED" ? "CONFIRMED" : "NOT_REVIEWED", accepted: true };
  if (truthClassification === TRUTH_CLASS.PROBABLE) {
    next.confidence = confidence ?? 0.5;
    next.humanVerificationState = reviewState === "VERIFIED" ? "CONFIRMED" : "NOT_REVIEWED";
  } else {
    next.confidence = null;
  }
  return next;
}

export function rebuildCurrentProjection({ propertyId, revisions = [], currentRevisionId, currentState = { propertyIdentity: { propertyId }, activeConditions: 0, ownershipState: "CURRENT", twinCoverage: 0 } } = {}) {
  const accepted = revisions.filter((r) => ensureAccepted(r));
  return { propertyId, currentRevisionId: currentRevisionId || accepted.at(-1)?.revisionId || null, currentState: { ...currentState, propertyIdentity: currentState.propertyIdentity || { propertyId } }, revisionCount: accepted.length, rebuiltAt: new Date().toISOString(), source: "revision-history", mutable: false };
}

export function createPassportRelationship({ relationshipId = makeId("PRL"), propertyId, partyRef, relationshipType = PASSPORT_RELATIONSHIP_TYPE.OWNER, startDate = new Date().toISOString(), endDate = null, isCurrent = true, source = "passport:bootstrap", verificationState = "VERIFIED", createdAt = new Date().toISOString(), endedAt = null } = {}) {
  return { relationshipId, propertyId, partyRef, relationshipType, startDate, endDate, isCurrent, source, verificationState, createdAt, endedAt };
}

export function transferPassportOwnership({ propertyId, previousOwnerRef, nextOwnerRef, source = "passport:ownership-transfer" }) {
  const previous = previousOwnerRef ? createPassportRelationship({ relationshipId: makeId("PRL-OLD"), propertyId, partyRef: previousOwnerRef, relationshipType: PASSPORT_RELATIONSHIP_TYPE.OWNER, startDate: new Date(Date.now() - 86400000).toISOString(), endDate: new Date().toISOString(), isCurrent: false, source, verificationState: "VERIFIED", endedAt: new Date().toISOString() }) : null;
  const next = createPassportRelationship({ relationshipId: makeId("PRL-NEW"), propertyId, partyRef: nextOwnerRef, relationshipType: PASSPORT_RELATIONSHIP_TYPE.OWNER, startDate: new Date().toISOString(), endDate: null, isCurrent: true, source, verificationState: "VERIFIED" });
  return { priorOwnerRelationship: previous, newOwnerRelationship: next, passportId: `PP-${propertyId}` };
}

export function createPassportComponent({ componentId = makeId("PCOMP"), propertyId, structureId = null, parentComponentId = null, componentType = PASSPORT_COMPONENT_TYPE.OTHER, name = "Component", location = null, installedAt = null, manufacturer = null, model = null, serialRef = null, material = null, status = PASSPORT_COMPONENT_LIFECYCLE.OBSERVED, sourceRefs = [], createdRevisionId = null, currentRevisionId = null } = {}) {
  return { componentId, propertyId, structureId, parentComponentId, componentType, name, location, installedAt, manufacturer, model, serialRef, material, status, sourceRefs, createdRevisionId, currentRevisionId };
}

export function createPassportMeasurement({ measurementId = makeId("PMEAS"), propertyId, componentId = null, measurementType, value, unit, truthClassification = TRUTH_CLASS.MEASURED, method = "manual", sourceEvidenceIds = [], sourceTwinVersionId = null, capturedAt = new Date().toISOString(), acceptedRevisionId = null, precision = null, accuracy = null, confidence = null, quality = "STANDARD" } = {}) {
  return { measurementId, propertyId, componentId, measurementType, value, unit, truthClassification, method, sourceEvidenceIds, sourceTwinVersionId, capturedAt, acceptedRevisionId, precision, accuracy, confidence, quality };
}

export function createPassportCondition({ conditionId = makeId("PCOND"), propertyId, componentId = null, sourceFindingId = null, truthClassification = TRUTH_CLASS.PROBABLE, confidence = null, severity = "moderate", status = PASSPORT_CONDITION_STATE.ACTIVE, firstObservedAt = new Date().toISOString(), lastObservedAt = new Date().toISOString(), resolvedAt = null, sourceRefs = [], acceptedRevisionId = null } = {}) {
  return { conditionId, propertyId, componentId, sourceFindingId, truthClassification, confidence, severity, status, firstObservedAt, lastObservedAt, resolvedAt, sourceRefs, acceptedRevisionId };
}

export function createPassportAuditEvent({ auditEventId = makeId("PAUD"), propertyId, passportId, revisionId = null, actorType = "SYSTEM", actorId = "system:passport", action = "RECORD_CREATED", entityType = "passport", entityId = null, beforeRef = null, afterRef = null, reason = "", timestamp = new Date().toISOString() } = {}) {
  return { auditEventId, propertyId, passportId, revisionId, actorType, actorId, action, entityType, entityId, beforeRef, afterRef, reason, timestamp };
}

export function createPassportIdentityHistory({ identityHistoryId = makeId("PIDH"), propertyId, passportId, revisionId = null, changeType = "PROPERTY_IDENTITY_UPDATED", previousIdentityRef = null, acceptedIdentityRef = null, at = new Date().toISOString(), source = "property:identity" } = {}) {
  return { identityHistoryId, propertyId, passportId, revisionId, changeType, previousIdentityRef, acceptedIdentityRef, at, source };
}

export function createPassportOwnershipHistory({ ownershipHistoryId = makeId("POH"), propertyId, passportId, relationshipId, partyRef, relationshipType = PASSPORT_RELATIONSHIP_TYPE.OWNER, startedAt = new Date().toISOString(), endedAt = null, isCurrent = true, source = "passport:ownership-history" } = {}) {
  return { ownershipHistoryId, propertyId, passportId, relationshipId, partyRef, relationshipType, startedAt, endedAt, isCurrent, source };
}

export function createPassportComponentHistory({ componentHistoryId = makeId("PCH"), propertyId, componentId, componentType, lifecycleState = PASSPORT_COMPONENT_LIFECYCLE.OBSERVED, priorComponentId = null, replacementOfId = null, revisionId = null, sourceRefs = [], createdAt = new Date().toISOString() } = {}) {
  return { componentHistoryId, propertyId, componentId, componentType, lifecycleState, priorComponentId, replacementOfId, revisionId, sourceRefs, createdAt };
}

export function createPassportMeasurementHistory({ measurementHistoryId = makeId("PMH"), propertyId, passportId, measurementId, measurementType, truthClassification = TRUTH_CLASS.MEASURED, acceptedValue, unit, acceptedRevisionId = null, evidenceIds = [], twinVersionIds = [], at = new Date().toISOString() } = {}) {
  return { measurementHistoryId, propertyId, passportId, measurementId, measurementType, truthClassification, acceptedValue, unit, acceptedRevisionId, evidenceIds, twinVersionIds, at };
}

export function createPassportTwinHistory({ twinHistoryId = makeId("PTH"), propertyId, passportId, twinType = PASSPORT_TWIN_TYPE.TWIN_TYPE_A, twinReferenceId, status = PASSPORT_TWIN_STATUS.CURRENT, approvedAt = new Date().toISOString(), supersedesTwinReferenceId = null, sourcePropertyId = propertyId, revisionId = null } = {}) {
  return { twinHistoryId, propertyId, passportId, twinType, twinReferenceId, status, approvedAt, supersedesTwinReferenceId, sourcePropertyId, revisionId };
}

export function createPassportConditionHistory({ conditionHistoryId = makeId("PCHD"), propertyId, passportId, conditionId, status = PASSPORT_CONDITION_STATE.ACTIVE, sourceFindingId = null, acceptedRevisionId = null, resolvedAt = null, at = new Date().toISOString() } = {}) {
  return { conditionHistoryId, propertyId, passportId, conditionId, status, sourceFindingId, acceptedRevisionId, resolvedAt, at };
}

export function createPassportProjectHistory({ projectHistoryId = makeId("PPH"), propertyId, passportId, projectId, status = "STARTED", relatedFindingIds = [], revisionId = null, startedAt = new Date().toISOString(), completedAt = null } = {}) {
  return { projectHistoryId, propertyId, passportId, projectId, status, relatedFindingIds, revisionId, startedAt, completedAt };
}

export function createPassportRepairHistory({ repairHistoryId = makeId("PRH"), propertyId, passportId, repairId, projectId = null, relatedFindingIds = [], completionEvidenceId = null, status = "VERIFIED", completedAt = new Date().toISOString(), revisionId = null } = {}) {
  return { repairHistoryId, propertyId, passportId, repairId, projectId, relatedFindingIds, completionEvidenceId, status, completedAt, revisionId };
}

export function createPassportMaintenanceHistory({ maintenanceHistoryId = makeId("PMTH"), propertyId, passportId, maintenanceId, systemId = null, task = "MAINTENANCE", status = "PERFORMED", performedAt = new Date().toISOString(), evidenceIds = [], revisionId = null } = {}) {
  return { maintenanceHistoryId, propertyId, passportId, maintenanceId, systemId, task, status, performedAt, evidenceIds, revisionId };
}

export function createPassportDocumentHistory({ documentHistoryId = makeId("PDH"), propertyId, passportId, documentId, title = "Document", artifactReference, source = "property:document", relatedProjectId = null, relatedRepairId = null, revisionId = null, addedAt = new Date().toISOString() } = {}) {
  return { documentHistoryId, propertyId, passportId, documentId, title, artifactReference, source, relatedProjectId, relatedRepairId, revisionId, addedAt };
}

export function createPassportTimelineEntry({ timelineId = makeId("PTL"), propertyId, passportId, type, at = new Date().toISOString(), summary = "", source = null, sourceDomain = null, sourceRef = null, revisionId = null } = {}) {
  return { timelineId, propertyId, passportId, type, at, summary, source, sourceDomain, sourceRef, revisionId };
}

export function validatePropertyScopedPassportRecord({ propertyId, entityPropertyId, entityType = "passport" }) {
  if (!propertyId || !entityPropertyId) throw new Error(`${entityType} requires property identifiers.`);
  if (propertyId !== entityPropertyId) throw new Error(`Cross-property ${entityType} reference refused: ${propertyId} !== ${entityPropertyId}`);
  return { ok: true, propertyId };
}

export function ensureApprovedTwinReference({ status, propertyId, twinPropertyId }) {
  validatePropertyScopedPassportRecord({ propertyId, entityPropertyId: twinPropertyId, entityType: "twin-reference" });
  if (!status || ![PASSPORT_TWIN_STATUS.APPROVED, PASSPORT_TWIN_STATUS.CURRENT, PASSPORT_TWIN_STATUS.HISTORICAL, PASSPORT_TWIN_STATUS.SUPERSEDED].includes(status)) throw new Error("Unapproved twin version refused for Passport reference.");
  return { ok: true, approved: true, status };
}

export function buildPassportHistoryBundle({ propertyId, passportId, currentRevisionId, revisions = [], ownership = [], components = [], measurements = [], twins = [], conditions = [], projects = [], repairs = [], maintenance = [], documents = [], timeline = [], audit = [], integrityIssues = [] } = {}) {
  return { propertyId, passportId, currentRevisionId, identityHistory: revisions.map((r) => ({ revisionId: r.revisionId, propertyId, passportId, status: r.status, acceptedAt: r.acceptedAt, reason: r.reason })), ownershipHistory: ownership, componentHistory: components, measurementHistory: measurements, twinHistory: twins, conditionHistory: conditions, projectHistory: projects, repairHistory: repairs, maintenanceHistory: maintenance, documentHistory: documents, timeline, audit, integrityIssues };
}

export function createPassportTwinReference({ twinReferenceId = makeId("PTR"), propertyId, passportId, twinType = PASSPORT_TWIN_TYPE.TWIN_TYPE_A, twinVersionId = null, twinSourceId = null, status = PASSPORT_TWIN_STATUS.APPROVED, approvedAt = new Date().toISOString(), supersededAt = null, supersedesTwinReferenceId = null, revisionId = null, sourceRefs = [], sourcePropertyId = propertyId } = {}) {
  return { twinReferenceId, propertyId, passportId, twinType, twinVersionId, twinSourceId, status, approvedAt, supersededAt, supersedesTwinReferenceId, revisionId, sourceRefs, sourcePropertyId };
}

export function createPassportIntegrityIssue({ issueId = makeId("PII"), propertyId, passportId, code, severity = "warning", message, revisionId = null, sourceRef = null, status = PASSPORT_INTEGRITY.WARNING } = {}) {
  return { issueId, propertyId, passportId, code, severity, message, revisionId, sourceRef, status };
}

export function evaluatePassportIntegrity({ revisions = [], orphanCount = 0, brokenSourceCount = 0, currentHeadState = "OK", revisionChainState = "OK", warnings = [] } = {}) {
  const hashChainState = revisions.length ? "CHAINED" : "EMPTY";
  if (brokenSourceCount || orphanCount) return { status: PASSPORT_INTEGRITY.WARNING, hashChainState, orphanCount, brokenSourceCount, currentHeadState, revisionChainState, warnings: warnings.length ? warnings : ["Integrity warning detected."] };
  return { status: PASSPORT_INTEGRITY.CLEAN, hashChainState, orphanCount, brokenSourceCount, currentHeadState, revisionChainState, warnings };
}

export function buildPassportTimeline({ propertyId, events = [] } = []) {
  return events.map((event, index) => ({ eventId: event.eventId || `EVT-${index + 1}`, propertyId, type: event.type, at: event.at || new Date().toISOString(), summary: event.summary || event.type, source: event.source || null }));
}

export { ensureAccepted };
