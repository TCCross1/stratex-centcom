import React from "react";
import { PACKET_TITLES } from "../../../domains/reports/packet-contract.js";
import { ReportPageShell } from "../chrome/ReportPageShell.jsx";
import { SkeletonA } from "../skeletons/SkeletonA.jsx";
import { shellFromPacket } from "./shellProps.js";

export function Page05TwinThermal({ packet }) {
  return (
    <ReportPageShell {...shellFromPacket(packet, 5, PACKET_TITLES[5])}>
      <SkeletonA packet={packet} />
    </ReportPageShell>
  );
}
