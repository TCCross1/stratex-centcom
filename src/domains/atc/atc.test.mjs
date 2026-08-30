/**
 * ATC COMMAND TEST SUITE
 *
 * The point of these tests is honesty as much as correctness: a disconnected
 * provider must never produce a clean result, and CENTCOM must never issue a
 * launch authorization it does not actually have.
 *
 * Run:  node src/domains/atc/atc.test.mjs
 */
import AtcService, { LIVE_STATE, LAUNCH_STATE } from "./service.js";
import { evaluateReadiness, ATC_STATE, CHECK_STATE, isExpired } from "./readiness.js";
import { assessThermalWindow, THERMAL_BAND, policyFor } from "./policy.js";
import {
  WeatherProvider, AirspaceProvider, FlightProvider,
  AircraftTelemetryProvider, SensorProvider, PROVIDER_MODE, providerHealth, isLive,
} from "./providers.js";
import {
  weatherByMission, airspaceByMission, aircraftReadinessById,
  sensorReadinessByPackage, operatorReadinessById,
} from "./fixtures.js";
import MissionService from "../mission/service.js";
import { properties } from "../property/fixtures.js";

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log("  ok   " + m); };
const no = (m) => { fail++; console.log("  FAIL " + m); };
const check = (c, m) => (c ? ok(m) : no(m));
const section = (t) => console.log("\n=== " + t + " ===");

const mission = (over = {}) => ({
  id: "M-T", propertyId: "SXP-004182", requestedPackage: "DAYSCAN",
  requestedServices: ["RGB_MAPPING"], scheduledStart: "2026-09-01T09:00:00Z",
  authorizationState: "NOT_REQUIRED", occupancyState: "OCCUPIED",
  aircraftId: "AC-M4TD-01", operatorId: "OP-01", sensorPackageId: "SP-RGB",
  estimatedDurationMinutes: 90, assessmentObjective: "ROOF", ...over,
});

const goodInputs = (over = {}) => ({
  mission: mission(over.mission),
  weather: weatherByMission["M-2026-0831-021"],
  airspace: airspaceByMission["M-2026-0831-021"],
  aircraftReadiness: aircraftReadinessById["AC-M4TD-01"],
  sensorReadiness: sensorReadinessByPackage["SP-RGB"],
  operatorReadiness: operatorReadinessById["OP-01"],
  missionPlan: { complete: true, missing: [] },
  blockers: [],
  ...over,
});

/* --------------------------------------------------- 1. readiness engine -- */
section("1. ATC READINESS");

const r1 = evaluateReadiness(goodInputs());
check(r1.overallState === ATC_STATE.READY || r1.overallState === ATC_STATE.READY_WITH_WARNINGS,
  "all required checks satisfied → READY or READY_WITH_WARNINGS");
check(r1.blockingCount === 0, "no blocking failures when everything passes");

const r2 = evaluateReadiness(goodInputs({
  sensorReadiness: { sensors: [{ sensorId: "S", type: "RGB", connected: true, health: "GOOD", calibrationState: "DUE", capabilities: ["RGB"], warnings: [] }] },
}));
check(r2.overallState === ATC_STATE.READY_WITH_WARNINGS, "calibration due produces READY_WITH_WARNINGS, not BLOCKED");

const r3 = evaluateReadiness(goodInputs({ mission: { authorizationState: "PENDING" } }));
check(r3.overallState === ATC_STATE.BLOCKED, "pending authorization → BLOCKED");

const r4 = evaluateReadiness(goodInputs({ aircraftReadiness: null }));
check(r4.overallState === ATC_STATE.BLOCKED, "missing aircraft telemetry → BLOCKED, not READY");
check(r4.checks.some((c) => c.state === CHECK_STATE.PROVIDER_UNAVAILABLE),
  "missing telemetry reports PROVIDER_UNAVAILABLE rather than FAIL");
check(!r4.checks.some((c) => c.category === "BATTERY" && c.state === CHECK_STATE.PASS),
  "battery never passes without telemetry");

check(isExpired({ expiresAt: new Date(Date.now() - 1000).toISOString() }), "an old assessment reports expired");
check(!isExpired(r1), "a fresh assessment is not expired");

/* -------------------------------------------------------- 2. weather ----- */
section("2. WEATHER");

check(evaluateReadiness(goodInputs()).checks.find((c) => c.code === "WIND_SPEED").state === CHECK_STATE.PASS,
  "acceptable wind passes");
const windy = evaluateReadiness(goodInputs({ weather: weatherByMission["M-2026-0830-019"] }));
check(windy.checks.find((c) => c.code === "WIND_SPEED").state === CHECK_STATE.FAIL,
  "24 mph against a 20 mph policy limit fails");
const breezy = evaluateReadiness(goodInputs({ weather: weatherByMission["M-2026-0830-020"] }));
check(breezy.checks.find((c) => c.code === "WIND_SPEED").state === CHECK_STATE.WARNING,
  "16 mph produces a warning, not a failure");
const noWx = evaluateReadiness(goodInputs({ weather: null }));
check(noWx.checks.find((c) => c.category === "WEATHER").state === CHECK_STATE.PROVIDER_UNAVAILABLE,
  "absent weather provider reports PROVIDER_UNAVAILABLE");
check(!noWx.checks.some((c) => c.category === "WIND" && c.state === CHECK_STATE.PASS),
  "no wind check passes without a weather feed");

/* -------------------------------------------------------- 3. thermal ----- */
section("3. THERMAL WINDOW");

check(assessThermalWindow(weatherByMission["M-2026-0902-031"], { minutesAfterSunset: 138 }).band === THERMAL_BAND.PREDICTED_IDEAL,
  "clear, calm, well after sunset → PREDICTED IDEAL");
const marginal = assessThermalWindow(weatherByMission["M-2026-0903-032"], { minutesAfterSunset: 45 });
check([THERMAL_BAND.MARGINAL, THERMAL_BAND.POOR].includes(marginal.band),
  "overcast, breezy, recent rain → MARGINAL or POOR");
check(assessThermalWindow({ windSpeedMph: 4 }).band === THERMAL_BAND.INSUFFICIENT_DATA,
  "missing inputs → INSUFFICIENT DATA, never a zero score");
check(assessThermalWindow({ windSpeedMph: 4 }).score === null, "insufficient data returns no score at all");
check(assessThermalWindow(weatherByMission["M-2026-0902-031"]).scoreIsFixture === true,
  "every thermal score is flagged as a development fixture");

const thermalMission = goodInputs({
  mission: { requestedPackage: "THERMALSCAN", requestedServices: ["THERMAL_CAPTURE"], sensorPackageId: "SP-RGB" },
  sensorReadiness: sensorReadinessByPackage["SP-RGB"],
  weather: weatherByMission["M-2026-0902-031"],
});
const tr = evaluateReadiness(thermalMission);
check(tr.checks.find((c) => c.code === "THERMAL_READY").state === CHECK_STATE.FAIL,
  "THERMALSCAN with an RGB-only package fails the thermal sensor check");
check(tr.overallState === ATC_STATE.BLOCKED, "a thermal mission without a thermal sensor is BLOCKED");

const dayScan = evaluateReadiness(goodInputs());
check(dayScan.checks.find((c) => c.code === "THERMAL_WINDOW").state === CHECK_STATE.NOT_APPLICABLE,
  "a non-thermal mission marks the thermal window NOT APPLICABLE");

/* ------------------------------------------------------- 4. airspace ----- */
section("4. AIRSPACE");

check(evaluateReadiness(goodInputs()).checks.find((c) => c.code === "AIRSPACE").state === CHECK_STATE.PASS,
  "a CLEAR fixture passes");
check(evaluateReadiness(goodInputs({ airspace: airspaceByMission["M-2026-0830-019"] }))
  .checks.find((c) => c.code === "AIRSPACE").state === CHECK_STATE.WARNING,
  "REVIEW_REQUIRED produces a warning");
check(evaluateReadiness(goodInputs({ airspace: airspaceByMission["M-2026-0902-031"] }))
  .checks.find((c) => c.code === "AIRSPACE").state === CHECK_STATE.WARNING,
  "AUTHORIZATION_REQUIRED produces a warning");
const noAir = evaluateReadiness(goodInputs({ airspace: null }));
check(noAir.checks.find((c) => c.code === "AIRSPACE").state === CHECK_STATE.PROVIDER_UNAVAILABLE,
  "no airspace provider → PROVIDER_UNAVAILABLE");
check(!noAir.checks.some((c) => c.code === "AIRSPACE" && c.state === CHECK_STATE.PASS),
  "an absent airspace provider NEVER resolves to clear");
check(noAir.checks.find((c) => c.code === "GEOFENCE").state === CHECK_STATE.UNKNOWN,
  "geofence is UNKNOWN without a provider, and separate from airspace");

/* ------------------------------------------------------- 5. aircraft ----- */
section("5. AIRCRAFT");

check(evaluateReadiness(goodInputs()).checks.find((c) => c.code === "BATTERY_LEVEL").state === CHECK_STATE.PASS,
  "78% battery passes a 45% policy minimum");
const dock = evaluateReadiness(goodInputs({ aircraftReadiness: aircraftReadinessById["AC-DOCK-03"] }));
check(dock.checks.find((c) => c.code === "BATTERY_LEVEL").state === CHECK_STATE.FAIL, "28% battery fails");
check(dock.checks.find((c) => c.code === "STORAGE_FREE").state === CHECK_STATE.FAIL, "6 GB storage fails a 16 GB estimate");
check(dock.checks.find((c) => c.code === "GPS_STATE").state === CHECK_STATE.WARNING, "degraded GPS warns");
check(dock.checks.find((c) => c.code === "AIRCRAFT_HEALTH").state === CHECK_STATE.WARNING, "aircraft health WARNING is surfaced");
check(evaluateReadiness(goodInputs({
  aircraftReadiness: { ...aircraftReadinessById["AC-M4TD-01"], healthState: "UNKNOWN" },
})).checks.find((c) => c.code === "AIRCRAFT_HEALTH").state === CHECK_STATE.UNKNOWN,
  "unknown health stays UNKNOWN — never assumed good");

/* --------------------------------------------------------- 6. sensor ----- */
section("6. SENSORS");

check(evaluateReadiness(goodInputs()).checks.find((c) => c.code === "RGB_READY").state === CHECK_STATE.PASS,
  "DAYSCAN with an RGB package passes");
check(evaluateReadiness(goodInputs({
  mission: { requestedPackage: "THERMALSCAN", requestedServices: ["THERMAL_CAPTURE"], sensorPackageId: "SP-RGB-IR" },
  sensorReadiness: sensorReadinessByPackage["SP-RGB-IR"],
})).checks.find((c) => c.code === "THERMAL_READY").state === CHECK_STATE.PASS,
  "THERMALSCAN with a thermal-capable package passes");
check(evaluateReadiness(goodInputs({
  sensorReadiness: { sensors: [{ sensorId: "S", type: "RGB", connected: false, health: "UNKNOWN", calibrationState: "UNKNOWN", capabilities: ["RGB"], warnings: [] }] },
})).checks.find((c) => c.code === "RGB_READY").state === CHECK_STATE.FAIL,
  "a disconnected sensor fails");
check(evaluateReadiness(goodInputs({
  sensorReadiness: { sensors: [{ sensorId: "S", type: "RGB", connected: true, health: "GOOD", calibrationState: "REQUIRED", capabilities: ["RGB"], warnings: [] }] },
})).checks.find((c) => c.code === "RGB_CAL").state === CHECK_STATE.FAIL,
  "calibration REQUIRED fails");

/* ------------------------------------------------------- 7. operator ----- */
section("7. OPERATOR");

check(evaluateReadiness(goodInputs()).checks.find((c) => c.code === "OPERATOR_AVAILABLE").state === CHECK_STATE.PASS,
  "an assigned, available operator passes");
const op2 = evaluateReadiness(goodInputs({ operatorReadiness: operatorReadinessById["OP-02"] }));
check(op2.checks.find((c) => c.code === "OPERATOR_AVAILABLE").state === CHECK_STATE.FAIL, "an unavailable operator fails");
check(op2.checks.find((c) => c.code === "OPERATOR_ACK").state === CHECK_STATE.WARNING, "an unacknowledged mission warns");
check(evaluateReadiness(goodInputs({ operatorReadiness: null }))
  .checks.find((c) => c.code === "OPERATOR_ASSIGNED").state === CHECK_STATE.FAIL,
  "no operator assigned fails");

/* ------------------------------------------------- 8. provider honesty --- */
section("8. PROVIDER HONESTY");

check(!isLive(PROVIDER_MODE.FIXTURE), "a FIXTURE provider is never reported live");
check(!isLive(PROVIDER_MODE.DISCONNECTED), "a DISCONNECTED provider is never reported live");
check(isLive(PROVIDER_MODE.CONNECTED), "only CONNECTED counts as live");
check(providerHealth().every((p) => p.isLive === false),
  "no provider currently claims to be live");
check(providerHealth().filter((p) => p.mode === PROVIDER_MODE.FIXTURE).every((p) => /fixture/i.test(p.detail)),
  "fixture providers describe themselves as fixtures, not as healthy");

const air = await AirspaceProvider.getAssessment("M", "P", { state: "CLEAR", geofenceState: "CLEAR" });
check(air.state === "PROVIDER_UNAVAILABLE",
  "a disconnected airspace provider overrides even a CLEAR fixture");
check(air.temporaryRestrictionState === "NOT_CHECKED",
  "temporary restrictions report NOT CHECKED rather than clear");

let denied = false;
try { await FlightProvider.authorizeLaunch("M"); } catch { denied = true; }
check(denied, "a disconnected FlightProvider refuses to issue a real authorization");
const sim = await FlightProvider.authorizeLaunch("M", { simulation: true });
check(sim.state === "AUTHORIZED_FIXTURE" && sim.isLive === false,
  "simulated authorization is labelled AUTHORIZED_FIXTURE and is not live");
check(/SIMULATION/i.test(sim.notice), "simulated authorization carries an explicit simulation notice");

const tel = await AircraftTelemetryProvider.getLatest("M", { batteryPercent: 50 });
check(tel.isLive === false && tel.simulation === true, "telemetry is flagged as simulation, never live");

/* ------------------------------------------------------ 9. launch gate --- */
section("9. LAUNCH AUTHORIZATION");

let refused = null;
try { await AtcService.requestLaunchAuthorization("M-2026-0903-032"); } catch (e) { refused = e.message; }
check(refused && /not READY/.test(refused), "launch is refused when the mission is not READY");

await AtcService.evaluate("M-2026-0831-021");
let refused2 = null;
try { await AtcService.requestLaunchAuthorization("M-2026-0831-021"); } catch (e) { refused2 = e.message; }
check(refused2 !== null, "launch is refused while required checks are unsatisfied");
check(/Airspace/.test(refused2), "the refusal names the unsatisfied airspace check");

const la = await AtcService.getLaunchAuthorization("M-2026-0831-021");
check(la.state === LAUNCH_STATE.DENIED, "a denied request is recorded, not discarded");
check(Boolean(la.reason), "the denial records its reason");

/* --------------------------------------------------- 10. hold / resume --- */
section("10. HOLD / RESUME / ABORT");

const MID = "M-2026-0829-018";
await AtcService.setLiveState(MID, LIVE_STATE.CAPTURING);
const held = await AtcService.hold(MID, "WEATHER", { actor: "OP-01" });
check(held.state === LIVE_STATE.HOLD && held.holdReason === "WEATHER", "an active mission can be held with a reason");

let badHold = false;
try { await AtcService.hold(MID, "NONSENSE"); } catch { badHold = true; }
check(badHold, "a hold without a valid reason category is refused");

let earlyResume = false;
try { await AtcService.resume(MID); } catch { earlyResume = true; }
check(earlyResume, "resume is refused while the hold condition stands");

const resumed = await AtcService.resume(MID, { blockerResolved: true });
check(resumed.state === LIVE_STATE.CAPTURING, "resume returns to the state the mission was held from");

const evts = await AtcService.listEvents(MID);
check(evts.some((e) => e.type === "MISSION_HELD") && evts.some((e) => e.type === "MISSION_RESUMED"),
  "hold and resume both emit ATC events");
const aud = await AtcService.listAudit(MID);
check(aud.some((e) => e.action === "MISSION_HELD" && e.reason === "WEATHER"),
  "the audit record preserves the hold reason");

const lost = await AtcService.connectionLost(MID);
check(lost.state === LIVE_STATE.CONNECTION_LOST, "connection loss is a real operational state");

// Abort is not cancel.
const beforeAbort = await MissionService.get(MID);
await MissionService.abort(MID, "WEATHER", { actor: "OP-01" });
const afterAbort = await MissionService.get(MID);
check(afterAbort.missionState === "ABORTED", "an active mission aborts to ABORTED");
check(afterAbort.missionState !== "CANCELLED", "abort is never silently converted to cancel");
const abortedSessions = await MissionService.listCaptureSessions(MID);
check(abortedSessions.some((s) => s.status === "ABORTED" && s.abortReason === "WEATHER"),
  "the capture session is preserved with its abort reason");

/* ------------------------------------------------------ 11. post-flight -- */
section("11. POST-FLIGHT / CAPTURE VALIDATION");

const good = await AtcService.validateCapture("M-2026-0827-012");
check(good.state === "APPROVED", "a complete capture with all required outputs is approved");
check(good.missingOutputs.length === 0, "an approved capture reports no missing outputs");

const short = await AtcService.validateCapture("M-2026-0829-015");
check(short.state === "RECAPTURE_REQUIRED", "71% coverage requires recapture");
check(short.coverageState === "71%", "the validation records actual coverage");

const thermalMissing = await AtcService.validateCapture("M-2026-0829-016");
check(["APPROVED", "APPROVED_WITH_WARNINGS", "RECAPTURE_REQUIRED"].includes(thermalMissing.state),
  "thermal-requiring missions are validated against their required outputs");

const cvEvents = await AtcService.listEvents("M-2026-0829-015");
check(cvEvents.some((e) => e.type === "RECAPTURE_REQUIRED"), "a failed validation emits RECAPTURE_REQUIRED");
const okEvents = await AtcService.listEvents("M-2026-0827-012");
check(okEvents.some((e) => e.type === "ATC_CLOSEOUT"), "an approved capture closes ATC responsibility");

/* -------------------------------------------------- 12. property scope --- */
section("12. ATC PROPERTY ISOLATION");

const propertyIds = properties.map((p) => p.stratexPropertyId);
const allMissions = await MissionService.listAll();
const missionProperty = Object.fromEntries(allMissions.map((m) => [m.id, m.propertyId]));

const assessments = Object.values(AtcService.__store.assessments);
check(assessments.every((a) => a.propertyId === missionProperty[a.missionId]),
  "every readiness assessment carries its mission's property");
check(assessments.every((a) => propertyIds.includes(a.propertyId)),
  "every readiness assessment points at a known property");

const auths = Object.values(AtcService.__store.launchAuthorizations);
check(auths.every((a) => a.propertyId === missionProperty[a.missionId]),
  "every launch authorization carries its mission's property");

check(AtcService.__store.validations.every((v) => v.propertyId === missionProperty[v.missionId]),
  "every capture validation carries its mission's property");

console.log("\n" + (fail ? `RESULT: ${fail} FAILURE(S), ${pass} passed\n` : `RESULT: ALL ${pass} TESTS PASS\n`));
process.exit(fail ? 1 : 0);
