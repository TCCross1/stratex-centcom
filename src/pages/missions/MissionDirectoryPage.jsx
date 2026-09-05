import React, { useState } from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate } from "../../utils/format.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { stageByKey } from "../../domains/mission/lifecycle.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, DataTable, Resource, EmptyState, ModuleIntro, ModuleMetrics,
  GhostButton,
} from "../../components/common/primitives.jsx";
import { StateChip } from "../../components/mission/MissionShared.jsx";

const MISSION_FILTERS = {
  ALL: () => true,
  UPCOMING: (m) => m.missionState === "SCHEDULED",
  AUTHORIZATION: (m) => m.missionState === "AUTHORIZATION_PENDING",
  SCHEDULING: (m) => ["CREATED", "SCHEDULING"].includes(m.missionState),
  "ATC REVIEW": (m) => m.missionState === "ATC_REVIEW",
  READY: (m) => m.missionState === "READY",
  ACTIVE: (m) => ["LAUNCHED", "CAPTURING"].includes(m.missionState),
  PROCESSING: (m) => ["DATA_VALIDATION", "PROCESSING", "CORTEX_ANALYSIS", "PASSPORT_SYNC"].includes(m.missionState),
  RECAPTURE: (m) => m.missionState === "RECAPTURE_REQUIRED",
  COMPLETE: (m) => m.missionState === "COMPLETE",
  CANCELLED: (m) => ["CANCELLED", "ABORTED", "FAILED"].includes(m.missionState),
};


const MISSION_SORTS = {
  "Scheduled Time": (a, b) => new Date(a.scheduledStart || 0) - new Date(b.scheduledStart || 0),
  Priority: (a, b) => ["URGENT", "HIGH", "NORMAL", "LOW"].indexOf(a.priority) - ["URGENT", "HIGH", "NORMAL", "LOW"].indexOf(b.priority),
  "Last Updated": (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
  Property: (a, b) => a.propertyId.localeCompare(b.propertyId),
  "Mission State": (a, b) => stageByKey(a.missionState).n - stageByKey(b.missionState).n,
};


export function MissionCommand({ navigate }) {
  const rows = useResource(() => centcomApi.listMissions(), []);
  const sum = useResource(() => centcomApi.getMissionSummary(), []);
  const vp = useViewport();
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState("Scheduled Time");

  return (
    <>
      <Resource res={sum} loadingLines={1}>
        {(s) => (
          <ModuleMetrics
            cells={[
              { label: "Awaiting Authorization", value: s.awaitingAuthorization, tone: s.awaitingAuthorization ? "warn" : "mute" },
              { label: "Upcoming", value: s.upcoming, tone: "info" },
              { label: "ATC Review", value: s.atcReview, tone: s.atcReview ? "warn" : "mute" },
              { label: "Ready", value: s.ready, tone: "ok" },
              { label: "Active", value: s.active, tone: s.active ? "ok" : "mute" },
              { label: "Processing", value: s.processing, tone: "info" },
              { label: "Blocked", value: s.blocked, tone: s.blocked ? "bad" : "ok" },
              { label: "Recapture Required", value: s.recapture, tone: s.recapture ? "warn" : "ok" },
              { label: "Complete", value: s.complete, tone: "mute" },
              { label: "Cancelled", value: s.cancelled, tone: "mute" },
            ]}
          />
        )}
      </Resource>

      <Panel>
        <PanelHeader
          title="Mission Command"
          action={
            <>
            <GhostButton small onClick={() => navigate(ROUTES.board)}>Board</GhostButton>
            <GhostButton small accent="gold" onClick={() => navigate(ROUTES.missionCreate())}>+ Create Mission</GhostButton>
            
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort missions"
              style={{
                fontFamily: T.font.display, fontSize: vp.isPhone ? 16 : 10.5, fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase", color: T.color.textSoft,
                background: "rgba(6,12,22,0.9)", border: "1px solid " + T.color.edgeBright,
                borderRadius: T.radius.sm, padding: vp.isPhone ? "10px 12px" : "6px 9px",
                outline: "none", minHeight: vp.isPhone ? T.layout.tap : undefined,
              }}
            >
              {Object.keys(MISSION_SORTS).map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            </>
          }
        />
        <ModuleIntro purpose="A mission is one Stratex field operation on one property. It may produce captures, evidence, twins, measurements, analyses, findings, Passport revisions and reports — but the property, not the mission, is the durable record." />

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
          {Object.keys(MISSION_FILTERS).map((k) => {
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
          res={rows}
          loadingLines={6}
          empty={<EmptyState title="No missions" hint="Create a mission from a property record to begin the capture lifecycle." />}
        >
          {(list) => {
            const filtered = list.filter(MISSION_FILTERS[filter]).sort(MISSION_SORTS[sort]);
            if (!filtered.length)
              return <EmptyState title={"No missions in " + filter} hint="Choose ALL to see the full queue." />;
            return (
              <>
                <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textFaint, marginBottom: 8 }}>
                  {filtered.length} of {list.length} missions
                </div>
                <DataTable
                  keyOf={(r) => r.id}
                  primary="id"
                  onRowClick={(r) => navigate(ROUTES.mission(r.id))}
                  rows={filtered}
                  columns={[
                    { key: "jobNumber", header: "Job", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.jobNumber || r.id}</span> },
                    { key: "id", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.id}</span> },
                    { key: "property", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.propertyId}</span> },
                    { key: "origin", header: "Origin", render: (r) => r.originType.replace(/_/g, " ") },
                    { key: "objective", header: "Objective", render: (r) => r.assessmentObjective.replace(/_/g, " ") },
                    { key: "package", header: "Package", render: (r) => r.requestedPackage.replace(/_/g, " ") },
                    { key: "window", header: "Scheduled", wrap: true, render: (r) => r.scheduledStart
                      ? shortDate(r.scheduledStart) + " · " + r.timeWindowType
                      : <span style={{ color: T.color.textFaint }}>Not scheduled</span> },
                    { key: "state", header: "Mission State", render: (r) => <StateChip value={r.missionState} /> },
                    { key: "atc", header: "ATC", render: (r) => <StateChip value={r.atcState} small /> },
                    { key: "op", header: "Operator", render: (r) => r.operatorId || <span style={{ color: T.color.textFaint }}>—</span> },
                    { key: "ac", header: "Aircraft", render: (r) => r.aircraftId || <span style={{ color: T.color.textFaint }}>—</span> },
                    { key: "priority", header: "Priority", render: (r) => r.priority },
                    { key: "updated", header: "Updated", render: (r) => relTime(r.updatedAt) },
                  ]}
                />
              </>
            );
          }}
        </Resource>
      </Panel>
    </>
  );
}

/* ---------------------------------------------------------------- detail -- */

