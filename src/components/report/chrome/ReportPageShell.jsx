import React from "react";
import T from "../../../design/tokens.js";
import { PACKET_PACKAGE, PACKET_TITLES } from "../../../domains/reports/packet-contract.js";
import RT from "../tokens-report.js";
import { ReportHeader } from "./ReportHeader.jsx";
import { ReportFooterStamps } from "./ReportFooterStamps.jsx";
import { ReportIdentityBar } from "./ReportIdentityBar.jsx";

export function ReportPageShell({
  title,
  packageLine,
  reportId,
  page,
  pageCount = 27,
  passportSyncedAt,
  nextScanLabel,
  nextScanDetail,
  reviewComplete = false,
  operator,
  children,
}) {
  return (
    <article
      className="sx-packet-page"
      data-packet-page={page}
      style={{
        width: RT.artboardW,
        height: RT.artboardH,
        background: RT.abyss,
        color: T.color.text,
        display: "flex",
        flexDirection: "column",
        boxShadow: T.bevel.panel,
        overflow: "hidden",
        outline: "1px solid " + RT.innerStroke,
        outlineOffset: -1,
      }}
    >
      <ReportHeader
        title={title || PACKET_TITLES[page] || "INTELLIGENCE PACKET"}
        packageLine={packageLine || PACKET_PACKAGE}
        reportId={reportId}
        page={page}
        pageCount={pageCount}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: RT.pad,
          background: "radial-gradient(80% 70% at 50% 0%, rgba(30,107,255,0.10), transparent 60%), " + T.color.hull,
        }}
      >
        {children}
      </div>
      <ReportFooterStamps
        passportSyncedAt={passportSyncedAt}
        nextScanLabel={nextScanLabel}
        nextScanDetail={nextScanDetail}
        reviewComplete={reviewComplete}
        operator={operator}
      />
      <ReportIdentityBar />
    </article>
  );
}

export function PacketStage({ children, className }) {
  return (
    <div className={className} style={{ width: "100%", overflow: "auto", background: T.color.void, padding: 16 }}>
      <div style={{ width: RT.artboardW, margin: "0 auto" }}>{children}</div>
    </div>
  );
}

export default ReportPageShell;
