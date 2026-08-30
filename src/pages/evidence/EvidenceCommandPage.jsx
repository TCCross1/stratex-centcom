import React, { useState } from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate, bytesToMb } from "../../utils/format.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, DataTable, Resource, EmptyState, GhostButton,
  ModuleIntro, ModuleMetrics, Label, Fact,
} from "../../components/common/primitives.jsx";
import { EvPill, OriginBadge, ThermalKindBadge } from "../../components/evidence/EvidenceShared.jsx";

const FILTERS = {
  ALL: () => true,
  ORIGINAL: (a) => a.origin === "ORIGINAL",
  DERIVED: (a) => a.origin === "DERIVED",
  RGB: (a) => a.sensorType === "RGB",
  THERMAL: (a) => a.sensorType === "THERMAL",
  TELEMETRY: (a) => a.artifactType === "TELEMETRY_LOG" || a.artifactType === "FLIGHT_LOG",
  "NEEDS REVIEW": (a) => a.reviewState === "NOT_REVIEWED",
  FAILED: (a) => a.qualityState === "FAIL" || a.ingestState === "FAILED",
  QUARANTINED: (a) => a.reviewState === "QUARANTINED",
  RECAPTURE: (a) => a.reviewState === "RECAPTURE_REQUIRED",
  HOT: (a) => a.storageTier === "HOT",
  WARM: (a) => a.storageTier === "WARM",
  COLD: (a) => a.storageTier === "COLD",
  ARCHIVE: (a) => a.storageTier === "ARCHIVE",
};

/**
 * EVIDENCE COMMAND
 *
 * The vault preserves what actually happened in the field. Originals are
 * immutable; everything computed from them declares its parent.
 */
export function EvidenceCommand({ navigate }) {
  const assets = useResource(() => centcomApi.vaultListAll(), []);
  const summary = useResource(() => centcomApi.vaultSummary(), []);
  const providers = useResource(() => centcomApi.vaultProviderHealth(), []);
  const vp = useViewport();
  const [filter, setFilter] = useState("ALL");

  return (
    <>
      <Resource res={summary} loadingLines={1}>
        {(s) => (
          <ModuleMetrics
            cells={[
              { label: "Total Assets", value: s.total, tone: "info" },
              { label: "Originals", value: s.originals, tone: "info" },
              { label: "Derived", value: s.derived, tone: "mute" },
              { label: "Needs Review", value: s.needsReview, tone: s.needsReview ? "warn" : "ok" },
              { label: "Warnings", value: s.warnings, tone: s.warnings ? "warn" : "ok" },
              { label: "Quarantined", value: s.quarantined, tone: s.quarantined ? "bad" : "ok" },
              { label: "Hash Mismatches", value: s.hashMismatches, tone: s.hashMismatches ? "bad" : "ok" },
              { label: "Recapture Required", value: s.recapture, tone: s.recapture ? "warn" : "ok" },
              { label: "Cortex Eligible", value: s.cortexEligible, tone: "ok" },
              { label: "Hot / Warm", value: s.hot + " / " + s.warm, tone: "info" },
              { label: "Cold / Archive", value: s.cold + " / " + s.archive, tone: "mute" },
              { label: "Processing Failures", value: s.processingFailures, tone: s.processingFailures ? "warn" : "ok" },
            ]}
          />
        )}
      </Resource>

      <Panel>
        <PanelHeader
          title="Vault Providers"
          action={<GhostButton small onClick={() => navigate(ROUTES.evidenceReview)}>Open Review Queue</GhostButton>}
        />
        <ModuleIntro purpose="Evidence storage and capture ingestion both depend on systems that are not connected. A fixture store is not production object storage, and this table says so rather than showing green." />
        <Resource res={providers} loadingLines={2}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.id}
              primary="name"
              rows={rows}
              columns={[
                { key: "name", header: "Provider", render: (r) => r.name },
                { key: "mode", header: "Mode", render: (r) => <EvPill value={r.mode} small /> },
                { key: "vendor", header: "Vendor", render: (r) => r.vendor },
                { key: "live", header: "Live", align: "center", render: (r) => (r.isLive ? "yes" : "no") },
                { key: "detail", header: "Detail", wrap: true, render: (r) => r.detail },
              ]}
            />
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Evidence Directory" />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
          {Object.keys(FILTERS).map((k) => {
            const on = k === filter;
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                aria-pressed={on}
                style={{
                  cursor: "pointer", padding: vp.isPhone ? "8px 11px" : "5px 10px",
                  minHeight: vp.isPhone ? 36 : undefined, borderRadius: T.radius.pill,
                  fontFamily: T.font.display, fontSize: 9, fontWeight: 700, letterSpacing: "0.11em",
                  color: on ? "#FFFFFF" : T.color.textMute,
                  background: on ? "rgba(30,107,255,0.30)" : "transparent",
                  border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                }}
              >
                {k}
              </button>
            );
          })}
        </div>

        <Resource
          res={assets}
          loadingLines={6}
          empty={<EmptyState title="The vault is empty" hint="Evidence appears after a capture package is ingested." />}
        >
          {(rows) => {
            const filtered = rows.filter(FILTERS[filter]);
            if (!filtered.length)
              return <EmptyState title={"No evidence in " + filter} hint="Choose ALL to see the whole vault." />;
            return (
              <>
                <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textFaint, marginBottom: 8 }}>
                  {filtered.length} of {rows.length} assets
                </div>
                <DataTable
                  keyOf={(r) => r.evidenceId}
                  primary="filename"
                  onRowClick={(r) => navigate(ROUTES.evidenceAsset(r.evidenceId))}
                  rows={filtered}
                  columns={[
                    { key: "evidenceId", header: "Evidence", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.evidenceId}</span> },
                    { key: "filename", header: "Artifact", wrap: true, render: (r) => (
                      <span>
                        <span style={{ fontFamily: T.font.mono }}>{r.filename}</span>
                        {r.thermalKind && <span style={{ marginLeft: 7 }}><ThermalKindBadge kind={r.thermalKind} /></span>}
                      </span>
                    ) },
                    { key: "origin", header: "Origin", render: (r) => <OriginBadge origin={r.origin} /> },
                    { key: "type", header: "Type", render: (r) => r.artifactType.replace(/_/g, " ") },
                    { key: "property", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.propertyId}</span> },
                    { key: "mission", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.missionId}</span> },
                    { key: "captured", header: "Captured", render: (r) => (r.capturedAt ? shortDate(r.capturedAt) : "—") },
                    { key: "integrity", header: "Integrity", render: (r) => <EvPill value={r.hashState} small /> },
                    { key: "quality", header: "Quality", render: (r) => <EvPill value={r.qualityState} small /> },
                    { key: "review", header: "Review", render: (r) => <EvPill value={r.reviewState} small /> },
                    { key: "tier", header: "Tier", render: (r) => <EvPill value={r.storageTier} small /> },
                    { key: "size", header: "Size", align: "right", render: (r) => (r.byteSize ? bytesToMb(r.byteSize) : "—") },
                  ]}
                />
              </>
            );
          }}
        </Resource>
      </Panel>

      <CapturePackagePanel navigate={navigate} vp={vp} />
    </>
  );
}

/** Capture attempts, shown so recapture history is instantly readable. */
function CapturePackagePanel({ navigate, vp }) {
  const res = useResource(() => centcomApi.vaultListPackages(), []);
  return (
    <Panel>
      <PanelHeader title="Capture Packages" />
      <ModuleIntro purpose="PROPERTY → MISSION → CAPTURE SESSION → CAPTURE PACKAGE → EVIDENCE. A recapture adds an attempt to the same mission; the earlier package and its evidence are never overwritten." />
      <Resource res={res} loadingLines={4}>
        {(rows) => (
          <DataTable
            keyOf={(r) => r.capturePackageId}
            primary="capturePackageId"
            onRowClick={(r) => navigate(ROUTES.capturePackage(r.capturePackageId))}
            rows={rows}
            columns={[
              { key: "capturePackageId", header: "Package", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.capturePackageId}</span> },
              { key: "attempt", header: "Attempt", align: "center", render: (r) => (
                <span style={{ fontFamily: T.font.display, fontWeight: 700, color: r.attemptNumber > 1 ? T.color.medium : T.color.text }}>
                  ATTEMPT {r.attemptNumber}
                </span>
              ) },
              { key: "property", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.propertyId}</span> },
              { key: "mission", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.missionId}</span> },
              { key: "status", header: "Status", render: (r) => <EvPill value={r.status} small /> },
              { key: "coverage", header: "Coverage", render: (r) => <EvPill value={r.coverageState} small /> },
              { key: "received", header: "Artifacts", align: "right", render: (r) => r.receivedArtifactCount },
              { key: "created", header: "Created", render: (r) => relTime(r.createdAt) },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}

/* ------------------------------------------------------------ review queue */

const QUEUES = [
  ["needsReview", "Needs Review", "warn"],
  ["warnings", "Warnings", "warn"],
  ["failedQuality", "Failed Quality", "bad"],
  ["quarantined", "Quarantined", "bad"],
  ["recapture", "Recapture Required", "warn"],
  ["approved", "Approved", "ok"],
  ["rejected", "Rejected", "mute"],
];

export function EvidenceReviewQueue({ navigate }) {
  const res = useResource(() => centcomApi.vaultReviewQueue(), []);
  const vp = useViewport();
  const [bucket, setBucket] = useState("needsReview");
  const [busy, setBusy] = useState(null);

  const act = async (evidenceId, decision, reason) => {
    setBusy(evidenceId);
    try { await centcomApi.vaultReview(evidenceId, decision, { reason }); res.reload(); }
    finally { setBusy(null); }
  };

  return (
    <Panel>
      <PanelHeader title="Evidence Review Queue" />
      <ModuleIntro purpose="Human review changes an asset's state and nothing else. Approving, rejecting or quarantining evidence never modifies the captured file — the original is preserved whatever the decision." />
      <Resource res={res} loadingLines={5}>
        {(q) => (
          <>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
              {QUEUES.map(([key, label]) => {
                const on = key === bucket;
                return (
                  <button
                    key={key}
                    onClick={() => setBucket(key)}
                    aria-pressed={on}
                    style={{
                      cursor: "pointer", padding: vp.isPhone ? "9px 12px" : "6px 11px",
                      minHeight: vp.isPhone ? 40 : undefined, borderRadius: T.radius.pill,
                      fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em",
                      color: on ? "#FFFFFF" : T.color.textMute,
                      background: on ? "rgba(30,107,255,0.30)" : "transparent",
                      border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                    }}
                  >
                    {label} ({q[key].length})
                  </button>
                );
              })}
            </div>

            {q[bucket].length === 0 ? (
              <EmptyState title="Nothing in this queue" hint="No evidence currently sits in this state." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q[bucket].map((a) => (
                  <div
                    key={a.evidenceId}
                    style={{
                      padding: "12px 13px", borderRadius: T.radius.md,
                      background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                      border: "1px solid " + T.color.edge, boxShadow: T.bevel.tile,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                      <button
                        onClick={() => navigate(ROUTES.evidenceAsset(a.evidenceId))}
                        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer",
                                 fontFamily: T.font.mono, fontSize: 12, color: T.color.bluePale }}
                      >
                        {a.evidenceId}
                      </button>
                      <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.text, flex: 1, minWidth: 0 }}>
                        {a.filename}
                      </span>
                      <OriginBadge origin={a.origin} />
                      {a.thermalKind && <ThermalKindBadge kind={a.thermalKind} />}
                      <EvPill value={a.qualityState} small />
                      <EvPill value={a.reviewState} small />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginTop: 11 }}>
                      <Fact label="Property" value={a.propertyId} mono />
                      <Fact label="Mission" value={a.missionId} mono />
                      <Fact label="Captured" value={a.capturedAt ? shortDate(a.capturedAt) : "—"} />
                      <Fact label="Integrity" value={a.hashState.replace(/_/g, " ")} />
                    </div>

                    {a.quarantineReason && (
                      <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.high, marginTop: 9 }}>
                        ✕ {a.quarantineReason}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                      <GhostButton small onClick={() => act(a.evidenceId, "APPROVED", "Reviewed and accepted.")}>
                        {busy === a.evidenceId ? "…" : "Approve"}
                      </GhostButton>
                      <GhostButton small onClick={() => act(a.evidenceId, "APPROVED_WITH_WARNINGS", "Accepted with warnings.")}>
                        Approve with warning
                      </GhostButton>
                      <GhostButton small onClick={() => act(a.evidenceId, "RECAPTURE_REQUIRED", "Insufficient for the mission.")}>
                        Request recapture
                      </GhostButton>
                      <GhostButton small accent="gold" onClick={() => act(a.evidenceId, "REJECTED", "Rejected in review.")}>
                        Reject
                      </GhostButton>
                      <GhostButton small accent="gold" onClick={() => act(a.evidenceId, "QUARANTINED", "Held for integrity concerns.")}>
                        Quarantine
                      </GhostButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Resource>
    </Panel>
  );
}
