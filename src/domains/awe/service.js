/**
 * AWE SERVICE — Air, Water, Energy.
 * Scores are development fixtures and are flagged as such on every record via
 * `scoreIsFixture`. The UI must surface that flag, not hide it.
 */
import { aweByProperty, aweEmpty } from "./fixtures.js";
import { serve } from "../shared/transport.js";

export const AweService = {
  listByProperty: (propertyId) =>
    serve(() => aweByProperty[propertyId] || aweEmpty),
};
export default AweService;
