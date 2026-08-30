/**
 * SHARING SERVICE — authorization, not ownership.
 * A professional receives what the work requires, for as long as the work
 * requires it, and never authority over Passport.
 */
import { grants } from "./fixtures.js";
import { serve } from "../shared/transport.js";

export const SharingService = {
  listByProperty: (propertyId) =>
    serve(() => grants.filter((g) => g.propertyId === propertyId)),
  listActive: () => serve(() => grants.filter((g) => g.status === "ACTIVE")),
};
export default SharingService;
