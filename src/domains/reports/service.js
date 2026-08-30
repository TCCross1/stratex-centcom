/**
 * REPORTS DOMAIN + CORE SERVICE BOUNDARY
 *
 * Core performs report generation. CENTCOM commands and observes it. No report
 * logic lives here, and no PDF is ever claimed to exist that does not.
 */
import { serve } from "../shared/transport.js";

export const REPORT_TYPE = {
  PROPERTY_INTELLIGENCE: "PROPERTY_INTELLIGENCE",
  MISSION: "MISSION",
  THERMAL: "THERMAL",
  ROOF: "ROOF",
  PROJECT: "PROJECT",
  REPAIR_VERIFICATION: "REPAIR_VERIFICATION",
};

export const REPORT_STATUS = {
  QUEUED: "QUEUED",
  GENERATING: "GENERATING",
  READY: "READY",
  FAILED: "FAILED",
};

/**
 * @typedef {Object} Report
 * @property {string} reportId @property {keyof REPORT_TYPE} type
 * @property {keyof REPORT_STATUS} status @property {string} propertyId
 * @property {string[]} sourceMissionIds @property {string[]} sourceEvidenceIds
 * @property {string[]} sourceFindingIds @property {string} passportRevisionId
 * @property {string} coreJobId @property {string|null} artifactRef
 * @property {string|null} generatedAt
 */

/**
 * The Core report boundary. `connected: false` means no report service is
 * reachable — the UI says so rather than showing an empty list that implies
 * zero reports were generated.
 */
export const CoreReportAdapter = {
  connected: false,

  listReportJobs: () => serve(() => []),
  getReportJob: (jobId) => serve(() => null),

  /** Requesting a report is a command to Core, never work done inside CENTCOM. */
  requestReport: () =>
    Promise.reject(new Error("Core report service not connected.")),
};

export default CoreReportAdapter;
