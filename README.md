# STRATEX CENTCOM

**Command · Control · Intelligence**
Mission control for residential property intelligence. Cross AI Softwares Inc.

---

## Run it

```bash
npm install
npm run dev -- --host
```

`--host` prints a second address like `http://192.168.1.42:5173`. Open that on
your phone while on the same wifi to check the mobile layout.

## Run the tests

```bash
npm test
```

Five domain suites, ~395 assertions. They run on plain Node — no test framework
to install.

| Suite | Assertions |
|---|---|
| Mission Command | 65 |
| Air Traffic Control | 79 |
| Evidence Vault | 107 |
| Property Reality | 144 |
| Property Isolation & Integrity | full sweep |

---

## What this is

CENTCOM is the operational command layer of the Stratex ecosystem. It commands
missions, controls flight readiness, preserves evidence, builds property
reality, and supervises the systems around it.

```
CENTCOM ── commands the ecosystem
  ├── ATC        flight readiness and field operations
  ├── Evidence   the immutable record of what was captured
  ├── Reality    versioned spatial understanding
  ├── Cortex     interpretation of evidence
  ├── Passport   canonical property truth
  ├── Core       the work/execution engine
  ├── Pro        the professional application boundary
  └── Habitat    the homeowner application boundary
```

## Architecture

```
src/
  design/        the visual constitution — tokens, brand assets
  utils/         formatting and identifier helpers
  app/           hooks, router, root composition
  domains/       one canonical model per domain
    shared/        truth classification, review state, RBAC, transport
    property/ mission/ atc/ evidence/ reality/ cortex/ passport/ ...
  components/    reusable command surfaces
  pages/         one module per route
```

**Rules the code holds to:**

- A page never imports a fixture. It calls a service.
- `TRUTH_CLASS` and `REVIEW_STATE` are declared once, in `domains/shared/`.
- Route strings come from `ROUTES`. Nothing hand-builds a URL.
- No file exceeds 750 lines.
- No circular imports.

## Honesty constraints

This system is built to never fake capability. These are enforced by tests, not
just documented:

- **Real SHA-256** over real bytes. Fixture evidence with no bytes reports
  `NOT_COMPUTED_FIXTURE` — never an invented digest.
- **Original evidence is immutable.** Overwrite attempts throw. Review changes
  state, never content.
- **Chain of custody is append-only.**
- **No provider claims to be live** unless it is. Weather, airspace, flight,
  telemetry, storage and reconstruction are all disconnected and say so.
- **Absence of data is never a pass.** Missing telemetry reports UNKNOWN;
  unchecked airspace reports PROVIDER_UNAVAILABLE. Neither reads as "clear."
- **No fabricated geometry.** Point, vertex and face counts are null and render
  as "not computed."
- **Concealed systems are never "observed."** Wiring and plumbing inside walls
  read NOT_OBSERVED with observation class UNKNOWN.
- **Photogrammetric dimensions are DERIVED**, never MEASURED.
- **Comparison without geometry returns INSUFFICIENT_DATA**, never "zero
  changes found."

## Known disconnected providers

| Provider | Mode |
|---|---|
| WeatherProvider | FIXTURE |
| AirspaceProvider | DISCONNECTED |
| FlightProvider | DISCONNECTED |
| AircraftTelemetryProvider | DISCONNECTED |
| SensorProvider | FIXTURE |
| EvidenceStorageProvider | IN_MEMORY_STORAGE |
| EvidenceSourceProvider | FIXTURE |
| PropertyRealityProcessingProvider | FIXTURE |
| CoreReportAdapter / Core / Pro / Habitat | not connected |

All fixture data is flagged `sourceMode: "FIXTURE"` and surfaced as such in the UI.

## Naming note

The three digital twin types use working identifiers (`TWIN_TYPE_A/B/C`) with
placeholder labels. `permanentNameLocked: false` on every entry, and a test
enforces it. **These are not product names.**

## Branding

Approved artwork lives in `public/brand/`. Only `stratex-centcom-logo.png` is
supplied. The others are registered `official: false` and render a clearly
labelled temporary boundary rather than an approximation.

---

© Cross AI Softwares Inc.
