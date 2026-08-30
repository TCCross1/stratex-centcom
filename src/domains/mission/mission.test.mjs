/**
 * MISSION COMMAND TEST SUITE
 *
 * Proves the rules that make Mission Command trustworthy: only legal
 * transitions, real gates, honest recapture/rescan semantics, and no
 * cross-property leakage.
 *
 * Run:  node src/domains/mission/mission.test.mjs
 */
import MissionService from "./service.js";
import {
  canTransition, evaluateReadyGate, evaluateCloseout, checkSensorCompatibility,
} from "./lifecycle.js";
import { sensorPackages } from "./fixtures.js";
import { properties } from "../property/fixtures.js";
import CortexService from "../cortex/service.js";

const CortexService_listFindings = (p) => CortexService.listFindingsByProperty(p);

let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log("  ok   " + m); };
const bad = (m) => { fail++; console.log("  FAIL " + m); };
const check = (cond, m) => (cond ? ok(m) : bad(m));
const section = (t) => console.log("\n=== " + t + " ===");

const stub = (over = {}) => ({
  id: "M-TEST", propertyId: "SXP-004182", missionState: "CREATED",
  authorizationState: "NOT_REQUIRED", requestedPackage: "DAYSCAN",
  requestedServices: ["RGB_MAPPING"], scheduledStart: null,
  operatorId: null, aircraftId: null, sensorPackageId: null,
  captureState: "NOT_STARTED", evidenceState: "NOT_STARTED",
  processingState: "NOT_STARTED", cortexState: "NOT_STARTED",
  passportState: "NOT_STARTED", reportState: "NOT_STARTED", ...over,
});

/* ------------------------------------------------- 1. state transitions -- */
section("1. STATE TRANSITIONS");

check(!canTransition(stub(), "SCHEDULED").allowed,
  "CREATED → SCHEDULED is refused (scheduling must be entered first)");
check(!canTransition(stub({ missionState: "READY" }), "COMPLETE").allowed,
  "READY → COMPLETE is refused");
check(canTransition(stub({ missionState: "CAPTURING" }), "CAPTURE_COMPLETE").allowed,
  "CAPTURING → CAPTURE_COMPLETE is allowed");
check(canTransition(stub({ missionState: "DATA_VALIDATION" }), "RECAPTURE_REQUIRED").allowed,
  "DATA_VALIDATION → RECAPTURE_REQUIRED is allowed");
check(canTransition(stub(), "AUTHORIZATION_PENDING").allowed,
  "CREATED → AUTHORIZATION_PENDING is allowed");
check(!canTransition(stub({ missionState: "COMPLETE" }), "CAPTURING").allowed,
  "COMPLETE is terminal — no transition out");
check(!canTransition(stub({ missionState: "CANCELLED" }), "SCHEDULING").allowed,
  "CANCELLED is terminal — no transition out");
check(!canTransition(stub(), "NONSENSE").allowed,
  "an unknown state is refused outright");

/* ------------------------------------------------------- 2. READY gate -- */
section("2. READY GATE");

const full = stub({
  missionState: "ATC_REVIEW", scheduledStart: "2026-09-01T09:00:00Z",
  operatorId: "OP-01", aircraftId: "AC-01", sensorPackageId: "SP-RGB",
});
const rgb = sensorPackages.find((s) => s.id === "SP-RGB");

check(evaluateReadyGate(full, { sensorPackage: rgb }).ready,
  "a fully resourced DayScan passes the ready gate");
check(!evaluateReadyGate({ ...full, authorizationState: "PENDING" }, { sensorPackage: rgb }).ready,
  "READY fails when authorization is still pending");
check(!evaluateReadyGate({ ...full, operatorId: null }, { sensorPackage: rgb }).ready,
  "READY fails with no operator assigned");
check(!evaluateReadyGate({ ...full, aircraftId: null }, { sensorPackage: rgb }).ready,
  "READY fails with no aircraft assigned");
check(!evaluateReadyGate({ ...full, scheduledStart: null }, { sensorPackage: rgb }).ready,
  "READY fails with no scheduled start");
check(!evaluateReadyGate(full, {
    sensorPackage: rgb,
    blockers: [{ severity: "BLOCKING", status: "OPEN", message: "test" }],
  }).ready, "READY fails while a BLOCKING blocker is open");
check(evaluateReadyGate(full, {
    sensorPackage: rgb,
    blockers: [{ severity: "WARNING", status: "OPEN", message: "test" }],
  }).ready, "a WARNING blocker does not stop READY");
check(evaluateReadyGate(full, {
    sensorPackage: rgb,
    blockers: [{ severity: "BLOCKING", status: "RESOLVED", message: "test" }],
  }).ready, "a resolved blocker does not stop READY");

/* --------------------------------------------- 3. resource compatibility -- */
section("3. RESOURCE COMPATIBILITY");

const thermalMission = stub({ requestedPackage: "THERMALSCAN", requestedServices: ["THERMAL_CAPTURE"] });
check(checkSensorCompatibility(thermalMission, rgb).includes("THERMAL"),
  "THERMALSCAN with an RGB-only package reports THERMAL missing");
check(checkSensorCompatibility(stub(), rgb).length === 0,
  "DAYSCAN with an RGB package is compatible");
check(checkSensorCompatibility(thermalMission, sensorPackages.find((s) => s.id === "SP-RGB-IR")).length === 0,
  "THERMALSCAN with an RGB+Thermal package is compatible");
check(!evaluateReadyGate({ ...full, requestedPackage: "THERMALSCAN", requestedServices: ["THERMAL_CAPTURE"] },
  { sensorPackage: rgb }).ready, "an incompatible sensor package blocks READY");

/* ------------------------------------------------------- 4. authorization -- */
section("4. AUTHORIZATION");

const proMission = stub({ missionState: "AUTHORIZATION_PENDING", authorizationState: "SENT" });
check(!canTransition(proMission, "AUTHORIZED").allowed,
  "a mission with SENT authorization cannot reach AUTHORIZED");
check(canTransition({ ...proMission, authorizationState: "CONFIRMED" }, "AUTHORIZED").allowed,
  "once CONFIRMED, AUTHORIZED is permitted");
check(!evaluateReadyGate({ ...full, authorizationState: "DECLINED" }, { sensorPackage: rgb }).ready,
  "a DECLINED authorization keeps the mission out of READY");

const live = await MissionService.getDetail("M-2026-0901-030");
check(live.mission.authorizationState === "SENT" && !live.readyGate.ready,
  "the professional-origin fixture is held at authorization");

/* ------------------------------------------------------------ 5. closeout -- */
section("5. CLOSEOUT");

const nearDone = stub({
  missionState: "PASSPORT_SYNC", captureState: "COMPLETE", evidenceState: "VALIDATED",
  processingState: "COMPLETE", cortexState: "COMPLETE", passportState: "SYNCED",
});
const doneSession = [{ status: "COMPLETE" }];
check(evaluateCloseout(nearDone, { captureSessions: doneSession }).canComplete,
  "a package without a report can complete without one");
check(!evaluateCloseout({ ...nearDone, requestedServices: ["RGB_MAPPING", "REPORT"] },
  { captureSessions: doneSession }).canComplete,
  "a package that requested a report cannot complete without it");
check(!evaluateCloseout({ ...nearDone, cortexState: "RUNNING" },
  { captureSessions: doneSession }).canComplete,
  "closeout fails while Cortex is still running");
check(!evaluateCloseout({ ...nearDone, passportState: "CONFLICT" },
  { captureSessions: doneSession }).canComplete,
  "closeout fails on a Passport conflict");
check(!evaluateCloseout(nearDone, { captureSessions: [] }).canComplete,
  "closeout fails with no completed capture session");

let threw = false;
try { await MissionService.transition("M-2026-0828-014", "COMPLETE"); } catch { threw = true; }
check(threw, "the Passport-conflict fixture is refused COMPLETE by the service");

/* ----------------------------------------------------------- 6. recapture -- */
section("6. RECAPTURE");

const before = await MissionService.listCaptureSessions("M-2026-0829-015");
const firstAttempt = { ...before[0] };
const newSession = await MissionService.startRecapture("M-2026-0829-015", "Rear plane and chimney missing.");
const after = await MissionService.listCaptureSessions("M-2026-0829-015");
const missionsNow = await MissionService.listAll();

check(after.length === before.length + 1, "recapture adds a capture session");
check(newSession.attemptNumber === firstAttempt.attemptNumber + 1, "attempt number increments");
check(after[0].coverageState === firstAttempt.coverageState && after[0].status === firstAttempt.status,
  "the original capture attempt is left untouched");
check(newSession.missionId === "M-2026-0829-015", "recapture stays on the same mission");
check(newSession.propertyId === "SXP-004190", "recapture stays on the same property");
check(missionsNow.filter((m) => m.id === "M-2026-0829-015").length === 1,
  "recapture creates no duplicate mission");

/* -------------------------------------------------------------- 7. rescan -- */
section("7. RESCAN");

const countBefore = (await MissionService.listAll()).length;
const rescan = await MissionService.createRescan("M-2026-0827-012", { id: "M-TEST-RESCAN" });
const countAfter = (await MissionService.listAll()).length;

check(countAfter === countBefore + 1, "rescan creates a new mission");
check(rescan.propertyId === "SXP-004182", "rescan stays on the same property");
check(rescan.parentMissionId === "M-2026-0827-012" && rescan.relationshipType === "RESCAN_OF",
  "rescan records its relationship to the prior mission");
check(rescan.missionState === "CREATED" && rescan.captureState === "NOT_STARTED",
  "rescan begins a fresh lifecycle");

/* ------------------------------------------------- 8. audit / no silence -- */
section("8. EVENT EMISSION");

const detailBefore = await MissionService.getDetail("M-2026-0831-021");
await MissionService.assignResource("M-2026-0831-021", "OPERATOR", "OP-02");
const detailAfter = await MissionService.getDetail("M-2026-0831-021");

check(detailAfter.audit.length > detailBefore.audit.length, "a resource assignment writes an audit record");
check(detailAfter.timeline.length > detailBefore.timeline.length, "a resource assignment writes a timeline event");
check(detailAfter.assignments.some((a) => a.state === "REASSIGNED"),
  "the previous operator assignment is superseded, not erased");

let rejected = false;
try { await MissionService.transition("M-2026-0903-032", "COMPLETE"); } catch { rejected = true; }
check(rejected, "the service refuses an illegal transition rather than mutating state");

/* --------------------------------------------------- 9. property isolation -- */
section("9. MISSION PROPERTY ISOLATION");

const all = await MissionService.listAll();
const propertyIds = properties.map((p) => p.stratexPropertyId);
check(all.every((m) => propertyIds.includes(m.propertyId)),
  "every mission belongs to a known property");

let leak = 0;
for (const pid of propertyIds) {
  const mine = await MissionService.listByProperty(pid);
  if (mine.some((m) => m.propertyId !== pid)) leak++;
}
check(leak === 0, "listByProperty never returns another property's mission");

const sessions = MissionService.__provider.captures;
const missionById = Object.fromEntries(all.map((m) => [m.id, m]));
check(sessions.every((s) => missionById[s.missionId]?.propertyId === s.propertyId),
  "every capture session's property matches its mission's property");

const orgMissions = await MissionService.listByOrganization("ORG-BLUEGRASS");
check(orgMissions.every((m) => m.requestingPartyRef === "ORG-BLUEGRASS"),
  "the tenant-scoped read returns only that organization's missions");

/* ------------------------------------------------------------- 10. handoff -- */
section("10. ATC HANDOFF PROJECTION");

const handoff = await MissionService.getReadinessRequest("M-2026-0830-019");
check(handoff.missionId && handoff.propertyId && handoff.requiredCapabilities.length > 0,
  "the readiness request carries mission, property and required capabilities");
check(!("captureState" in handoff) && !("evidenceState" in handoff),
  "the handoff is a projection — it does not copy the mission record");

/* ------------------------------------------------- 11. mission creation -- */
section("11. MISSION CREATION");

const beforeCreate = (await MissionService.listAll()).length;
const propBefore = properties.length;

const draft = {
  propertyId: "SXP-004182", originType: "STRATEX_INTERNAL",
  missionType: "Test Capture", assessmentObjective: "ROOF",
  requestedPackage: "DAYSCAN", requestedServices: ["RGB_MAPPING"],
  sensorPackageId: "SP-RGB", operatorId: "OP-01", aircraftId: "AC-M4TD-01",
  requestedDate: "2026-09-10", priority: "NORMAL",
  knownIssues: [{ id: "KI-T", issue: "Owner reports a stain on the ceiling", reportedBy: "HOMEOWNER" }],
};

check(MissionService.validateDraft({}).errors.length >= 4, "an empty draft reports every missing requirement");
check(MissionService.validateDraft(draft).valid, "a complete draft validates");

const created = await MissionService.create({ ...draft, id: "M-TEST-CREATE" });
check(created.id === "M-TEST-CREATE" && created.missionState === "CREATED", "creation returns a CREATED mission");
check(created.propertyId === "SXP-004182", "the created mission resolves to the existing property");
check((await MissionService.listAll()).length === beforeCreate + 1, "exactly one mission was created");
check(properties.length === propBefore, "resolving an existing property creates no duplicate property");

const createdDetail = await MissionService.getDetail("M-TEST-CREATE");
check(createdDetail.timeline.some((e) => e.type === "MISSION_CREATED"), "creation emits a timeline event");
check(createdDetail.audit.some((e) => e.action === "MISSION_CREATED"), "creation emits an audit event");

// Reported context must never become a finding or property truth.
check(Array.isArray(created.knownIssues) && created.knownIssues[0].reportedBy === "HOMEOWNER",
  "reported context is stored as context with its reporter");
const propertyFindings = await CortexService_listFindings("SXP-004182");
check(!propertyFindings.some((f) => /stain on the ceiling/i.test(f.title)),
  "a reported issue is never written into findings");

let thermalRejected = false;
try {
  await MissionService.create({ ...draft, id: "M-TEST-THERMAL", requestedPackage: "THERMALSCAN",
    requestedServices: ["THERMAL_CAPTURE"], sensorPackageId: "SP-RGB" });
} catch (e) { thermalRejected = /THERMAL/.test(e.message); }
check(thermalRejected, "creating a THERMALSCAN with an RGB-only package is rejected at creation");

let noProperty = false;
try { await MissionService.create({ ...draft, id: "M-TEST-NOPROP", propertyId: null }); } catch { noProperty = true; }
check(noProperty, "a mission cannot be created without a property");

const createdProMission = await MissionService.create({
  ...draft, id: "M-TEST-PRO", originType: "PROFESSIONAL",
  requestingPartyType: "ORGANIZATION", requestingPartyRef: "ORG-BLUEGRASS",
  authorizationState: "PENDING",
});
check(createdProMission.requestingPartyRef === "ORG-BLUEGRASS", "a professional mission preserves its organization reference");
check(!canTransition(createdProMission, "AUTHORIZED").allowed,
  "a professional mission stays gated by authorization after creation");

const scoped = await MissionService.listByProperty("SXP-004182");
check(scoped.every((m) => m.propertyId === "SXP-004182"), "created missions remain property-scoped");

console.log("\n" + (fail ? `RESULT: ${fail} FAILURE(S), ${pass} passed\n` : `RESULT: ALL ${pass} TESTS PASS\n`));
process.exit(fail ? 1 : 0);
