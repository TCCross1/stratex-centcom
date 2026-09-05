import React from "react";
import { TakeoffTable } from "./TakeoffTable.jsx";

/** C-19 Pro */
export function RateTable({ lines }) {
  return (
    <div data-c="C-19">
      <TakeoffTable lines={lines} />
    </div>
  );
}
