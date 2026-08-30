import React from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate } from "../../utils/format.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Fact, DataTable, Resource, EmptyState, GhostButton,
  Breadcrumb, ModuleIntro, MetalText,
} from "../../components/common/primitives.jsx";
import { EvPill, OriginBadge, ThermalKindBadge } from "../../components/evidence/EvidenceShared.jsx";

/**
 * CAPTURE PACKAGE
 *
 * One attempt at capturing a mission. A recapture creates a new package on the
 * same mission — the earlier attempt and its evidence are never overwritten.
 */
export function CapturePackagePage({ packageId, navigate }) {
  const res = useResource(() => centcomApi.vaultGetPackage(packageId), [packageId]);
  const vp = useViewport();
  const grid = (n) => (vp.isPhone ? "1fr 1fr" : "repeat(" + n + ",1fr)");

  return (
    <Resource
      res={res}
      loadingLines={5}
      label="Opening capture package"
      empty={
        <Panel>
          <EmptyState title="No capture package with that ID" hint={'"' + packageId + '" is not on file.'}
            action={<GhostButton onClick={() => navigate(ROUTES.evidence)}>Back to Evidence Command</GhostButton>} />
        </Panel>
      }
    >
      {(d) => {
        const p = d.pkg;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
            <Panel pad={vp.isPhone ? 12 : 14}>
              <Breadcrumb
                navigate={navigate}
                trail={[
                  { label: "CENTCOM", to: ROUTES.dashboard },
                  { label: "Evidence", to: ROUTES.evidence },
                  { label: p.capturePackageId },
                ]}
              />
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <MetalText size={vp.isPhone ? 19 : 24} track="0.04em">ATTEMPT {p.attemptNumber}</MetalText>
                <span style={{ fontFamily: T.font.mono, fontSize: 12, color: T.color.bluePale }}>{p.capturePackageId}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
                <EvPill value={p.status} />
                <EvPill value={p.coverageState} small />
                <EvPill value={p.ingestState} small />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <GhostButton small onClick={() => navigate(ROUTES.property(p.propertyId))}>Property {p.propertyId}</GhostButton>
                <GhostButton small onClick={() => navigate(ROUTES.mission(p.missionId))}>Mission {p.missionId}</GhostButton>
                <GhostButton small onClick={() => navigate(ROUTES.atcMission(p.missionId, "post-flight"))}>ATC post-flight</GhostButton>
              </div>
            </Panel>

            <Panel>
              <PanelHeader title="Package Summary" />
              <div style={{ display: "grid", gridTemplateColumns: grid(4), gap: 12 }}>
                <Fact label="Capture Session" value={p.captureSessionId || "—"} mono />
                <Fact label="Operator" value={p.operatorId || "—"} mono />
                <Fact label="Aircraft" value={p.aircraftId || "—"} mono />
                <Fact label="Sensor Package" value={p.sensorPackageId || "—"} mono />
                <Fact label="Created" value={relTime(p.createdAt)} />
                <Fact label="Closed" value={p.closedAt ? relTime(p.closedAt) : "Open"} />
                <Fact label="Artifacts Received" value={p.receivedArtifactCount} />
                <Fact label="Validation" value={p.validationState.replace(/_/g, " ")} />
              </div>
              {p.notes && (
                <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn, marginTop: 12 }}>▲ {p.notes}</div>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Attempt History" />
              <ModuleIntro purpose="Every attempt on this mission, in order. A recapture never replaces an earlier package — operators can see the whole capture history at a glance." />
              <DataTable
                keyOf={(r) => r.capturePackageId}
                primary="capturePackageId"
                onRowClick={(r) => navigate(ROUTES.capturePackage(r.capturePackageId))}
                rows={d.attempts}
                columns={[
                  { key: "attempt", header: "Attempt", align: "center", render: (r) => (
                    <span style={{ fontFamily: T.font.display, fontWeight: 700,
                                   color: r.capturePackageId === p.capturePackageId ? T.color.bluePale : T.color.textMute }}>
                      ATTEMPT {r.attemptNumber}
                    </span>
                  ) },
                  { key: "capturePackageId", header: "Package", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.capturePackageId}</span> },
                  { key: "status", header: "Status", render: (r) => <EvPill value={r.status} small /> },
                  { key: "coverage", header: "Coverage", render: (r) => <EvPill value={r.coverageState} small /> },
                  { key: "count", header: "Artifacts", align: "right", render: (r) => r.receivedArtifactCount },
                  { key: "created", header: "Created", render: (r) => shortDate(r.createdAt) },
                  { key: "notes", header: "Notes", wrap: true, render: (r) => r.notes || "—" },
                ]}
              />
            </Panel>

            <Panel>
              <PanelHeader title="Coverage" />
              {d.coverage ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: grid(3), gap: 12, marginBottom: 14 }}>
                    <Fact label="State" value={d.coverage.coverageState.replace(/_/g, " ")} />
                    <Fact label="Completion" value={d.coverage.completionPercent + "%"} />
                    <Fact label="Reviewed By" value={d.coverage.reviewedBy} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr" : "1fr 1fr", gap: 14 }}>
                    <div>
                      <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Captured</Label>
                      {d.coverage.capturedAreas.map((x) => (
                        <div key={x} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.ok }}>● {x}</div>
                      ))}
                    </div>
                    <div>
                      <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Missing — required but not captured</Label>
                      {d.coverage.missingAreas.length === 0
                        ? <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textFaint }}>None.</div>
                        : d.coverage.missingAreas.map((x) => (
                            <div key={x} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>▲ {x}</div>
                          ))}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState title="Coverage not evaluated" hint="No coverage assessment has been run for this package." />
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Artifacts" />
              <Resource res={{ data: d.assets, loading: false, error: null, reload: () => {} }}
                empty={<EmptyState title="No artifacts ingested" hint="This package is open and has not received evidence yet." />}>
                {(rows) => (
                  <DataTable
                    keyOf={(r) => r.evidenceId}
                    primary="filename"
                    onRowClick={(r) => navigate(ROUTES.evidenceAsset(r.evidenceId))}
                    rows={rows}
                    columns={[
                      { key: "evidenceId", header: "Evidence", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.evidenceId}</span> },
                      { key: "filename", header: "Artifact", wrap: true, render: (r) => r.filename },
                      { key: "origin", header: "Origin", render: (r) => <OriginBadge origin={r.origin} /> },
                      { key: "thermal", header: "Thermal", render: (r) => (r.thermalKind ? <ThermalKindBadge kind={r.thermalKind} /> : "—") },
                      { key: "type", header: "Type", render: (r) => r.artifactType.replace(/_/g, " ") },
                      { key: "integrity", header: "Integrity", render: (r) => <EvPill value={r.hashState} small /> },
                      { key: "quality", header: "Quality", render: (r) => <EvPill value={r.qualityState} small /> },
                      { key: "review", header: "Review", render: (r) => <EvPill value={r.reviewState} small /> },
                    ]}
                  />
                )}
              </Resource>
            </Panel>
          </div>
        );
      }}
    </Resource>
  );
}
