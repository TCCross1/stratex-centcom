import React, { useState } from "react";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { can } from "../../domains/shared/rbac.js";
import { STATE_TONE } from "../../domains/shared/states.js";
import { relTime, shortDate } from "../../utils/format.js";
import { useResource, useViewport } from "../../app/hooks.js";
import { DataTable, EmptyState, Fact, GhostButton, Label, ModuleIntro, Panel, PanelHeader, Resource, SeverityPill, StatusDot } from "../common/primitives.jsx";
import { PropertyRealityViewer, VIEWER_LAYERS } from "../reality/PropertyRealityViewer.jsx";

export function IdentityVaultPanel({ propertyId }) {
  const res = useResource(() => centcomApi.listOwnership(), [propertyId]);
  return (
    <Panel>
      <PanelHeader title="Identity Vault — Ownership" accent="gold" />
      <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginBottom: 12 }}>
        Ownership is an association, not a property attribute. Access changes on transfer. Property history does not.
      </div>
      <Resource res={res} loadingLines={2}>
        {(rows) => (
          <DataTable
            keyOf={(r) => r.id}
            rows={rows}
            primary="name"
            columns={[
              { key: "rel", header: "Relation", render: (r) => r.relation },
              { key: "name", header: "Party", render: (r) => r.displayName },
              { key: "from", header: "From", render: (r) => r.from },
              { key: "to", header: "To", render: (r) => r.to || <span style={{ color: T.color.ok }}>Current</span> },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}

export function TwinPanel({ propertyId }) {
  const res = useResource(() => centcomApi.listTwins(propertyId), [propertyId]);
  const fx = useResource(() => centcomApi.listFindings(propertyId), [propertyId]);
  const vp = useViewport();
  const [selected, setSelected] = useState(null);
  const [layer, setLayer] = useState("twin");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader
          title="Property Reality Twin"
          action={
            <GhostButton small onClick={() => {}} accent="blue">
              Compare versions — unavailable
            </GhostButton>
          }
        />
        <Resource
          res={res}
          loadingLines={4}
          empty={
            <EmptyState
              title="No reality twin for this property yet"
              hint="A twin is generated from validated capture evidence. This property has no completed, validated mission, so no geometry exists to show. Nothing is hidden — there is nothing yet."
            />
          }
        >
          {(rows) => {
            const current = rows.find((r) => r.id === selected) || rows.find((r) => r.isCurrent) || rows[0];
            return (
              <>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
                  {rows.map((r) => {
                    const on = r.id === current.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelected(r.id)}
                        aria-pressed={on}
                        style={{
                          cursor: "pointer", padding: vp.isPhone ? "9px 12px" : "6px 11px",
                          minHeight: vp.isPhone ? 38 : undefined, borderRadius: T.radius.sm,
                          fontFamily: T.font.display, fontSize: 10.5, fontWeight: 700,
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          color: on ? "#FFFFFF" : T.color.textMute,
                          background: on ? "linear-gradient(180deg,rgba(30,107,255,0.34),rgba(10,24,48,0.9))" : "transparent",
                          border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                          boxShadow: on ? T.glow.blueSoft : "none",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        {r.version}
                        {r.isCurrent ? " • Current" : ""}
                      </button>
                    );
                  })}
                </div>

                <div style={{ height: vp.isPhone ? 200 : 300, marginBottom: 12 }}>
                  <PropertyRealityViewer
                    propertyId={propertyId}
                    activeLayer={layer}
                    scanProgress={100}
                    findings={fx.data || []}
                  />
                </div>

                <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 12 }}>
                  {VIEWER_LAYERS.map((lyr) => {
                    const on = lyr.key === layer;
                    return (
                      <button
                        key={lyr.key}
                        onClick={() => setLayer(lyr.key)}
                        aria-pressed={on}
                        style={{
                          flex: "none", whiteSpace: "nowrap", cursor: "pointer",
                          padding: vp.isPhone ? "9px 12px" : "6px 11px",
                          minHeight: vp.isPhone ? 38 : undefined, borderRadius: T.radius.sm,
                          fontFamily: T.font.display, fontSize: 10, fontWeight: 700,
                          letterSpacing: "0.1em", textTransform: "uppercase",
                          color: on ? "#FFFFFF" : T.color.textMute,
                          background: on ? "linear-gradient(180deg,rgba(30,107,255,0.34),rgba(10,24,48,0.9))" : "transparent",
                          border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        {lyr.label}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
                  <Fact label="Version" value={current.version} />
                  <Fact label="Generated" value={shortDate(current.generatedAt)} />
                  <Fact label="Source Mission" value={current.sourceMissionId} mono />
                  <Fact label="Capture Method" value={current.captureMethod} />
                  <Fact label="Reason" value={current.reason} />
                  <Fact label="Status" value={current.isCurrent ? "Current" : "Superseded"} tone={current.isCurrent ? "ok" : undefined} />
                  <Fact label="Supersedes" value={current.supersedes || "— first version"} mono />
                  <Fact label="Notes" value={current.notes || "—"} />
                  <Fact label="Master Artifact" value={current.projections.master} />
                  <Fact label="Core Projection" value={current.projections.core} />
                  <Fact label="Cortex Projection" value={current.projections.cortex} />
                  <Fact label="Habitat Projection" value={current.projections.habitat} />
                </div>
              </>
            );
          }}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Version History" />
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginBottom: 12 }}>
          A rescan adds a version. It never replaces one. Temporal comparison depends on every version surviving.
        </div>
        <Resource res={res} loadingLines={3} empty={<EmptyState title="No versions" hint="Version history begins with the first validated capture." />}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.id}
              primary="v"
              onRowClick={(r) => setSelected(r.id)}
              rows={rows}
              columns={[
                { key: "v", header: "Version", render: (r) => (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontFamily: T.font.display, fontWeight: 700, color: T.color.text }}>{r.version}</span>
                    {r.isCurrent && <SeverityPill severity="low" />}
                  </span>
                ) },
                { key: "when", header: "Generated", render: (r) => shortDate(r.generatedAt) },
                { key: "mission", header: "Source Mission", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.sourceMissionId}</span> },
                { key: "method", header: "Capture Method", wrap: true, render: (r) => r.captureMethod },
                { key: "why", header: "Reason", wrap: true, render: (r) => r.reason },
                { key: "master", header: "Master", align: "right", render: (r) => r.projections.master },
                { key: "core", header: "Core Proj.", align: "right", render: (r) => r.projections.core },
                { key: "cortex", header: "Cortex Proj.", align: "right", render: (r) => r.projections.cortex },
                { key: "habitat", header: "Habitat Proj.", align: "right", render: (r) => r.projections.habitat },
              ]}
            />
          )}
        </Resource>
      </Panel>
    </div>
  );
}

/** Property systems index (§37). Fixture-backed until Passport serves it. */
export function SystemsHealthGrid({ propertyId }) {
  const res = useResource(() => centcomApi.listPropertySystems(propertyId), [propertyId]);
  const vp = useViewport();
  return (
    <Resource res={res} loadingLines={3} empty={<EmptyState title="No systems recorded" hint="Systems appear once a capture has been processed into the property record." />}>
      {(rows) => (
        <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(3,1fr)", gap: 9 }}>
          {rows.map((r) => {
            const c = STATE_TONE[r.tone];
            return (
              <div
                key={r.id}
                style={{
                  padding: "10px 11px", borderRadius: T.radius.sm,
                  background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                  border: "1px solid " + T.color.edge, boxShadow: T.bevel.tile,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span aria-hidden="true" style={{ color: c, fontSize: 9 }}>{r.mark}</span>
                  <Label style={{ fontSize: 8.5, color: T.color.textSoft }}>{r.name}</Label>
                </div>
                <div style={{ fontFamily: T.font.display, fontSize: 11, fontWeight: 700, color: c, marginTop: 5 }}>
                  {r.status}
                </div>
                <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textFaint, marginTop: 3 }}>
                  Observed {relTime(r.lastObserved)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Resource>
  );
}

export function SharingSummaryPanel({ propertyId, openTab }) {
  const res = useResource(() => centcomApi.listGrants(propertyId), [propertyId]);
  return (
    <Panel>
      <PanelHeader
        title="Who Has Access"
        action={<GhostButton small onClick={() => openTab("Sharing")}>Manage</GhostButton>}
      />
      <Resource res={res} loadingLines={2} empty={<EmptyState title="No active grants" hint="Nobody outside Stratex can currently see this property record." />}>
        {(rows) => (
          <div>
            {rows.map((g) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 2px", borderBottom: "1px solid rgba(22,38,60,0.7)" }}>
                <StatusDot state={g.state === "active" ? "ok" : "offline"} size={6} />
                <span style={{ flex: 1, minWidth: 0, fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft }}>
                  {g.grantee}
                </span>
                <span style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textFaint, whiteSpace: "nowrap" }}>
                  {g.state === "active" ? "expires " + shortDate(g.expiresAt) : g.state}
                </span>
              </div>
            ))}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

export function TimelinePanel({ full }) {
  const res = useResource(() => centcomApi.listTimeline(), []);
  const [domain, setDomain] = useState("All");
  return (
    <Panel>
      <PanelHeader title="Property Timeline" />
      {full && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          {Object.keys(TIMELINE_DOMAINS).map((k) => {
            const on = k === domain;
            return (
              <button
                key={k}
                onClick={() => setDomain(k)}
                aria-pressed={on}
                style={{
                  cursor: "pointer", padding: "7px 11px", minHeight: 34, borderRadius: T.radius.pill,
                  fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700,
                  letterSpacing: "0.11em", textTransform: "uppercase",
                  color: on ? "#FFFFFF" : T.color.textMute,
                  background: on ? "rgba(30,107,255,0.30)" : "transparent",
                  border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                {k}
              </button>
            );
          })}
        </div>
      )}
      <Resource res={res} loadingLines={4} empty={<EmptyState title="Timeline empty" hint="Timeline events are appended, never rewritten." />}>
        {(rows) => (
          <div style={{ position: "relative", paddingLeft: 16 }}>
            <span style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: "linear-gradient(180deg," + T.color.blue + ",transparent)" }} />
            {(full ? rows.filter(TIMELINE_DOMAINS[domain]) : rows.slice(0, 5)).map((e) => (
              <div key={e.id} style={{ position: "relative", padding: "8px 0" }}>
                <span style={{ position: "absolute", left: -16, top: 13, width: 7, height: 7, borderRadius: "50%", background: T.color.blueBright, boxShadow: T.glow.blueSoft }} />
                <div style={{ fontFamily: T.font.mono, fontSize: 9.5, letterSpacing: "0.08em", color: T.color.blueBright }}>
                  {e.type}
                </div>
                <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginTop: 3 }}>
                  {e.detail}
                </div>
                <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textFaint, marginTop: 2 }}>
                  {shortDate(e.at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

export const TIMELINE_DOMAINS = {
  All: () => true,
  Missions: (t) => t.type.startsWith("MISSION") || t.type.startsWith("CAPTURE") || t.type.includes("RESCANNED"),
  Evidence: (t) => t.type.startsWith("EVIDENCE"),
  Cortex: (t) => t.type.startsWith("CORTEX") || t.type.startsWith("FINDING") || t.type.startsWith("TWIN"),
  Passport: (t) => t.type.startsWith("PASSPORT") || t.type.startsWith("PROPERTY_CREATED"),
  Work: (t) => t.type.startsWith("REPAIR") || t.type.startsWith("PROJECT") || t.type.startsWith("COMPLETION"),
  Access: (t) => t.type.includes("AUTHORIZED") || t.type.includes("OWNERSHIP") || t.type.includes("NOTIFIED"),
};

export function SharingPanel({ propertyId, navigate }) {
  const grants = useResource(() => centcomApi.listGrants(propertyId), [propertyId]);
  const owners = useResource(() => centcomApi.listOwnership(propertyId), [propertyId]);
  const vp = useViewport();
  const tone = { ACTIVE: T.color.ok, PENDING: T.color.blueBright, EXPIRED: T.color.textFaint, REVOKED: T.color.high };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="Access & Sharing" accent="gold" />
        <ModuleIntro purpose="A grant gives a named person at a named organization a specific slice of this property, for a stated purpose, until a stated date. It is not ownership, and it never confers authority to write to Passport." />
        <Resource
          res={grants}
          loadingLines={3}
          empty={<EmptyState title="No grants issued" hint="Nobody outside Stratex has been given access to this property record." />}
        >
          {(rows) => (
            <DataTable
              keyOf={(r) => r.grantId}
              primary="organization"
              rows={rows}
              columns={[
                { key: "grantId", header: "Grant", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.grantId}</span> },
                { key: "organization", header: "Organization", wrap: true, render: (r) => (
                  <span>{r.organization}<span style={{ color: T.color.textMute }}>{" — " + r.recipient}</span></span>
                ) },
                { key: "role", header: "Role", render: (r) => r.role.replace(/_/g, " ") },
                { key: "scope", header: "Scope", wrap: true, render: (r) => (
                  <span style={{ fontFamily: T.font.mono, fontSize: 9.5, color: T.color.bluePale }}>{r.scope.join(" · ")}</span>
                ) },
                { key: "purpose", header: "Purpose", wrap: true, render: (r) => r.purpose },
                { key: "status", header: "Status", render: (r) => (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: tone[r.status] }}>
                    <span aria-hidden="true">{r.status === "ACTIVE" ? "●" : r.status === "PENDING" ? "◐" : r.status === "REVOKED" ? "✕" : "○"}</span>
                    {r.status}
                  </span>
                ) },
                { key: "granted", header: "Granted", render: (r) => shortDate(r.grantedAt) },
                { key: "expires", header: "Expires", render: (r) => shortDate(r.expiresAt) },
                { key: "revoked", header: "Revoked", render: (r) => r.revokedAt ? shortDate(r.revokedAt) : "—" },
                { key: "access", header: "Access History", wrap: true, render: (r) => r.accessCount
                  ? r.accessCount + " views · last " + relTime(r.lastAccessedAt)
                  : "Never accessed" },
              ]}
            />
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Ownership Relationships" />
        <ModuleIntro purpose="Ownership is an association between a property and a party, with a start and an end. A transfer ends one relationship and begins another — it never erases the property's history. Party identity lives in the Identity Vault; only the reference appears here." />
        <Resource
          res={owners}
          loadingLines={2}
          empty={<EmptyState title="No ownership on record" hint="No party has been associated with this property yet." />}
        >
          {(rows) => (
            <DataTable
              keyOf={(r) => r.relationshipId}
              primary="displayName"
              rows={rows}
              columns={[
                { key: "relationshipId", header: "Relationship", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.relationshipId}</span> },
                { key: "type", header: "Type", render: (r) => r.relationshipType },
                { key: "displayName", header: "Party", render: (r) => r.displayName },
                { key: "partyId", header: "Identity Ref.", render: (r) => (
                  <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textMute }}>{r.partyId}</span>
                ) },
                { key: "start", header: "From", render: (r) => r.startDate },
                { key: "end", header: "To", render: (r) => r.endDate || <span style={{ color: T.color.ok }}>Current</span> },
              ]}
            />
          )}
        </Resource>
      </Panel>
    </div>
  );
}

export function AuditPanel({ propertyId }) {
  const res = useResource(() => centcomApi.getAudit(propertyId), [propertyId]);
  const [domain, setDomain] = useState("ALL");
  const DOMAINS = ["ALL", "PROPERTY", "MISSION", "EVIDENCE", "CORTEX", "PASSPORT", "CORE", "PRO", "HABITAT", "SHARING", "ADMIN"];

  return (
    <Panel>
      <PanelHeader title="Audit Trail" />
      <ModuleIntro purpose="Every change to canonical truth records who made it, what changed, and what it changed from. Sensitive values are referenced by ID rather than inlined." />
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {DOMAINS.map((d) => {
          const on = d === domain;
          return (
            <button
              key={d}
              onClick={() => setDomain(d)}
              aria-pressed={on}
              style={{
                cursor: "pointer", padding: "7px 10px", minHeight: 34, borderRadius: T.radius.pill,
                fontFamily: T.font.display, fontSize: 9, fontWeight: 700, letterSpacing: "0.11em",
                color: on ? "#FFFFFF" : T.color.textMute,
                background: on ? "rgba(30,107,255,0.30)" : "transparent",
                border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
              }}
            >
              {d}
            </button>
          );
        })}
      </div>
      <Resource
        res={res}
        loadingLines={4}
        empty={<EmptyState title="No audit records" hint="No recorded action has touched this property yet." />}
      >
        {(rows) => {
          const filtered = domain === "ALL" ? rows : rows.filter((e) => e.domain === domain);
          if (!filtered.length)
            return <EmptyState title="No events in this domain" hint="Choose ALL to see the full trail." />;
          return (
            <DataTable
              keyOf={(r) => r.auditId}
              primary="action"
              rows={filtered}
              columns={[
                { key: "at", header: "When", render: (r) => relTime(r.at) },
                { key: "actor", header: "Actor", render: (r) => (
                  <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.actor}
                    <span style={{ color: T.color.textFaint }}>{" (" + r.actorType.toLowerCase() + ")"}</span>
                  </span>
                ) },
                { key: "domain", header: "Domain", render: (r) => r.domain },
                { key: "action", header: "Action", render: (r) => (
                  <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{r.action}</span>
                ) },
                { key: "object", header: "Object", render: (r) => r.objectType + " " + r.objectId },
                { key: "prev", header: "Previous", render: (r) => r.previousState || "—" },
                { key: "next", header: "New", render: (r) => r.newState || "—" },
                { key: "reason", header: "Reason", wrap: true, render: (r) => r.reason },
                { key: "src", header: "Source", render: (r) => (
                  <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.sourceSystem}</span>
                ) },
              ]}
            />
          );
        }}
      </Resource>
    </Panel>
  );
}

