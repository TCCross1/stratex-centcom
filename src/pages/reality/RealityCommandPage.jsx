import React, { useState } from "react";
import T from "../../design/tokens.js";
import { relTime } from "../../utils/format.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { WORKING_NAME_NOTICE } from "../../domains/reality/types.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, DataTable, Resource, EmptyState, GhostButton,
  ModuleIntro, ModuleMetrics,
} from "../../components/common/primitives.jsx";
import { RPill, TwinTypeBadge } from "../../components/reality/RealityShared.jsx";

const FILTERS = {
  ALL: () => true,
  PROCESSING: (r) => r.model.processingState === "RUNNING" || r.model.status === "PROCESSING",
  REVIEW: (r) => r.model.reviewState === "REVIEW_REQUIRED",
  APPROVED: (r) => Object.values(r.current).some(Boolean),
  WARNINGS: (r) => r.model.overallQualityState === "PASS_WITH_WARNINGS",
  FAILED: (r) => r.model.status === "FAILED",
  "COMPARISON AVAILABLE": (r) => r.comparisonAvailable,
};

const firstType = (row) =>
  Object.entries(row.current).find(([, v]) => v)?.[0] || row.model.availableTwinTypes[0] || "TWIN_TYPE_A";

/**
 * PROPERTY REALITY COMMAND
 *
 * Validated evidence becomes versioned spatial understanding here. Approved
 * versions are immutable — new reality creates a new version.
 */
export function RealityCommand({ navigate }) {
  const dir = useResource(() => centcomApi.realityDirectory(), []);
  const summary = useResource(() => centcomApi.realitySummary(), []);
  const providers = useResource(() => centcomApi.realityProviderHealth(), []);
  const types = useResource(() => centcomApi.realityTwinTypes(), []);
  const vp = useViewport();
  const [filter, setFilter] = useState("ALL");

  return (
    <>
      <Resource res={summary} loadingLines={1}>
        {(s) => (
          <ModuleMetrics
            cells={[
              { label: "Properties With Reality", value: s.propertiesWithReality, tone: "info" },
              { label: "Processing", value: s.processing, tone: s.processing ? "info" : "mute" },
              { label: "Review Required", value: s.reviewRequired, tone: s.reviewRequired ? "warn" : "ok" },
              { label: "Warnings", value: s.warnings, tone: s.warnings ? "warn" : "ok" },
              { label: "Failed", value: s.failed, tone: s.failed ? "bad" : "ok" },
              { label: "Approved", value: s.approved, tone: "ok" },
              { label: "Superseded", value: s.superseded, tone: "mute" },
              { label: "Comparisons", value: s.comparisonsAvailable, tone: "info" },
              { label: "Thermal Aligned", value: s.thermalAvailable, tone: "info" },
              { label: "CAD / BIM", value: s.cadAvailable, tone: s.cadAvailable ? "info" : "mute" },
              { label: "Processing Failures", value: s.processingFailures, tone: s.processingFailures ? "warn" : "ok" },
            ]}
          />
        )}
      </Resource>

      <Panel>
        <PanelHeader title="Twin Types" />
        <ModuleIntro purpose="Three canonical twin types share one Property Reality foundation — the same property identity, evidence vault, mission lineage, processing architecture and version model. What differs is policy: required outputs, supported layers and projection rules." />
        <div
          style={{
            display: "flex", alignItems: "center", gap: 9, marginBottom: 14,
            padding: "9px 12px", borderRadius: T.radius.sm,
            background: "rgba(240,180,41,0.10)", border: "1px solid rgba(240,180,41,0.42)",
          }}
        >
          <span aria-hidden="true" style={{ color: T.color.goldBright }}>▲</span>
          <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.goldBright }}>
            {WORKING_NAME_NOTICE}. The labels below are internal placeholders and must not be treated as product names.
          </span>
        </div>
        <Resource res={types} loadingLines={3}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.typeId}
              primary="displayLabel"
              rows={rows}
              columns={[
                { key: "displayLabel", header: "Working Label", render: (r) => <TwinTypeBadge typeId={r.typeId} /> },
                { key: "typeId", header: "Type ID", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.typeId}</span> },
                { key: "description", header: "Purpose", wrap: true, render: (r) => r.description },
                { key: "required", header: "Required Outputs", wrap: true, render: (r) => r.requiredOutputs.map((o) => o.replace(/_/g, " ")).join(", ") },
                { key: "projections", header: "Projects To", wrap: true, render: (r) =>
                  Object.entries(r.projectionRules).filter(([, v]) => v).map(([k]) => k).join(", ") },
              ]}
            />
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Processing Providers" />
        <ModuleIntro purpose="No reconstruction engine is connected. Photogrammetry, LiDAR fusion, meshing and CAD conversion are seams, not implementations — a fixture provider is never reported as healthy." />
        <Resource res={providers} loadingLines={2}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.id}
              primary="name"
              rows={rows}
              columns={[
                { key: "name", header: "Provider", render: (r) => r.name },
                { key: "mode", header: "Mode", render: (r) => <RPill value={r.mode} small /> },
                { key: "live", header: "Live", align: "center", render: (r) => (r.isLive ? "yes" : "no") },
                { key: "detail", header: "Detail", wrap: true, render: (r) => r.detail },
              ]}
            />
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Reality Directory" />
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
          res={dir}
          loadingLines={5}
          empty={<EmptyState title="No property reality on file" hint="Reality is generated from validated capture evidence." />}
        >
          {(rows) => {
            const filtered = rows.filter(FILTERS[filter]);
            if (!filtered.length)
              return <EmptyState title={"Nothing in " + filter} hint="Choose ALL to see every property." />;
            return (
              <DataTable
                keyOf={(r) => r.model.propertyId}
                primary="property"
                onRowClick={(r) => navigate(ROUTES.realityProperty(r.model.propertyId, firstType(r)))}
                rows={filtered}
                columns={[
                  { key: "property", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.model.propertyId}</span> },
                  { key: "types", header: "Twin Types", wrap: true, render: (r) => {
                    const present = Object.entries(r.current).filter(([, v]) => v);
                    return present.length
                      ? <span style={{ display: "inline-flex", gap: 5, flexWrap: "wrap" }}>
                          {present.map(([t]) => <TwinTypeBadge key={t} typeId={t} small />)}
                        </span>
                      : <span style={{ color: T.color.textFaint }}>None approved</span>;
                  } },
                  { key: "current", header: "Current Version", render: (r) => {
                    const cur = Object.values(r.current).find(Boolean);
                    return cur ? cur.versionLabel : <span style={{ color: T.color.textFaint }}>—</span>;
                  } },
                  { key: "status", header: "Status", render: (r) => <RPill value={r.model.status} small /> },
                  { key: "quality", header: "Quality", render: (r) => <RPill value={r.model.overallQualityState} small /> },
                  { key: "completeness", header: "Completeness", render: (r) => <RPill value={r.model.overallCompletenessState} small /> },
                  { key: "mission", header: "Source Mission", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.model.latestValidatedMissionId || "—"}</span> },
                  { key: "passport", header: "Passport Rev.", render: (r) => r.model.currentPassportRevisionId || "—" },
                  { key: "comparison", header: "Comparison", align: "center", render: (r) => (r.comparisonAvailable ? "available" : "—") },
                  { key: "updated", header: "Updated", render: (r) => relTime(r.model.updatedAt) },
                ]}
              />
            );
          }}
        </Resource>
      </Panel>

      <RealityReviewQueue navigate={navigate} vp={vp} />
    </>
  );
}

const QUEUES = [
  ["processing", "Processing"], ["reviewRequired", "Review Required"], ["warnings", "Warnings"],
  ["failed", "Failed"], ["approved", "Approved"], ["superseded", "Superseded"],
];

function RealityReviewQueue({ navigate, vp }) {
  const res = useResource(() => centcomApi.realityReviewQueue(), []);
  const [bucket, setBucket] = useState("reviewRequired");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const act = async (versionId, decision) => {
    setBusy(versionId); setError(null);
    try { await centcomApi.realityReview(versionId, decision, { reason: "Reviewed in Reality Command." }); res.reload(); }
    catch (e) { setError(e.message); }
    finally { setBusy(null); }
  };

  return (
    <Panel>
      <PanelHeader title="Twin Review Queue" />
      <ModuleIntro purpose="Approval locks a version's content identity. Reprocessing an approved version is refused — new reality creates a new version, and the earlier one is superseded rather than rewritten." />
      <Resource res={res} loadingLines={4}>
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
              <EmptyState title="Nothing in this queue" hint="No twin version currently sits in this state." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q[bucket].map((v) => (
                  <div
                    key={v.twinVersionId}
                    style={{
                      padding: "12px 13px", borderRadius: T.radius.md,
                      background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                      border: "1px solid " + T.color.edge, boxShadow: T.bevel.tile,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                      <button
                        onClick={() => navigate(ROUTES.realityProperty(v.propertyId, v.twinType))}
                        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer",
                                 fontFamily: T.font.mono, fontSize: 12, color: T.color.bluePale }}
                      >
                        {v.twinVersionId}
                      </button>
                      <TwinTypeBadge typeId={v.twinType} small />
                      <span style={{ fontFamily: T.font.display, fontWeight: 700, color: T.color.text }}>{v.versionLabel}</span>
                      <RPill value={v.status} small />
                      <span style={{ marginLeft: "auto", fontFamily: T.font.mono, fontSize: 10, color: T.color.textMute }}>
                        {v.propertyId}
                      </span>
                    </div>
                    {v.notes && (
                      <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textSoft, marginTop: 9 }}>{v.notes}</div>
                    )}
                    {["DRAFT", "PROCESSING", "REVIEW_REQUIRED"].includes(v.status) && (
                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                        <GhostButton small onClick={() => act(v.twinVersionId, "APPROVE")}>
                          {busy === v.twinVersionId ? "…" : "Approve"}
                        </GhostButton>
                        <GhostButton small onClick={() => act(v.twinVersionId, "APPROVE_WITH_WARNINGS")}>Approve with warnings</GhostButton>
                        <GhostButton small onClick={() => act(v.twinVersionId, "REQUEST_REPROCESSING")}>Request reprocessing</GhostButton>
                        <GhostButton small accent="gold" onClick={() => act(v.twinVersionId, "REJECT")}>Reject version</GhostButton>
                      </div>
                    )}
                    {["APPROVED", "APPROVED_WITH_WARNINGS"].includes(v.status) && (
                      <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 10 }}>
                        Approved reality is immutable. A change requires a new version.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            {error && (
              <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.high, marginTop: 12 }}>{error}</div>
            )}
          </>
        )}
      </Resource>
    </Panel>
  );
}
