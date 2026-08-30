import React, { useState } from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate } from "../../utils/format.js";
import { ROUTES, REALITY_TABS } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { twinType, WORKING_NAME_NOTICE, twinTypeIds } from "../../domains/reality/types.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Fact, DataTable, Resource, EmptyState, GhostButton,
  Breadcrumb, ModuleIntro, MetalText, LineageRail,
} from "../../components/common/primitives.jsx";
import { RPill, TwinTypeBadge, MetricValue, LayerRow } from "../../components/reality/RealityShared.jsx";
import { ProjectionTab, RealityAuditTab } from "./RealityProjectionTabs.jsx";

const slug = (n) => n.toLowerCase().replace(/\s+/g, "-");
const grid = (vp, n) => (vp.isPhone ? "1fr 1fr" : "repeat(" + n + ",1fr)");

export function RealityDetail({ propertyId, twinTypeId, tabSlug, navigate }) {
  const versions = useResource(() => centcomApi.realityVersions(propertyId, twinTypeId), [propertyId, twinTypeId]);
  const model = useResource(() => centcomApi.realityModel(propertyId), [propertyId]);
  const fromSlug = REALITY_TABS.find((t) => slug(t) === tabSlug);
  const [tab, setTab] = useState(fromSlug || "Overview");
  const [selectedId, setSelectedId] = useState(null);
  const vp = useViewport();
  const type = twinType(twinTypeId);

  const openTab = (name) => { setTab(name); navigate(ROUTES.realityProperty(propertyId, twinTypeId, slug(name))); };

  return (
    <Resource
      res={versions}
      loadingLines={5}
      label="Opening property reality"
      empty={
        <Panel>
          <EmptyState
            title="No reality for this property and type"
            hint={"No " + (type?.displayLabel || twinTypeId) + " version exists for " + propertyId + ". Reality is generated from validated capture evidence."}
            action={<GhostButton onClick={() => navigate(ROUTES.reality)}>Back to Reality Command</GhostButton>}
          />
        </Panel>
      }
    >
      {(list) => {
        const selected = list.find((v) => v.twinVersionId === selectedId)
          || list.find((v) => ["APPROVED", "APPROVED_WITH_WARNINGS"].includes(v.status))
          || list[0];
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
            <Panel pad={vp.isPhone ? 12 : 14}>
              <Breadcrumb
                navigate={navigate}
                trail={[
                  { label: "CENTCOM", to: ROUTES.dashboard },
                  { label: "Reality", to: ROUTES.reality },
                  { label: propertyId, to: ROUTES.realityProperty(propertyId, twinTypeId) },
                  { label: tab },
                ]}
              />
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <MetalText size={vp.isPhone ? 18 : 23} track="0.04em">PROPERTY REALITY</MetalText>
                <span style={{ fontFamily: T.font.mono, fontSize: 12, color: T.color.bluePale }}>{propertyId}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
                <TwinTypeBadge typeId={twinTypeId} />
                <RPill value={selected.status} />
                <span style={{ fontFamily: T.font.display, fontWeight: 700, color: T.color.text }}>{selected.versionLabel}</span>
              </div>
              <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.goldBright, marginTop: 10 }}>
                ▲ {WORKING_NAME_NOTICE}
              </div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
                {twinTypeIds().map((tid) => (
                  <GhostButton key={tid} small onClick={() => navigate(ROUTES.realityProperty(propertyId, tid))}>
                    {twinType(tid).displayLabel}
                  </GhostButton>
                ))}
                <GhostButton small onClick={() => navigate(ROUTES.property(propertyId, "reality-twin"))}>Property record</GhostButton>
              </div>
            </Panel>

            <div
              style={{
                display: "flex", flexWrap: vp.isPhone ? "nowrap" : "wrap",
                overflowX: vp.isPhone ? "auto" : "visible", WebkitOverflowScrolling: "touch",
                gap: 4, padding: 6, background: "rgba(6,12,22,0.75)",
                border: "1px solid " + T.color.edge, borderRadius: T.radius.md,
                position: vp.isPhone ? "sticky" : "static", top: 0, zIndex: 20,
              }}
              role="tablist"
            >
              {REALITY_TABS.map((name) => {
                const on = name === tab;
                return (
                  <button
                    key={name} role="tab" aria-selected={on} onClick={() => openTab(name)}
                    style={{
                      fontFamily: T.font.display, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", color: on ? "#FFFFFF" : T.color.textMute,
                      background: on ? "linear-gradient(180deg,rgba(30,107,255,0.34),rgba(10,24,48,0.9))" : "transparent",
                      border: "1px solid " + (on ? "rgba(30,107,255,0.55)" : "transparent"),
                      borderRadius: T.radius.sm, cursor: "pointer", flex: "none", whiteSpace: "nowrap",
                      padding: vp.isPhone ? "9px 12px" : "6px 10px",
                      boxShadow: on ? T.glow.blueSoft : "none",
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>

            <RealityTabBody
              tab={tab} propertyId={propertyId} twinTypeId={twinTypeId}
              versions={list} selected={selected} setSelectedId={setSelectedId}
              model={model.data} navigate={navigate} openTab={openTab} vp={vp}
              reload={versions.reload}
            />
          </div>
        );
      }}
    </Resource>
  );
}

function RealityTabBody({ tab, propertyId, twinTypeId, versions, selected, setSelectedId, model, navigate, openTab, vp, reload }) {
  const detail = useResource(() => centcomApi.realityVersion(selected.twinVersionId), [selected.twinVersionId]);

  if (tab === "Versions")
    return (
      <Panel>
        <PanelHeader title="Version History" />
        <ModuleIntro purpose="Version numbers are scoped to this property AND this twin type. A superseded version is retained in full — nothing is deleted, and no version is ever rewritten." />
        <DataTable
          keyOf={(v) => v.twinVersionId}
          primary="versionLabel"
          onRowClick={(v) => setSelectedId(v.twinVersionId)}
          rows={versions}
          columns={[
            { key: "versionLabel", header: "Version", render: (v) => (
              <span style={{ fontFamily: T.font.display, fontWeight: 700,
                             color: v.twinVersionId === selected.twinVersionId ? T.color.bluePale : T.color.text }}>
                {v.versionLabel}
              </span>
            ) },
            { key: "twinVersionId", header: "ID", render: (v) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{v.twinVersionId}</span> },
            { key: "status", header: "Status", render: (v) => <RPill value={v.status} small /> },
            { key: "quality", header: "Quality", render: (v) => <RPill value={v.qualityState} small /> },
            { key: "completeness", header: "Completeness", render: (v) => <RPill value={v.completenessState} small /> },
            { key: "created", header: "Created", render: (v) => shortDate(v.createdAt) },
            { key: "approved", header: "Approved", render: (v) => (v.approvedAt ? shortDate(v.approvedAt) : "—") },
            { key: "supersedes", header: "Supersedes", render: (v) => v.supersedesTwinVersionId || "—" },
            { key: "supersededBy", header: "Superseded By", render: (v) => v.supersededByTwinVersionId || "—" },
            { key: "passport", header: "Passport Rev.", render: (v) => v.passportRevisionId || "—" },
          ]}
        />
      </Panel>
    );

  return (
    <Resource res={detail} loadingLines={4}>
      {(d) => (
        <VersionTab tab={tab} d={d} propertyId={propertyId} twinTypeId={twinTypeId}
                    model={model} navigate={navigate} openTab={openTab} vp={vp} reload={reload} />
      )}
    </Resource>
  );
}

function VersionTab({ tab, d, propertyId, twinTypeId, model, navigate, openTab, vp, reload }) {
  const v = d.version;
  const type = twinType(twinTypeId);

  if (tab === "Overview")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Current Reality" />
          <div style={{ display: "grid", gridTemplateColumns: grid(vp, 4), gap: 12 }}>
            <Fact label="Twin Version" value={v.twinVersionId} mono />
            <Fact label="Version" value={v.versionLabel} />
            <Fact label="Status" value={v.status.replace(/_/g, " ")} />
            <Fact label="Quality" value={v.qualityState.replace(/_/g, " ")} />
            <Fact label="Completeness" value={d.completeness.state.replace(/_/g, " ")} />
            <Fact label="Coordinate System" value={v.coordinateSystem.replace(/_/g, " ")} />
            <Fact label="Units" value={v.unitSystem} />
            <Fact label="Created" value={shortDate(v.createdAt)} />
            <Fact label="Approved" value={v.approvedAt ? shortDate(v.approvedAt) : "Not approved"} />
            <Fact label="Approved By" value={v.approvedBy || "—"} />
            <Fact label="Passport Revision" value={v.passportRevisionId || "—"} />
            <Fact label="Artifacts" value={d.artifacts.length} />
          </div>
          {d.completeness.missing.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Required outputs missing for this type</Label>
              {d.completeness.missing.map((m) => (
                <div key={m} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>▲ {m.replace(/_/g, " ")}</div>
              ))}
            </div>
          )}
          <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 14 }}>
            Completeness is evaluated against {type.displayLabel}'s own policy, not a global definition.
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Lineage" />
          <LineageRail
            navigate={navigate}
            steps={[
              { label: "Property", value: propertyId, to: ROUTES.property(propertyId) },
              { label: "Mission", value: v.sourceMissionIds[0] || "—", to: v.sourceMissionIds[0] ? ROUTES.mission(v.sourceMissionIds[0]) : null },
              { label: "Capture", value: v.sourceCapturePackageIds[0] || "—", to: v.sourceCapturePackageIds[0] ? ROUTES.capturePackage(v.sourceCapturePackageIds[0]) : null },
              { label: "Evidence", value: v.sourceEvidenceIds.length + " assets", to: ROUTES.property(propertyId, "evidence") },
              { label: "Processing", value: d.jobs.length + " jobs" },
              { label: "Reality", value: v.versionLabel, current: true },
              { label: "Passport", value: v.passportRevisionId || "—", to: ROUTES.property(propertyId, "passport") },
              { label: "Cortex", value: "analyses", to: ROUTES.property(propertyId, "cortex") },
            ]}
          />
        </Panel>
      </div>
    );

  if (tab === "Viewer")
    return (
      <Panel>
        <PanelHeader title="Reality Viewer" />
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 14,
            borderRadius: T.radius.md, background: "rgba(30,107,255,0.10)", border: "1px solid rgba(30,107,255,0.4)",
          }}
        >
          <span aria-hidden="true" style={{ color: T.color.blueBright }}>⌀</span>
          <span style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft }}>
            NO SPATIAL RENDERER IS CONNECTED. No mesh, point cloud or texture exists to display — these are metadata
            descriptors only. Nothing below is a rendering of this property.
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
          <Fact label="Renderer" value="Not connected" />
          <Fact label="Geometry Artifacts" value={d.artifacts.filter((a) => ["MESH", "TEXTURED_MESH", "POINT_CLOUD"].includes(a.artifactType)).length} />
          <Fact label="Coordinate System" value={v.coordinateSystem.replace(/_/g, " ")} />
        </div>
        <div style={{ marginTop: 14 }}>
          <GhostButton small onClick={() => openTab("Geometry")}>Inspect geometry descriptors</GhostButton>
        </div>
      </Panel>
    );

  if (tab === "Evidence")
    return (
      <Panel>
        <PanelHeader title="Source Evidence" />
        <ModuleIntro purpose="Reality reads evidence. It never rewrites an evidence asset — the vault remains the record of what was actually captured." />
        <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
          <Fact label="Source Missions" value={v.sourceMissionIds.join(", ") || "—"} mono />
          <Fact label="Capture Packages" value={v.sourceCapturePackageIds.join(", ") || "—"} mono />
          <Fact label="Evidence Assets" value={v.sourceEvidenceIds.length} />
        </div>
        {v.sourceEvidenceIds.length === 0 ? (
          <EmptyState title="No source evidence recorded" hint="This version has no evidence references on file." />
        ) : (
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {v.sourceEvidenceIds.map((id) => (
              <GhostButton key={id} small onClick={() => navigate(ROUTES.evidenceAsset(id))}>{id}</GhostButton>
            ))}
          </div>
        )}
      </Panel>
    );

  if (tab === "Processing")
    return (
      <Panel>
        <PanelHeader title="Processing Jobs" />
        <ModuleIntro purpose="Every artifact traces to the job that produced it, with processor and version recorded. No reconstruction actually ran — these are fixture jobs." />
        <Resource res={{ data: d.jobs, loading: false, error: null, reload: () => {} }}
          empty={<EmptyState title="No processing jobs" hint="No job is recorded against this version." />}>
          {(rows) => (
            <DataTable
              keyOf={(j) => j.jobId}
              primary="processorType"
              rows={rows}
              columns={[
                { key: "jobId", header: "Job", render: (j) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{j.jobId}</span> },
                { key: "processorType", header: "Processor", render: (j) => j.processorType.replace(/_/g, " ") },
                { key: "processorVersion", header: "Version", render: (j) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{j.processorVersion}</span> },
                { key: "status", header: "Status", render: (j) => <RPill value={j.status} small /> },
                { key: "inputs", header: "Input Evidence", wrap: true, render: (j) => j.inputEvidenceIds.join(", ") || "—" },
                { key: "outputs", header: "Outputs", wrap: true, render: (j) => j.outputArtifactIds.join(", ") || "—" },
                { key: "warnings", header: "Warnings", wrap: true, render: (j) => j.warningCodes.join(", ") || "—" },
                { key: "failure", header: "Failure", wrap: true, render: (j) => j.failureReason || "—" },
              ]}
            />
          )}
        </Resource>
      </Panel>
    );

  if (tab === "Geometry")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Spatial Artifacts" />
          <ModuleIntro purpose="Metadata descriptors only. Counts a real processor would report — points, vertices, faces — read 'not computed' because nothing counted them." />
          <DataTable
            keyOf={(a) => a.spatialArtifactId}
            primary="artifactType"
            rows={d.artifacts}
            columns={[
              { key: "artifactType", header: "Artifact", render: (a) => a.artifactType.replace(/_/g, " ") },
              { key: "format", header: "Format", render: (a) => a.format || "—" },
              { key: "points", header: "Points", align: "right", render: (a) => <MetricValue value={a.pointCount} /> },
              { key: "vertices", header: "Vertices", align: "right", render: (a) => <MetricValue value={a.vertexCount} /> },
              { key: "faces", header: "Faces", align: "right", render: (a) => <MetricValue value={a.faceCount} /> },
              { key: "source", header: "Capture Method", render: (a) => a.pointCloudSource ? a.pointCloudSource.replace(/_/g, " ") : "—" },
              { key: "mesh", header: "Mesh Quality", render: (a) => (a.meshQuality ? <RPill value={a.meshQuality} small /> : "—") },
              { key: "job", header: "Job", render: (a) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{a.processingJobId}</span> },
              { key: "evidence", header: "Source Evidence", wrap: true, render: (a) => a.sourceEvidenceIds.join(", ") || "—" },
            ]}
          />
        </Panel>

        <Panel>
          <PanelHeader title="Roof Geometry" />
          {d.roof ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: grid(vp, 2), gap: 14 }}>
                <div>
                  <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Planes</Label>
                  {d.roof.sections.map((s) => (
                    <div key={s.featureId} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginBottom: 4 }}>
                      <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{s.featureId}</span>
                      {" " + s.label} — {s.areaSqFt} sq ft, {s.pitch}
                    </div>
                  ))}
                </div>
                <div>
                  <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Linear Features</Label>
                  {[...d.roof.ridges, ...d.roof.valleys, ...d.roof.eaves].map((r) => (
                    <div key={r.featureId} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginBottom: 4 }}>
                      <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{r.featureId}</span>
                      {" " + r.label} — {r.lengthFt} lf
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 12 }}>
                Feature IDs are stable so a finding, measurement or repair can attach to the same roof plane across versions.
              </div>
            </>
          ) : (
            <EmptyState title="No roof geometry" hint="This version has no roof geometry artifact." />
          )}
        </Panel>
      </div>
    );

  if (tab === "Thermal") return <ThermalTab versionId={v.twinVersionId} vp={vp} navigate={navigate} />;

  if (tab === "Measurements")
    return (
      <Panel>
        <PanelHeader title="Measurements" />
        <ModuleIntro purpose="A dimension computed from geometry is DERIVED, not MEASURED. Only a direct sensor reading is measured — precision is recorded separately from Cortex confidence, which does not belong here." />
        {d.measurements ? (
          <DataTable
            keyOf={(m) => m.measurementId}
            primary="name"
            rows={d.measurements.measurements}
            columns={[
              { key: "name", header: "Measurement", wrap: true, render: (m) => m.name },
              { key: "value", header: "Value", align: "right", render: (m) => <MetricValue value={m.value} unit={m.unit} /> },
              { key: "truth", header: "Truth Class", render: (m) => <RPill value={m.truthClassification} small /> },
              { key: "method", header: "Method", render: (m) => m.method.replace(/_/g, " ") },
              { key: "precision", header: "Precision", render: (m) => m.precision || "—" },
              { key: "feature", header: "Feature", render: (m) => m.featureId ? <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{m.featureId}</span> : "—" },
              { key: "evidence", header: "Source Evidence", wrap: true, render: (m) => m.sourceEvidenceIds.join(", ") || "—" },
              { key: "artifacts", header: "Source Artifacts", wrap: true, render: (m) => m.sourceArtifactIds.join(", ") || "—" },
            ]}
          />
        ) : (
          <EmptyState title="No measurement set" hint="No measurements have been extracted from this version." />
        )}
      </Panel>
    );

  if (tab === "Layers")
    return (
      <Panel>
        <PanelHeader title="Layers" />
        <ModuleIntro purpose="A layer that was not observed says so. Concealed systems — wiring, plumbing, ducting inside walls — are never rendered as observed, and an inferred system is marked PROBABLE rather than known." />
        {d.layers ? (
          <div>
            {Object.entries(d.layers.layers).map(([name, row]) => (
              <LayerRow key={name} name={name} row={row} />
            ))}
          </div>
        ) : (
          <EmptyState title="No layer set" hint="This version has no layer set recorded." />
        )}
      </Panel>
    );

  if (tab === "Quality")
    return (
      <Panel>
        <PanelHeader title="Quality & Review" />
        <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
          <Fact label="Overall" value={v.qualityState.replace(/_/g, " ")} />
          <Fact label="Completeness" value={d.completeness.state.replace(/_/g, " ")} />
          <Fact label="Status" value={v.status.replace(/_/g, " ")} />
        </div>
        {d.quality ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
              <Fact label="Geometry" value={d.quality.geometryQuality.replace(/_/g, " ")} />
              <Fact label="Texture" value={d.quality.textureQuality.replace(/_/g, " ")} />
              <Fact label="Thermal Alignment" value={d.quality.thermalAlignmentQuality.replace(/_/g, " ")} />
              <Fact label="Measurement" value={d.quality.measurementQuality.replace(/_/g, " ")} />
              <Fact label="Coverage" value={d.quality.coverageQuality.replace(/_/g, " ")} />
              <Fact label="Reviewed By" value={d.quality.reviewedBy} />
            </div>
            <DataTable
              keyOf={(c) => c.code}
              primary="label"
              rows={d.quality.checks}
              columns={[
                { key: "state", header: "Result", render: (c) => <RPill value={c.state} small /> },
                { key: "label", header: "Check", render: (c) => c.label },
                { key: "source", header: "Judged By", render: (c) => c.source },
                { key: "detail", header: "Detail", wrap: true, render: (c) => c.detail || "—" },
              ]}
            />
          </>
        ) : (
          <EmptyState title="Not evaluated" hint="No quality assessment exists for this version." />
        )}
        {["APPROVED", "APPROVED_WITH_WARNINGS"].includes(v.status) && (
          <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 14 }}>
            This version is approved and immutable. Reprocessing would create a new version; this one would be superseded, not rewritten.
          </div>
        )}
      </Panel>
    );

  if (tab === "Comparison") return <ComparisonTab propertyId={propertyId} versionId={v.twinVersionId} vp={vp} navigate={navigate} />;

  if (tab === "Cortex" || tab === "Passport" || tab === "Projections")
    return <ProjectionTab which={tab} propertyId={propertyId} twinTypeId={twinTypeId} vp={vp} navigate={navigate} />;

  if (tab === "Audit")
    return <RealityAuditTab propertyId={propertyId} vp={vp} />;

  return <Panel><EmptyState title={tab} hint="No content for this section." /></Panel>;
}

function ThermalTab({ versionId, vp, navigate }) {
  const res = useResource(() => centcomApi.realityThermal(versionId), [versionId]);
  return (
    <Panel>
      <PanelHeader title="Thermal Spatial Layer" accent="gold" />
      <ModuleIntro purpose="A rendered thermal picture is not radiometric data. Without a radiometric source, no temperature values are claimed — an aligned layer is not the same as a calibrated one." />
      <Resource res={res} loadingLines={3}
        empty={<EmptyState title="No thermal layer" hint="This version has no thermal spatial layer." />}>
        {(t) => (
          <>
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
              <Fact label="Alignment" value={t.alignmentState.replace(/_/g, " ")} />
              <Fact label="Coverage" value={t.coverageState.replace(/_/g, " ")} />
              <Fact label="Quality" value={t.qualityState.replace(/_/g, " ")} />
              <Fact label="Method" value={t.alignmentMethod ? t.alignmentMethod.replace(/_/g, " ") : "Not started"} />
              <Fact label="Processing Version" value={t.processingVersion || "—"} mono />
              <Fact label="Radiometric Source" value={t.radiometricAvailable ? "Available" : "Not available"}
                    tone={t.radiometricAvailable ? "ok" : "warn"} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 2), gap: 14, marginTop: 14 }}>
              <div>
                <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Radiometric Sources</Label>
                {t.sourceRadiometricEvidenceIds.length
                  ? t.sourceRadiometricEvidenceIds.map((id) => (
                      <GhostButton key={id} small onClick={() => navigate(ROUTES.evidenceAsset(id))}>{id}</GhostButton>
                    ))
                  : <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.warn }}>None — no temperature values can be claimed.</div>}
              </div>
              <div>
                <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Rendered Thermal</Label>
                {t.sourceThermalEvidenceIds.length
                  ? t.sourceThermalEvidenceIds.map((id) => (
                      <GhostButton key={id} small onClick={() => navigate(ROUTES.evidenceAsset(id))}>{id}</GhostButton>
                    ))
                  : <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textFaint }}>None.</div>}
              </div>
            </div>
            {t.notes && (
              <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginTop: 14 }}>{t.notes}</div>
            )}
          </>
        )}
      </Resource>
    </Panel>
  );
}

function ComparisonTab({ propertyId, versionId, vp, navigate }) {
  const versions = useResource(() => centcomApi.realityVersions(propertyId), [propertyId]);
  const [result, setResult] = useState(null);
  const [changeSet, setChangeSet] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (baseId) => {
    setBusy(true); setError(null); setChangeSet(null);
    try {
      const r = await centcomApi.realityCompare(baseId, versionId);
      setResult(r);
      if (r.changeSetId) setChangeSet(await centcomApi.realityChangeSet(r.changeSetId));
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="Compare Versions" />
        <ModuleIntro purpose="Comparison is only meaningful between two versions of the same twin type on the same property. When the artifacts needed for a real difference do not exist, the result is INSUFFICIENT DATA — never 'zero changes found'." />
        <Resource res={versions} loadingLines={2}>
          {(list) => {
            const candidates = list.filter((x) => x.twinVersionId !== versionId);
            if (!candidates.length)
              return <EmptyState title="Nothing to compare against" hint="This property has only one twin version." />;
            return (
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {candidates.map((c) => (
                  <GhostButton key={c.twinVersionId} small onClick={() => run(c.twinVersionId)}>
                    {busy ? "…" : "Compare against " + c.versionLabel + " (" + twinType(c.twinType).displayLabel + ")"}
                  </GhostButton>
                ))}
              </div>
            );
          }}
        </Resource>
        {error && (
          <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: T.radius.sm,
                        background: "rgba(251,146,60,0.10)", border: "1px solid rgba(251,146,60,0.45)",
                        fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>
            ▲ {error}
          </div>
        )}
      </Panel>

      {result && (
        <Panel>
          <PanelHeader title="Comparison Result" />
          <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
            <Fact label="Status" value={result.status.replace(/_/g, " ")} />
            <Fact label="Base" value={result.baseTwinVersionId} mono />
            <Fact label="Comparison" value={result.comparisonTwinVersionId} mono />
          </div>
          {result.reason && (
            <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn, marginTop: 12 }}>▲ {result.reason}</div>
          )}
        </Panel>
      )}

      {changeSet && (
        <Panel>
          <PanelHeader title="Change Set" />
          <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.blueBright, marginBottom: 12 }}>
            {changeSet.notice}
          </div>
          <DataTable
            keyOf={(c) => c.changeId}
            primary="description"
            rows={changeSet.changes}
            columns={[
              { key: "changeClass", header: "Change", render: (c) => <RPill value={c.changeClass} small /> },
              { key: "description", header: "Description", wrap: true, render: (c) => c.description },
              { key: "baseFeatureId", header: "Base Feature", render: (c) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{c.baseFeatureId}</span> },
              { key: "newFeatureId", header: "New Feature", render: (c) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{c.newFeatureId}</span> },
              { key: "artifacts", header: "Source Artifacts", wrap: true, render: (c) => c.sourceArtifactIds.join(", ") },
              { key: "processor", header: "Processor", render: (c) => c.processorVersion },
            ]}
          />
        </Panel>
      )}
    </div>
  );
}
