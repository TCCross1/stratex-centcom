import React from "react";
import T from "../../../design/tokens.js";

/** C-02 */
export function ConfidenceChip({ value, gold = false }) {
  const missing = value == null;
  return (
    <span
      data-c="C-02"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 8px",
        borderRadius: T.radius.sm,
        border: "1px solid " + (gold ? T.color.goldDeep : T.color.packetStroke),
        fontFamily: T.font.mono,
        fontSize: 10,
        color: gold ? T.color.goldBright : T.color.bluePale,
        letterSpacing: "0.08em",
      }}
    >
      CONF {missing ? "—" : Math.round((value <= 1 ? value * 100 : value)) + "%"}
    </span>
  );
}

export default ConfidenceChip;
