import React, { useEffect, useState } from "react";
import T from "../../../design/tokens.js";
import { PACKET_AUDIENCE, PACKET_TITLES } from "../../../domains/reports/packet-contract.js";
import { PacketStage } from "../chrome/ReportPageShell.jsx";
import { PacketPageView, PacketWalk } from "../pages/PacketWalk.jsx";
import { PacketDelivery } from "./PacketDelivery.jsx";

export function ReportPreview({ packet, onAudience, grants = [], fixtureLabel = true }) {
  const pages = packet?.pages?.length ? packet.pages : [2, 3, 4, 5];
  const pageKey = pages.join(",");
  const [page, setPage] = useState(pages[0]);
  useEffect(() => {
    const next = pageKey.split(",").map(Number);
    if (!next.includes(page)) setPage(next[0]);
  }, [pageKey, page]);
  const shown = pages.includes(page) ? page : pages[0];
  const visual = packet?.sourceMode === "VISUAL_CANON";
  const fixture = packet?.sourceMode === "FIXTURE" || visual;

  return (
    <div>
      <div className="sx-no-print">
        {fixtureLabel && fixture ? (
          <div
            style={{
              marginBottom: 10,
              padding: "8px 12px",
              border: "1px solid " + T.color.goldDeep,
              borderRadius: T.radius.md,
              fontFamily: T.font.display,
              letterSpacing: "0.18em",
              fontWeight: 700,
              color: T.color.goldBright,
              fontSize: 12,
            }}
          >
            {visual ? packet?.banner || "VISUAL CANON FIXTURE — NOT PROPERTY TRUTH" : "REPORT PREVIEW · FIXTURE"}
          </div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              style={{
                minHeight: T.layout.tap,
                padding: "0 14px",
                borderRadius: T.radius.md,
                border: "1px solid " + (shown === p ? T.color.edgeHot : T.color.edge),
                background: shown === p ? T.metal.railSelected : T.color.panel,
                color: T.color.text,
                fontFamily: T.font.display,
                letterSpacing: "0.12em",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {p} · {PACKET_TITLES[p] || (p === 1 ? "COVER" : "PAGE")}
            </button>
          ))}
          {onAudience ? (
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {[PACKET_AUDIENCE.PRO, PACKET_AUDIENCE.HABITAT].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => onAudience(a)}
                  style={{
                    minHeight: T.layout.tap,
                    padding: "0 12px",
                    borderRadius: T.radius.md,
                    border: "1px solid " + (packet?.audience === a ? T.color.gold : T.color.edge),
                    background: T.color.panel,
                    color: packet?.audience === a ? T.color.gold : T.color.textSoft,
                    fontFamily: T.font.display,
                    letterSpacing: "0.14em",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {a}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <PacketDelivery packet={packet} grants={grants} />
        {(packet?.lint || []).length ? (
          <div style={{ marginBottom: 10, fontFamily: T.font.mono, fontSize: 11, color: T.color.warn }}>
            LINT {packet.lint.map((i) => i.code).join(" · ")}
          </div>
        ) : null}
      </div>
      <PacketStage className="sx-no-print">
        <PacketPageView packet={packet} page={shown} />
      </PacketStage>
      <div className="sx-print-only">
        <PacketWalk packet={packet} pages={pages} />
      </div>
    </div>
  );
}

export default ReportPreview;
