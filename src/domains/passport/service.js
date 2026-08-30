/**
 * PASSPORT SERVICE — the canonical property record.
 * Core and Cortex write through controlled pathways. Professionals never write
 * here at all. History is revised, never overwritten.
 */
import { passportRecord } from "./fixtures.js";
import { serve } from "../shared/transport.js";

export const PassportService = {
  getByProperty: (propertyId) => serve(() => passportRecord),
  listRevisions: (propertyId) => serve(() => passportRecord.revisions),
};
export default PassportService;
