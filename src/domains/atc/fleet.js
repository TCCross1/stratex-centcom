/**
 * FleetProvider — latest vehicle fixes only. Never invents a truck.
 */
import { serve } from "../shared/transport.js";
import { PROVIDER_MODE, isLive, stamp } from "./providers-core.js";

const STALE_MS = 15 * 60 * 1000;

export const FleetProvider = {
  name: "FleetProvider",
  mode: PROVIDER_MODE.DISCONNECTED,
  vendor: "none connected",
  /** Tests may inject fixes. Production starts empty. */
  _fixes: [],

  getLatestFixes: () =>
    serve(() => {
      if (!isLive(FleetProvider.mode)) {
        return stamp(FleetProvider.mode, { vehicles: [], unavailable: true });
      }
      const now = Date.now();
      const vehicles = (FleetProvider._fixes || []).filter((fix) => {
        if (!Number.isFinite(fix.lat) || !Number.isFinite(fix.lng)) return false;
        if (!fix.vehicleId) return false;
        const t = Date.parse(fix.asOf);
        if (!Number.isFinite(t)) return false;
        return now - t <= STALE_MS;
      }).map((fix) => ({
        vehicleId: fix.vehicleId,
        lat: fix.lat,
        lng: fix.lng,
        asOf: fix.asOf,
      }));
      return stamp(PROVIDER_MODE.CONNECTED, { vehicles, unavailable: false });
    }),
};
