import React from "react";
import T from "../../../design/tokens.js";
import { PACKET_CHROME } from "../../../domains/reports/packet-contract.js";
import RT from "../tokens-report.js";

export function ReportIdentityBar() {
  return (
    <div
      style={{
        height: RT.identityH,
        flex: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        padding: "0 22px",
        borderTop: "1px solid " + RT.hairline,
        background: T.color.blueInk,
        whiteSpace: "nowrap",
        overflow: "hidden",
        fontFamily: T.font.display,
        fontSize: 11,
        letterSpacing: "0.08em",
        fontWeight: 600,
      }}
    >
      <span style={{ color: T.color.text }}>
        {PACKET_CHROME.product}
        <span style={{ color: T.color.textFaint, margin: "0 10px" }}>|</span>
        {PACKET_CHROME.commandLine}
      </span>
      <span style={{ color: T.color.bluePale }}>{PACKET_CHROME.passportLine}</span>
      <span style={{ color: T.color.goldBright }}>{PACKET_CHROME.identityMicro}</span>
    </div>
  );
}

export default ReportIdentityBar;
