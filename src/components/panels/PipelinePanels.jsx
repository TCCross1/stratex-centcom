import React, { useState } from "react";
import { ROUTES } from "../../app/router/routes.js";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { TRUTH_CLASS } from "../../domains/shared/classification.js";
import { can } from "../../domains/shared/rbac.js";
import { stageByKey } from "../../domains/shared/states.js";
import { relTime, shortDate } from "../../utils/format.js";
import { useResource, useViewport } from "../../app/hooks.js";
import { HexShell } from "../brand/StratexBrand.jsx";
import { ClassBadge, DataTable, EmptyState, Fact, Label, Panel, PanelHeader, Resource, SeverityPill, StatusDot, GhostButton } from "../common/primitives.jsx";
import { PropertyRealityViewer, VIEWER_LAYERS } from "../reality/PropertyRealityViewer.jsx";

export function MissionsPanel({ propertyId, navigate }) {
  const res = useResource(() => centcomApi.listMissions(propertyId), [propertyId]);
  return (
    <Panel>
      <PanelHeader
        title={propertyId ? "Missions for this Property" : "Mission Command — 15-Stage Workflow"}
        action={propertyId && navigate
          ? <GhostButton small accent="gold" onClick={() => navigate(ROUTES.missionCreate(propertyId))}>+ Create Mission</GhostButton>
          : null}
      />
      <Resource
        res={res}
        loadingLines={5}
        empty={<EmptyState title="No missions" hint="A mission is an event belonging to a property. Create one to begin the capture lifecycle." />}
      >
        {(rows) => (
          <DataTable
            keyOf={(r) => r.id}
            primary="id"
            onRowClick={(r) => navigate && navigate("/missions/" + r.id)}
            rows={rows}
            columns={[
              { key: "id", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.id}</span> },
              { key: "type", header: "Type", wrap: true, render: (r) => r.missionType },
              { key: "stage", header: "Stage", render: (r) => (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textFaint }}>
                    {String(stageByKey(r.stage).n).padStart(2, "0")}
                  </span>
                  {stageByKey(r.stage).label}
                </span>
              ) },
              { key: "cap", header: "Capture", align: "right", render: (r) => r.capturePct + "%" },
              { key: "evidence", header: "Evidence", render: (r) => r.evidenceStatus },
              { key: "cortex", header: "Cortex", render: (r) => r.cortexStatus },
              { key: "passport", header: "Passport", wrap: true, render: (r) => r.passportStatus },
              { key: "blocker", header: "Blocker", wrap: true, render: (r) => r.blocker ? <span style={{ color: T.color.warn }}>▲ {r.blocker}</span> : <span style={{ color: T.color.textFaint }}>—</span> },
              { key: "op", header: "Operator", render: (r) => r.operatorId },
              { key: "when", header: "Scheduled", render: (r) => shortDate(r.scheduledAt) },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}

/** A reusable module header: purpose, live/fixture state, and actions. */

export function EvidencePanel({ propertyId }) {
  const pk = useResource(() => centcomApi.vaultListPackagesByProperty(propertyId), [propertyId]);
  const as = useResource(() => centcomApi.listEvidenceAssets(), []);
  const kindColor = {
    ORIGINAL: T.color.blueBright, PROCESSED: "#C9D8E8", DERIVED: "#C9D8E8",
    ANNOTATION: T.color.bluePale, AI_GENERATED: T.color.goldBright,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: T.layout.gutter }}>
      <Panel>
        <PanelHeader title="Evidence Packages" />
        <Resource res={pk} loadingLines={4} empty={<EmptyState title="No evidence yet" hint="Evidence packages appear after a capture is validated and ingested." />}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.id}
              rows={rows}
              primary="id"
              columns={[
                { key: "id", header: "Package", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.id}</span> },
                { key: "mission", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.missionId}</span> },
                { key: "state", header: "State", render: (r) => (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <StatusDot state={r.state === "sealed" ? "ok" : r.state === "failed" ? "fail" : "caution"} size={6} />
                    {r.state}
                  </span>
                ) },
                { key: "assets", header: "Assets", align: "right", render: (r) => r.assetCount.toLocaleString() },
                { key: "cov", header: "Coverage", align: "right", render: (r) => r.coveragePct + "%" },
                { key: "missing", header: "Missing Surfaces", wrap: true, render: (r) => r.missingSurfaces.length ? <span style={{ color: T.color.warn }}>{r.missingSurfaces.join(", ")}</span> : <span style={{ color: T.color.textFaint }}>None</span> },
                { key: "hash", header: "Hashes", align: "center", render: (r) => <StatusDot state={r.hashesVerified ? "ok" : "caution"} size={6} /> },
              ]}
            />
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Assets & Lineage" />
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginBottom: 12 }}>
          Originals carry Object Lock and are never modified. Everything else declares what it was derived from.
        </div>
        <Resource res={as} loadingLines={4}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.evidenceId}
              rows={rows}
              primary="file"
              onRowClick={(r) => (window.location.hash = ROUTES.evidenceAsset(r.evidenceId))}
              columns={[
                { key: "file", header: "Artifact", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.text }}>{r.filename}</span> },
                { key: "kind", header: "Kind", render: (r) => <span style={{ fontFamily: T.font.display, fontSize: 10, letterSpacing: "0.1em", color: kindColor[r.kind] }}>{r.kind}</span> },
                { key: "class", header: "Classification", render: (r) => <ClassBadge classification={r.truthClassification} /> },
                { key: "sensor", header: "Source", render: (r) => r.sensor },
                { key: "from", header: "Derived From", render: (r) => r.derivedFrom ? <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.derivedFrom}</span> : <span style={{ color: T.color.textFaint }}>— original</span> },
                { key: "hash", header: "SHA-256", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textMute }}>{r.sha256}</span> },
                { key: "tier", header: "Tier", align: "center", render: (r) => r.tier.toUpperCase() },
                { key: "lock", header: "Lock", align: "center", render: (r) => r.objectLock ? <StatusDot state="ok" size={6} /> : <span style={{ color: T.color.textFaint }}>—</span> },
              ]}
            />
          )}
        </Resource>
      </Panel>
    </div>
  );
}

export function FindingsPanel({ propertyId, compact, navigate }) {
  const res = useResource(() => centcomApi.listFindings(propertyId), [propertyId]);
  return (
    <Panel>
      <PanelHeader title="Cortex Findings" accent="gold" />
      <Resource
        res={res}
        loadingLines={4}
        empty={<EmptyState title="No findings" hint="Findings appear after Cortex completes an analysis of validated evidence." />}
      >
        {(rows) => (
          <div>
            {(compact ? rows.slice(0, 3) : rows).map((f) => (
              <div
                key={f.findingId}
                onClick={navigate ? () => navigate(ROUTES.finding(f.findingId)) : undefined}
                style={{
                  padding: "11px 2px", borderBottom: "1px solid rgba(22,38,60,0.7)",
                  cursor: navigate ? "pointer" : "default",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <SeverityPill severity={f.severity} />
                  <ClassBadge classification={f.truthClassification} />
                  {f.truthClassification === TRUTH_CLASS.PROBABLE && (
                    <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.goldBright }}>
                      confidence {(f.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                  <span style={{ marginLeft: "auto", fontFamily: T.font.display, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: f.reviewState === "verified" ? T.color.ok : T.color.textMute }}>
                    {f.reviewState}
                  </span>
                </div>
                <div style={{ fontFamily: T.font.body, fontSize: 12.5, fontWeight: 600, color: T.color.text, marginTop: 7 }}>
                  {f.title}
                </div>
                {!compact && (
                  <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginTop: 5, lineHeight: 1.5 }}>
                    {f.detail}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 7 }}>
                  <Label style={{ fontSize: 8.5 }}>Traces to</Label>
                  {f.sourceEvidenceIds.map((r) => (
                    <span key={r} style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale, background: "rgba(30,107,255,0.12)", border: "1px solid rgba(30,107,255,0.35)", borderRadius: T.radius.xs, padding: "1px 6px" }}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

/**
 * FINDING DETAIL — the truth-traceability page.
 * Every claim CENTCOM makes about a property should be answerable here: what
 * was concluded, from which evidence, by which model version, and whether a
 * human has verified it.
 */

export function CortexPanel({ propertyId }) {
  const res = useResource(() => centcomApi.listAnalyses(propertyId), [propertyId]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: T.layout.gutter }}>
      <Panel>
        <PanelHeader title="Cortex Analysis Queue" accent="gold" />
        <Resource res={res} loadingLines={4} empty={<EmptyState title="Queue empty" hint="Analyses are enqueued when an evidence package is sealed." />}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.analysisId}
              rows={rows}
              primary="id"
              columns={[
                { key: "id", header: "Analysis", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.goldBright }}>{r.analysisId}</span> },
                { key: "prop", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.propertyId}</span> },
                { key: "mission", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.missionId}</span> },
                { key: "state", header: "State", render: (r) => (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <StatusDot state={r.status === "COMPLETE" ? "ok" : r.status === "FAILED" ? "fail" : "caution"} size={6} />
                    {r.status}
                  </span>
                ) },
                { key: "model", header: "Model Version", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.modelName + " " + r.modelVersion}</span> },
                { key: "av", header: "Analysis Version", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.analysisVersion}</span> },
                { key: "n", header: "Findings", align: "right", render: (r) => r.findingIds.length },
              ]}
            />
          )}
        </Resource>
      </Panel>
      <FindingsPanel propertyId={propertyId} />
    </div>
  );
}

export function PassportPanel() {
  const res = useResource(() => centcomApi.getPassport(), []);
  const vp = useViewport();
  return (
    <Panel>
      <PanelHeader title="Passport — One Property. One Record. One Truth." />
      <Resource res={res} loadingLines={4}>
        {(pp) => (
          <>
            <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 16 }}>
              <Fact label="Current Revision" value={pp.currentRevision} mono />
              <Fact label="Record Integrity" value={pp.integrity} tone={pp.integrity === "clean" ? "ok" : "warn"} />
              <Fact label="Core Projection" value={pp.projections.core} tone={pp.projections.core === "synced" ? "ok" : "warn"} />
              <Fact label="Habitat Projection" value={pp.projections.habitat} tone={pp.projections.habitat === "synced" ? "ok" : "warn"} />
            </div>
            <DataTable
              keyOf={(r) => r.id}
              rows={pp.revisions}
              primary="rev"
              columns={[
                { key: "rev", header: "Revision", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.rev}</span> },
                { key: "when", header: "Committed", render: (r) => relTime(r.committedAt) },
                { key: "by", header: "Committed By", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.committedBy}</span> },
                { key: "sum", header: "Summary", wrap: true, render: (r) => r.summary },
                { key: "cf", header: "Conflict", align: "center", render: (r) => r.conflict ? <StatusDot state="fail" size={6} /> : <span style={{ color: T.color.textFaint }}>—</span> },
              ]}
            />
          </>
        )}
      </Resource>
    </Panel>
  );
}

export function LiveMissionFeed({ navigate }) {
  const res = useResource(() => centcomApi.getActiveFlight(), []);
  const [layer, setLayer] = useState("twin");
  const fx = useResource(() => centcomApi.listFindings(), []);
  const findings = fx.data || [];
  const vp = useViewport();
  const sm = vp.isPhone;

  return (
    <Panel pad={0} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ padding: sm ? "12px 12px 0" : "13px 16px 0" }}>
        <PanelHeader title="Live Mission Feed" />
      </div>

      <Resource res={res} loadingLines={5} label="Acquiring mission link">
        {({ flight, mission, property }) => (
          <>
            <div
              style={{
                position: "relative", display: "flex", gap: 10,
                padding: sm ? "0 10px 6px" : "0 14px 6px",
                minHeight: sm ? 0 : 300,
                flexDirection: sm ? "column" : "row",
              }}
            >
              <div style={{ flex: 1, minWidth: 0, position: "relative", height: sm ? 190 : "auto" }}>
                <PropertyRealityViewer
                  propertyId={property.stratexPropertyId}
                  missionId={mission.id}
                  activeLayer={layer}
                  scanProgress={flight.progressPct}
                  findings={findings}
                  evidenceMarkers={[]}
                  measurements={[]}
                />
              </div>

              <div
                style={
                  sm
                    ? {
                        display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4,
                        WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
                      }
                    : { width: 150, flex: "none", display: "flex", flexDirection: "column", gap: 5, paddingTop: 6, maxHeight: 300, overflowY: "auto" }
                }
              >
                {VIEWER_LAYERS.map((lyr) => {
                  const l = lyr.label;
                  const on = lyr.key === layer;
                  return (
                    <button
                      key={lyr.key}
                      onClick={() => setLayer(lyr.key)}
                      aria-pressed={on}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: sm ? "9px 12px" : "8px 10px",
                        flex: sm ? "none" : undefined,
                        whiteSpace: "nowrap",
                        minHeight: sm ? 38 : undefined,
                        WebkitTapHighlightColor: "transparent",
                        background: on
                          ? "linear-gradient(180deg,rgba(30,107,255,0.36),rgba(12,32,68,0.9))"
                          : "linear-gradient(180deg,rgba(16,28,48,0.85),rgba(7,13,24,0.9))",
                        border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                        borderRadius: T.radius.sm, cursor: "pointer",
                        boxShadow: on ? T.glow.blueSoft : T.bevel.raised,
                        transition: "all " + T.motion.fast,
                      }}
                    >
                      <HexShell id={"lyr-" + lyr.key} size={15} glyph="core" accent={lyr.key === "awe" || lyr.key === "systems" ? "gold" : "blue"} />
                      <span
                        style={{
                          fontFamily: T.font.display, fontSize: 10, fontWeight: 700,
                          letterSpacing: "0.10em", textTransform: "uppercase",
                          color: on ? "#FFFFFF" : T.color.textSoft,
                        }}
                      >
                        {l}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div
              style={{
                display: "flex", alignItems: "center",
                gap: sm ? 14 : 20,
                flexWrap: sm ? "wrap" : "nowrap",
                padding: sm ? "11px 12px 12px" : "12px 16px 14px",
                borderTop: "1px solid " + T.color.divider,
              }}
            >
              <button
                onClick={() => navigate("/missions/" + mission.id)}
                style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
              >
                <Label style={{ color: T.color.blueBright }}>Mission</Label>
                <div style={{ fontFamily: T.font.mono, fontSize: 12, color: T.color.text, marginTop: 3 }}>
                  {mission.id}
                </div>
              </button>

              <button
                onClick={() => navigate("/properties/" + property.stratexPropertyId)}
                style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
              >
                <div style={{ fontFamily: T.font.display, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.09em", color: T.color.text, textTransform: "uppercase" }}>
                  {property.identity.addressLine1}
                </div>
                <div style={{ fontFamily: T.font.display, fontSize: 11, letterSpacing: "0.09em", color: T.color.textMute, textTransform: "uppercase", marginTop: 2 }}>
                  {property.identity.city}, {property.identity.region} {property.identity.postalCode}
                </div>
              </button>

              <div style={{ flex: 1, minWidth: sm ? "100%" : 120 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <Label style={{ color: T.color.blueBright }}>Scan Progress</Label>
                  <span style={{ fontFamily: T.font.display, fontSize: 21, fontWeight: 700, color: "#FFFFFF", textShadow: T.glow.textBlue }}>
                    {flight.progressPct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 5, borderRadius: 3, marginTop: 6,
                    background: "rgba(8,16,30,0.9)", boxShadow: T.bevel.sunken, overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: flight.progressPct + "%", height: "100%",
                      background: "linear-gradient(90deg," + T.color.blueDeep + "," + T.color.blueBright + ")",
                      boxShadow: T.glow.blueHard, transition: "width " + T.motion.slow,
                    }}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 6 }}>
                  <Label style={{ color: T.color.textMute }}>Data Link:</Label>
                  <span style={{ fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.14em", color: flight.dataLinkLive ? T.color.ok : T.color.high }}>
                    {flight.dataLinkLive ? "LIVE" : "LOST"}
                  </span>
                  <StatusDot state={flight.dataLinkLive ? "ok" : "fail"} size={6} />
                </div>
              </div>
            </div>
          </>
        )}
      </Resource>
    </Panel>
  );
}

/**
 * The signature element: the property reality twin. The house is the hero of
 * this system, not a chart. Wireframe overlay, capture nodes, and a live scan
 * cone from the aircraft. Layer selection changes the overlay treatment.
 */
/**
 * The layer registry. Each entry declares what kind of data backs it and
 * whether that data exists yet, so the viewer can never imply it is showing a
 * thermal capture it does not have.
 */

export function MissionQueue() {
  const res = useResource(() => centcomApi.listMissions(), []);
  const QUEUE = ["created", "scheduled", "atc_readiness", "authorized", "ready", "in_flight"];
  return (
    <Resource res={res} loadingLines={4} empty={<EmptyState title="Queue empty" hint="No missions are awaiting launch." />}>
      {(rows) => {
        const queued = rows.filter((m) => QUEUE.includes(m.stage));
        if (!queued.length)
          return <EmptyState title="Nothing in the launch queue" hint="Every mission on file has passed launch or is closed." />;
        return (
          <DataTable
            keyOf={(r) => r.id}
            primary="id"
            onRowClick={(r) => (window.location.hash = "/missions/" + r.id)}
            rows={queued}
            columns={[
              { key: "id", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.id}</span> },
              { key: "type", header: "Type", wrap: true, render: (r) => r.missionType },
              { key: "stage", header: "Stage", render: (r) => stageByKey(r.stage).label },
              { key: "when", header: "Scheduled", render: (r) => shortDate(r.scheduledAt) },
              { key: "op", header: "Operator", render: (r) => r.operatorId },
              { key: "ac", header: "Aircraft", render: (r) => r.aircraftId },
              { key: "hold", header: "Hold", wrap: true, render: (r) => r.blocker ? <span style={{ color: T.color.warn }}>▲ {r.blocker}</span> : <span style={{ color: T.color.ok }}>● Clear</span> },
            ]}
          />
        );
      }}
    </Resource>
  );
}
