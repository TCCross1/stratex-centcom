import React from "react";
import { ReportPageShell } from "../chrome/ReportPageShell.jsx";
import { ExclusionPlate } from "../chrome/ExclusionPlate.jsx";
import { shellFromPacket } from "./shellProps.js";

export function PageExclusion({ packet, page = 6, module, reason }) {
  return (
    <ReportPageShell {...shellFromPacket(packet, page, module || "EXCLUDED MODULE")}>
      <ExclusionPlate module={module} reason={reason} />
    </ReportPageShell>
  );
}
