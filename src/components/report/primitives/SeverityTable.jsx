import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";

/** C-08 */
export function SeverityTable({ rows = [] }) {
  return (
    <table data-c="C-08" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ fontFamily: T.font.display, fontSize: RT.tableHead.size, letterSpacing: RT.tableHead.track, color: T.color.bluePale }}>
          <th style={{ textAlign: "left", padding: 6 }}>FINDING</th>
          <th style={{ textAlign: "left", padding: 6 }}>ZONE</th>
          <th style={{ textAlign: "right", padding: 6 }}>SEV</th>
        </tr>
      </thead>
      <tbody>
        {(rows.length ? rows : [{ title: "—", zone: "—", severity: "—" }]).map((r, i) => (
          <tr key={i} style={{ background: i % 2 ? T.color.rowWash : "transparent", fontFamily: T.font.body, fontSize: RT.tableCell.size }}>
            <td style={{ padding: 6 }}>{r.title || "—"}</td>
            <td style={{ padding: 6, color: T.color.textMute }}>{r.zone || "—"}</td>
            <td style={{ padding: 6, textAlign: "right", fontFamily: T.font.mono }}>{r.severity || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
