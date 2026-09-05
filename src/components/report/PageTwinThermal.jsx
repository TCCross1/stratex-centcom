import React from "react";
import T from "../../design/tokens.js";
import { EXCLUSION_REASON } from "../../domains/reports/manifest.js";
import { displayCell } from "../../domains/reports/packet.js";
import { PACKET_TITLES } from "../../domains/reports/packet-contract.js";
import { PacketPage } from "./chrome.jsx";
import { ExclusionPlate, Field, InstrumentFrame } from "./cells.jsx";

export function PageTwinThermal({ packet }) {
  const m = packet?.measurements || {};
  const th = packet?.thermal || {};
  const idn = packet?.identity || {};
  return (
    <PacketPage page={5} packet={packet} title={PACKET_TITLES[5]}>
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: T.packet.gutter, height: "100%" }}>
        <InstrumentFrame title="C-01 Twin A · RGB mesh (authorized projection)">
          <div
            style={{
              height: "100%",
              minHeight: 360,
              border: "1px solid " + T.color.packetStroke,
              borderRadius: T.radius.md,
              background:
                "repeating-linear-gradient(135deg, rgba(30,107,255,0.05) 0 12px, rgba(5,10,18,0.4) 12px 24px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              textAlign: "center",
              padding: 20,
            }}
          >
            <div style={{ fontFamily: T.font.display, letterSpacing: "0.22em", color: T.color.bluePale, fontSize: 12 }}>
              REALITY PROJECTION · {idn.twinVersion || "—"}
            </div>
            <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.color.textSoft, maxWidth: 420, lineHeight: 1.5 }}>
              Mesh is not embedded in CENTCOM. Twin B imagery is never the official area. Official plane IDs come from
              Core / Reality when connected.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 520, marginTop: 12 }}>
              <Field label="Roof area" value={displayCell(m.roofAreaSqFt)} unit="sq ft" />
              <Field label="Ridge" value={displayCell(m.ridgeLf)} unit="lf" />
              <Field label="South pitch" value={displayCell(m.southPitch)} unit=": 12" />
              <Field label="Eave" value={displayCell(m.eaveLf)} unit="lf" />
            </div>
          </div>
        </InstrumentFrame>
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: T.packet.gutter, minHeight: 0 }}>
          <InstrumentFrame title="C-02 Thermal instrument" accent="gold">
            {th.coreMoistureIndex == null ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
                <ExclusionPlate
                  reason={
                    "No Core moisture index on this revision. Cortex finding is shown as intelligence, not as a Core formula output."
                  }
                />
                {th.cortexFindingId ? (
                  <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textSoft, lineHeight: 1.5 }}>
                    <div style={{ fontFamily: T.font.mono, color: T.color.gold, marginBottom: 6 }}>{th.cortexFindingId}</div>
                    {th.title}
                    <div style={{ marginTop: 6, color: T.color.textMute }}>{th.detail}</div>
                    <div style={{ marginTop: 8, fontFamily: T.font.mono, fontSize: 10, color: T.color.textFaint }}>
                      {th.zone || "—"} · {th.truthClassification || "—"} · conf{" "}
                      {th.cortexConfidence == null ? "—" : Math.round(th.cortexConfidence * 100) + "%"}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: T.color.textMute, fontSize: 12 }}>{EXCLUSION_REASON.NO_EVIDENCE}</div>
                )}
              </div>
            ) : (
              <Field label="Core moisture index" value={th.coreMoistureIndex + "/100"} />
            )}
          </InstrumentFrame>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field
              label="Saturated area"
              value={displayCell(m.saturatedSqFt)}
              unit="sq ft"
              hint={m.saturatedTruth ? String(m.saturatedTruth) : "PROBABLE if present"}
            />
            <Field label="Ambient at capture" value={displayCell(m.ambientF)} unit="°F" />
          </div>
        </div>
      </div>
    </PacketPage>
  );
}
