/**
 * BASIC ATC FIXTURES — aircraft, operators, and the seeded readiness checklist.
 * Development data. No aircraft is connected and no check here was performed.
 */
import { iso, ago } from "../../utils/format.js";

export const aircraft = [
  { id: "AC-M4TD-01", model: "Enterprise quadcopter (development fixture)", batteryPct: 78, storagePct: 41, health: "nominal", lastCalibration: ago(7000) },
  { id: "AC-M4TD-02", model: "Enterprise quadcopter (development fixture)", batteryPct: 96, storagePct: 12, health: "nominal", lastCalibration: ago(4000) },
  { id: "AC-DOCK-03", model: "Docked station aircraft (development fixture)", batteryPct: 28, storagePct: 94, health: "caution", lastCalibration: ago(44000) },
];

export const operators = [
  { id: "OP-01", name: "Tony Cross", certification: "Part 107 • 2028-03", currentMedical: true, role: "Pilot / Operator" },
  { id: "OP-02", name: "R. Delgado", certification: "Part 107 • 2027-11", currentMedical: true, role: "Pilot / Operator" },
];

export const atcReadiness = {
  missionId: "M-2026-0830-019",
  launchAuthorized: false,
  holdReason: "Sustained wind above envelope",
  checks: [
    { key: "weather", label: "Weather", state: "caution", detail: "Overcast, 72°F, no precipitation (fixture)" },
    { key: "wind", label: "Wind", state: "fail", detail: "24 mph sustained against a 20 mph policy limit" },
    { key: "visibility", label: "Visibility", state: "pass", detail: "9 mi (fixture)" },
    { key: "airspace", label: "Airspace", state: "caution", detail: "No provider connected — not checked" },
    { key: "geofence", label: "Geofencing", state: "caution", detail: "Not checked" },
    { key: "authorization", label: "Authorization", state: "caution", detail: "Not checked" },
    { key: "link", label: "Drone Link", state: "caution", detail: "No telemetry provider connected" },
    { key: "airframe", label: "Aircraft Health", state: "caution", detail: "No telemetry" },
    { key: "battery", label: "Battery", state: "caution", detail: "No telemetry" },
    { key: "storage", label: "Storage", state: "caution", detail: "No telemetry" },
    { key: "camera", label: "Camera", state: "pass", detail: "RGB present (fixture)" },
    { key: "thermal", label: "Thermal", state: "pass", detail: "Thermal present (fixture)" },
    { key: "sensors", label: "Sensor Package", state: "pass", detail: "RGB • Thermal (fixture)" },
    { key: "calibration", label: "Calibration", state: "pass", detail: "Current (fixture)" },
    { key: "plan", label: "Mission Plan", state: "pass", detail: "Objective and services defined" },
    { key: "operator", label: "Operator", state: "pass", detail: "OP-01 assigned and available" },
  ],
};
