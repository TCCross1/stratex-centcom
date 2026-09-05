import React from "react";
import T from "../../../design/tokens.js";
import { displayCell } from "../../../domains/reports/packet.js";
import { ReportPanel } from "../primitives/Panel.jsx";
import { ScheduleTable } from "../primitives/ScheduleTable.jsx";
import { EnergyColumn } from "../primitives/EnergyColumn.jsx";
import { SpecList } from "../primitives/SpecList.jsx";

/** Schedule + energy */
export function SkeletonD({ packet }) {
  const openings = packet?.openings || { windows: [], doors: [] };
  const m = packet?.measurements || {};
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: T.packet.gutter, height: "100%" }}>
      <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: T.packet.gutter, minHeight: 0 }}>
        <ReportPanel title="Window schedule" kicker="C-21">
          <ScheduleTable rows={openings.windows} emptyNoun="window" />
        </ReportPanel>
        <ReportPanel title="Door schedule" kicker="C-21">
          <ScheduleTable rows={openings.doors} emptyNoun="door" />
        </ReportPanel>
      </div>
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr", gap: T.packet.gutter, minHeight: 0 }}>
        <SpecList
          rows={[
            { label: "Roof area", value: displayCell(m.roofAreaSqFt), unit: "sq ft" },
            { label: "Conditioned area", value: displayCell(m.conditionedSqFt), unit: "sq ft" },
            { label: "South pitch", value: displayCell(m.southPitch), unit: ": 12" },
            { label: "Year built", value: displayCell(packet?.identity?.yearBuilt) },
          ]}
        />
        <ReportPanel title="Energy envelope" kicker="C-22" accent="gold">
          <EnergyColumn energy={packet?.awe?.energy} audience={packet?.audience} />
        </ReportPanel>
      </div>
    </div>
  );
}
