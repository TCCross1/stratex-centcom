/**
 * PRO ADAPTER — Stratex Pro is the professional-facing APPLICATION. It consumes
 * Core services and authorized Passport projections. It never owns canonical
 * property truth, and it is not built inside CENTCOM. This is the boundary the
 * standalone Pro application will satisfy.
 */
import { serve } from "../shared/transport.js";

export const ProAdapter = {
  connected: false,

  getOversight: (propertyId) =>
    serve({
      propertyId,
      organization: "Bluegrass Roofing LLC",
      authorization: "Scoped grant SG-041 • expires 2026-09-30",
      projectStatus: "Roof replacement — complete",
      proposalStatus: "Accepted",
      professionalActivity: "Last active 2 days ago",
      coreServicesUsed: "Geometry • Takeoff • Estimating",
      completionEvidence: "Submitted • 41 assets • accepted",
      exceptions: 0,
      deepLink: "https://pro.stratex.app/properties/" + propertyId,
    }),
};
export default ProAdapter;
