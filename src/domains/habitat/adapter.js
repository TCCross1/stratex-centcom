/**
 * HABITAT ADAPTER — Habitat consumes authorized Passport projections. It is
 * never the source of canonical truth, and its code is not imported here.
 * Audit the real Habitat repository before wiring this.
 */
import { serve } from "../shared/transport.js";
import { ago } from "../../utils/format.js";

export const HabitatAdapter = {
  connected: false,

  getOversight: (propertyId) =>
    serve({
      propertyId,
      syncState: "synced",
      lastProjection: ago(26),
      homeHealth: 84,
      activeAlerts: 3,
      maintenanceDue: 1,
      activeProjects: 1,
      contractorAuthorizations: 1,
      syncFailures: 0,
      deepLink: "https://habitat.stratex.app/home/" + propertyId,
    }),
};
export default HabitatAdapter;
