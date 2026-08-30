/**
 * PASSPORT FIXTURES — the canonical property record.
 * One property. One record. One truth — which means one canonical history with
 * revisions, not one mutable row.
 */
import { iso, ago } from "../../utils/format.js";

export const passportRecord = {
  propertyId: "SXP-004182",
  currentRevision: "r14",
  integrity: "clean",
  projections: { core: "synced", habitat: "synced" },
  revisions: [
    { id: "PR-14", rev: "r14", committedAt: ago(28), committedBy: "pipeline:cortex", summary: "Mission M-2026-0829-017 findings committed", conflict: false },
    { id: "PR-13", rev: "r13", committedAt: ago(2900), committedBy: "pipeline:core", summary: "Roof replacement completion evidence accepted", conflict: false },
    { id: "PR-12", rev: "r12", committedAt: iso("2026-05-02"), committedBy: "pipeline:twin", summary: "Digital twin V2 registered", conflict: false },
  ],
};
