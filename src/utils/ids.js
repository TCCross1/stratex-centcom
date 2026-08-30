/**
 * Identifier helpers.
 *
 * The canonical stored and routed value for a property is `stratexPropertyId`
 * (for example SXP-004182). What an operator READS is produced here, so the
 * human-readable format can evolve without touching a single reference
 * anywhere else in the system.
 */

export const formatPropertyId = (property) =>
  property?.displayId || property?.stratexPropertyId || "—";

/** Route/tab slug for a display name: "Reality Twin" -> "reality-twin". */
export const tabSlugOf = (name) => name.toLowerCase().replace(/\s+/g, "-");

/** Match a slug back to its display name from a list of tab names. */
export const tabFromSlug = (tabs, slug) => tabs.find((t) => tabSlugOf(t) === slug);
