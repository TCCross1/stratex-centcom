import React, { useState } from "react";
import T from "../../../design/tokens.js";
import { GhostButton } from "../../common/primitives.jsx";

/**
 * Print-to-PDF uses the same artboards. This is not a Core-generated PDF.
 * Client send uses REPORT-scoped ACTIVE grants — no mailer, Core stays disconnected.
 */
export function PacketDelivery({ packet, grants = [], onPrint }) {
  const [log, setLog] = useState(null);
  const reportGrants = (grants || []).filter(
    (g) => g.status === "ACTIVE" && Array.isArray(g.scope) && g.scope.includes("REPORT")
  );
  const idn = packet?.identity || {};

  function printPacket() {
    if (onPrint) onPrint();
    window.print();
  }

  function recordSend(grant) {
    setLog({
      at: new Date().toISOString(),
      grantId: grant.grantId,
      recipient: grant.recipient,
      organization: grant.organization,
      reportId: packet?.reportId,
      propertyId: idn.propertyId,
      note: "Authorization recorded. No delivery service is connected.",
    });
  }

  return (
    <div className="sx-no-print" style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <GhostButton accent="gold" onClick={printPacket}>
          Download PDF · print
        </GhostButton>
        <span style={{ fontFamily: T.font.mono, fontSize: 11, color: T.color.textMute }}>
          Browser print-to-PDF of these artboards. Not a Core-generated PDF.
        </span>
      </div>
      <div
        style={{
          padding: 12,
          border: "1px solid " + T.color.edge,
          borderRadius: T.radius.md,
          background: T.color.inset,
        }}
      >
        <div
          style={{
            fontFamily: T.font.display,
            letterSpacing: "0.16em",
            fontSize: 11,
            color: T.color.goldBright,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          SEND TO AUTHORIZED CLIENTS
        </div>
        {!reportGrants.length ? (
          <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textMute }}>
            No ACTIVE grant with REPORT scope on this property. CENTCOM will not invent a mailer.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {reportGrants.map((g) => (
              <div key={g.grantId} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.text }}>
                  {g.recipient} · {g.organization} · {g.grantId}
                </span>
                <GhostButton small onClick={() => recordSend(g)}>
                  Record send intent
                </GhostButton>
              </div>
            ))}
          </div>
        )}
        {log ? (
          <div style={{ marginTop: 10, fontFamily: T.font.mono, fontSize: 11, color: T.color.ok, lineHeight: 1.45 }}>
            {log.grantId} · {log.recipient} · {log.reportId} · {log.note}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default PacketDelivery;
