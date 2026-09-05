import React from "react";
import T from "../../design/tokens.js";
import { EXCLUSION_REASON } from "../../domains/reports/manifest.js";
import { displayCell, formatPct } from "../../domains/reports/packet.js";
import { PACKET_TITLES } from "../../domains/reports/packet-contract.js";
import { PacketPage } from "./chrome.jsx";
import { EmptySchedule, ExclusionPlate, Field, InstrumentFrame, ScoreDial } from "./cells.jsx";

export function PageOpeningsEnergy({ packet }) {
  const openings = packet?.openings || { windows: [], doors: [] };
  const energy = packet?.awe?.energy;
  const m = packet?.measurements || {};
  return (
    <PacketPage page={2} packet={packet} title={PACKET_TITLES[2]}>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: T.packet.gutter, height: "100%" }}>
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: T.packet.gutter, minHeight: 0 }}>
          <InstrumentFrame title="C-12 Window schedule">
            {openings.windows?.length ? (
              <ScheduleTable rows={openings.windows} />
            ) : (
              <EmptySchedule noun="window" />
            )}
          </InstrumentFrame>
          <InstrumentFrame title="C-13 Door schedule">
            {openings.doors?.length ? (
              <ScheduleTable rows={openings.doors} />
            ) : (
              <EmptySchedule noun="door" />
            )}
          </InstrumentFrame>
        </div>
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: T.packet.gutter, minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Roof area" value={displayCell(m.roofAreaSqFt)} unit="sq ft" />
            <Field label="Conditioned area" value={displayCell(m.conditionedSqFt)} unit="sq ft" />
            <Field label="South pitch" value={displayCell(m.southPitch)} unit=": 12" />
            <Field label="Year built" value={displayCell(packet?.identity?.yearBuilt)} />
          </div>
          <InstrumentFrame title="C-14 Energy envelope" accent="gold">
            {energy?.score == null && energy?.status === "Not Observed" ? (
              <ExclusionPlate reason={EXCLUSION_REASON.NO_EVIDENCE} />
            ) : (
              <div style={{ display: "flex", gap: 16, height: "100%", alignItems: "center" }}>
                <ScoreDial score={energy?.score} label="ENERGY" fixture={energy?.scoreIsFixture} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.font.display, letterSpacing: "0.16em", color: T.color.gold, fontSize: 12, marginBottom: 8 }}>
                    {energy?.status || "—"} · {formatPct(energy?.score)}
                  </div>
                  <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.color.textSoft, lineHeight: 1.5 }}>
                    {energy?.summary || "—"}
                  </div>
                  {energy?.scoreIsFixture ? (
                    <div style={{ marginTop: 10, fontFamily: T.font.mono, fontSize: 10, color: T.color.medium }}>
                      AWE scores are development fixtures until the scoring engine exists.
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </InstrumentFrame>
        </div>
      </div>
    </PacketPage>
  );
}

function ScheduleTable({ rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.font.body, fontSize: 12 }}>
      <thead>
        <tr style={{ color: T.color.bluePale, letterSpacing: "0.12em", fontFamily: T.font.display, fontSize: 10 }}>
          <th style={{ textAlign: "left", padding: "4px 6px" }}>ID</th>
          <th style={{ textAlign: "left", padding: "4px 6px" }}>NAME</th>
          <th style={{ textAlign: "left", padding: "4px 6px" }}>ZONE</th>
          <th style={{ textAlign: "right", padding: "4px 6px" }}>VALUE</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} style={{ borderTop: "1px solid " + T.color.divider, color: T.color.text }}>
            <td style={{ padding: "6px", fontFamily: T.font.mono, fontSize: 11 }}>{r.id}</td>
            <td style={{ padding: "6px" }}>{r.name}</td>
            <td style={{ padding: "6px", color: T.color.textMute }}>{r.zone || "—"}</td>
            <td style={{ padding: "6px", textAlign: "right", fontFamily: T.font.mono }}>
              {r.value == null ? "—" : r.value} {r.unit || ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
