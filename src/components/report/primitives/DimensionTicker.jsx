import React from "react";
import { SpecList } from "./SpecList.jsx";
import { displayCell } from "../../../domains/reports/packet.js";

/** C-06 — Twin A roofGeometry feature totals only. */
export function DimensionTicker({ ticker = {} }) {
  return (
    <div data-c="C-06">
      <SpecList
        rows={[
          { label: "Roof area", value: displayCell(ticker.roofAreaSqFt), unit: "sq ft" },
          { label: "Ridge", value: displayCell(ticker.ridgeLf), unit: "lf" },
          { label: "Eave", value: displayCell(ticker.eaveLf), unit: "lf" },
          { label: "South pitch", value: displayCell(ticker.southPitch), unit: ": 12" },
        ]}
      />
    </div>
  );
}

export default DimensionTicker;
