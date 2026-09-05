import React from "react";
import T from "../../../design/tokens.js";
import { EXCLUSION_REASON } from "../../../domains/reports/manifest.js";
import { ReportPanel } from "../primitives/Panel.jsx";
import { TwinWell } from "../primitives/TwinWell.jsx";
import { DimensionTicker } from "../primitives/DimensionTicker.jsx";
import { ThermalRamp } from "../primitives/ThermalRamp.jsx";
import { ConfidenceChip } from "../primitives/ConfidenceChip.jsx";
import { RecRow } from "../primitives/RecRow.jsx";
import { ExclusionPlate } from "../chrome/ExclusionPlate.jsx";
import { PhotoWell } from "../primitives/PhotoWell.jsx";

/** Twin + analysis */
export function SkeletonA({ packet }) {
  const th = packet?.thermal || {};
  const m = packet?.measurements || {};
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: T.packet.gutter, height: "100%" }}>
      <ReportPanel title="Twin A · RGB mesh" kicker="C-03">
        <TwinWell label={"REALITY PROJECTION · " + (packet?.identity?.twinVersion || "—")}>
          <DimensionTicker ticker={packet?.ticker || m} />
        </TwinWell>
      </ReportPanel>
      <div style={{ display: "grid", gridTemplateRows: "1fr auto auto", gap: T.packet.gutter, minHeight: 0 }}>
        <ReportPanel title="Thermal instrument" kicker="C-02" accent="gold">
          {th.coreMoistureIndex == null ? (
            <div>
              <ExclusionPlate reason="No Core moisture index on this revision. Cortex finding is intelligence, not a Core formula output." />
              {th.cortexFindingId ? (
                <div style={{ marginTop: 10 }}>
                  <ConfidenceChip value={th.cortexConfidence} gold />
                  <RecRow title={th.cortexFindingId + " · " + (th.title || "")} detail={th.detail} />
                </div>
              ) : (
                <div style={{ marginTop: 8, color: T.color.textMute, fontSize: 12 }}>{EXCLUSION_REASON.NO_EVIDENCE}</div>
              )}
            </div>
          ) : (
            <div style={{ fontFamily: T.font.display, fontSize: 28 }}>{th.coreMoistureIndex}/100</div>
          )}
        </ReportPanel>
        <ThermalRamp ambientF={m.ambientF} />
        <PhotoWell caption="Authorized still withheld — originals live in the vault." />
      </div>
    </div>
  );
}
