/**
 * TIMELINE SERVICE — append-oriented property history.
 */
import { timelineEvents } from "./fixtures.js";
import { serve } from "../shared/transport.js";

export const TimelineService = {
  listByProperty: (propertyId) => serve(() => timelineEvents),
};
export default TimelineService;
