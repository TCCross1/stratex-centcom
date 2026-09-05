import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";

/** C-24 */
export function PhotoWell({ caption }) {
  return (
    <div
      data-c="C-24"
      style={{
        height: "100%",
        minHeight: 120,
        border: "1px solid " + RT.hairline,
        borderRadius: T.radius.md,
        background: T.color.inset,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: T.color.textFaint,
        fontFamily: T.font.body,
        fontSize: 12,
      }}
    >
      {caption || "No authorized still on this revision."}
    </div>
  );
}
