import React, { useState } from "react";
import T from "../../design/tokens.js";
import centcomApi, { CoreAdapter, CoreReportAdapter } from "../../domains/index.js";
import { PACKET_AUDIENCE } from "../../domains/reports/packet-contract.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  EmptyState, GhostButton, ModuleIntro, ModuleShell, Panel, PanelHeader, Resource,
} from "../../components/common/primitives.jsx";
import { PacketPreview } from "../../components/report/PacketPreview.jsx";

export function ReportsCommand({ navigate, session }) {
  const vp = useViewport();
  const [audience, setAudience] = useState(PACKET_AUDIENCE.PRO);
  const [propertyId, setPropertyId] = useState("SXP-004182");
  const [sourceMode, setSourceMode] = useState("FIXTURE");
  const directory = useResource(() => centcomApi.listPropertySummaries(), []);
  const packet = useResource(
    () => centcomApi.getReportPacket(propertyId, { audience, session, sourceMode }),
    [propertyId, audience, session, sourceMode]
  );
  const grants = useResource(() => centcomApi.listGrants(propertyId), [propertyId]);

  return (
    <ModuleShell title="REPORTS">
      <div className="sx-no-print">
      <Panel>
        <PanelHeader title="Intelligence Outputs" />
        <ModuleIntro purpose="Reports are generated from committed Passport revisions, never from raw evidence. CENTCOM previews the Core instrument-panel contract. Print-to-PDF uses these artboards and is not a Core-generated PDF. Client send uses REPORT-scoped grants only." />
        {!CoreReportAdapter.connected ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderRadius: T.radius.md,
              background: "rgba(251,146,60,0.10)",
              border: "1px solid rgba(251,146,60,0.45)",
              marginBottom: 12,
            }}
          >
            <span aria-hidden="true" style={{ color: T.color.warn }}>▲</span>
            <span style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>
              Core report service not connected. Preview binds Passport / Twin A / measurements / AWE only.
              Missing Core takeoff, openings, and moisture index render as — . This is not a delivered report.
            </span>
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          <GhostButton onClick={() => navigate("/core")}>Check Core service health</GhostButton>
          <span style={{ fontFamily: T.font.mono, fontSize: 11, color: T.color.textMute, alignSelf: "center" }}>
            ENGINE {CoreAdapter.connected ? "UP" : "DISCONNECTED"} · REPORTS {CoreReportAdapter.connected ? "UP" : "DISCONNECTED"}
          </span>
        </div>
        <Resource res={directory} loadingLines={2}>
          {(rows) => (
            <label style={{ display: "block", fontFamily: T.font.body, fontSize: 12, color: T.color.textSoft }}>
              Property
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                style={{
                  display: "block",
                  marginTop: 6,
                  minHeight: T.layout.tap,
                  minWidth: vp.isPhone ? "100%" : 360,
                  background: T.color.inset,
                  color: T.color.text,
                  border: "1px solid " + T.color.edge,
                  borderRadius: T.radius.md,
                  padding: "0 10px",
                }}
              >
                {rows.map((p) => (
                  <option key={p.stratexPropertyId} value={p.stratexPropertyId}>
                    {p.identity?.addressLine1} · {p.stratexPropertyId}
                  </option>
                ))}
              </select>
            </label>
          )}
        </Resource>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {[
            { id: "FIXTURE", label: "Mock job · FIXTURE" },
            { id: "PASSPORT", label: "Passport bind" },
            { id: "VISUAL_CANON", label: "Visual canon layout" },
          ].map((mode) => (
            <GhostButton
              key={mode.id}
              accent={sourceMode === mode.id ? "gold" : "blue"}
              onClick={() => setSourceMode(mode.id)}
            >
              {mode.label}
            </GhostButton>
          ))}
        </div>
      </Panel>
      </div>
      <Panel>
        <div className="sx-no-print">
        <PanelHeader title="Packet preview — pages 2–5" accent="gold" />
        </div>
        <Resource
          res={packet}
          loadingLines={8}
          empty={<EmptyState title="No packet" hint="Property record could not be bound." />}
        >
          {(pkt) => (
            <PacketPreview
              packet={pkt}
              onAudience={setAudience}
              grants={grants.data || []}
            />
          )}
        </Resource>
      </Panel>
    </ModuleShell>
  );
}
