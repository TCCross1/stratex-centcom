import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";

/** C-03 */
export function TwinWell({ label, children }) {
  return (
    <div
      data-c="C-03"
      style={{
        height: "100%",
        minHeight: 220,
        border: "1px solid " + RT.hairline,
        borderRadius: T.radius.md,
        background:
          "repeating-linear-gradient(135deg, rgba(30,107,255,0.05) 0 12px, rgba(5,10,18,0.4) 12px 24px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        textAlign: "center",
        padding: 16,
      }}
    >
      <div style={{ fontFamily: T.font.display, letterSpacing: "0.22em", color: T.color.bluePale, fontSize: 12 }}>
        {label || "TWIN A · RGB MESH"}
      </div>
      <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textSoft, maxWidth: 460, lineHeight: 1.5 }}>
        Mesh is not embedded in CENTCOM. Twin B is never the ruler for area, pitch, or length.
      </div>
      {children}
    </div>
  );
}

export default TwinWell;
