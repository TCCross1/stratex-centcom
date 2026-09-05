/**
 * 27-module walk order. Included modules render; excluded modules get a plate.
 */
import { REPORT_MODULES } from "../../../domains/reports/manifest.js";
import { HABITAT_SKIP_PAGES, PACKET_AUDIENCE, PACKET_PAGE } from "../../../domains/reports/packet-contract.js";

export const MODULE_PAGE = {
  COVER: 1,
  WINDOW_SCHEDULE: PACKET_PAGE.OPENINGS_ENERGY,
  DOOR_SCHEDULE: PACKET_PAGE.OPENINGS_ENERGY,
  ENERGY: PACKET_PAGE.OPENINGS_ENERGY,
  AWE: PACKET_PAGE.AWE,
  HOME_HEALTH: PACKET_PAGE.AWE,
  MATERIALS: PACKET_PAGE.BID_DESK,
  LABOR: PACKET_PAGE.BID_DESK,
  DIGITAL_TWIN: PACKET_PAGE.TWIN_THERMAL,
  THERMAL: PACKET_PAGE.TWIN_THERMAL,
};

export function walkSequence(manifest = [], audience = PACKET_AUDIENCE.PRO) {
  const rows = manifest.length ? manifest : REPORT_MODULES.map((module) => ({ module, included: true, reason: null }));
  return rows
    .map((row, i) => {
      const page = MODULE_PAGE[row.module] || i + 1;
      const habitatSkip = audience === PACKET_AUDIENCE.HABITAT && HABITAT_SKIP_PAGES.includes(page);
      return {
        ...row,
        page,
        included: habitatSkip ? false : row.included,
        reason: habitatSkip ? "Habitat packets never include this module." : row.reason,
      };
    });
}

export function previewPages(audience = PACKET_AUDIENCE.PRO) {
  const pages = [PACKET_PAGE.OPENINGS_ENERGY, PACKET_PAGE.AWE, PACKET_PAGE.BID_DESK, PACKET_PAGE.TWIN_THERMAL];
  if (audience === PACKET_AUDIENCE.HABITAT) return pages.filter((p) => !HABITAT_SKIP_PAGES.includes(p));
  return pages;
}
