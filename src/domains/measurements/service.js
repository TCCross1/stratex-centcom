/**
 * MEASUREMENT SERVICE — property-scoped. No measurement bleeds across
 * properties. Summaries never blend truth classes together.
 */
import { measurements, MEASUREMENT_CATEGORY } from "./fixtures.js";
import { serve } from "../shared/transport.js";
import { TRUTH_CLASS } from "../shared/classification.js";

export const MeasurementService = {
  listByProperty: (propertyId) =>
    serve(() => measurements.filter((m) => m.propertyId === propertyId)),

  listByMission: (missionId) =>
    serve(() => measurements.filter((m) => m.missionId === missionId)),

  get: (measurementId) =>
    serve(() => {
      const m = measurements.find((x) => x.measurementId === measurementId);
      if (!m) throw new Error("Measurement not found.");
      return m;
    }),

  /** Counts are reported per truth class, never as one blended total. */
  getSummaryByProperty: (propertyId) =>
    serve(() => {
      const rows = measurements.filter((m) => m.propertyId === propertyId);
      return {
        total: rows.length,
        measured: rows.filter((m) => m.truthClassification === TRUTH_CLASS.MEASURED).length,
        derived: rows.filter((m) => m.truthClassification === TRUTH_CLASS.DERIVED).length,
        probable: rows.filter((m) => m.truthClassification === TRUTH_CLASS.PROBABLE).length,
        categories: [...new Set(rows.map((m) => m.category))],
      };
    }),

  categories: () => MEASUREMENT_CATEGORY,
};

export default MeasurementService;
