/**
 * DOMAIN STATE VOCABULARIES
 *
 * Every status an operator can see is declared here with its own label, tone
 * and text mark. A status is never communicated by color alone — the mark is
 * part of the contract, not decoration.
 */
import T from "../../design/tokens.js";

export const STATE = {
  property: {
    ACTIVE: { label: "Active", tone: "ok", mark: "●" },
    MONITORING: { label: "Monitoring", tone: "info", mark: "◐" },
    ATTENTION: { label: "Attention", tone: "warn", mark: "▲" },
    PROJECT_ACTIVE: { label: "Project Active", tone: "info", mark: "◆" },
    ARCHIVED: { label: "Archived", tone: "mute", mark: "○" },
  },
  passport: {
    CURRENT: { label: "Current", tone: "ok", mark: "●" },
    PENDING: { label: "Pending", tone: "info", mark: "◐" },
    REVIEW_REQUIRED: { label: "Review Required", tone: "warn", mark: "▲" },
    CONFLICT: { label: "Conflict", tone: "bad", mark: "✕" },
    ERROR: { label: "Error", tone: "bad", mark: "✕" },
  },
  cortex: {
    IDLE: { label: "Idle", tone: "mute", mark: "○" },
    QUEUED: { label: "Queued", tone: "info", mark: "◐" },
    PROCESSING: { label: "Processing", tone: "info", mark: "◐" },
    COMPLETE: { label: "Complete", tone: "ok", mark: "●" },
    REVIEW_REQUIRED: { label: "Review Required", tone: "warn", mark: "▲" },
    ERROR: { label: "Error", tone: "bad", mark: "✕" },
  },
  core: {
    IDLE: { label: "Idle", tone: "mute", mark: "○" },
    PROCESSING: { label: "Processing", tone: "info", mark: "◐" },
    WORK_ACTIVE: { label: "Work Active", tone: "ok", mark: "●" },
    BLOCKED: { label: "Blocked", tone: "warn", mark: "▲" },
    ERROR: { label: "Error", tone: "bad", mark: "✕" },
  },
  pro: {
    NONE: { label: "None", tone: "mute", mark: "○" },
    AUTHORIZED: { label: "Authorized", tone: "info", mark: "◐" },
    ESTIMATE_ACTIVE: { label: "Estimate Active", tone: "info", mark: "◆" },
    PROJECT_ACTIVE: { label: "Project Active", tone: "ok", mark: "●" },
    COMPLETION_PENDING: { label: "Completion Pending", tone: "warn", mark: "▲" },
  },
  habitat: {
    NOT_CONNECTED: { label: "Not Connected", tone: "mute", mark: "○" },
    SYNCED: { label: "Synced", tone: "ok", mark: "●" },
    SYNC_PENDING: { label: "Sync Pending", tone: "info", mark: "◐" },
    SYNC_ERROR: { label: "Sync Error", tone: "bad", mark: "✕" },
  },
};

export const STATE_TONE = {
  ok: T.color.ok, info: T.color.blueBright, warn: T.color.medium,
  bad: T.color.high, mute: T.color.textFaint,
};

export const stateOf = (domain, key) =>
  (STATE[domain] && STATE[domain][key]) || { label: key || "—", tone: "mute", mark: "○" };

/** The 15 working mission stages. CLOSED is a terminal state, not a stage. */
export const MISSION_STAGES = [
  { key: "created", label: "Created", n: 1 },
  { key: "scheduled", label: "Scheduled", n: 2 },
  { key: "atc_readiness", label: "ATC Readiness", n: 3 },
  { key: "authorized", label: "Authorized", n: 4 },
  { key: "ready", label: "Ready", n: 5 },
  { key: "in_flight", label: "In Flight", n: 6 },
  { key: "captured", label: "Captured", n: 7 },
  { key: "capture_validation", label: "Capture Validation", n: 8 },
  { key: "evidence_ingest", label: "Evidence Ingest", n: 9 },
  { key: "processing", label: "Processing", n: 10 },
  { key: "twin_generation", label: "Twin Generation", n: 11 },
  { key: "cortex_analysis", label: "Cortex Analysis", n: 12 },
  { key: "passport_commit", label: "Passport Commit", n: 13 },
  { key: "report_output", label: "Report / Output", n: 14 },
  { key: "delivery", label: "Delivery", n: 15 },
];
export const MISSION_TERMINAL = { key: "closed", label: "Closed", n: 16 };

export const stageByKey = (k) =>
  MISSION_STAGES.find((s) => s.key === k) ||
  (k === "closed" ? MISSION_TERMINAL : { key: k, label: k, n: 0 });

/** Why a property stopped moving through the pipeline. */
export const BLOCKER = {
  WEATHER: "Weather hold",
  AUTHORIZATION: "Authorization required",
  EQUIPMENT: "Equipment fault",
  EVIDENCE_INCOMPLETE: "Evidence incomplete",
  PROCESSING_FAILED: "Processing failed",
  HUMAN_REVIEW: "Human review required",
  PASSPORT_CONFLICT: "Passport conflict",
  REPORT_FAILURE: "Report generation failed",
  SHARING_AUTH: "Sharing authorization needed",
};



/** Why a property or mission stopped moving through the pipeline. */
/** Property history is append-only. These events are never silently mutated. */
const TIMELINE_EVENT = [
  "PROPERTY_CREATED", "MISSION_CREATED", "MISSION_APPROVED", "CAPTURE_STARTED",
  "CAPTURE_COMPLETED", "EVIDENCE_INGESTED", "EVIDENCE_VALIDATED", "TWIN_GENERATED",
  "CORTEX_ANALYSIS_COMPLETED", "FINDING_CREATED", "FINDING_VERIFIED", "PASSPORT_UPDATED",
  "REPORT_GENERATED", "HOMEOWNER_NOTIFIED", "PROJECT_CREATED", "CONTRACTOR_AUTHORIZED",
  "REPAIR_STARTED", "REPAIR_COMPLETED", "COMPLETION_EVIDENCE_RECEIVED",
  "PROPERTY_RESCANNED", "OWNERSHIP_TRANSFERRED",
];
