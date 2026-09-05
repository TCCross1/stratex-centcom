import React from "react";
import { PACKET_AUDIENCE, PACKET_TITLES } from "../../../domains/reports/packet-contract.js";
import { ReportPageShell } from "../chrome/ReportPageShell.jsx";
import { SkeletonC } from "../skeletons/SkeletonC.jsx";
import { ExclusionPlate } from "../chrome/ExclusionPlate.jsx";
import { shellFromPacket } from "./shellProps.js";

export function Page04Estimate({ packet }) {
  return (
    <ReportPageShell {...shellFromPacket(packet, 4, PACKET_TITLES[4])}>
      {packet?.audience === PACKET_AUDIENCE.HABITAT ? (
        <ExclusionPlate reason="Habitat packets never include materials or labor desks." />
      ) : (
        <SkeletonC packet={packet} />
      )}
    </ReportPageShell>
  );
}
