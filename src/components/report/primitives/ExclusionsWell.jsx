import React from "react";
import T from "../../../design/tokens.js";
import { ExclusionPlate } from "../chrome/ExclusionPlate.jsx";

/** C-20 */
export function ExclusionsWell({ reason }) {
  return (
    <div data-c="C-20">
      {reason ? <ExclusionPlate reason={reason} /> : (
        <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textMute }}>No module exclusions on this walk.</div>
      )}
    </div>
  );
}
