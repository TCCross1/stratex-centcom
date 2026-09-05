/**
 * CORE PACKET CONTRACT — chrome copy, page ids, Habitat exclusions.
 *
 * Visual master: 1920×1080 classified instrument panel. Header / footer /
 * identity bar copy is locked here so JSX never improvises brand language.
 */

export const PACKET_TOTAL_PAGES = 27;

export const PACKET_AUDIENCE = {
  PRO: "PRO",
  HABITAT: "HABITAT",
  CENTCOM: "CENTCOM",
};

/** Skeleton pages from the visual master (canon art pages 2–5). */
export const PACKET_PAGE = {
  OPENINGS_ENERGY: 2, // Skeleton D
  AWE: 3,             // Skeleton B
  BID_DESK: 4,        // Skeleton C — Pro only
  TWIN_THERMAL: 5,    // Skeleton A
};

/** Habitat never receives takeoff / labor / materials desk pages. */
export const HABITAT_SKIP_PAGES = [4, 21, 22];

export const PACKET_CHROME = {
  product: "STRATEX CORE",
  productLeft: "STRATEX",
  productRight: "CORE",
  tagline: "EVIDENCE. INSIGHT. ACTION.",
  classification: "OPERATIONS // CONTROLLED",
  commandLine: "COMMAND • CONTROL • INTELLIGENCE",
  passportLine: "STRATEX PASSPORT — THE CANONICAL PROPERTY RECORD",
  identityMicro: "Evidence. Insight. Action.",
  chambers: [
    { key: "CUSTODY", label: "CUSTODY", caption: "CHAINED" },
    { key: "PASSPORT", label: "PASSPORT SYNC", caption: "RECORD" },
    { key: "AI", label: "AI-ASSISTED", caption: "CORTEX" },
    { key: "NEXT", label: "NEXT SCAN", caption: "MISSION" },
    { key: "PREPARED", label: "PREPARED BY", caption: "OPERATOR" },
  ],
};

export const PACKET_TITLES = {
  2: "OPENINGS · ENERGY ENVELOPE",
  3: "AIR · WATER · ENERGY",
  4: "SCOPE DESK · MATERIALS / LABOR",
  5: "TWIN · THERMAL INSTRUMENT",
};

export const PACKET_PACKAGE = "COMPREHENSIVE PROPERTY INTELLIGENCE";
