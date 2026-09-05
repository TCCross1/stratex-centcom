import React from "react";
import T from "../../../design/tokens.js";

export function ThermalRamp({ ambientF }) {
  const ramp =
    "linear-gradient(90deg," +
    T.packet.thermal.violet +
    "," +
    T.packet.thermal.magenta +
    "," +
    T.packet.thermal.orange +
    "," +
    T.packet.thermal.paleYellow +
    ")";
  return (
    <div data-c="thermal-ramp">
      <div style={{ height: 10, borderRadius: T.radius.pill, background: ramp, boxShadow: T.bevel.sunken }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontFamily: T.font.mono, fontSize: 9, color: T.color.textMute }}>
        <span>40°F</span>
        <span>AMBIENT {ambientF == null ? "—" : ambientF + "°F"}</span>
        <span>120°F</span>
      </div>
    </div>
  );
}
