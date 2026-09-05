import React, { useState } from "react";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { ROUTES } from "../../app/router/routes.js";
import { parseOpsQuery, localDateKey } from "../../domains/ops/calendar.js";
import { localClock } from "../../utils/format.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Resource, EmptyState, GhostButton, ModuleIntro, Fact, DataTable,
} from "../../components/common/primitives.jsx";
import { SourceBadge } from "../../components/atc/AtcShared.jsx";
import { CityMap } from "../../components/atc/CityMap.jsx";
import { JobEditor } from "../../components/atc/JobEditor.jsx";

function toIsoLocal(value) {
  if (!value) return null;
  if (/T/.test(value) && value.length === 16) return value + ":00";
  return value;
}

export function AtcDayMap({ route, navigate }) {
  const { date, city } = parseOpsQuery(route);
  const focus = date || "2026-08-30";
  const cityName = city || "Lexington";
  const vp = useViewport();
  const [opacity, setOpacity] = useState(0.55);
  const [fleetNote, setFleetNote] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const res = useResource(() => centcomApi.getAtcDayMap({ date: focus, city: cityName }), [focus, cityName]);

  const refresh = () => res.reload && res.reload();

  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const saveJob = (pin, form) => run(async () => {
    await centcomApi.updateMission(pin.missionId, {
      jobNumber: form.jobNumber,
      missionType: form.missionType,
      specialInstructions: form.specialInstructions,
      knownIssues: form.circumstance
        ? [{ id: "KI-OPS", issue: form.circumstance, reportedBy: "OPERATOR", location: null, severity: null, notes: "Ops edit." }]
        : [],
    });
    await centcomApi.updatePropertyIdentity(pin.propertyId, {
      addressLine1: form.address,
      lat: Number(form.lat),
      lng: Number(form.lng),
    });
  });

  const rescheduleJob = (pin, form) => run(async () => {
    const start = toIsoLocal(form.scheduledStart);
    const end = toIsoLocal(form.scheduledEnd);
    await centcomApi.rescheduleMission(pin.missionId, { start, end });
    const nextDate = localDateKey(start);
    if (nextDate && nextDate !== focus) {
      setSelectedId(null);
      navigate(ROUTES.atcDayDate(nextDate, cityName));
    }
  });

  const deleteJob = (pin) => run(async () => {
    await centcomApi.removeMission(pin.missionId, { reason: "Removed from ATC day routing." });
    setSelectedId(null);
  });

  const moveJob = (pin, ll) => run(async () => {
    await centcomApi.updatePropertyIdentity(pin.propertyId, { lat: ll.lat, lng: ll.lng });
  });

  return (
    <Resource res={res} loadingLines={6} label="Opening ATC day map">
      {(map) => {
        const hours = map.hourly?.unavailable ? [] : (map.hourly?.hours || []);
        const wx = map.weatherSnapshot;
        const selected = (map.pins || []).concat(map.unplaced || []).find((p) => p.missionId === selectedId) || null;
        return (
          <>
            <Panel>
              <PanelHeader
                title="ATC Day Map"
                action={<SourceBadge mode={map.providerMode} isLive={wx?.isLive} />}
              />
              <ModuleIntro purpose="Primary ops map. House pins need property coordinates. Drag a house to relocate. Edit, reschedule, or delete a job and routing updates immediately. Trucks need a live FleetProvider fix. Cloud and precip tiles come from RainViewer — no invented Doppler sweep." />
              <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
                <Fact label="Date" value={map.date} mono />
                <Fact label="City" value={wx?.cityLabel || "LEX, KY"} />
                <Fact label="Jobs" value={String((map.pins || []).length + (map.unplaced || []).length)} />
                <Fact label="Basemap" value="MapLibre · OpenFreeMap Liberty" />
              </div>
            </Panel>

            <Panel pad={10}>
              <PanelHeader title="City map" />
              <CityMap
                center={map.center}
                pins={map.pins}
                trucks={map.trucks}
                radarOverlay={map.radarOverlay}
                radarClouds={map.radarClouds}
                radarOpacity={opacity}
                height={vp.isPhone ? 320 : 560}
                onHouse={(pin) => { setSelectedId(pin.missionId); setError(null); }}
                onHouseMove={(pin, ll) => moveJob(pin, ll)}
                onTruck={(truck) => setFleetNote(truck.vehicleId + " · " + (truck.asOf || "no asOf"))}
              />
              {fleetNote ? (
                <div style={{ marginTop: 8, fontFamily: T.font.mono, fontSize: 11, color: T.color.goldBright }}>{fleetNote}</div>
              ) : null}
              {selected ? (
                <JobEditor
                  pin={selected}
                  busy={busy}
                  error={error}
                  onClose={() => setSelectedId(null)}
                  onSave={(form) => saveJob(selected, form)}
                  onReschedule={(form) => rescheduleJob(selected, form)}
                  onDelete={() => deleteJob(selected)}
                />
              ) : (
                <div style={{ marginTop: 8, fontFamily: T.font.body, fontSize: 11, color: T.color.textMute }}>
                  Click a house to edit the job. Drag it to move the pin.
                </div>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Day jobs" />
              {!map.pins.length && !map.unplaced.length ? (
                <EmptyState title="No jobs on this day" hint="Create or reschedule a mission onto this date." />
              ) : (
                <DataTable
                  keyOf={(r) => r.missionId}
                  primary="jobNumber"
                  onRowClick={(r) => setSelectedId(r.missionId)}
                  rows={(map.pins || []).concat(map.unplaced || [])}
                  columns={[
                    { key: "jobNumber", header: "Job", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.jobNumber}</span> },
                    { key: "missionId", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.missionId}</span> },
                    { key: "address", header: "Address", render: (r) => r.address || "—" },
                    { key: "circumstance", header: "Circumstance", wrap: true, render: (r) => r.circumstance || "—" },
                    { key: "scheduledStart", header: "Start", render: (r) => localClock(r.scheduledStart) },
                  ]}
                />
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Hourly forecast" />
              {map.hourly?.unavailable || !hours.length ? (
                <EmptyState title="FORECAST UNAVAILABLE" hint="Disconnected or missing fields never render as clear skies." />
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 8 }}>
                  {hours.map((h) => (
                    <div key={h.hour} style={{ border: "1px solid " + T.color.edge, borderRadius: T.radius.sm, padding: 10 }}>
                      <div style={{ fontFamily: T.font.mono, fontSize: 11, color: T.color.bluePale }}>{h.hour}</div>
                      <div style={{ fontFamily: T.font.body, fontSize: 12, marginTop: 4 }}>{h.tempF}° · {h.rainChancePct}%{h.storms ? " · storms" : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel>
              <PanelHeader title="Radar" />
              {map.radarOverlay || map.radarClouds ? (
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: T.font.mono, fontSize: 11, color: T.color.bluePale }}>
                  Opacity
                  <input type="range" min="0" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
                  {Math.round(opacity * 100)}%
                  <span style={{ color: T.color.textMute }}>{map.radar?.status || "RADAR TILES"}</span>
                </label>
              ) : (
                <EmptyState
                  title={map.radar?.status || "RADAR DISCONNECTED"}
                  hint="Cloud and precip tiles are absent unless RainViewer answers. CENTCOM never draws a fake Doppler sweep."
                />
              )}
            </Panel>

            <Panel>
              <PanelHeader title="NO_COORDINATES" />
              {!map.unplaced.length ? (
                <EmptyState title="Every mission on this day has coordinates" hint="Pins only render when lat/lng exist." />
              ) : (
                <DataTable
                  keyOf={(r) => r.missionId}
                  primary="missionId"
                  onRowClick={(r) => setSelectedId(r.missionId)}
                  rows={map.unplaced}
                  columns={[
                    { key: "missionId", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.missionId}</span> },
                    { key: "propertyId", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.propertyId}</span> },
                    { key: "city", header: "City", render: (r) => r.city || "—" },
                    { key: "reason", header: "Reason", render: (r) => r.reason },
                  ]}
                />
              )}
            </Panel>
            <GhostButton small onClick={() => navigate(ROUTES.atc)}>ATC Command</GhostButton>
          </>
        );
      }}
    </Resource>
  );
}
