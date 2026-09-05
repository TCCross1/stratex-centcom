import React from "react";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { ROUTES } from "../../app/router/routes.js";
import { monthGrid, parseOpsQuery } from "../../domains/ops/calendar.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Resource, EmptyState, GhostButton, ModuleIntro, Fact, DataTable,
} from "../../components/common/primitives.jsx";
import { SourceBadge } from "../../components/atc/AtcShared.jsx";
import { StateChip } from "../../components/mission/MissionShared.jsx";
import { WeatherGlyph } from "../../components/ops/WeatherGlyph.jsx";
import { SeasonalMonthBanner } from "../../components/ops/SeasonalMonthBanner.jsx";

function chipText(forecast) {
  if (!forecast || forecast.unavailable || forecast.rainChancePct == null) return "UNAVAILABLE";
  return `${forecast.rainChancePct}% · ${forecast.tempHi}/${forecast.tempLo}${forecast.storms ? " · storms" : ""}`;
}

export function MissionBoard({ route, navigate }) {
  const { date, city } = parseOpsQuery(route);
  const focus = date || "2026-08-30";
  const cityName = city || "Lexington";
  const vp = useViewport();
  const res = useResource(() => centcomApi.getMissionBoard({ date: focus, city: cityName }), [focus, cityName]);

  return (
    <Resource res={res} loadingLines={6} label="Opening mission board">
      {(board) => {
        const cells = monthGrid(board.month);
        const dayMissions = board.days[focus] || [];
        const forecast = board.forecasts[focus];
        return (
          <>
            <Panel>
              <PanelHeader
                title="Mission Board"
                action={<SourceBadge mode={board.providerMode} isLive={board.weatherSnapshot?.isLive} />}
              />
              <ModuleIntro purpose="Read-only calendar of scheduled missions. Weather is the ATC city snapshot. The Board never creates a mission." />
              <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
                <Fact label="City" value={board.city} />
                <Fact label="Selected" value={focus} mono />
                <Fact label="Weather" value={board.providerMode} />
                <Fact label="Snapshot" value={board.weatherSnapshot?.cityLabel || "LEX, KY"} />
              </div>
            </Panel>

            <Panel>
              <SeasonalMonthBanner month={board.month} monthName={board.monthName} compact={vp.isPhone} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 6 }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} style={{ fontFamily: T.font.display, fontSize: 9, letterSpacing: "0.12em", color: T.color.textFaint, textAlign: "center" }}>{d}</div>
                ))}
                {cells.map((key, i) => {
                  if (!key) return <div key={"pad-" + i} style={{ minHeight: vp.isPhone ? 96 : 118 }} />;
                  const on = key === focus;
                  const count = (board.days[key] || []).length;
                  const wx = board.forecasts[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => navigate(ROUTES.boardDay(key, board.city))}
                      style={{
                        textAlign: "left", cursor: "pointer", minHeight: vp.isPhone ? 96 : 118, padding: 8,
                        borderRadius: T.radius.md,
                        border: "1px solid " + (on ? "rgba(30,107,255,0.55)" : T.color.edge),
                        background: on ? "rgba(30,107,255,0.18)" : T.color.inset,
                        color: T.color.text,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontFamily: T.font.mono, fontSize: 12 }}>{Number(key.slice(-2))}</div>
                        <WeatherGlyph icon={wx?.unavailable ? null : wx?.icon} size={22} />
                      </div>
                      <div style={{ fontFamily: T.font.mono, fontSize: 11, color: wx?.unavailable ? T.color.warn : T.color.text, marginTop: 6 }}>
                        {wx?.unavailable ? "—" : (wx.tempHi + "° / " + wx.tempLo + "°")}
                      </div>
                      <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textMute, marginTop: 4 }}>
                        {count ? count + " job" + (count === 1 ? "" : "s") : " "}
                      </div>
                      <div style={{ fontFamily: T.font.mono, fontSize: 9, color: wx?.unavailable ? T.color.warn : T.color.bluePale, marginTop: 2 }}>
                        {wx?.unavailable ? "UNAVAILABLE" : (wx.rainChancePct + "%")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel>
              <PanelHeader title={"Missions · " + focus} />
              <div style={{ fontFamily: T.font.mono, fontSize: 11, color: forecast?.unavailable ? T.color.warn : T.color.bluePale, marginBottom: 12 }}>
                {chipText(forecast)}
              </div>
              {!dayMissions.length ? (
                <EmptyState title="No scheduled missions this day" hint="Unscheduled work stays off the Board. Nothing is invented here." />
              ) : (
                <DataTable
                  keyOf={(r) => r.missionId}
                  primary="missionId"
                  onRowClick={(r) => navigate(ROUTES.mission(r.missionId))}
                  rows={dayMissions}
                  columns={[
                    { key: "jobNumber", header: "Job", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.jobNumber}</span> },
                    { key: "missionId", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.missionId}</span> },
                    { key: "scheduledStart", header: "Start", render: (r) => new Date(r.scheduledStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
                    { key: "address", header: "Address", wrap: true, render: (r) => r.address || "—" },
                    { key: "circumstance", header: "Circumstance", wrap: true, render: (r) => r.circumstance || "—" },
                    { key: "city", header: "City", render: (r) => r.city || "—" },
                    { key: "propertyId", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.propertyId}</span> },
                    { key: "missionType", header: "Type", wrap: true, render: (r) => r.missionType },
                    { key: "missionState", header: "State", render: (r) => <StateChip value={r.missionState} small /> },
                  ]}
                />
              )}
            </Panel>
            <GhostButton small onClick={() => navigate(ROUTES.missions)}>Mission Command</GhostButton>
          </>
        );
      }}
    </Resource>
  );
}
