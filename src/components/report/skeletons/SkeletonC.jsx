import React from "react";
import T from "../../../design/tokens.js";
import { EXCLUSION_REASON } from "../../../domains/reports/manifest.js";
import { PACKET_AUDIENCE } from "../../../domains/reports/packet-contract.js";
import { ReportPanel } from "../primitives/Panel.jsx";
import { HeroMoney } from "../primitives/HeroMoney.jsx";
import { TakeoffTable } from "../primitives/TakeoffTable.jsx";
import { ExclusionPlate } from "../chrome/ExclusionPlate.jsx";

/** Bid desk — Pro only. Never mount for Habitat. */
export function SkeletonC({ packet }) {
  if (packet?.audience === PACKET_AUDIENCE.HABITAT)
    return <ExclusionPlate reason="Habitat packets never include materials or labor desks." />;
  const est = packet?.estimate || {};
  if (!est.available) {
    return (
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: T.packet.gutter, height: "100%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          <HeroMoney label="Materials" value={est.materials} />
          <HeroMoney label="Labor" value={est.labor} />
          <HeroMoney label="Tax" value={est.tax} />
          <HeroMoney label="Total" value={est.total} gold />
        </div>
        <ReportPanel title="Scope desk" kicker="C-16">
          <ExclusionPlate reason={est.reason || EXCLUSION_REASON.OUTPUT_UNAVAILABLE} />
        </ReportPanel>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: T.packet.gutter, height: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        <HeroMoney label="Materials" value={est.materials} />
        <HeroMoney label="Labor" value={est.labor} />
        <HeroMoney label="Tax" value={est.tax} />
        <HeroMoney label="Total" value={est.total} gold />
      </div>
      <ReportPanel title="Line items" kicker="C-16" accent="gold">
        <TakeoffTable lines={est.lines} />
      </ReportPanel>
    </div>
  );
}
