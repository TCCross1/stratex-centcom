/**
 * PASSPORT FIXTURES — canonical property record fixtures.
 * These fixtures preserve the property-level context for the UI while the
 * service contract holds the immutable revision model.
 */
import { iso, ago } from "../../utils/format.js";

export const passportRecord = {
  passportId: "PP-SXP-004182",
  propertyId: "SXP-004182",
  currentRevision: "r14",
  currentRevisionId: "r14",
  integrity: "clean",
  status: "ACTIVE",
  schemaVersion: "1.0",
  integrityState: "clean",
  latestAcceptedAt: iso("2026-08-30"),
  projections: { core: "synced", habitat: "synced" },
  revisions: [
    { id: "PR-14", rev: "r14", committedAt: ago(28), committedBy: "pipeline:cortex", summary: "Mission M-2026-0829-017 findings committed", conflict: false },
    { id: "PR-13", rev: "r13", committedAt: ago(2900), committedBy: "pipeline:core", summary: "Roof replacement completion evidence accepted", conflict: false },
    { id: "PR-12", rev: "r12", committedAt: iso("2026-05-02"), committedBy: "pipeline:twin", summary: "Digital twin V2 registered", conflict: false },
  ],
};
