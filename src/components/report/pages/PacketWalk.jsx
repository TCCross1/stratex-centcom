import React from "react";
import { PACKET_AUDIENCE, PACKET_TITLES } from "../../../domains/reports/packet-contract.js";
import { PageCover } from "./PageCover.jsx";
import { Page02Openings } from "./Page02Openings.jsx";
import { Page03Awe } from "./Page03Awe.jsx";
import { Page04Estimate } from "./Page04Estimate.jsx";
import { Page05TwinThermal } from "./Page05TwinThermal.jsx";
import { PageExclusion } from "./PageExclusion.jsx";

const PAGE = {
  1: PageCover,
  2: Page02Openings,
  3: Page03Awe,
  4: Page04Estimate,
  5: Page05TwinThermal,
};

export function PacketPageView({ packet, page }) {
  const habitat = packet?.audience === PACKET_AUDIENCE.HABITAT;
  if (habitat && page === 4)
    return <PageExclusion packet={packet} page={4} module={PACKET_TITLES[4]} reason="Habitat packets never include materials or labor desks." />;
  const View = PAGE[page] || Page02Openings;
  return <View packet={packet} />;
}

export function PacketWalk({ packet, pages }) {
  const list = pages?.length ? pages : packet?.pages || [2, 3, 4, 5];
  return (
    <div className="sx-print-packet">
      {list.map((page) => (
        <PacketPageView key={page} packet={packet} page={page} />
      ))}
    </div>
  );
}

export default PacketWalk;
