import React from "react";
import { SeverityTable } from "./SeverityTable.jsx";

/** C-14 */
export function ConditionMatrix({ rows }) {
  return (
    <div data-c="C-14">
      <SeverityTable rows={rows} />
    </div>
  );
}
