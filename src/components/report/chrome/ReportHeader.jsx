import React from "react";
import T from "../../../design/tokens.js";
import { BRAND } from "../../../design/brand-assets.js";
import { PACKET_CHROME } from "../../../domains/reports/packet-contract.js";
import RT from "../tokens-report.js";
import { MISSING } from "../packet/bindPacket.js";

export function ReportHeader({ title, packageLine, reportId, page, pageCount }) {
  return (
    <header
      style={{
        height: RT.headerH,
        flex: "none",
        display: "grid",
        gridTemplateColumns: "340px 1fr 340px",
        alignItems: "center",
        padding: "0 22px",
        borderBottom: "1px solid " + T.color.packetStrokeHot,
        background: "linear-gradient(180deg,rgba(14,24,42,0.98) 0%,rgba(5,10,18,0.98) 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <img src={BRAND.centcom.src} alt={BRAND.centcom.alt} height={36} style={{ height: 36, width: "auto", display: "block" }} />
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: T.font.display, fontWeight: 700, letterSpacing: "0.18em", fontSize: 22 }}>
            <span style={{ color: T.color.text }}>{PACKET_CHROME.productLeft}</span>
            <span style={{ color: T.color.blueBright }}>{PACKET_CHROME.productRight}</span>
          </div>
          <div
            style={{
              fontFamily: T.font.display,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.34em",
              color: T.color.goldBright,
              marginTop: 2,
            }}
          >
            {PACKET_CHROME.tagline}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: T.font.display,
            fontSize: T.packet.type.title.size,
            fontWeight: 700,
            letterSpacing: T.packet.type.title.track,
            color: T.color.text,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: T.font.display,
            fontSize: RT.kicker.size,
            fontWeight: RT.kicker.weight,
            letterSpacing: RT.kicker.track,
            color: T.color.textMute,
            marginTop: 4,
          }}
        >
          {packageLine}
        </div>
      </div>
      <div
        style={{
          justifySelf: "end",
          minWidth: 220,
          padding: "8px 12px",
          border: "1px solid " + RT.hairline,
          borderRadius: T.radius.md,
          background: T.color.inset,
          boxShadow: T.bevel.sunken,
          fontFamily: T.font.mono,
          fontSize: 11,
          color: T.color.bluePale,
        }}
      >
        <div style={{ letterSpacing: "0.16em", color: T.color.textMute, fontSize: 9 }}>REPORT ID</div>
        <div style={{ marginTop: 3, color: T.color.text }}>{reportId || MISSING}</div>
        <div style={{ marginTop: 4, letterSpacing: "0.14em" }}>
          PAGE {page} OF {pageCount}
        </div>
      </div>
    </header>
  );
}

export default ReportHeader;
