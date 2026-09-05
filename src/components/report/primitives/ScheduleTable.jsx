import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";

/** C-21 */
export function ScheduleTable({ rows = [], emptyNoun = "opening" }) {
  if (!rows.length) {
    return (
      <div data-c="C-21" style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textMute, lineHeight: 1.5 }}>
        No verified {emptyNoun} schedule is on this Passport revision.{" "}
        <span style={{ color: T.color.textFaint }}>—</span>
      </div>
    );
  }
  return (
    <table data-c="C-21" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ fontFamily: T.font.display, fontSize: RT.tableHead.size, letterSpacing: RT.tableHead.track, color: T.color.bluePale }}>
          <th style={{ textAlign: "left", padding: 6 }}>ID</th>
          <th style={{ textAlign: "left", padding: 6 }}>NAME</th>
          <th style={{ textAlign: "left", padding: 6 }}>ZONE</th>
          <th style={{ textAlign: "right", padding: 6 }}>VALUE</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id || r.measurementId || i} style={{ background: i % 2 ? T.color.rowWash : "transparent", fontFamily: T.font.body, fontSize: RT.tableCell.size }}>
            <td style={{ padding: 6, fontFamily: T.font.mono }}>{r.id || r.measurementId || "—"}</td>
            <td style={{ padding: 6 }}>{r.name || "—"}</td>
            <td style={{ padding: 6, color: T.color.textMute }}>{r.zone || "—"}</td>
            <td style={{ padding: 6, textAlign: "right", fontFamily: T.font.mono }}>
              {r.value == null ? "—" : r.value} {r.unit || ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
