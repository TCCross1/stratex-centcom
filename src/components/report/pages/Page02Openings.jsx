import React from "react";
import { PACKET_TITLES } from "../../../domains/reports/packet-contract.js";
import { ReportPageShell } from "../chrome/ReportPageShell.jsx";
import { SkeletonD } from "../skeletons/SkeletonD.jsx";
import { shellFromPacket } from "./shellProps.js";

export function Page02Openings({ packet }) {
  return (
    <ReportPageShell {...shellFromPacket(packet, 2, PACKET_TITLES[2])}>
      <SkeletonD packet={packet} />
    </ReportPageShell>
  );
}
