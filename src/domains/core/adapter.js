/**
 * CORE ADAPTER — Core is the work/execution ENGINE, not a contractor app.
 * It performs measurement, geometry, takeoff, estimating, reporting and
 * workflow processing. CENTCOM supervises the engine; it does not run it.
 */
import { serve } from "../shared/transport.js";
import { ago } from "../../utils/format.js";

export const CoreAdapter = {
  connected: false,

  getEngineStatus: () =>
    serve({
      services: [
        { id: "svc-geometry", name: "Geometry & Measurement", state: "operational", queued: 3, failed: 0, p95Ms: 4200 },
        { id: "svc-takeoff", name: "Takeoff & Quantity", state: "operational", queued: 1, failed: 0, p95Ms: 2600 },
        { id: "svc-estimate", name: "Estimating Calculation", state: "operational", queued: 0, failed: 0, p95Ms: 1900 },
        { id: "svc-material", name: "Material Intelligence", state: "degraded", queued: 9, failed: 2, p95Ms: 11800 },
        { id: "svc-report", name: "Report Generation", state: "operational", queued: 2, failed: 0, p95Ms: 7400 },
        { id: "svc-workflow", name: "Workflow Execution", state: "operational", queued: 4, failed: 0, p95Ms: 900 },
      ],
    }),

  getPropertyWorkState: (propertyId) =>
    serve({
      propertyId,
      workState: "Scope computed",
      measurementJob: "Complete • 41 surfaces",
      takeoffJob: "Complete • 3 assemblies",
      estimateJob: "Complete",
      reportJob: "Delivered 2026-08-29",
      lastRun: ago(120),
      failures: 0,
    }),
};
export default CoreAdapter;
