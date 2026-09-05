import React from "react";
import T from "../../../design/tokens.js";
import { PACKET_AUDIENCE } from "../../../domains/reports/packet-contract.js";
import { ReportPanel } from "../primitives/Panel.jsx";
import { ScoreRing } from "../primitives/ScoreRing.jsx";
import { ScoreChip } from "../primitives/ScoreChip.jsx";

/** AWE triptych */
export function SkeletonB({ packet }) {
  const habitat = packet?.audience === PACKET_AUDIENCE.HABITAT;
  const dims = [
    { key: "air", title: "AIR", kicker: "C-07" },
    { key: "water", title: "WATER", kicker: "C-07", accent: "gold" },
    { key: "energy", title: "ENERGY", kicker: "C-07" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: T.packet.gutter, height: "100%" }}>
      {dims.map((d) => {
        const row = packet?.awe?.[d.key] || {};
        return (
          <ReportPanel key={d.key} title={d.title} kicker={d.kicker} accent={d.accent}>
            <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", gap: 12 }}>
              <ScoreRing score={row.score} label={d.title} fixture={row.scoreIsFixture} habitat={habitat} />
              <ScoreChip score={row.score} status={row.status} />
              <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.color.textSoft, lineHeight: 1.55, textAlign: "center" }}>
                {row.summary || "No observation on record."}
              </div>
            </div>
          </ReportPanel>
        );
      })}
    </div>
  );
}
