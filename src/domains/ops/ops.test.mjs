import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import MissionService from "../mission/service.js";
import { PROVIDER_MODE, FleetProvider } from "../atc/providers.js";
import { getCityWeatherSnapshot, weatherNet, setWeatherMode, clearWeatherCache } from "../atc/weather.js";
import { headerWeatherRoute, monthName, localDateKey, seasonOfMonth } from "./calendar.js";
import BoardService from "./board.js";
import AtcDayMapService from "./day-map.js";

const rainviewerOk = {
  ok: true,
  json: async () => ({
    radar: { past: [{ path: "/v2/radar/fixture" }] },
    satellite: { infrared: [{ path: "/v2/satellite/fixture" }] },
  }),
};

const run = async () => {
  const realFetch = weatherNet.fetch;
  weatherNet.fetch = async (url, opts) => {
    const u = String(url || "");
    if (u.includes("rainviewer.com")) return rainviewerOk;
    if (realFetch) return realFetch(url, opts);
    throw new Error("NO_FETCH");
  };
  setWeatherMode(PROVIDER_MODE.FIXTURE);
  clearWeatherCache();

  const header = await getCityWeatherSnapshot("lexington");
  const board = await BoardService.getMonth({ date: "2026-08-30", city: "Lexington" });
  const map = await AtcDayMapService.getDay({ date: "2026-08-30", city: "Lexington" });
  assert.equal(board.weatherSnapshot, header, "header, board, and ATC share one weather snapshot object");
  assert.equal(map.weatherSnapshot, header, "header, board, and ATC share one weather snapshot object");

  const click = headerWeatherRoute(header.city);
  assert.equal(click.startsWith("/atc/day"), true, "header click routes to ATC day");
  assert.equal(click.includes("/board"), false, "header click does not route to Board");

  const ids = (await BoardService.getDay({ date: "2026-08-30", city: "Lexington" })).missions.map((m) => m.missionId);
  assert.ok(ids.includes("M-2026-0830-020"));
  assert.ok(ids.includes("M-2026-0830-022"));
  assert.ok(ids.includes("M-2026-0830-040"));

  const demoPins = map.pins.map((p) => p.missionId);
  assert.ok(demoPins.includes("M-2026-0830-040"), "Idle Hour storm job is pinned");
  assert.ok(demoPins.includes("M-2026-0830-041"), "Tates Creek hail job is pinned");
  assert.ok(demoPins.includes("M-2026-0830-042"), "Alumni HVAC job is pinned");
  assert.ok(demoPins.includes("M-2026-0830-043"), "Cheapside roof job is pinned");
  assert.ok(demoPins.includes("M-2026-0830-044"), "Todds closeout job is pinned");
  const hail = map.pins.find((p) => p.missionId === "M-2026-0830-041");
  assert.equal(hail.jobNumber, "JOB-4202");
  assert.equal(hail.address, "447 Tates Creek Rd");
  assert.match(hail.circumstance || "", /hail/i);

  const boardDay = await BoardService.getDay({ date: "2026-08-30", city: "Lexington" });
  const boardHail = boardDay.missions.find((m) => m.missionId === "M-2026-0830-041");
  assert.equal(boardHail.jobNumber, "JOB-4202");
  assert.equal(boardHail.address, "447 Tates Creek Rd");
  assert.match(boardHail.circumstance || "", /hail/i);

  const moved = await (await import("../property/service.js")).default.updateIdentity("SXP-004201", { lat: 38.11, lng: -84.51 });
  assert.equal(moved.identity.lat, 38.11);
  const afterMove = await AtcDayMapService.getDay({ date: "2026-08-30", city: "Lexington" });
  const idle = afterMove.pins.find((p) => p.missionId === "M-2026-0830-040");
  assert.equal(idle.lat, 38.11);
  await (await import("../property/service.js")).default.updateIdentity("SXP-004201", { lat: 38.0318, lng: -84.4904 });

  await MissionService.reschedule("M-2026-0830-042", { start: "2026-08-31T11:30:00", end: "2026-08-31T12:30:00" });
  const shifted = await MissionService.get("M-2026-0830-042");
  assert.equal(shifted.requestedDate, localDateKey("2026-08-31T11:30:00"), "reschedule stores operator-local date");
  const afterShift = await AtcDayMapService.getDay({ date: "2026-08-30", city: "Lexington" });
  assert.equal(afterShift.pins.some((p) => p.missionId === "M-2026-0830-042"), false, "reschedule off-day drops the pin");
  const nextDay = await AtcDayMapService.getDay({ date: "2026-08-31", city: "Lexington" });
  assert.ok(nextDay.pins.some((p) => p.missionId === "M-2026-0830-042"), "reschedule lands on the new day");
  await MissionService.reschedule("M-2026-0830-042", { start: "2026-08-30T11:30:00", end: "2026-08-30T12:30:00" });

  const created = await MissionService.create({
    id: "M-OPS-TEST-1",
    propertyId: "SXP-004205",
    originType: "STRATEX_INTERNAL",
    assessmentObjective: "ROOF",
    requestedPackage: "DAYSCAN",
    requestedServices: ["RGB_MAPPING"],
    missionType: "Ops test",
    jobNumber: "JOB-TEST",
    scheduledStart: "2026-08-30T18:00:00",
    scheduledEnd: "2026-08-30T19:00:00",
  });
  const withCreated = await AtcDayMapService.getDay({ date: "2026-08-30", city: "Lexington" });
  assert.ok(withCreated.pins.some((p) => p.missionId === created.id));
  await MissionService.remove(created.id);
  const afterDelete = await AtcDayMapService.getDay({ date: "2026-08-30", city: "Lexington" });
  assert.equal(afterDelete.pins.some((p) => p.missionId === created.id), false, "deleted job leaves the map");

  const logged = await MissionService.listAll();
  for (const m of logged) {
    assert.ok(m.jobNumber, m.id + " is logged with a job number");
  }
  const auto = await MissionService.create({
    id: "M-OPS-TEST-2",
    propertyId: "SXP-004205",
    originType: "STRATEX_INTERNAL",
    assessmentObjective: "ROOF",
    requestedPackage: "DAYSCAN",
    requestedServices: ["RGB_MAPPING"],
    missionType: "Auto job",
  });
  assert.match(auto.jobNumber, /^JOB-/);
  await MissionService.remove(auto.id);

  const before = (await MissionService.listAll()).map((m) => m.id).sort();
  assert.equal(BoardService.create, undefined, "Board has no create API");
  await BoardService.getMonth({ date: "2026-08-30", city: "Lexington" });
  const after = (await MissionService.listAll()).map((m) => m.id).sort();
  assert.deepEqual(after, before, "Board does not create missions");

  const versailles = await AtcDayMapService.getDay({ date: "2026-08-30", city: "Versailles" });
  assert.equal(versailles.pins.some((p) => p.missionId === "M-2026-0830-019"), false, "mission without coords gets no house pin");
  assert.ok(
    versailles.unplaced.some((p) => p.missionId === "M-2026-0830-019" && p.reason === "NO_COORDINATES"),
    "mission without coords is listed NO_COORDINATES"
  );

  assert.equal(map.trucks.length, 0, "no fleet fix → zero truck markers");
  assert.equal(FleetProvider.mode, PROVIDER_MODE.DISCONNECTED);

  assert.equal(map.radar.sweep, false, "never draw a fake Doppler sweep");
  assert.equal(map.staticImage, false, "map is not a static image");
  assert.equal(map.basemap, "maplibre-vector");
  assert.ok(map.radarOverlay, "fixture mode still paints RainViewer precip tiles");
  assert.ok(map.radarClouds, "fixture mode still paints infrared cloud tiles");
  assert.match(map.radarOverlay, /tilecache\.rainviewer\.com/);
  assert.match(map.radarClouds, /tilecache\.rainviewer\.com/);
  assert.equal(map.radar.status, "RADAR TILES");

  const wx30 = board.forecasts["2026-08-30"];
  assert.equal(wx30.unavailable, false);
  assert.equal(wx30.icon, "storm");
  assert.equal(wx30.tempHi, 82);
  assert.equal(wx30.tempLo, 63);
  assert.equal(board.forecasts["2026-08-01"].unavailable, false, "month cells carry a daily forecast");
  assert.equal(seasonOfMonth("2026-08"), "summer");
  assert.equal(seasonOfMonth("2026-09"), "autumn");
  assert.equal(seasonOfMonth("2026-12"), "winter");
  assert.equal(seasonOfMonth("2026-04"), "spring");

  const routingSrc = readFileSync(new URL("../../components/mission/MissionRouting.jsx", import.meta.url), "utf8");
  assert.equal(routingSrc.includes("addressLine1"), true, "Mission Detail routing editor writes address");
  assert.equal(routingSrc.includes("lat"), true, "Mission Detail routing editor writes pin lat");
  assert.equal(routingSrc.includes("updatePropertyIdentity"), true, "Mission Detail routing editor moves the house");
  assert.equal(routingSrc.includes("window.location.reload"), false, "routing editor reloads via resource, not full page");

  const cityMapSrc = readFileSync(new URL("../../components/atc/CityMap.jsx", import.meta.url), "utf8");
  assert.equal(cityMapSrc.includes("maplibre-gl"), true);
  assert.equal(cityMapSrc.includes("clouds-layer"), true, "city map paints infrared cloud tiles");
  assert.equal(cityMapSrc.includes("RAINVIEWER_MAX_ZOOM"), true, "radar overzooms z7 instead of requesting unsupported zooms");
  assert.equal(/<img[\s\S]*basemap/.test(cityMapSrc), false, "map is not a static image");

  assert.equal(board.monthName, "AUGUST");
  assert.equal(monthName("2026-09"), "SEPTEMBER");
  assert.equal(monthName("2026-08"), "AUGUST");

  const prevFetch = weatherNet.fetch;
  weatherNet.fetch = async (url) => {
    const u = String(url || "");
    if (u.includes("rainviewer.com")) return rainviewerOk;
    throw new Error("NWS down");
  };
  setWeatherMode(PROVIDER_MODE.CONNECTED);
  try {
    const deadHeader = await getCityWeatherSnapshot("lexington");
    const deadBoard = await BoardService.getMonth({ date: "2026-08-30", city: "Lexington" });
    const deadMap = await AtcDayMapService.getDay({ date: "2026-08-30", city: "Lexington" });
    assert.equal(deadHeader, deadBoard.weatherSnapshot);
    assert.equal(deadHeader, deadMap.weatherSnapshot);
    assert.equal(deadHeader.mode, "DISCONNECTED");
    assert.equal(deadHeader.unavailable, true);
    assert.equal(deadBoard.providerMode, "DISCONNECTED");
    assert.equal(deadMap.providerMode, "DISCONNECTED");
    assert.equal(deadMap.hourly.unavailable, true);
    const blob = JSON.stringify(deadHeader).toLowerCase();
    assert.equal(blob.includes("sunny"), false, "disconnected weather ≠ clear skies");
    assert.notEqual(deadHeader.rainChancePct, 0);
    assert.ok(deadMap.radarOverlay, "NWS down does not kill RainViewer tiles");
    assert.ok(deadMap.radarClouds);
    assert.equal(deadMap.radar.sweep, false);
  } finally {
    weatherNet.fetch = prevFetch;
    setWeatherMode(PROVIDER_MODE.FIXTURE);
  }

  setWeatherMode(PROVIDER_MODE.DISCONNECTED);
  try {
    const offMap = await AtcDayMapService.getDay({ date: "2026-08-30", city: "Lexington" });
    assert.equal(offMap.radarOverlay, null, "DISCONNECTED weather mode never paints radar");
    assert.equal(offMap.radarClouds, null);
    assert.equal(offMap.radar.sweep, false);
  } finally {
    setWeatherMode(PROVIDER_MODE.FIXTURE);
  }

  weatherNet.fetch = realFetch;
  console.log("RESULT: ALL OPS BOARD / DAY MAP TESTS PASS");
};

run().catch((err) => {
  console.error(err);
  console.log("RESULT: OPS BOARD / DAY MAP TESTS FAILED");
  process.exit(1);
});
