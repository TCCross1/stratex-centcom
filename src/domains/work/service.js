/**
 * WORK SERVICES — projects, repairs, maintenance, documents.
 * All property-scoped. Project, Repair and Maintenance stay separate concepts.
 */
import { projects, repairs, maintenance, documents, MAINTENANCE_HORIZON } from "./fixtures.js";
import { serve } from "../shared/transport.js";

export const ProjectService = {
  listByProperty: (propertyId) =>
    serve(() => projects.filter((p) => p.propertyId === propertyId)),
  get: (projectId) =>
    serve(() => {
      const p = projects.find((x) => x.projectId === projectId);
      if (!p) throw new Error("Project not found.");
      return p;
    }),
};

export const RepairService = {
  listByProperty: (propertyId) =>
    serve(() => repairs.filter((r) => r.propertyId === propertyId)),
  listByProject: (projectId) =>
    serve(() => repairs.filter((r) => r.projectId === projectId)),
};

export const MaintenanceService = {
  listByProperty: (propertyId) =>
    serve(() => maintenance.filter((m) => m.propertyId === propertyId)),

  /** The roadmap groups by horizon, in order, and keeps empty horizons visible
   *  so an operator can see what is genuinely unscheduled. */
  getRoadmap: (propertyId) =>
    serve(() => {
      const rows = maintenance.filter((m) => m.propertyId === propertyId);
      return MAINTENANCE_HORIZON.map((horizon) => ({
        horizon,
        items: rows.filter((m) => m.horizon === horizon && m.status !== "COMPLETE"),
      }));
    }),
};

export const DocumentService = {
  listByProperty: (propertyId) =>
    serve(() => documents.filter((d) => d.propertyId === propertyId)),
};
