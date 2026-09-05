import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";
import { formatMoney } from "../../../domains/reports/packet.js";
import { Kicker } from "./Kicker.jsx";

/** C-17 Pro */
export function HeroMoney({ label, value, gold = false }) {
  const shown = formatMoney(value);
  return (
    <div data-c="C-17">
      <Kicker gold={gold}>{label}</Kicker>
      <div
        style={{
          fontFamily: T.font.display,
          fontSize: RT.heroMoney.size,
          fontWeight: RT.heroMoney.weight,
          letterSpacing: RT.heroMoney.track,
          color: shown === "—" ? T.color.textFaint : T.color.text,
          marginTop: 4,
        }}
      >
        {shown}
      </div>
    </div>
  );
}
