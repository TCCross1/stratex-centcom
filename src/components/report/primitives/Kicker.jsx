import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";

export function Kicker({ children, gold = false }) {
  return (
    <div
      style={{
        fontFamily: T.font.display,
        fontSize: RT.kicker.size,
        fontWeight: RT.kicker.weight,
        letterSpacing: RT.kicker.track,
        color: gold ? T.color.goldBright : T.color.bluePale,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

export default Kicker;
