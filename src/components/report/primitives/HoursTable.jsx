import React from "react";
import { TakeoffTable } from "./TakeoffTable.jsx";

/** C-18 Pro */
export function HoursTable({ lines }) {
  return (
    <div data-c="C-18">
      <TakeoffTable lines={lines} />
    </div>
  );
}
