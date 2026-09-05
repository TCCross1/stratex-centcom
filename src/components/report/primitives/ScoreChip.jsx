import React from "react";
import T from "../../../design/tokens.js";
import { MISSING } from "../packet/bindPacket.js";

/** C-13 */
export function ScoreChip({ score, status }) {
  return (
    <span
      data-c="C-13"
      style={{
        display: "inline-flex",
        gap: 8,
        alignItems: "center",
        fontFamily: T.font.display,
        letterSpacing: "0.16em",
        fontSize: 12,
        fontWeight: 700,
        color: status === "Action Required" ? T.color.high : T.color.bluePale,
      }}
    >
      {status || "Not Observed"} · {score == null ? MISSING : Math.round(score) + "/100"}
    </span>
  );
}

export default ScoreChip;
