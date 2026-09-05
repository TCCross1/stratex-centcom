import { serve } from "../shared/transport.js";
import { TRUTH_CLASS } from "../shared/classification.js";
import { passportRecord as fixturePassportRecord } from "./fixtures.js";
import { listSeeVersions } from "./see-versions.js";
import {
  PASSPORT_STATUS,
  PASSPORT_REVISION_STATE,
  PASSPORT_CONFLICT_STATE,
  PASSPORT_INGESTION_STATE,
  PASSPORT_INTEGRITY,
  PASSPORT_REBASE_STATE,
  PASSPORT_RELATIONSHIP_TYPE,
  PASSPORT_COMPONENT_TYPE,
  PASSPORT_COMPONENT_LIFECYCLE,
  PASSPORT_CONDITION_STATE,
  PASSPORT_DIRECTORY_FILTER,
  PASSPORT_ALERT_TYPE,
} from "./constants.js";
import {
  buildPassportRecord,
  createPassportRevision,
  createPassportRelationship,
  createPassportComponent,
  createPassportMeasurement,
  createPassportCondition,
  createPassportAuditEvent,
  createPassportTimelineEntry,
  createPassportConflict,
  createPassportIngestionRequest,
  validatePassportCandidate,
  evaluateTruthAcceptance,
  rebuildCurrentProjection,
  transferPassportOwnership,
  buildPassportTimeline,
  buildPassportHistoryBundle,
  evaluatePassportIntegrity,
  createPassportTwinReference,
  createPassportTwinHistory,
  createPassportConditionHistory,
  createPassportProjectHistory,
  createPassportRepairHistory,
  createPassportMaintenanceHistory,
  createPassportDocumentHistory,
  createPassportMeasurementHistory,
  createPassportComponentHistory,
  createPassportOwnershipHistory,
  createPassportIdentityHistory,
  createPassportIntegrityIssue,
} from "./builders.js";

export const PassportIntegrityService = {
  verify: ({ propertyId, passportId, revisions = [], currentHeadRevisionId = null, orphanCount = 0, brokenSourceCount = 0, warnings = [], currentHeadState = "OK", revisionChainState = "OK", hashChainState = revisions.length ? "CHAINED" : "EMPTY" } = {}) => {
    const hasCurrentHead = !!currentHeadRevisionId || revisions.length > 0;
    const chainOk = revisionChainState === "OK" && hasCurrentHead;
    let status = PASSPORT_INTEGRITY.CLEAN;
    const issueWarnings = [...warnings];
    if (orphanCount > 0) issueWarnings.push("ORPHAN_REFERENCE");
    if (brokenSourceCount > 0) issueWarnings.push("BROKEN_SOURCE_REFERENCE");
    if (!chainOk) {
      status = PASSPORT_INTEGRITY.FAILURE;
      issueWarnings.push("REVISION_CHAIN_INVALID");
    } else if (issueWarnings.length > 0) {
      status = PASSPORT_INTEGRITY.WARNING;
    }
    return { propertyId, passportId, status, hashChainState, revisionChainState: chainOk ? "OK" : "FAIL", currentHeadState: currentHeadState === "OK" && hasCurrentHead ? "OK" : "FAIL", orphanCount, brokenSourceCount, warnings: issueWarnings };
  },
};

export const PassportProjectionService = {
  core: ({ propertyId, revisions = [], currentState = {} } = {}) => ({ propertyId, currentRevisionId: revisions.at(-1)?.revisionId || null, identity: currentState.propertyIdentity || { propertyId }, components: currentState.components || [], systems: currentState.systems || [], measurements: currentState.measurements || [], conditions: currentState.conditions || [], projects: currentState.projects || [], repairs: currentState.repairs || [], maintenance: currentState.maintenance || [], acceptedCortexIntelligence: currentState.acceptedCortexIntelligence || [], mutable: false }),
  pro: ({ propertyId, currentState = {} } = {}) => ({ propertyId, readOnly: true, filtered: currentState.filtered || true, authorized: true, ownershipSummary: currentState.ownershipSummary || "authorized" }),
  habitat: ({ propertyId, currentState = {} } = {}) => ({ propertyId, readOnly: true, homeownerSafe: true, authorized: currentState.authorization !== false, visibleSummary: currentState.visibleSummary || "homeowner-safe overview" }),
  report: ({ propertyId, currentState = {} } = {}) => ({ propertyId, truthClass: currentState.truthClass || "MEASURED", confidence: currentState.confidence || null, readOnly: true, sections: currentState.sections || ["Property Passport", "Timeline", "Conditions"] }),
};

export const PassportRebaseService = {
  rebase: ({ candidateBaseRevisionId, currentHeadRevisionId, candidateTouches = {}, canonicalFields = {}, candidateFields = {} }) => {
    const touched = Object.keys(candidateTouches).filter(Boolean);
    const conflicts = touched.filter((key) => canonicalFields[key] !== undefined && candidateFields[key] !== undefined && canonicalFields[key] !== candidateFields[key]);
    if (!candidateBaseRevisionId || !currentHeadRevisionId) return { state: PASSPORT_REBASE_STATE.BLOCKED, reason: "MISSING_BASE" };
    if (candidateBaseRevisionId === currentHeadRevisionId) return { state: PASSPORT_REBASE_STATE.CLEAN, reason: "NO_REBASE_REQUIRED" };
    if (!touched.length) return { state: PASSPORT_REBASE_STATE.CLEAN, reason: "UNRELATED_FIELDS" };
    if (conflicts.length) return { state: PASSPORT_REBASE_STATE.CONFLICTED, reason: "FIELD_CONFLICT", originalBaseRevisionId: candidateBaseRevisionId, rebasedOntoRevisionId: currentHeadRevisionId, conflicts };
    return { state: PASSPORT_REBASE_STATE.CLEAN, reason: "REBASED_CLEANLY", originalBaseRevisionId: candidateBaseRevisionId, rebasedOntoRevisionId: currentHeadRevisionId };
  },
};

export * from "./builders.js";
export * from "./constants.js";

const PASSPORT_DIRECTORY_FILTER_KEYS = Object.values(PASSPORT_DIRECTORY_FILTER);

const buildPassportDirectoryRow = (property, record) => {
  const ownership = Array.isArray(record.ownership) ? record.ownership : [];
  const currentOwner = ownership.find((o) => o.isCurrent) || ownership[0] || {};
  const openConflicts = Array.isArray(record.conflicts) ? record.conflicts.filter((c) => c.status === PASSPORT_CONFLICT_STATE.OPEN || c.status === PASSPORT_CONFLICT_STATE.UNDER_REVIEW).length : (property.passportState === "CONFLICT" ? 1 : 0);
  const pendingIngestions = Array.isArray(record.ingestions) ? record.ingestions.filter((i) => i.status === PASSPORT_INGESTION_STATE.READY_FOR_REVIEW || i.status === PASSPORT_INGESTION_STATE.PENDING_REVIEW || i.status === PASSPORT_INGESTION_STATE.BLOCKED).length : 0;
  const integrityState = record.integrityState || record.integrity || PASSPORT_INTEGRITY.CLEAN;
  const filterKeys = [PASSPORT_DIRECTORY_FILTER.ALL];
  if (Array.isArray(record.revisions) && record.revisions.some((r) => r.status === PASSPORT_REVISION_STATE.PENDING_REVIEW)) filterKeys.push(PASSPORT_DIRECTORY_FILTER.PENDING_REVIEW);
  if (openConflicts > 0) filterKeys.push(PASSPORT_DIRECTORY_FILTER.OPEN_CONFLICTS);
  if (integrityState !== PASSPORT_INTEGRITY.CLEAN) filterKeys.push(PASSPORT_DIRECTORY_FILTER.INTEGRITY_WARNING);
  if (Array.isArray(record.ownership) && record.ownership.some((o) => o.isCurrent === false && o.relationshipType === "OWNER")) filterKeys.push(PASSPORT_DIRECTORY_FILTER.TRANSFER_PENDING);
  if (Array.isArray(record.revisions) && record.revisions.some((r) => r.acceptedAt && (Date.now() - new Date(r.acceptedAt).getTime()) <= 1000 * 60 * 60 * 24 * 30)) filterKeys.push(PASSPORT_DIRECTORY_FILTER.RECENTLY_UPDATED);
  if (pendingIngestions > 0 || (property.passportState === "BLOCKED")) filterKeys.push(PASSPORT_DIRECTORY_FILTER.BLOCKED_INGESTION);
  return {
    propertyId: property.stratexPropertyId,
    passportId: record.passportId,
    currentRevision: record.currentRevision || record.currentRevisionId || "—",
    lastAccepted: record.latestAcceptedAt || record.updatedAt || null,
    ownerState: currentOwner.relationshipType || "OWNER",
    openConflicts,
    pendingIngestions,
    twinCoverage: Array.isArray(record.currentProjection?.currentState?.twinCoverage) ? record.currentProjection.currentState.twinCoverage.length : (record.currentProjection?.currentState?.twinCoverage ?? 0),
    activeConditions: Array.isArray(record.conditions) ? record.conditions.length : 0,
    integrityState,
    status: property.passportState,
    filterKeys: [...new Set(filterKeys)],
  };
};

export const PassportService = {
  getCommandSummary: () => serve(async () => {
    const { properties } = await import("../property/fixtures.js");
    const passports = await Promise.all(properties.map(async (property) => {
      const record = await PassportService.getByProperty(property.stratexPropertyId);
      return { property, record };
    }));
    return passports.reduce((acc, { property, record }) => {
      const revisions = Array.isArray(record.revisions) ? record.revisions : [];
      const conflicts = Array.isArray(record.conflicts) ? record.conflicts : [];
      const ingestions = Array.isArray(record.ingestions) ? record.ingestions : [];
      const warnings = Array.isArray(record.integrityWarnings) ? record.integrityWarnings : [];
      const ownership = Array.isArray(record.ownership) ? record.ownership : [];
      const now = Date.now();
      acc.totalPassports += 1;
      acc.revisionsPending += revisions.filter((r) => r.status === PASSPORT_REVISION_STATE.PENDING_REVIEW).length;
      acc.conflictsOpen += conflicts.filter((c) => c.status === PASSPORT_CONFLICT_STATE.OPEN || c.status === PASSPORT_CONFLICT_STATE.UNDER_REVIEW).length + (property.passportState === "CONFLICT" ? 1 : 0);
      acc.ingestionsBlocked += ingestions.filter((i) => i.status === PASSPORT_INGESTION_STATE.BLOCKED).length + (property.passportState === "BLOCKED" ? 1 : 0);
      acc.truthReviewsRequired += (record.integrityState && record.integrityState !== PASSPORT_INTEGRITY.CLEAN ? 1 : 0) + (record.conditions || []).filter((c) => c.truthClassification === "PROBABLE" || c.truthClassification === "POSSIBLE").length;
      acc.ownershipTransfers += ownership.filter((o) => !o.isCurrent).length;
      acc.integrityWarnings += warnings.length + (record.integrityState === PASSPORT_INTEGRITY.WARNING ? 1 : 0);
      acc.recentCanonicalUpdates += revisions.filter((r) => {
        if (!r.acceptedAt) return false;
        const t = new Date(r.acceptedAt).getTime();
        return Number.isFinite(t) && (now - t) <= 1000 * 60 * 60 * 24 * 30;
      }).length;
      return acc;
    }, { totalPassports: 0, revisionsPending: 0, conflictsOpen: 0, ingestionsBlocked: 0, truthReviewsRequired: 0, ownershipTransfers: 0, integrityWarnings: 0, recentCanonicalUpdates: 0 });
  }),
  getPassportDirectoryFilters: () => serve(() => PASSPORT_DIRECTORY_FILTER_KEYS),
  listPassportDirectory: (filter = PASSPORT_DIRECTORY_FILTER.ALL) => serve(async () => {
    const { properties } = await import("../property/fixtures.js");
    const rows = await Promise.all(properties.map(async (property) => {
      const record = await PassportService.getByProperty(property.stratexPropertyId);
      return buildPassportDirectoryRow(property, record);
    }));
    const normalized = String(filter || PASSPORT_DIRECTORY_FILTER.ALL);
    if (normalized === PASSPORT_DIRECTORY_FILTER.ALL) return rows;
    const filterMap = {
      [PASSPORT_DIRECTORY_FILTER.PENDING_REVIEW]: (row) => row.filterKeys.includes(PASSPORT_DIRECTORY_FILTER.PENDING_REVIEW),
      [PASSPORT_DIRECTORY_FILTER.OPEN_CONFLICTS]: (row) => row.filterKeys.includes(PASSPORT_DIRECTORY_FILTER.OPEN_CONFLICTS),
      [PASSPORT_DIRECTORY_FILTER.INTEGRITY_WARNING]: (row) => row.filterKeys.includes(PASSPORT_DIRECTORY_FILTER.INTEGRITY_WARNING),
      [PASSPORT_DIRECTORY_FILTER.TRANSFER_PENDING]: (row) => row.filterKeys.includes(PASSPORT_DIRECTORY_FILTER.TRANSFER_PENDING),
      [PASSPORT_DIRECTORY_FILTER.RECENTLY_UPDATED]: (row) => row.filterKeys.includes(PASSPORT_DIRECTORY_FILTER.RECENTLY_UPDATED),
      [PASSPORT_DIRECTORY_FILTER.BLOCKED_INGESTION]: (row) => row.filterKeys.includes(PASSPORT_DIRECTORY_FILTER.BLOCKED_INGESTION),
    };
    const fn = filterMap[normalized] || (() => true);
    return rows.filter(fn);
  }),
  getByProperty: (propertyId = fixturePassportRecord.propertyId) => serve(() => {
    const safePropertyId = propertyId || fixturePassportRecord.propertyId;
    const record = buildPassportRecord({ propertyId: safePropertyId, status: PASSPORT_STATUS.ACTIVE });
    const revisionA = createPassportRevision({ passportId: `PP-${safePropertyId}`, propertyId: safePropertyId, revisionNumber: 1, parentRevisionId: null, baseRevisionId: null, createdByType: "SYSTEM", createdById: "system:passport-bootstrap", sourceType: "property-identity", sourceManifestId: "PM-BOOTSTRAP", status: PASSPORT_REVISION_STATE.ACCEPTED, changeCount: 2, warningCount: 0, reason: "Canonical property bootstrap", content: { propertyIdentity: { propertyId: safePropertyId } } });
    const revisionB = createPassportRevision({ passportId: `PP-${safePropertyId}`, propertyId: safePropertyId, revisionNumber: 2, parentRevisionId: revisionA.revisionId, baseRevisionId: revisionA.revisionId, createdByType: "CORTEX", createdById: "manifest:pcm-001", sourceType: "cortex-manifest", sourceManifestId: "PCM-SXP-004182-001", status: PASSPORT_REVISION_STATE.ACCEPTED, changeCount: 1, warningCount: 0, reason: "Accepted roof condition review", content: { condition: "roof_wetness", status: "WATCH" } });
    const ownership = [createPassportRelationship({ relationshipId: `OWN-${safePropertyId}`, propertyId: safePropertyId, partyRef: `P-${safePropertyId.slice(-4)}`, relationshipType: PASSPORT_RELATIONSHIP_TYPE.OWNER, startDate: new Date(Date.now() - 120000000).toISOString(), endDate: null, isCurrent: true, source: "property:identity", verificationState: "VERIFIED" }), createPassportRelationship({ relationshipId: `OWN-${safePropertyId}-PRIOR`, propertyId: safePropertyId, partyRef: `P-OLD-${safePropertyId.slice(-4)}`, relationshipType: PASSPORT_RELATIONSHIP_TYPE.OWNER, startDate: new Date(Date.now() - 240000000).toISOString(), endDate: new Date(Date.now() - 120000000).toISOString(), isCurrent: false, source: "property:identity", verificationState: "VERIFIED" })];
    const conditions = [createPassportCondition({ conditionId: `COND-${safePropertyId}-1`, propertyId: safePropertyId, sourceFindingId: "FD-0001", truthClassification: TRUTH_CLASS.PROBABLE, confidence: 0.82, severity: "moderate", status: PASSPORT_CONDITION_STATE.ACTIVE, sourceRefs: ["E-001"], acceptedRevisionId: revisionB.revisionId })];
    const measurements = [createPassportMeasurement({ measurementId: `MEAS-${safePropertyId}-1`, propertyId: safePropertyId, measurementType: "roof_area", value: 1824, unit: "sq_ft", truthClassification: TRUTH_CLASS.MEASURED, method: "LiDAR", sourceEvidenceIds: ["E-001"], acceptedRevisionId: revisionB.revisionId, precision: 0.1, accuracy: 0.05, quality: "STANDARD" })];
    const timeline = buildPassportTimeline({ propertyId: safePropertyId, events: [{ type: "PROPERTY_CREATED", summary: "Property initialized in Passport" }, { type: "PASSPORT_REVISION_ACCEPTED", summary: "Current revision accepted" }, { type: "PASSPORT_ALERT_CREATED", summary: "Review required" }] });
    const conflicts = [createPassportConflict({ propertyId: safePropertyId, baseRevisionId: revisionA.revisionId, candidateSourceId: "PCM-SXP-004182-001", entityType: "condition", entityId: `COND-${safePropertyId}-1`, fieldPath: "status", canonicalValue: "ACTIVE", candidateValue: "WATCH", canonicalSourceRefs: ["E-0009"], candidateSourceRefs: ["FD-0001"], truthClasses: [TRUTH_CLASS.MEASURED, TRUTH_CLASS.PROBABLE], createdAt: new Date().toISOString(), severity: "medium", status: PASSPORT_CONFLICT_STATE.OPEN, reason: "Candidate conflicts with the accepted status" })];
    const ingestions = [createPassportIngestionRequest({ propertyId: safePropertyId, candidateManifestId: "PCM-SXP-004182-001", baseRevisionId: revisionA.revisionId, status: PASSPORT_INGESTION_STATE.BLOCKED, warnings: ["MISSING_LINEAGE"], conflictCount: 1, proposedChangeSetId: "PCS-1" }), createPassportIngestionRequest({ propertyId: safePropertyId, candidateManifestId: "PCM-SXP-004182-002", baseRevisionId: revisionB.revisionId, status: PASSPORT_INGESTION_STATE.READY_FOR_REVIEW, warnings: [], conflictCount: 0, proposedChangeSetId: "PCS-2" })];
    const alerts = [{ alertId: "AL-1", alertType: PASSPORT_ALERT_TYPE.INGESTION_BLOCKED, propertyId: safePropertyId, route: `/passport/${safePropertyId}/ingestions/${ingestions[0].ingestionId}`, severity: "high", createdAt: new Date().toISOString(), summary: "Candidate ingestion blocked", reason: "MISSING_LINEAGE", sourceEntity: "PCM-SXP-004182-001", deepLink: `/passport/${safePropertyId}/ingestions/${ingestions[0].ingestionId}`, status: "OPEN" }, { alertId: "AL-2", alertType: PASSPORT_ALERT_TYPE.CONFLICT_CREATED, propertyId: safePropertyId, route: `/passport/${safePropertyId}/conflicts/${conflicts[0].conflictId}`, severity: "medium", createdAt: new Date().toISOString(), summary: "Condition conflict requires governance", reason: "Candidate conflicts with accepted state", sourceEntity: conflicts[0].conflictId, deepLink: `/passport/${safePropertyId}/conflicts/${conflicts[0].conflictId}`, status: "OPEN" }, { alertId: "AL-3", alertType: PASSPORT_ALERT_TYPE.REVIEW_REQUIRED, propertyId: safePropertyId, route: `/passport/${safePropertyId}/revisions/${revisionB.revisionId}`, severity: "medium", createdAt: new Date().toISOString(), summary: "Truth review required", reason: "Probable classification needs review", sourceEntity: revisionB.revisionId, deepLink: `/passport/${safePropertyId}/revisions/${revisionB.revisionId}`, status: "OPEN" }];
    const systemsHealth = [{ name: "Passport Service", status: "HEALTHY", count: 1, reason: "Service synced", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }, { name: "Revision Queue", status: "ATTENTION", count: 1, reason: "Review required", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }, { name: "Ingestion Queue", status: "BLOCKED", count: 1, reason: "Blocked candidate", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }, { name: "Conflict Backlog", status: "ATTENTION", count: 1, reason: "Open conflict", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }, { name: "Projection Health", status: "HEALTHY", count: 4, reason: "All projections generated", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }, { name: "Integrity Warnings", status: "WARNING", count: 1, reason: "Integrity warning present", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }, { name: "Hash-Chain State", status: "HEALTHY", count: 2, reason: "Revision hash chain intact", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }, { name: "Orphan References", status: "HEALTHY", count: 0, reason: "No orphan references", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }, { name: "Broken Source References", status: "WARNING", count: 1, reason: "Bad source lineage", lastEvaluated: new Date().toISOString(), affected: [safePropertyId] }];
    const seeVersions = listSeeVersions(safePropertyId);
    const revisions = [revisionA, revisionB, ...seeVersions];
    const head = revisions.at(-1);
    const seeFindings = seeVersions.flatMap((rev) => (rev.content?.seeFindings || []).map((finding) => ({
      ...finding,
      passportVersionId: rev.revisionId,
      committedToPassport: true,
    })));
    const projectedCurrent = rebuildCurrentProjection({ propertyId: safePropertyId, revisions, currentRevisionId: head.revisionId, currentState: { propertyIdentity: { propertyId: safePropertyId }, activeConditions: conditions.length, ownershipState: "CURRENT", twinCoverage: 3, seeFindings } });
    const history = {
      ownership,
      components: [createPassportComponent({ componentId: `COMP-${safePropertyId}-ROOF-01`, propertyId: safePropertyId, componentType: PASSPORT_COMPONENT_TYPE.ROOF, name: "Roof assembly", status: PASSPORT_COMPONENT_LIFECYCLE.ACTIVE, createdRevisionId: revisionB.revisionId, currentRevisionId: revisionB.revisionId })],
      measurements,
      conditions,
      timeline,
      audit: [createPassportAuditEvent({ propertyId: safePropertyId, passportId: `PP-${safePropertyId}`, revisionId: revisionB.revisionId, action: "PASSPORT_REVIEWED", entityType: "condition", entityId: `COND-${safePropertyId}-1`, reason: "Probable condition received governance review" })],
      integrity: evaluatePassportIntegrity({ revisions: [revisionA, revisionB], orphanCount: 0, brokenSourceCount: 1, currentHeadState: "OK", revisionChainState: "OK", warnings: ["BROKEN_SOURCE_REFERENCE"] }),
    };
    return {
      ...fixturePassportRecord,
      ...record,
      propertyId: safePropertyId,
      passportId: `PP-${safePropertyId}`,
      currentRevision: head.revisionId,
      currentRevisionId: head.revisionId,
      seeFindings,
      integrity: history.integrity.status,
      integrityState: history.integrity.status,
      status: PASSPORT_STATUS.ACTIVE,
      schemaVersion: "1.0",
      latestAcceptedAt: new Date().toISOString(),
      ownership: history.ownership,
      components: history.components,
      measurements: history.measurements,
      conditions: history.conditions,
      timeline: history.timeline,
      audit: history.audit,
      conflicts,
      ingestions,
      alerts,
      systemsHealth,
      revisions,
      projections: { core: "synced", pro: "synced", habitat: "synced", report: "synced" },
      currentProjection: projectedCurrent,
      currentState: { propertyIdentity: { propertyId: safePropertyId }, activeConditions: conditions.length, ownershipState: "CURRENT", twinCoverage: 3 },
    };
  }),
  listRevisions: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.revisions)),
  getRevisionDetail: (propertyId, revisionId) => serve(() => PassportService.getByProperty(propertyId).then((r) => {
    const revision = (r.revisions || []).find((rev) => rev.revisionId === revisionId || rev.rev === revisionId || rev.id === revisionId) || r.revisions?.[0];
    return revision ? { ...revision, propertyId: r.propertyId, passportId: r.passportId, sourceRefs: ["E-001", "FD-0001"], evidenceRefs: ["E-001"], reason: revision.reason || "Canonical record change", auditRecords: r.audit || [], previousHash: revision.previousIntegrityHash || null, hashState: revision.integrityHash ? "CHAINED" : "UNKNOWN", acceptedValue: revision.content || revision.reason || "—", previousValue: revision.content?.previousValue || "—", changedField: revision.content?.condition || "status" } : null;
  })),
  getCurrentProjection: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.currentProjection || rebuildCurrentProjection({ propertyId, revisions: r.revisions || [], currentRevisionId: r.currentRevisionId }))),
  getIntegrity: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => ({ status: r.integrityState || PASSPORT_INTEGRITY.CLEAN, hashChainState: "CHAINED", orphanCount: 0, brokenSourceCount: 0, currentHeadState: "OK", revisionChainState: "OK", warnings: [] }))),
  getPassportAlerts: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.alerts || [])),
  getSystemsHealth: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.systemsHealth || [])),
  getProjectionInspector: (propertyId, projectionType = "core") => serve(() => PassportService.getByProperty(propertyId).then((r) => ({
    propertyId: r.propertyId,
    passportId: r.passportId,
    projectionType,
    projectionVersion: "V1",
    generatedAt: new Date().toISOString(),
    sourceRevisionId: r.currentRevisionId,
    readOnlyPolicy: "READ_ONLY",
    fieldsIncluded: ["propertyIdentity", "ownership", "conditions", "measurements"],
    fieldsExcluded: ["rawEvidence", "privateIdentifiers"],
    truthClassificationsPreserved: [TRUTH_CLASS.MEASURED, TRUTH_CLASS.PROBABLE],
    privacyTransformations: ["redact_identity_details"],
    health: "HEALTHY",
    currentState: r.currentState || {},
  }))),
  getIngestionReview: (propertyId, ingestionId) => serve(() => PassportService.getByProperty(propertyId).then((r) => (r.ingestions || []).find((i) => i.ingestionId === ingestionId) || null)),
  getConflictReview: (propertyId, conflictId) => serve(() => PassportService.getByProperty(propertyId).then((r) => (r.conflicts || []).find((i) => i.conflictId === conflictId) || null)),
  getOwnership: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.ownership || [])),
  getComponents: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.components || [])),
  getMeasurements: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.measurements || [])),
  getConditions: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.conditions || [])),
  getTimeline: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.timeline || [])),
  getAudit: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.audit || [])),
  getHistoryBundle: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => buildPassportHistoryBundle({ propertyId, passportId: r.passportId, currentRevisionId: r.currentRevisionId, revisions: r.revisions || [], ownership: r.ownership || [], components: r.components || [], measurements: r.measurements || [], twins: r.twins || [], conditions: r.conditions || [], projects: r.projects || [], repairs: r.repairs || [], maintenance: r.maintenance || [], documents: r.documents || [], timeline: r.timeline || [], audit: r.audit || [], integrityIssues: r.integrityIssues || [] }))),
  listIdentityHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => (r.revisions || []).map((rev) => ({ revisionId: rev.revisionId, acceptedAt: rev.acceptedAt, status: rev.status, propertyId: r.propertyId, passportId: r.passportId })))),
  listOwnershipHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.ownership || [])),
  listComponentHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.components || [])),
  listMeasurementHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.measurements || [])),
  listTwinHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.twins || [])),
  listConditionHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.conditions || [])),
  listProjectHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.projects || [])),
  listRepairHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.repairs || [])),
  listMaintenanceHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.maintenance || [])),
  listDocumentHistory: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.documents || [])),
  listTimeline: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.timeline || [])),
  listAudit: (propertyId) => serve(() => PassportService.getByProperty(propertyId).then((r) => r.audit || [])),
};

export default PassportService;
