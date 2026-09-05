import React from "react";
import T from "../../../design/tokens.js";
import { MISSING } from "../packet/bindPacket.js";

export function Missing() {
  return (
    <span style={{ color: T.color.textFaint, fontFamily: T.font.mono, letterSpacing: "0.08em" }}>{MISSING}</span>
  );
}

export function CellValue({ value, unit }) {
  if (value == null || value === "" || value === MISSING) return <Missing />;
  return (
    <span style={{ color: T.color.text, fontFamily: T.font.display, fontWeight: 700, letterSpacing: "0.04em" }}>
      {value}
      {unit ? <span style={{ color: T.color.textMute, fontWeight: 600, marginLeft: 6 }}>{unit}</span> : null}
    </span>
  );
}
