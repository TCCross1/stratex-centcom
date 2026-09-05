import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";
import { formatMoney } from "../../../domains/reports/packet.js";

/** C-16 Pro */
export function TakeoffTable({ lines = [] }) {
  return (
    <table data-c="C-16" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ fontFamily: T.font.display, fontSize: RT.tableHead.size, letterSpacing: RT.tableHead.track, color: T.color.bluePale }}>
          <th style={{ textAlign: "left", padding: 6 }}>ASSEMBLY</th>
          <th style={{ textAlign: "right", padding: 6 }}>QTY</th>
          <th style={{ textAlign: "right", padding: 6 }}>AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        {(lines.length ? lines : [{ name: "—", qty: null, amount: null }]).map((line, i) => (
          <tr key={i} style={{ background: i % 2 ? T.color.rowWash : "transparent", fontFamily: T.font.body, fontSize: RT.tableCell.size }}>
            <td style={{ padding: 6 }}>{line.name || "—"}</td>
            <td style={{ padding: 6, textAlign: "right", fontFamily: T.font.mono }}>{line.qty == null ? "—" : line.qty}</td>
            <td style={{ padding: 6, textAlign: "right", fontFamily: T.font.mono }}>{formatMoney(line.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
