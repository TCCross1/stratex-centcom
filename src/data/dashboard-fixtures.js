/**
 * DASHBOARD FIXTURES — genuinely cross-domain seed data for the executive
 * surface: alerts, system events, business metrics, platform health.
 *
 * Revenue and business figures are fixtures. They are labelled as such
 * wherever they appear, and no financial source is connected.
 */
import { iso, ago, clock } from "../utils/format.js";
import { ROLE } from "../domains/shared/rbac.js";

export const session = {
  userId: "u-001",
  name: "Tony Cross",
  role: ROLE.ADMIN,
  station: "CENTCOM-01",
};

export const alerts = [
  { id: "AL-1", category: "CORTEX", title: "High Moisture Detected", detail: "Attic Zone • 2nd Floor", severity: "high", at: ago(2), propertyId: "SXP-004182", target: "/properties/SXP-004182/findings" },
  { id: "AL-2", category: "CORTEX", title: "Roof Life < 5 Years", detail: "Based on AI Projection", severity: "medium", at: ago(15), propertyId: "SXP-004182", target: "/properties/SXP-004182/cortex" },
  { id: "AL-3", category: "CORTEX", title: "HVAC Efficiency Low", detail: "System Aging Detected", severity: "medium", at: ago(32), propertyId: "SXP-004182", target: "/properties/SXP-004182/systems" },
  { id: "AL-4", category: "PROPERTY", title: "Electrical Panel Risk", detail: "Upgrade Recommended", severity: "low", at: ago(60), propertyId: "SXP-004188", target: "/properties/SXP-004188/findings" },
  { id: "AL-5", category: "HABITAT", title: "Maintenance Due", detail: "Plumbing System Check", severity: "low", at: ago(120), propertyId: "SXP-004179", target: "/properties/SXP-004179/maintenance" },
  { id: "AL-6", category: "CORE", title: "Material Intelligence Degraded", detail: "9 jobs queued • 2 failed", severity: "medium", at: ago(8), propertyId: null, target: "/core" },
];

/** Typed system events. The panel renders these; it never hard-codes copy. */

export const activity = [
  { id: "AC-1", type: "MISSION_COMPLETED", at: clock(5), title: "Mission M-2026-0829-017 completed", sub: "456 Oakview Dr, Lexington, KY", propertyId: "SXP-004179", target: "/properties/SXP-004179/missions" },
  { id: "AC-2", type: "REPORT_DELIVERED", at: clock(12), title: "Report delivered to homeowner", sub: "1234 Bridlewood Way", propertyId: "SXP-004182", target: "/properties/SXP-004182/reports" },
  { id: "AC-3", type: "PASSPORT_REVISION_CREATED", at: clock(20), title: "New property added to Passport", sub: "789 Maplecrest Ln", propertyId: "SXP-004190", target: "/properties/SXP-004190/passport" },
  { id: "AC-4", type: "PROFESSIONAL_AUTHORIZED", at: clock(28), title: "Professional authorized on project", sub: "Roof replacement • Bluegrass Roofing LLC", propertyId: "SXP-004182", target: "/properties/SXP-004182/pro" },
  { id: "AC-5", type: "CORTEX_ANALYSIS_STARTED", at: clock(39), title: "Cortex analysis started", sub: "321 Stonegate Dr", propertyId: "SXP-004188", target: "/properties/SXP-004188/cortex" },
];

const spark = (start, end, n = 26, jitter = 0.35) => {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = start + (end - start) * t;
    const wob = Math.sin(i * 1.7) * jitter + Math.sin(i * 0.6) * jitter * 0.6;
    out.push(+(base + wob).toFixed(3));
  }
  return out;
};

export const metrics = [
  { id: "mission_success", label: "Mission Success Rate", value: "98.6%", sub: "99%", delta: "+2.4%", series: spark(94, 98.6, 26, 0.5) },
  { id: "report_accuracy", label: "Report Accuracy", value: "99.2%", sub: "94%", delta: "+1.8%", series: spark(95.5, 99.2, 26, 0.4) },
  { id: "csat", label: "Customer Satisfaction", value: "4.9/5", sub: "", delta: "+0.3", series: spark(4.4, 4.9, 26, 0.06) },
  { id: "repeat", label: "Repeat Business", value: "76%", sub: "", delta: "+8%", series: spark(62, 76, 26, 1.4) },
];

export const overview = {
  activeMissions: { value: 18, delta: "+3", caption: "In Progress" },
  propertiesScanned: { value: 1247, delta: "+57", caption: "This Month" },
  reportsDelivered: { value: 892, delta: "+28", caption: "This Month" },
  revenue: { value: 142880, delta: "+18.6%", caption: "vs Last Month" },
};

export const conditions = { city: "Lexington, KY", tempF: 72, sky: "Partly cloudy" };

export const systems = [
  { id: "sys-api", name: "CENTCOM API", state: "operational", detail: "p95 118 ms" },
  { id: "sys-pg", name: "Passport (PostgreSQL)", state: "operational", detail: "Replication lag 0.4 s" },
  { id: "sys-obj", name: "Evidence Object Store", state: "operational", detail: "Object Lock enforced" },
  { id: "sys-queue", name: "Processing Queue", state: "degraded", detail: "9 jobs backlogged" },
  { id: "sys-cortex", name: "Cortex Workers", state: "operational", detail: "3/4 nodes active" },
  { id: "sys-atc", name: "ATC Telemetry Bridge", state: "operational", detail: "Link nominal" },
  { id: "sys-core", name: "Core Work Engine", state: "fixture", detail: "Development fixture — not connected" },
  { id: "sys-pro", name: "Pro Integration", state: "fixture", detail: "Development fixture — not connected" },
  { id: "sys-habitat", name: "Habitat Integration", state: "fixture", detail: "Development fixture — not connected" },
];
