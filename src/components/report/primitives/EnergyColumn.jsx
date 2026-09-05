import React from "react";
import T from "../../../design/tokens.js";
import { PACKET_AUDIENCE } from "../../../domains/reports/packet-contract.js";
import { ScoreRing } from "./ScoreRing.jsx";
import { ScoreChip } from "./ScoreChip.jsx";
import { ExclusionPlate } from "../chrome/ExclusionPlate.jsx";
import { EXCLUSION_REASON } from "../../../domains/reports/manifest.js";

/** C-22 */
export function EnergyColumn({ energy, audience }) {
  const habitat = audience === PACKET_AUDIENCE.HABITAT;
  if (energy?.score == null && energy?.status === "Not Observed")
    return <ExclusionPlate reason={EXCLUSION_REASON.NO_EVIDENCE} />;
  return (
    <div data-c="C-22" style={{ display: "flex", gap: 16, alignItems: "center", height: "100%" }}>
      <ScoreRing score={energy?.score} label="ENERGY" fixture={energy?.scoreIsFixture} habitat={habitat} />
      <div>
        <ScoreChip score={energy?.score} status={energy?.status} />
        <div style={{ fontFamily: T.font.body, fontSize: 13, color: T.color.textSoft, lineHeight: 1.5, marginTop: 8 }}>
          {energy?.summary || "—"}
        </div>
      </div>
    </div>
  );
}
