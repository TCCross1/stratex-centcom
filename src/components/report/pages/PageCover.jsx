import React from "react";
import T from "../../../design/tokens.js";
import { PACKET_CHROME, PACKET_PACKAGE } from "../../../domains/reports/packet-contract.js";
import { ReportPageShell } from "../chrome/ReportPageShell.jsx";
import { shellFromPacket } from "./shellProps.js";
import { SourcesChecklist } from "../primitives/SourcesChecklist.jsx";

export function PageCover({ packet }) {
  const idn = packet?.identity || {};
  return (
    <ReportPageShell {...shellFromPacket(packet, 1, "PROPERTY INTELLIGENCE COVER")}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: T.packet.gutter, height: "100%" }}>
        <div>
          <div style={{ fontFamily: T.font.display, fontSize: 36, fontWeight: 700, letterSpacing: "0.06em" }}>
            {idn.addressLine1 || "—"}
          </div>
          <div style={{ fontFamily: T.font.body, fontSize: 16, color: T.color.textSoft, marginTop: 8 }}>{idn.cityLine || "—"}</div>
          <div style={{ fontFamily: T.font.mono, fontSize: 13, color: T.color.bluePale, marginTop: 18 }}>
            {idn.propertyId || "—"} · {idn.passportId || "—"} · {idn.revision || "—"}
          </div>
          <div style={{ marginTop: 28, fontFamily: T.font.display, letterSpacing: "0.2em", color: T.color.goldBright }}>
            {PACKET_PACKAGE}
          </div>
          <div style={{ marginTop: 8, color: T.color.textMute }}>{PACKET_CHROME.tagline}</div>
        </div>
        <SourcesChecklist
          items={[
            { id: "p", label: "Passport revision", ok: !!idn.revision },
            { id: "t", label: "Twin A geometry", ok: !!(packet?.ticker?.source || idn.twinVersion) },
            { id: "c", label: "Core estimate", ok: !!packet?.estimate?.available },
            {
              id: "s",
              label:
                packet?.sourceMode === "VISUAL_CANON"
                  ? "VISUAL CANON — NOT PROPERTY TRUTH"
                  : "Source " + (packet?.sourceMode || "PASSPORT"),
              ok: packet?.sourceMode !== "VISUAL_CANON",
            },
          ]}
        />
      </div>
    </ReportPageShell>
  );
}
