import React from "react";
import T from "../../../design/tokens.js";
import { HexShell } from "../../brand/StratexBrand.jsx";

/** C-23 */
export function OperatorSeal({ certId }) {
  return (
    <div data-c="C-23" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <HexShell id={"seal-" + (certId || "op")} size={48} glyph="core" accent="gold" />
      <div style={{ fontFamily: T.font.mono, fontSize: 8, color: T.color.goldBright, letterSpacing: "0.12em", marginTop: 2 }}>
        {certId || "—"}
      </div>
    </div>
  );
}
