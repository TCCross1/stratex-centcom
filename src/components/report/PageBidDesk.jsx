import React from "react";
import T from "../../design/tokens.js";
import { EXCLUSION_REASON } from "../../domains/reports/manifest.js";
import { formatMoney } from "../../domains/reports/packet.js";
import { PACKET_AUDIENCE, PACKET_TITLES } from "../../domains/reports/packet-contract.js";
import { PacketPage } from "./chrome.jsx";
import { ExclusionPlate, Field, InstrumentFrame } from "./cells.jsx";

export function PageBidDesk({ packet }) {
  const habitat = packet?.audience === PACKET_AUDIENCE.HABITAT;
  const est = packet?.estimate || {};
  return (
    <PacketPage page={4} packet={packet} title={PACKET_TITLES[4]}>
      {habitat ? (
        <ExclusionPlate reason="Habitat packets never include materials or labor desks." />
      ) : !est.available ? (
        <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: T.packet.gutter, height: "100%" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            <Field label="Materials" value={formatMoney(est.materials)} />
            <Field label="Labor" value={formatMoney(est.labor)} />
            <Field label="Tax" value={formatMoney(est.tax)} />
            <Field label="Total" value={formatMoney(est.total)} />
          </div>
          <InstrumentFrame title="C-16 Scope desk — Core EstimateRevision">
            <ExclusionPlate reason={est.reason || EXCLUSION_REASON.OUTPUT_UNAVAILABLE} />
          </InstrumentFrame>
        </div>
      ) : (
        <DeskBody estimate={est} />
      )}
    </PacketPage>
  );
}

function DeskBody({ estimate }) {
  const lines = estimate.lines || [];
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: T.packet.gutter, height: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        <Field label="Materials" value={formatMoney(estimate.materials)} />
        <Field label="Labor" value={formatMoney(estimate.labor)} />
        <Field label="Tax" value={formatMoney(estimate.tax)} />
        <Field label="Total" value={formatMoney(estimate.total)} />
      </div>
      <InstrumentFrame title="C-16 Line items" accent="gold">
        {lines.length ? (
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.font.body, fontSize: 12 }}>
            <thead>
              <tr style={{ color: T.color.gold, fontFamily: T.font.display, letterSpacing: "0.12em", fontSize: 10 }}>
                <th style={{ textAlign: "left", padding: 6 }}>ASSEMBLY</th>
                <th style={{ textAlign: "right", padding: 6 }}>QTY</th>
                <th style={{ textAlign: "right", padding: 6 }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} style={{ borderTop: "1px solid " + T.color.divider }}>
                  <td style={{ padding: 6 }}>{line.name || "—"}</td>
                  <td style={{ padding: 6, textAlign: "right", fontFamily: T.font.mono }}>{line.qty ?? "—"}</td>
                  <td style={{ padding: 6, textAlign: "right", fontFamily: T.font.mono }}>{formatMoney(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <ExclusionPlate reason={EXCLUSION_REASON.OUTPUT_UNAVAILABLE} />
        )}
      </InstrumentFrame>
    </div>
  );
}
