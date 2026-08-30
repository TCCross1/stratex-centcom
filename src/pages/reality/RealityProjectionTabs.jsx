import React from "react";
import T from "../../design/tokens.js";
import { relTime } from "../../utils/format.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { twinType } from "../../domains/reality/types.js";
import { useResource } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Fact, DataTable, Resource, EmptyState, ModuleIntro,
} from "../../components/common/primitives.jsx";
import { RPill, TwinTypeBadge } from "../../components/reality/RealityShared.jsx";

const grid = (vp, n) => (vp.isPhone ? "1fr 1fr" : "repeat(" + n + ",1fr)");

export function ProjectionTab({ which, propertyId, twinTypeId, vp, navigate }) {
  const passport = useResource(() => centcomApi.realityPassportProjection(propertyId), [propertyId]);
  const cortex = useResource(() => centcomApi.realityCortexManifest(propertyId), [propertyId]);
  const core = useResource(() => centcomApi.realityCoreProjection(propertyId, twinTypeId), [propertyId, twinTypeId]);
  const habitat = useResource(() => centcomApi.realityHabitatProjection(propertyId, twinTypeId), [propertyId, twinTypeId]);
  const modules = useResource(() => centcomApi.realityReportModules(propertyId), [propertyId]);

  if (which === "Passport")
    return (
      <Panel>
        <PanelHeader title="Passport Projection" />
        <ModuleIntro purpose="Passport records references to approved twin versions. It never stores geometry, and a draft, failed or rejected version can never become the current Passport state." />
        <Resource res={passport} loadingLines={3}>
          {(p) => (
            <>
              <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
                {Object.entries(p.currentTwinVersionIds).map(([type, id]) => (
                  <Fact key={type} label={twinType(type).displayLabel} value={id || "None approved"} mono />
                ))}
              </div>
              <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Historical Versions — retained, never deleted</Label>
              {p.historicalTwinVersions.length ? (
                <DataTable
                  keyOf={(h) => h.twinVersionId}
                  primary="twinVersionId"
                  rows={p.historicalTwinVersions}
                  columns={[
                    { key: "twinVersionId", header: "Version", render: (h) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{h.twinVersionId}</span> },
                    { key: "twinType", header: "Type", render: (h) => <TwinTypeBadge typeId={h.twinType} small /> },
                    { key: "versionLabel", header: "Label", render: (h) => h.versionLabel },
                    { key: "status", header: "Status", render: (h) => <RPill value={h.status} small /> },
                  ]}
                />
              ) : (
                <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textFaint }}>No historical versions.</div>
              )}
            </>
          )}
        </Resource>
      </Panel>
    );

  if (which === "Cortex")
    return (
      <Panel>
        <PanelHeader title="Cortex Spatial Manifest" accent="gold" />
        <ModuleIntro purpose="Cortex reads reality through a scoped manifest of approved versions. It may produce findings and annotations; it can never mutate twin history." />
        <Resource res={cortex} loadingLines={3}>
          {(c) => (
            <>
              <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
                <Fact label="Twin Versions" value={c.twinVersionIds.length} />
                <Fact label="Spatial Artifacts" value={c.spatialArtifactIds.length} />
                <Fact label="Measurement Sets" value={c.measurementSetIds.length} />
                <Fact label="Thermal Layers" value={c.thermalLayerIds.length} />
                <Fact label="Available Layers" value={c.availableLayers.length} />
                <Fact label="Warnings" value={c.warnings.length} tone={c.warnings.length ? "warn" : "ok"} />
              </div>
              {c.warnings.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  {c.warnings.map((w, i) => (
                    <div key={i} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>▲ {w}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </Resource>
      </Panel>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="Core Geometry Projection" />
        <ModuleIntro purpose="Core consumes approved geometry to calculate work. The projection is read-only and exposes no way to alter canonical twin history." />
        <Resource res={core} loadingLines={2}>
          {(c) => c.available ? (
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
              <Fact label="Version" value={c.versionLabel} />
              <Fact label="Read Only" value="yes" tone="ok" />
              <Fact label="Measurements" value={c.measurements.length} />
              <Fact label="Geometry Artifacts" value={c.geometryArtifacts.length} />
              <Fact label="Roof Geometry" value={c.roofGeometry ? "Available" : "None"} />
              <Fact label="Quality" value={c.qualityState.replace(/_/g, " ")} />
            </div>
          ) : (
            <EmptyState title="Not projected to Core" hint={c.reason} />
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Habitat Projection" accent="gold" />
        <ModuleIntro purpose="Habitat receives an authorized read-only projection of approved canonical state. It does not own reality." />
        <Resource res={habitat} loadingLines={2}>
          {(h) => h.available ? (
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
              <Fact label="Version" value={h.versionLabel} />
              <Fact label="Read Only" value="yes" tone="ok" />
              <Fact label="Available Layers" value={h.availableLayers.length} />
              <Fact label="Measurements" value={h.measurementCount} />
            </div>
          ) : (
            <EmptyState title="Not projected to Habitat" hint={h.reason} />
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Report Modules Supported" />
        <ModuleIntro purpose="A report module whose required artifact does not exist is excluded with a reason — never rendered as an empty page." />
        <Resource res={modules} loadingLines={3}>
          {(rows) => (
            <DataTable
              keyOf={(m) => m.module}
              primary="module"
              rows={rows}
              columns={[
                { key: "module", header: "Module", render: (m) => m.module.replace(/_/g, " ") },
                { key: "included", header: "Included", render: (m) => <RPill value={m.included ? "AVAILABLE" : "NOT_APPLICABLE"} small /> },
                { key: "reason", header: "Reason Excluded", wrap: true, render: (m) => m.reason || "—" },
              ]}
            />
          )}
        </Resource>
      </Panel>
    </div>
  );
}


export function RealityAuditTab({ propertyId, vp }) {
  const res = useResource(() => centcomApi.realityAudit(propertyId), [propertyId]);
  return (
    <Panel>
      <PanelHeader title="Reality Audit" />
      <ModuleIntro purpose="Version creation, approval, supersession and rejection all leave a record of who acted and from which state." />
      <Resource res={res} loadingLines={3}
        empty={<EmptyState title="No audit records in this session" hint="Audit entries are written as versions are created, approved or superseded. Seeded fixtures carry no prior audit history." />}>
        {(rows) => (
          <DataTable
            keyOf={(r) => r.auditId}
            primary="action"
            rows={rows.slice().reverse()}
            columns={[
              { key: "at", header: "When", render: (r) => relTime(r.at) },
              { key: "actor", header: "Actor", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.actor}</span> },
              { key: "action", header: "Action", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{r.action}</span> },
              { key: "object", header: "Version", render: (r) => r.objectId || "—" },
              { key: "prev", header: "Previous", render: (r) => r.previousState || "—" },
              { key: "next", header: "New", render: (r) => r.newState || "—" },
              { key: "reason", header: "Reason", wrap: true, render: (r) => r.reason || "—" },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}
