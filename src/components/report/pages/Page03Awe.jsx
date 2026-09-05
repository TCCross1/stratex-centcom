import React from "react";
import { PACKET_TITLES } from "../../../domains/reports/packet-contract.js";
import { ReportPageShell } from "../chrome/ReportPageShell.jsx";
import { SkeletonB } from "../skeletons/SkeletonB.jsx";
import { shellFromPacket } from "./shellProps.js";

export function Page03Awe({ packet }) {
  return (
    <ReportPageShell {...shellFromPacket(packet, 3, PACKET_TITLES[3])}>
      <SkeletonB packet={packet} />
    </ReportPageShell>
  );
}
