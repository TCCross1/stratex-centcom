import React, { useState } from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate } from "../../utils/format.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { ATC_STATE } from "../../domains/atc/readiness.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, DataTable, Resource, EmptyState, GhostButton,
  ModuleIntro, ModuleMetrics,
} from "../../components/common/primitives.jsx";
import { AtcStatePill, SourceBadge } from "../../components/atc/AtcShared.jsx";

const ATC_FILTERS = {
  ALL: () => true,
  "REVIEW REQUIRED": (r) => r.atcState === ATC_STATE.NOT_EVALUATED || r.mission.missionState === "ATC_REVIEW",
  READY: (r) => r.atcState === ATC_STATE.READY,
  WARNINGS: (r) => r.atcState === ATC_STATE.READY_WITH_WARNINGS,
  BLOCKED: (r) => r.atcState === ATC_STATE.BLOCKED,
  THERMAL: (r) => ["THERMALSCAN", "AWE_ASSESSMENT", "COMPLETE_PROPERTY_INTELLIGENCE"].includes(r.mission.requestedPackage),
  ACTIVE: (r) => ["LAUNCHED", "CAPTURING"].includes(r.mission.missionState),
  EXCEPTION: (r) => ["ABORTED", "RECAPTURE_REQUIRED", "FAILED"].includes(r.mission.missionState),
};

/**
 * ATC COMMAND
 *
 * ATC decides whether a mission is ready to fly and supervises the operation.
 * It does not own property truth, Passport, Cortex conclusions or Core work.
 */
export function AtcCommand({ navigate }) {
  const queue = useResource(() => centcomApi.getAtcQueue(), []);
  const providers = useResource(() => centcomApi.getProviderHealth(), []);
  const vp = useViewport();
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState(null);

  const evaluate = async (missionId) => {
    setBusy(missionId);
    try { await centcomApi.atcEvaluate(missionId); queue.reload(); }
    finally { setBusy(null); }
  };

  return (
    <>
      <Resource res={queue} loadingLines={1}>
        {(rows) => (
          <ModuleMetrics
            cells={[
              { label: "In Queue", value: rows.length, tone: "info" },
              { label: "Awaiting Review", value: rows.filter(ATC_FILTERS["REVIEW REQUIRED"]).length, tone: "warn" },
              { label: "Ready", value: rows.filter(ATC_FILTERS.READY).length, tone: "ok" },
              { label: "Ready w/ Warnings", value: rows.filter(ATC_FILTERS.WARNINGS).length, tone: "warn" },
              { label: "Blocked", value: rows.filter(ATC_FILTERS.BLOCKED).length, tone: "bad" },
              { label: "Thermal Missions", value: rows.filter(ATC_FILTERS.THERMAL).length, tone: "info" },
              { label: "Active", value: rows.filter(ATC_FILTERS.ACTIVE).length, tone: "ok" },
              { label: "Exceptions", value: rows.filter(ATC_FILTERS.EXCEPTION).length, tone: "bad" },
            ]}
          />
        )}
      </Resource>

      <Panel>
        <PanelHeader
          title="Provider Status"
          action={<GhostButton small onClick={() => navigate(ROUTES.atcDay)}>Day Map</GhostButton>}
        />
        <ModuleIntro purpose="ATC depends on outside systems for weather, airspace, telemetry and launch authorization. None are connected. A fixture provider is not a healthy provider, and this table says so rather than showing green." />
        <Resource res={providers} loadingLines={2}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.id}
              primary="name"
              rows={rows}
              columns={[
                { key: "name", header: "Provider", render: (r) => r.name },
                { key: "mode", header: "Mode", render: (r) => <SourceBadge mode={r.mode} isLive={r.isLive} /> },
                { key: "vendor", header: "Vendor", render: (r) => r.vendor },
                { key: "detail", header: "Detail", wrap: true, render: (r) => r.detail },
              ]}
            />
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader
          title="ATC Mission Queue"
          action={<GhostButton small onClick={() => navigate(ROUTES.atcDay)}>Day Map</GhostButton>}
        />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
          {Object.keys(ATC_FILTERS).map((k) => {
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
          res={queue}
          loadingLines={5}
          empty={<EmptyState title="Nothing in the ATC queue" hint="Missions appear here once they are scheduled." />}
        >
          {(rows) => {
            const filtered = rows.filter(ATC_FILTERS[filter]);
            if (!filtered.length)
              return <EmptyState title={"No missions in " + filter} hint="Choose ALL to see the full queue." />;
            return (
              <DataTable
                keyOf={(r) => r.mission.id}
                primary="id"
                onRowClick={(r) => navigate(ROUTES.atcMission(r.mission.id))}
                rows={filtered}
                columns={[
                  { key: "id", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.mission.id}</span> },
                  { key: "property", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.mission.propertyId}</span> },
                  { key: "when", header: "Scheduled", wrap: true, render: (r) => r.mission.scheduledStart ? shortDate(r.mission.scheduledStart) + " · " + r.mission.timeWindowType : "Not scheduled" },
                  { key: "objective", header: "Objective", render: (r) => r.mission.assessmentObjective.replace(/_/g, " ") },
                  { key: "package", header: "Package", render: (r) => r.mission.requestedPackage.replace(/_/g, " ") },
                  { key: "op", header: "Operator", render: (r) => r.mission.operatorId || "—" },
                  { key: "ac", header: "Aircraft", render: (r) => r.mission.aircraftId || "—" },
                  { key: "atc", header: "ATC State", render: (r) => <AtcStatePill state={r.atcState} small /> },
                  { key: "blocking", header: "Blocking", align: "right", render: (r) => r.blockingCount == null ? "—" : r.blockingCount },
                  { key: "unresolved", header: "Unresolved", align: "right", render: (r) => r.unresolvedCount == null ? "—" : r.unresolvedCount },
                  { key: "thermal", header: "Thermal", render: (r) => r.thermalBand ? r.thermalBand.replace(/_/g, " ") : "—" },
                  { key: "launch", header: "Launch", render: (r) => r.launch.replace(/_/g, " ") },
                  { key: "action", header: "Action", render: (r) => (
                    <GhostButton small onClick={() => evaluate(r.mission.id)}>
                      {busy === r.mission.id ? "Evaluating…" : "Evaluate"}
                    </GhostButton>
                  ) },
                ]}
              />
            );
          }}
        </Resource>
      </Panel>
    </>
  );
}
