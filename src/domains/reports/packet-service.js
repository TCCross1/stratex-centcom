/**
 * PACKET SERVICE — CENTCOM preview of the Core intelligence packet.
 *
 * Core still generates the delivered artifact. This service binds Passport,
 * measurements, AWE, findings, twins, and ownership into the same page
 * contract so operators can inspect the instrument panel before Core is
 * connected. It never claims a PDF exists.
 */
import { serve } from "../shared/transport.js";
import PropertyService from "../property/service.js";
import PassportService from "../passport/service.js";
import MeasurementService from "../measurements/service.js";
import AweService from "../awe/service.js";
import CortexService from "../cortex/service.js";
import RealityEngine from "../reality/service.js";
import { bindPacket, PACKET_AUDIENCE } from "./packet.js";
import { CoreAdapter } from "../core/adapter.js";
import { CoreReportAdapter } from "./service.js";
import sxpFixture from "../../components/report/packet/fixture-sxp-004182.json";
import visualCanonFixture from "../../components/report/packet/fixture-visual-canon.json";

async function loadTwinA(propertyId) {
  const version = await RealityEngine.getCurrentVersion(propertyId, "TWIN_TYPE_A");
  if (!version) return null;
  const roof = await RealityEngine.getRoof(version.twinVersionId);
  return roof ? { ...roof, versionLabel: version.versionLabel } : { versionLabel: version.versionLabel };
}

async function loadTwinBThermal(propertyId) {
  const version = await RealityEngine.getCurrentVersion(propertyId, "TWIN_TYPE_B");
  if (!version) return null;
  return RealityEngine.getThermal(version.twinVersionId);
}

function applyFixtureOverlay(packet, fixture) {
  if (!fixture) return packet;
  return {
    ...packet,
    sourceMode: fixture.sourceMode || packet.sourceMode,
    banner: fixture.banner || packet.banner,
    reportId: fixture.reportId || packet.reportId,
    operator: fixture.operator || packet.operator,
    preparedBy: fixture.operator?.name || packet.preparedBy,
    nextScanLabel: fixture.nextScanLabel || packet.nextScanLabel,
    nextScanDetail: fixture.nextScanDetail || packet.nextScanDetail,
    lint: packet.lint,
  };
}

export const ReportPacketService = {
  getForProperty: (
    propertyId,
    { audience = PACKET_AUDIENCE.PRO, session = null, sourceMode = "PASSPORT" } = {}
  ) =>
    serve(async () => {
      if (sourceMode === "VISUAL_CANON") return visualCanonPacket(audience, session);
      const [property, passport, measurements, awe, findings, twins, ownership, twinA, twinBThermal] =
        await Promise.all([
          PropertyService.get(propertyId),
          PassportService.getByProperty(propertyId),
          MeasurementService.listByProperty(propertyId),
          AweService.listByProperty(propertyId),
          CortexService.listFindingsByProperty(propertyId),
          PropertyService.listTwins(propertyId),
          PropertyService.listOwnership(propertyId),
          loadTwinA(propertyId),
          loadTwinBThermal(propertyId),
        ]);
      const packet = bindPacket({
        property,
        passport,
        twinA,
        twinBThermal,
        measurements,
        awe,
        findings,
        twins,
        ownership: ownership || [],
        audience,
        coreEstimate: null,
        estimateRevision: null,
        sourceMode,
        session,
        preparedAt: null,
      });
      if (sourceMode === "FIXTURE" && propertyId === "SXP-004182")
        return applyFixtureOverlay(packet, sxpFixture);
      return packet;
    }),

  getVisualCanon: ({ audience = PACKET_AUDIENCE.PRO, session = null } = {}) =>
    serve(() => visualCanonPacket(audience, session)),

  previewHonest: () => ({
    coreGenerated: false,
    coreConnected: !!(CoreAdapter.connected && CoreReportAdapter.connected),
  }),
};

function visualCanonPacket(audience, session) {
  const fixture = visualCanonFixture;
  return {
    kind: "VISUAL_CANON_FIXTURE",
    sourceMode: "VISUAL_CANON",
    banner: fixture.banner,
    coreGenerated: false,
    coreConnected: false,
    audience,
    reportId: fixture.reportId,
    totalPages: 27,
    pages: audience === PACKET_AUDIENCE.HABITAT ? [2, 3, 5] : [2, 3, 4, 5],
    identity: fixture.identity,
    ticker: fixture.ticker,
    measurements: {
      roofAreaSqFt: null,
      ridgeLf: null,
      eaveLf: null,
      southPitch: null,
      conditionedSqFt: null,
      saturatedSqFt: null,
      ambientF: null,
    },
    openings: fixture.openings,
    awe: fixture.awe,
    thermal: { coreMoistureIndex: null, twinBLayer: null, cortexFindingId: null, cortexConfidence: null },
    estimate: fixture.estimate,
    operator: fixture.operator,
    preparedBy: fixture.operator?.name || session?.name || null,
    nextScanLabel: fixture.nextScanLabel,
    nextScanDetail: fixture.nextScanDetail,
    titlePackage: "COMPREHENSIVE PROPERTY INTELLIGENCE",
    lint: [],
  };
}

export default ReportPacketService;
