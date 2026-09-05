import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";

/** C-12 */
export function RecRow({ title, detail }) {
  return (
    <div data-c="C-12" style={{ padding: "8px 0", borderBottom: "1px solid " + T.color.divider }}>
      <div style={{ fontFamily: T.font.display, fontSize: RT.section.size, letterSpacing: "0.08em", color: T.color.text }}>
        {title || "—"}
      </div>
      <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textSoft, lineHeight: 1.45, marginTop: 4 }}>
        {detail || "—"}
      </div>
    </div>
  );
}
