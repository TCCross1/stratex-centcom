import React from "react";
import T from "../../design/tokens.js";
import { formatPct } from "../../domains/reports/packet.js";
import { PACKET_TITLES } from "../../domains/reports/packet-contract.js";
import { PacketPage } from "./chrome.jsx";
import { InstrumentFrame, ScoreDial } from "./cells.jsx";

export function PageAwe({ packet }) {
  const dims = [
    { key: "air", title: "C-08 AIR", accent: "blue" },
    { key: "water", title: "C-09 WATER", accent: "gold" },
    { key: "energy", title: "C-10 ENERGY", accent: "blue" },
  ];
  return (
    <PacketPage page={3} packet={packet} title={PACKET_TITLES[3]}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: T.packet.gutter, height: "100%" }}>
        {dims.map((d) => {
          const row = packet?.awe?.[d.key] || {};
          return (
            <InstrumentFrame key={d.key} title={d.title} accent={d.accent}>
              <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", gap: 14 }}>
                <ScoreDial score={row.score} label={d.key.toUpperCase()} fixture={row.scoreIsFixture} />
                <div
                  style={{
                    fontFamily: T.font.display,
                    letterSpacing: "0.18em",
                    color: row.status === "Action Required" ? T.color.high : T.color.bluePale,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {row.status || "Not Observed"} · {formatPct(row.score)}
                </div>
                <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.color.textSoft, lineHeight: 1.55, textAlign: "center" }}>
                  {row.summary || "No observation on record."}
                </div>
                {row.changeFromPrior ? (
                  <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textMute }}>{row.changeFromPrior}</div>
                ) : null}
                {row.scoreIsFixture ? (
                  <div style={{ marginTop: "auto", fontFamily: T.font.mono, fontSize: 9, color: T.color.medium, letterSpacing: "0.14em" }}>
                    FIXTURE — NOT A LIVE ENGINE SCORE
                  </div>
                ) : null}
              </div>
            </InstrumentFrame>
          );
        })}
      </div>
    </PacketPage>
  );
}
