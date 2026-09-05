import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";

export function ExclusionPlate({ reason, module }) {
  return (
    <div
      data-c="exclusion"
      style={{
        height: "100%",
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        border: "1px dashed " + RT.hairline,
        borderRadius: RT.radius,
        background: "rgba(3,6,12,0.55)",
        textAlign: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: T.font.display,
          letterSpacing: "0.22em",
          fontSize: 11,
          color: T.color.gold,
          fontWeight: 700,
        }}
      >
        MODULE EXCLUDED
      </div>
      {module ? (
        <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale, letterSpacing: "0.12em" }}>
          {module}
        </div>
      ) : null}
      <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textSoft, maxWidth: 420, lineHeight: 1.45 }}>
        {reason || "Not included in this packet."}
      </div>
    </div>
  );
}

export default ExclusionPlate;
