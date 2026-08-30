/**
 * ATC PROVIDER BOUNDARIES
 *
 * ATC depends on the outside world: weather, airspace, aircraft telemetry,
 * sensors, flight authorization. None of those are connected. These interfaces
 * define exactly what a real integration must satisfy, and every one of them
 * reports its own mode so nothing downstream can mistake a fixture for a feed.
 *
 * The single rule this file exists to enforce:
 *   A provider that is not connected never returns a clean result.
 *   Absence of data is UNKNOWN or PROVIDER_UNAVAILABLE — never PASS, never CLEAR.
 */
import { serve } from "../shared/transport.js";

export const PROVIDER_MODE = {
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  DEGRADED: "DEGRADED",
  FIXTURE: "FIXTURE",
  ERROR: "ERROR",
};

/** True only for a real, live upstream. FIXTURE is never live. */
export const isLive = (mode) => mode === PROVIDER_MODE.CONNECTED;

/** Every provider payload carries this envelope. No exceptions. */
export const stamp = (mode, payload) => ({
  ...payload,
  providerMode: mode,
  dataSource: mode === PROVIDER_MODE.FIXTURE ? "FIXTURE" : mode,
  isLive: isLive(mode),
  retrievedAt: new Date().toISOString(),
});

/* ------------------------------------------------------------- weather --- */

export const WeatherProvider = {
  name: "WeatherProvider",
  mode: PROVIDER_MODE.FIXTURE,
  vendor: "development fixture",

  /** @returns {Promise<WeatherSnapshot>} */
  getSnapshot: (missionId, propertyId, fixture) =>
    serve(() => {
      if (WeatherProvider.mode === PROVIDER_MODE.DISCONNECTED)
        return stamp(PROVIDER_MODE.DISCONNECTED, { snapshotId: null, unavailable: true });
      return stamp(WeatherProvider.mode, fixture);
    }),
};

/* ------------------------------------------------------------ airspace --- */

export const AirspaceProvider = {
  name: "AirspaceProvider",
  // No LAANC or FAA integration exists. This is deliberately DISCONNECTED so
  // no screen can render an airspace clearance CENTCOM did not obtain.
  mode: PROVIDER_MODE.DISCONNECTED,
  vendor: "none connected",

  getAssessment: (missionId, propertyId, fixture) =>
    serve(() => {
      if (AirspaceProvider.mode === PROVIDER_MODE.DISCONNECTED)
        return stamp(PROVIDER_MODE.DISCONNECTED, {
          ...fixture,
          state: "PROVIDER_UNAVAILABLE",
          geofenceState: "UNKNOWN",
          temporaryRestrictionState: "NOT_CHECKED",
          notes: "No airspace provider is connected. Airspace has not been checked.",
        });
      return stamp(AirspaceProvider.mode, fixture);
    }),
};

/* -------------------------------------------------------------- flight --- */

export const FlightProvider = {
  name: "FlightProvider",
  mode: PROVIDER_MODE.DISCONNECTED,
  vendor: "none connected",

  /** Simulation must be switched on deliberately; it is never the default. */
  simulationEnabled: true,

  authorizeLaunch: (missionId, { simulation = false } = {}) =>
    serve(() => {
      if (FlightProvider.mode === PROVIDER_MODE.CONNECTED)
        return stamp(PROVIDER_MODE.CONNECTED, { state: "AUTHORIZED", missionId });
      if (simulation && FlightProvider.simulationEnabled)
        return stamp(PROVIDER_MODE.FIXTURE, {
          state: "AUTHORIZED_FIXTURE",
          missionId,
          notice: "SIMULATION — no live flight provider is connected. This is not a real launch authorization.",
        });
      throw new Error("Live launch authorization unavailable — no flight provider is connected.");
    }),
};

/* ----------------------------------------------------------- telemetry --- */

export const AircraftTelemetryProvider = {
  name: "AircraftTelemetryProvider",
  mode: PROVIDER_MODE.DISCONNECTED,
  vendor: "none connected",
  simulationEnabled: true,

  getConnectionState: () => (isLive(AircraftTelemetryProvider.mode) ? "CONNECTED" : "DISCONNECTED"),

  getLatest: (missionId, fixture) =>
    serve(() => {
      if (isLive(AircraftTelemetryProvider.mode)) return stamp(PROVIDER_MODE.CONNECTED, fixture);
      if (AircraftTelemetryProvider.simulationEnabled)
        return stamp(PROVIDER_MODE.FIXTURE, { ...fixture, simulation: true });
      return stamp(PROVIDER_MODE.DISCONNECTED, { unavailable: true });
    }),

  /**
   * Deterministic simulation for UI and tests. It walks a scripted frame list —
   * there is no network code here and no attempt to imitate one.
   */
  subscribe(missionId, frames, onFrame, intervalMs = 1500) {
    if (!this.simulationEnabled) return () => {};
    let i = 0;
    const timer = setInterval(() => {
      onFrame(stamp(PROVIDER_MODE.FIXTURE, { ...frames[i % frames.length], simulation: true }));
      i++;
    }, intervalMs);
    return () => clearInterval(timer);
  },
};

/* -------------------------------------------------------------- sensor --- */

export const SensorProvider = {
  name: "SensorProvider",
  mode: PROVIDER_MODE.FIXTURE,
  vendor: "development fixture",

  getReadiness: (aircraftId, fixture) =>
    serve(() => {
      if (SensorProvider.mode === PROVIDER_MODE.DISCONNECTED)
        return stamp(PROVIDER_MODE.DISCONNECTED, { unavailable: true, sensors: [] });
      return stamp(SensorProvider.mode, fixture);
    }),
};

export const ALL_PROVIDERS = [
  WeatherProvider, AirspaceProvider, FlightProvider,
  AircraftTelemetryProvider, SensorProvider,
];

/** Health for Systems Command. A fixture provider is never reported healthy. */
export const providerHealth = () =>
  ALL_PROVIDERS.map((p) => ({
    id: p.name,
    name: p.name,
    mode: p.mode,
    vendor: p.vendor,
    isLive: isLive(p.mode),
    detail:
      p.mode === PROVIDER_MODE.FIXTURE
        ? "Development fixture — not a live feed"
        : p.mode === PROVIDER_MODE.DISCONNECTED
        ? "No provider connected"
        : p.mode,
  }));
