import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";

/** C-10 */
export function AssemblyCutaway({ caption }) {
  return (
    <div
      data-c="C-10"
      style={{
        minHeight: 88,
        border: "1px solid " + RT.hairline,
        borderRadius: T.radius.md,
        background: T.color.inset,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: T.color.textMute,
        fontFamily: T.font.body,
        fontSize: 12,
      }}
    >
      {caption || "No assembly cutaway on this revision."}
    </div>
  );
}
