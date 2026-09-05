import React, { useEffect, useState } from "react";
import T from "../../design/tokens.js";
import { localDateTimeValue } from "../../utils/format.js";
import { ROUTES } from "../../app/router/routes.js";
import { localDateKey } from "../../domains/ops/calendar.js";
import centcomApi from "../../domains/index.js";
import { useResource } from "../../app/hooks.js";
import { Panel, PanelHeader, Label, GhostButton, ModuleIntro } from "../common/primitives.jsx";

function fieldStyle() {
  return {
    width: "100%", fontFamily: T.font.body, fontSize: 12, color: T.color.text,
    background: "rgba(6,12,22,0.9)", border: "1px solid " + T.color.edgeBright,
    borderRadius: T.radius.sm, outline: "none", padding: "8px 11px",
  };
}

function toIso(value) {
  if (!value) return null;
  if (/T/.test(value) && value.length === 16) return value + ":00";
  return value;
}

function circumstanceOf(m) {
  return Array.isArray(m.knownIssues) && m.knownIssues[0] ? m.knownIssues[0].issue : "";
}

function formFrom(m, identity = {}) {
  return {
    jobNumber: m.jobNumber || "",
    missionType: m.missionType || "",
    circumstance: circumstanceOf(m),
    specialInstructions: m.specialInstructions || "",
    scheduledStart: localDateTimeValue(m.scheduledStart),
    scheduledEnd: localDateTimeValue(m.scheduledEnd),
    address: identity.addressLine1 || "",
    lat: identity.lat ?? "",
    lng: identity.lng ?? "",
  };
}

/** Ops routing editor on Mission Detail. Same writes as ATC Day Map JobEditor. */
export function MissionRouting({ detail: d, navigate, vp, onChanged }) {
  const m = d.mission;
  const propRes = useResource(
    () => centcomApi.getProperty(m.propertyId).catch(() => null),
    [m.propertyId]
  );
  const identity = propRes.data?.identity || {};
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(() => formFrom(m, identity));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    setForm(formFrom(m, identity));
  }, [m.id, m.jobNumber, m.scheduledStart, m.scheduledEnd, identity.addressLine1, identity.lat, identity.lng]);

  const run = async (fn) => {
    setBusy(true); setError(null);
    try {
      await fn();
      if (onChanged) onChanged();
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const cols = vp.isPhone ? "1fr" : "1fr 1fr";

  return (
    <Panel>
      <PanelHeader title="Job routing" />
      <ModuleIntro purpose="Edit job number, circumstance, window, address, or pin. Save, reschedule, move, and delete write through MissionService / PropertyService so Board and ATC Day Map follow." />
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 10 }}>
        <div>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Job number</Label>
          <input value={form.jobNumber} onChange={set("jobNumber")} style={fieldStyle()} />
        </div>
        <div>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Mission type</Label>
          <input value={form.missionType} onChange={set("missionType")} style={fieldStyle()} />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Address</Label>
        <input value={form.address} onChange={set("address")} style={fieldStyle()} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Circumstance</Label>
        <input value={form.circumstance} onChange={set("circumstance")} style={fieldStyle()} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Special instructions</Label>
        <textarea value={form.specialInstructions} onChange={set("specialInstructions")} style={{ ...fieldStyle(), minHeight: 56 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 10, marginTop: 10 }}>
        <div>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Start</Label>
          <input type="datetime-local" value={form.scheduledStart} onChange={set("scheduledStart")} style={fieldStyle()} />
        </div>
        <div>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>End</Label>
          <input type="datetime-local" value={form.scheduledEnd} onChange={set("scheduledEnd")} style={fieldStyle()} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: 10, marginTop: 10 }}>
        <div>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Lat</Label>
          <input value={form.lat} onChange={set("lat")} style={fieldStyle()} />
        </div>
        <div>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Lng</Label>
          <input value={form.lng} onChange={set("lng")} style={fieldStyle()} />
        </div>
      </div>
      {error ? <div style={{ marginTop: 10, fontFamily: T.font.body, fontSize: 11, color: T.color.high }}>{error}</div> : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <GhostButton small onClick={() => !busy && run(async () => {
          await centcomApi.updateMission(m.id, {
            jobNumber: form.jobNumber,
            missionType: form.missionType,
            specialInstructions: form.specialInstructions,
            knownIssues: form.circumstance
              ? [{ id: "KI-OPS", issue: form.circumstance, reportedBy: "OPERATOR", location: null, severity: null, notes: "Ops edit." }]
              : [],
          });
          await centcomApi.updatePropertyIdentity(m.propertyId, {
            addressLine1: form.address,
            lat: form.lat === "" ? null : Number(form.lat),
            lng: form.lng === "" ? null : Number(form.lng),
          });
        })}>Save job</GhostButton>
        <GhostButton small onClick={() => !busy && run(async () => {
          await centcomApi.rescheduleMission(m.id, { start: toIso(form.scheduledStart), end: toIso(form.scheduledEnd) });
        })}>Reschedule</GhostButton>
        <GhostButton small onClick={() => !busy && run(async () => {
          await centcomApi.removeMission(m.id, { reason: "Removed from ops routing." });
          navigate(ROUTES.missions);
        })}>Delete job</GhostButton>
        <GhostButton small onClick={() => navigate(ROUTES.atcDayDate(localDateKey(toIso(form.scheduledStart) || m.scheduledStart) || "2026-08-30"))}>
          Open on map
        </GhostButton>
      </div>
    </Panel>
  );
}
