import React from "react";
import T from "../../../design/tokens.js";
import { PACKET_CHROME } from "../../../domains/reports/packet-contract.js";
import RT from "../tokens-report.js";
import { OperatorSeal } from "../primitives/OperatorSeal.jsx";
import { MISSING } from "../packet/bindPacket.js";

function Chamber({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0, padding: "0 8px" }}>
      <div
        style={{
          fontFamily: T.font.display,
          fontSize: RT.kicker.size,
          fontWeight: 700,
          letterSpacing: RT.kicker.track,
          color: T.color.goldBright,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.font.mono,
          fontSize: 10,
          color: T.color.textSoft,
          letterSpacing: "0.06em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value || MISSING}
      </div>
    </div>
  );
}

export function ReportFooterStamps({
  passportSyncedAt,
  nextScanLabel,
  nextScanDetail,
  reviewComplete,
  operator,
}) {
  const values = {
    CUSTODY: reviewComplete ? "REVIEW COMPLETE" : "CHAINED",
    PASSPORT: passportSyncedAt || "SYNC PENDING",
    AI: "CORTEX ASSIST",
    NEXT: nextScanLabel || nextScanDetail,
    PREPARED: operator?.name,
  };
  return (
    <footer
      style={{
        height: RT.footerH,
        flex: "none",
        display: "grid",
        gridTemplateColumns: "1fr 86px",
        borderTop: "1px solid " + T.color.packetStrokeHot,
        background: "linear-gradient(0deg,rgba(14,24,42,0.98),rgba(5,10,18,0.96))",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", alignItems: "center", padding: "0 12px" }}>
        {PACKET_CHROME.chambers.map((c) => (
          <Chamber key={c.key} label={c.label} value={values[c.key]} />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid " + RT.hairline }}>
        <OperatorSeal certId={operator?.certId} />
      </div>
    </footer>
  );
}

export default ReportFooterStamps;
