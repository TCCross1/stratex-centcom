export const PROVIDER_MODE = {
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  DEGRADED: "DEGRADED",
  FIXTURE: "FIXTURE",
  ERROR: "ERROR",
};

/** True only for a real, live upstream. FIXTURE is never live. */
export const isLive = (mode) => mode === PROVIDER_MODE.CONNECTED || mode === "LIVE";

/** Every provider payload carries this envelope. No exceptions. */
export const stamp = (mode, payload) => ({
  ...payload,
  providerMode: mode,
  dataSource: mode === PROVIDER_MODE.FIXTURE ? "FIXTURE" : mode,
  isLive: isLive(mode),
  retrievedAt: new Date().toISOString(),
});
