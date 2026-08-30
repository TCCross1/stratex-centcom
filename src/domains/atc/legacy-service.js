/**
 * ATC BASIC READS — aircraft, operators and the seeded readiness checklist used
 * by the original ATC page. The readiness ENGINE lives in readiness.js and the
 * command surface in service.js; this file only serves those simple lists.
 */
import { atcReadiness, aircraft, operators } from "./fixtures-basic.js";
import { serve } from "../shared/transport.js";
import { FlightProvider as Provider } from "./providers.js";

export const AtcService = {
  getReadiness: () => serve(() => atcReadiness),
  listAircraft: () => serve(() => aircraft),
  listOperators: () => serve(() => operators),
};

export const FlightProvider = Provider;
export default AtcService;
