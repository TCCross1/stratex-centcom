/**
 * SERVICE FACADE
 *
 * One import surface for the presentation layer. Each method delegates to the
 * domain that owns the data — this file holds no fixtures and no business
 * rules of its own.
 *
 * The toLegacy* translation adapters that lived here during the Directive 004
 * migration have been removed. Presentation components now read canonical
 * domain field names directly.
 */
import { serve } from "./shared/transport.js";
import PropertyService from "./property/service.js";
import MissionService from "./mission/service.js";
import EvidenceService from "./evidence/service.js";
import CortexService from "./cortex/service.js";
import PassportService from "./passport/service.js";
import SharingService from "./sharing/service.js";
import TimelineService from "./timeline/service.js";
import AuditService from "./audit/service.js";
import AtcService, { FlightProvider } from "./atc/legacy-service.js";
import CoreAdapter from "./core/adapter.js";
import ProAdapter from "./pro/adapter.js";
import HabitatAdapter from "./habitat/adapter.js";
import CoreReportAdapter from "./reports/service.js";
import EvidenceVault from "./evidence/vault.js";
import RealityEngine from "./reality/service.js";
import RealityProjections from "./reality/projections.js";
import AtcCommandService, { LIVE_STATE, LAUNCH_STATE, HOLD_REASONS } from "./atc/service.js";
import { providerHealth } from "./atc/providers.js";
import MeasurementService from "./measurements/service.js";
import AweService from "./awe/service.js";
import { ProjectService, RepairService, MaintenanceService, DocumentService } from "./work/service.js";
import { passportRecord } from "./passport/fixtures.js";
import { ownership } from "./property/fixtures.js";
import {
  session, alerts, activity, metrics, overview, conditions, systems,
} from "../data/dashboard-fixtures.js";

export const centcomApi = {
  // dashboard
  getSession: () => serve(session, { delay: 60 }),
  getConditions: () => serve(conditions),
  getOverview: () => serve(overview),
  getAlerts: () => serve(alerts),
  getActivity: () => serve(activity),
  getMetrics: () => serve(metrics),
  getSystems: () => serve(systems),
  getAudit: (propertyId) =>
    propertyId ? AuditService.listByProperty(propertyId) : AuditService.list(),

  // property
  listPropertySummaries: () => PropertyService.listSummaries(),
  getDirectorySummary: async () => {
    const [summary, missions] = await Promise.all([
      PropertyService.getDirectorySummary(),
      MissionService.getCommandSummary(),
    ]);
    return { ...summary, activeMissions: missions.inFlight + missions.awaitingAtc };
  },
  getProperty: (id) => PropertyService.get(id),
  listPropertySystems: (id) => PropertyService.listSystems(id),
  listTwins: (propertyId) => PropertyService.listTwins(propertyId),
  listOwnership: () => serve(ownership),

  // mission — every write goes through a transition guard in the service
  listMissions: (propertyId) =>
    propertyId ? MissionService.listByProperty(propertyId) : MissionService.listAll(),
  getMission: (id) => MissionService.get(id),
  createMission: (draft, actor) => MissionService.create(draft, actor),
  validateMissionDraft: (draft) => MissionService.validateDraft(draft),
  getMissionDetail: (id) => MissionService.getDetail(id),
  getMissionSummary: () => MissionService.getCommandSummary(),
  getReadinessRequest: (id) => MissionService.getReadinessRequest(id),
  transitionMission: (id, to, opts) => MissionService.transition(id, to, opts),
  cancelMission: (id, reason, opts) => MissionService.cancel(id, reason, opts),
  abortMission: (id, reason, opts) => MissionService.abort(id, reason, opts),
  assignMissionResource: (id, type, resourceId, opts) => MissionService.assignResource(id, type, resourceId, opts),
  resolveMissionBlocker: (blockerId, resolution, opts) => MissionService.resolveBlocker(blockerId, resolution, opts),
  requestMissionAuthorization: (id, scope, opts) => MissionService.requestAuthorization(id, scope, opts),
  markRecaptureRequired: (id, reason, opts) => MissionService.markRecaptureRequired(id, reason, opts),
  getSensorPackage: (id) => MissionService.getSensorPackage(id),
  getActiveFlight: async () => {
    const { flight, mission } = await MissionService.getActiveFlight();
    const property = await PropertyService.get(mission.propertyId);
    return { flight, mission, property };
  },

  // atc
  getAtcReadiness: () => AtcService.getReadiness(),
  listAircraft: () => AtcService.listAircraft(),
  listOperators: () => AtcService.listOperators(),

  // evidence — property-scoped by default
  listEvidencePackages: (propertyId) =>
    propertyId
      ? EvidenceService.listPackagesByProperty(propertyId)
      : EvidenceService.listPackages(),
  listEvidenceAssets: async (propertyId) => {
    const rows = propertyId
      ? await EvidenceService.listByProperty(propertyId)
      : await EvidenceService.listAll();
    return rows;
  },
  getEvidenceAsset: async (evidenceId) => {
    const asset = await EvidenceService.get(evidenceId);
    const findings = await CortexService.listFindingsByEvidence(evidenceId);
    return {
      asset: asset,
      propertyId: asset.propertyId,
      missionId: asset.missionId,
      analysisId: findings.length ? findings[0].cortexAnalysisId : null,
      findings: findings,
      passportRevision: passportRecord.currentRevision,
    };
  },

  // cortex — no finding bleeds between properties
  listAnalyses: async (propertyId) => {
    const rows = propertyId
      ? await CortexService.listAnalysesByProperty(propertyId)
      : await CortexService.listAnalyses();
    return rows;
  },
  getAnalysis: (id) => CortexService.getAnalysis(id),
  listFindings: async (propertyId) => {
    const rows = propertyId
      ? await CortexService.listFindingsByProperty(propertyId)
      : await CortexService.listFindings();
    return rows;
  },
  getFinding: (id) => CortexService.getFinding(id),
  getCortexSummary: () => CortexService.getCommandSummary(),
  listPredictions: (propertyId) =>
    propertyId
      ? CortexService.listPredictionsByProperty(propertyId)
      : CortexService.listPredictions(),
  listGoldCandidates: (propertyId) =>
    propertyId
      ? CortexService.listGoldCandidatesByProperty(propertyId)
      : CortexService.listGoldCandidates(),

  // passport / sharing / timeline
  getPassport: (propertyId) => PassportService.getByProperty(propertyId),
  getPassportCommandSummary: () => PassportService.getCommandSummary(),
  getPassportDirectoryFilters: () => PassportService.getPassportDirectoryFilters(),
  listPassportDirectory: (filter) => PassportService.listPassportDirectory(filter),
  getPassportAlerts: (propertyId) => PassportService.getPassportAlerts(propertyId),
  getSystemsHealth: (propertyId) => PassportService.getSystemsHealth(propertyId),
  getRevisionDetail: (propertyId, revisionId) => PassportService.getRevisionDetail(propertyId, revisionId),
  getIngestionReview: (propertyId, ingestionId) => PassportService.getIngestionReview(propertyId, ingestionId),
  getConflictReview: (propertyId, conflictId) => PassportService.getConflictReview(propertyId, conflictId),
  getProjectionInspector: (propertyId, projectionType) => PassportService.getProjectionInspector(propertyId, projectionType),
  listGrants: (propertyId) => SharingService.listByProperty(propertyId),
  listTimeline: (propertyId) => TimelineService.listByProperty(propertyId),

  // measurements
  listMeasurements: (propertyId) => MeasurementService.listByProperty(propertyId),
  getMeasurementSummary: (propertyId) => MeasurementService.getSummaryByProperty(propertyId),

  // awe
  listAwe: (propertyId) => AweService.listByProperty(propertyId),

  // work domains — three separate concepts, never merged
  listProjects: (propertyId) => ProjectService.listByProperty(propertyId),
  listRepairs: (propertyId) => RepairService.listByProperty(propertyId),
  listMaintenance: (propertyId) => MaintenanceService.listByProperty(propertyId),
  getMaintenanceRoadmap: (propertyId) => MaintenanceService.getRoadmap(propertyId),
  listDocuments: (propertyId) => DocumentService.listByProperty(propertyId),

  // atc — ATC owns flight readiness; Mission owns intent
  atcEvaluate: (missionId, opts) => AtcCommandService.evaluate(missionId, opts),
  getAtcAssessment: (missionId) => AtcCommandService.getAssessment(missionId),
  getAtcQueue: () => AtcCommandService.getQueue(),
  getLaunchAuthorization: (missionId) => AtcCommandService.getLaunchAuthorization(missionId),
  requestLaunchAuthorization: (missionId, opts) => AtcCommandService.requestLaunchAuthorization(missionId, opts),
  getLiveState: (missionId) => AtcCommandService.getLiveState(missionId),
  holdMission: (missionId, reason, opts) => AtcCommandService.hold(missionId, reason, opts),
  resumeMission: (missionId, opts) => AtcCommandService.resume(missionId, opts),
  getTelemetry: (missionId) => AtcCommandService.getTelemetry(missionId),
  subscribeTelemetry: (missionId, cb) => AtcCommandService.subscribeTelemetry(missionId, cb),
  getCaptureValidation: (missionId) => AtcCommandService.getValidation(missionId),
  validateCapture: (missionId, opts) => AtcCommandService.validateCapture(missionId, opts),
  listAtcEvents: (missionId) => AtcCommandService.listEvents(missionId),
  listAtcAudit: (missionId) => AtcCommandService.listAudit(missionId),
  getProviderHealth: () => AtcCommandService.providerHealth(),

  // evidence vault — originals immutable, custody append-only
  vaultSummary: () => EvidenceVault.getVaultSummary(),
  vaultListAll: () => EvidenceVault.listAll(),
  vaultListByProperty: (id) => EvidenceVault.listByProperty(id),
  vaultListByMission: (id) => EvidenceVault.listByMission(id),
  vaultGet: (id) => EvidenceVault.get(id),
  vaultVerify: (id) => EvidenceVault.verify(id),
  vaultListCustody: (id) => EvidenceVault.listCustody(id),
  vaultReview: (id, decision, opts) => EvidenceVault.review(id, decision, opts),
  vaultQuarantine: (id, reason, opts) => EvidenceVault.quarantine(id, reason, opts),
  vaultRelease: (id, reason, opts) => EvidenceVault.release(id, reason, opts),
  vaultReviewQueue: () => EvidenceVault.listReviewQueue(),
  vaultListPackages: () => EvidenceVault.listPackages(),
  vaultListPackagesByMission: (id) => EvidenceVault.listPackagesByMission(id),
  vaultListPackagesByProperty: (id) => EvidenceVault.listPackagesByProperty(id),
  vaultGetPackage: (id) => EvidenceVault.getPackage(id),
  vaultGetCoverage: (id) => EvidenceVault.getCoverage(id),
  vaultListJobs: (id) => EvidenceVault.listJobs(id),
  vaultBuildManifest: (id) => EvidenceVault.buildCortexManifest(id),
  vaultProviderHealth: () => EvidenceVault.providerHealth(),
  vaultChangeTier: (id, tier, opts) => EvidenceVault.changeTier(id, tier, opts),

  // property reality — approved twin versions are immutable
  realityTwinTypes: () => RealityEngine.listTwinTypes(),
  realityDirectory: () => RealityEngine.getDirectory(),
  realitySummary: () => RealityEngine.getSummary(),
  realityModel: (id) => RealityEngine.getModel(id),
  realityVersions: (id, type) => RealityEngine.listVersions(id, type),
  realityVersion: (id) => RealityEngine.getVersion(id),
  realityCurrentVersion: (id, type) => RealityEngine.getCurrentVersion(id, type),
  realityJobs: (id) => RealityEngine.listJobs(id),
  realityArtifacts: (id) => RealityEngine.listArtifacts(id),
  realityThermal: (vid) => RealityEngine.getThermal(vid),
  realityRoof: (vid) => RealityEngine.getRoof(vid),
  realityMeasurements: (vid) => RealityEngine.getMeasurements(vid),
  realityLayerSet: (id) => RealityEngine.getLayerSet(id),
  realityReview: (vid, decision, opts) => RealityEngine.review(vid, decision, opts),
  realityReviewQueue: () => RealityEngine.listReviewQueue(),
  realityCompare: (a, b) => RealityEngine.compare(a, b),
  realityComparisons: (id) => RealityEngine.listComparisons(id),
  realityChangeSet: (id) => RealityEngine.getChangeSet(id),
  realityProviderHealth: () => RealityEngine.providerHealth(),
  realityAudit: (id) => RealityEngine.listAudit(id),
  realityBuildManifest: (id, opts) => RealityEngine.buildInputManifest(id, opts),
  realityPrepareQualificationDataset: (payload) => RealityEngine.prepareQualificationDataset(payload),

  // reality projections — all read-only
  realityPassportProjection: (id) => RealityProjections.passport(id),
  realityCortexManifest: (id, v) => RealityProjections.cortex(id, v),
  realityCoreProjection: (id, t) => RealityProjections.core(id, t),
  realityProProjection: (id, t, o) => RealityProjections.pro(id, t, o),
  realityHabitatProjection: (id, t) => RealityProjections.habitat(id, t),
  realityReportModules: (id) => RealityProjections.reportModules(id),

  // reports
  listReportJobs: () => CoreReportAdapter.listReportJobs(),
};

export {
  RealityEngine, RealityProjections,
  EvidenceVault,
  AtcCommandService, LIVE_STATE, LAUNCH_STATE, HOLD_REASONS, providerHealth,
  MeasurementService, AweService, ProjectService, RepairService,
  MaintenanceService, DocumentService,
  PropertyService, MissionService, EvidenceService, CortexService,
  PassportService, SharingService, TimelineService, AuditService, AtcService,
  CoreAdapter, ProAdapter, HabitatAdapter, CoreReportAdapter, FlightProvider,
};

/** Legacy alias kept until the component layer stops referencing it. */
export const FlightProviderAdapter = FlightProvider;

export default centcomApi;
