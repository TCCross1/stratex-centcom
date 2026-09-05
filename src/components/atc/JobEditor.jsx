import React, { useEffect, useState } from "react";
import T from "../../design/tokens.js";
import { localDateTimeValue } from "../../utils/format.js";
import { GhostButton, Label } from "../common/primitives.jsx";

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <Label style={{ fontSize: 8.5, marginBottom: 6 }}>{label}</Label>
      {children}
    </div>
  );
}

function inputStyle() {
  return {
    width: "100%",
    fontFamily: T.font.body,
    fontSize: 12,
    color: T.color.text,
    background: "rgba(6,12,22,0.9)",
    border: "1px solid " + T.color.edgeBright,
    borderRadius: T.radius.sm,
    outline: "none",
    padding: "8px 11px",
  };
}

export function JobEditor({ pin, onSave, onReschedule, onDelete, onClose, busy, error }) {
  const [form, setForm] = useState({
    jobNumber: pin.jobNumber || "",
    missionType: pin.missionType || "",
    address: pin.address || "",
    circumstance: pin.circumstance || "",
    specialInstructions: pin.specialInstructions || "",
    scheduledStart: localDateTimeValue(pin.scheduledStart),
    scheduledEnd: localDateTimeValue(pin.scheduledEnd),
    lat: pin.lat,
    lng: pin.lng,
  });

  useEffect(() => {
    setForm({
      jobNumber: pin.jobNumber || "",
      missionType: pin.missionType || "",
      address: pin.address || "",
      circumstance: pin.circumstance || "",
      specialInstructions: pin.specialInstructions || "",
      scheduledStart: localDateTimeValue(pin.scheduledStart),
      scheduledEnd: localDateTimeValue(pin.scheduledEnd),
      lat: pin.lat,
      lng: pin.lng,
    });
  }, [pin.missionId, pin.lat, pin.lng, pin.scheduledStart, pin.address, pin.jobNumber]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div style={{
      marginTop: 10,
      padding: 12,
      border: "1px solid " + T.color.edgeHot,
      borderRadius: T.radius.md,
      background: "rgba(8,16,30,0.96)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontFamily: T.font.display, fontSize: 11, letterSpacing: "0.12em", color: T.color.bluePale }}>
          JOB {pin.jobNumber || pin.missionId}
        </div>
        <GhostButton small onClick={onClose}>Close</GhostButton>
      </div>
      <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textFaint, marginBottom: 12 }}>
        {pin.missionId} · {pin.propertyId} · drag the house to move
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Job number">
          <input value={form.jobNumber} onChange={set("jobNumber")} style={inputStyle()} />
        </Field>
        <Field label="Mission type">
          <input value={form.missionType} onChange={set("missionType")} style={inputStyle()} />
        </Field>
      </div>
      <Field label="Address">
        <input value={form.address} onChange={set("address")} style={inputStyle()} />
      </Field>
      <Field label="Circumstance">
        <input value={form.circumstance} onChange={set("circumstance")} style={inputStyle()} />
      </Field>
      <Field label="Special instructions">
        <textarea value={form.specialInstructions} onChange={set("specialInstructions")} style={{ ...inputStyle(), minHeight: 56 }} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Start">
          <input type="datetime-local" value={form.scheduledStart} onChange={set("scheduledStart")} style={inputStyle()} />
        </Field>
        <Field label="End">
          <input type="datetime-local" value={form.scheduledEnd} onChange={set("scheduledEnd")} style={inputStyle()} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Lat">
          <input value={form.lat} onChange={set("lat")} style={inputStyle()} />
        </Field>
        <Field label="Lng">
          <input value={form.lng} onChange={set("lng")} style={inputStyle()} />
        </Field>
      </div>
      {error ? (
        <div style={{ color: T.color.warn, fontFamily: T.font.body, fontSize: 11, marginBottom: 10 }}>{error}</div>
      ) : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <GhostButton small onClick={() => !busy && onSave(form)}>Save</GhostButton>
        <GhostButton small onClick={() => !busy && onReschedule(form)}>Reschedule</GhostButton>
        <GhostButton small onClick={() => !busy && onDelete(pin)}>Delete</GhostButton>
      </div>
    </div>
  );
}
