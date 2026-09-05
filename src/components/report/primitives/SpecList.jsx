import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";
import { CellValue } from "./missing.jsx";

/** C-01 */
export function SpecList({ rows = [] }) {
  return (
    <dl data-c="C-01" style={{ margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            padding: "8px 10px",
            border: "1px solid " + RT.hairline,
            borderRadius: T.radius.md,
            background: T.color.inset,
            boxShadow: T.bevel.sunken,
          }}
        >
          <dt
            style={{
              fontFamily: T.font.display,
              fontSize: RT.kicker.size,
              letterSpacing: RT.kicker.track,
              color: T.color.bluePale,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            {row.label}
          </dt>
          <dd style={{ margin: 0, fontSize: T.packet.type.cell.size }}>
            <CellValue value={row.value} unit={row.unit} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default SpecList;
