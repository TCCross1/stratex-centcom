import React from "react";
import T from "../../design/tokens.js";
import centcomApi, { CoreAdapter, HabitatAdapter, ProAdapter } from "../../domains/index.js";
import { ROLE_SCOPES, can } from "../../domains/shared/rbac.js";
import { relTime } from "../../utils/format.js";
import { useResource, useViewport } from "../../app/hooks.js";
import { AdapterNotice, DataTable, Denied, Fact, GhostButton, Panel, PanelHeader, Resource, StatusDot } from "../common/primitives.jsx";

export function CoreCommand() {
  const res = useResource(() => CoreAdapter.getEngineStatus(), []);
  const vp = useViewport();
  return (
    <Panel>
      <PanelHeader title="Core Command — Work & Execution Engine" />
      <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginBottom: 12 }}>
        Core turns property intelligence into work: geometry, takeoff, estimating, reporting, workflow. This is engine
        oversight, not a professional dashboard — professionals work in Stratex Pro.
      </div>
      {!CoreAdapter.connected && <AdapterNotice name="CoreAdapter" />}
      <Resource res={res} loadingLines={5}>
        {(d) => (
          <DataTable
            keyOf={(r) => r.id}
            primary="name"
            rows={d.services}
            columns={[
              { key: "name", header: "Service", render: (r) => r.name },
              { key: "state", header: "State", render: (r) => (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <StatusDot state={r.state} size={6} />{r.state}
                </span>
              ) },
              { key: "queued", header: "Queued", align: "right", render: (r) => r.queued },
              { key: "failed", header: "Failed", align: "right", render: (r) => r.failed ? <span style={{ color: T.color.warn }}>{r.failed}</span> : "0" },
              { key: "p95", header: "p95", align: "right", render: (r) => (r.p95Ms / 1000).toFixed(1) + "s" },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}

export function CoreOversight({ propertyId = "SXP-004182" }) {
  const res = useResource(() => CoreAdapter.getPropertyWorkState(propertyId), [propertyId]);
  const vp = useViewport();
  return (
    <Panel>
      <PanelHeader title="Core — Work Performed on This Property" />
      {!CoreAdapter.connected && <AdapterNotice name="CoreAdapter" />}
      <Resource res={res} loadingLines={3}>
        {(d) => (
          <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 14 }}>
            <Fact label="Work State" value={d.workState} />
            <Fact label="Measurement Job" value={d.measurementJob} />
            <Fact label="Takeoff Job" value={d.takeoffJob} />
            <Fact label="Estimate Job" value={d.estimateJob} />
            <Fact label="Report Job" value={d.reportJob} />
            <Fact label="Last Run" value={relTime(d.lastRun)} />
            <Fact label="Failures" value={d.failures} tone={d.failures ? "warn" : "ok"} />
          </div>
        )}
      </Resource>
    </Panel>
  );
}

export function ProOversight({ propertyId = "SXP-004182" }) {
  const res = useResource(() => ProAdapter.getOversight(propertyId), [propertyId]);
  const vp = useViewport();
  return (
    <Panel>
      <PanelHeader title="Pro Oversight — The Professional" accent="gold" />
      <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginBottom: 12 }}>
        Professionals work in Stratex Pro, on an authorized package. A grant is scoped and expires. It never confers
        authority over Passport.
      </div>
      {!ProAdapter.connected && <AdapterNotice name="ProAdapter" />}
      <Resource res={res} loadingLines={3}>
        {(d) => (
          <>
            <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 14 }}>
              <Fact label="Organization" value={d.organization} />
              <Fact label="Authorization" value={d.authorization} />
              <Fact label="Project" value={d.projectStatus} />
              <Fact label="Proposal" value={d.proposalStatus} />
              <Fact label="Activity" value={d.professionalActivity} />
              <Fact label="Core Services Used" value={d.coreServicesUsed} />
              <Fact label="Completion Evidence" value={d.completionEvidence} />
              <Fact label="Exceptions" value={d.exceptions} tone={d.exceptions ? "warn" : "ok"} />
            </div>
            <div style={{ marginTop: 16 }}>
              <GhostButton accent="gold" onClick={() => window.open(d.deepLink, "_blank", "noopener")}>Open in Pro ↗</GhostButton>
            </div>
          </>
        )}
      </Resource>
    </Panel>
  );
}

export function HabitatOversight({ propertyId = "SXP-004182" }) {
  const res = useResource(() => HabitatAdapter.getOversight(propertyId), [propertyId]);
  const vp = useViewport();
  return (
    <Panel>
      <PanelHeader title="Habitat Oversight — The Relationship" accent="gold" />
      {!HabitatAdapter.connected && <AdapterNotice name="HabitatAdapter" />}
      <Resource res={res} loadingLines={3}>
        {(d) => (
          <>
            <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 14 }}>
              <Fact label="Sync State" value={d.syncState} tone={d.syncState === "synced" ? "ok" : "warn"} />
              <Fact label="Last Projection" value={relTime(d.lastProjection)} />
              <Fact label="Home Health" value={d.homeHealth} />
              <Fact label="Active Alerts" value={d.activeAlerts} />
              <Fact label="Maintenance Due" value={d.maintenanceDue} />
              <Fact label="Active Projects" value={d.activeProjects} />
              <Fact label="Contractor Authorizations" value={d.contractorAuthorizations} />
              <Fact label="Sync Failures" value={d.syncFailures} tone={d.syncFailures ? "warn" : "ok"} />
            </div>
            <div style={{ marginTop: 16 }}>
              <GhostButton accent="gold" onClick={() => window.open(d.deepLink, "_blank", "noopener")}>Open in Habitat ↗</GhostButton>
            </div>
          </>
        )}
      </Resource>
    </Panel>
  );
}

export function SystemsCommand() {
  const res = useResource(() => centcomApi.getSystems(), []);
  return (
    <Panel>
      <PanelHeader title="System Operations" />
      <Resource res={res} loadingLines={5}>
        {(rows) => (
          <DataTable
            keyOf={(r) => r.id}
            rows={rows}
            primary="name"
            columns={[
              { key: "name", header: "System", render: (r) => r.name },
              { key: "state", header: "State", render: (r) => (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <StatusDot state={r.state} size={6} />
                  <span style={{ color: r.state === "fixture" ? T.color.blueBright : T.color.textSoft }}>{r.state}</span>
                </span>
              ) },
              { key: "detail", header: "Detail", wrap: true, render: (r) => r.detail },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}

export function AdminCommand({ session }) {
  if (!can(session, "centcom:*")) return <Denied scope="centcom:*" />;
  return (
    <Panel>
      <PanelHeader title="Roles & Scopes" />
      <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginBottom: 12 }}>
        Access is domain-aware. A contractor with one authorized project never inherits CENTCOM authority.
      </div>
      <DataTable
        keyOf={(r) => r.role}
        rows={Object.entries(ROLE_SCOPES).map(([role, scopes]) => ({ role, scopes }))}
        primary="role"
        columns={[
          { key: "role", header: "Role", render: (r) => r.role },
          { key: "scopes", header: "Scopes", wrap: true, render: (r) => (
            <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{r.scopes.join("  •  ")}</span>
          ) },
        ]}
      />
    </Panel>
  );
}
