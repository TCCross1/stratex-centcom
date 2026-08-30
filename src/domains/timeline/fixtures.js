/**
 * TIMELINE FIXTURES. Property history is append-only.
 */
import { iso, ago } from "../../utils/format.js";

export const timelineEvents = [
  { id: "TL-91", type: "CORTEX_ANALYSIS_COMPLETED", at: ago(28), detail: "CX-0330 complete • 6 findings • cortex-core-3.2" },
  { id: "TL-90", type: "EVIDENCE_VALIDATED", at: ago(52), detail: "EP-017 sealed • 902 assets • hashes verified" },
  { id: "TL-89", type: "CAPTURE_COMPLETED", at: ago(96), detail: "M-2026-0829-017 • 100% coverage" },
  { id: "TL-88", type: "TWIN_GENERATED", at: ago(120), detail: "Digital twin V3 generated" },
  { id: "TL-87", type: "REPAIR_COMPLETED", at: iso("2026-08-12"), detail: "Roof replacement — Bluegrass Roofing LLC" },
  { id: "TL-86", type: "CONTRACTOR_AUTHORIZED", at: iso("2026-07-19"), detail: "Bluegrass Roofing LLC granted scoped access" },
  { id: "TL-85", type: "PROPERTY_CREATED", at: iso("2026-02-11"), detail: "STRATEX_PROPERTY_ID SXP-004182 issued" },
];

/** category: MISSION|ATC|EVIDENCE|CORTEX|PASSPORT|CORE|PRO|HABITAT|PROPERTY|SYSTEM
 *  severity: info|low|medium|high|critical
 *  target:   where clicking the alert takes the operator */
