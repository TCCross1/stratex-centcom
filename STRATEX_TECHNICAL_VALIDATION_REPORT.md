# STRATEX TECHNICAL VALIDATION REPORT

**Prepared for:** investor technical diligence
**Audit date (UTC):** 2026-09-11T05:30:34Z
**Repository audited:** `TCCross1/stratex-centcom`, HEAD `a69d35247d666f18b6d57038acc1645b7da6b12f`, branch `copilot/stratex-technical-validation-audit`
**Method:** Direct inspection of source, direct execution of install/build/test commands, no reliance on prior status reports, marketing copy, or README claims without independent re-verification.

This report intentionally does not soften findings. Where a capability is a fixture, it is labeled a fixture. Where a claim in the repository's own README was checked, the check and its result are shown.

---

## 1. Scope limitation (read first)

Only **one** repository was available: `stratex-centcom`. It is a Vite/React single-page application representing the CENTCOM "command layer." There is no Pro repository, no Habitat repository, no Core/Cortex backend, and no reconstruction-engine repository in this environment. Every statement below about Pro, Habitat, Core, or reconstruction is a statement about **how CENTCOM references them**, not about their own codebases, because those codebases were not provided. See `STRATEX_REPOSITORY_INVENTORY.md` for full detail.

---

## 2. Architecture validation

### 2.1 Claimed pipeline

> Capture/DJI input → ATC → Reality Foundry/reconstruction interfaces → Cortex → **Core** → Passport → Comprehensive Property Intelligence Report → 3D Digital Twin + Layers → standalone Stratex Pro and Stratex Habitat.

### 2.2 What is actually present in code

| Stage | Present in code? | Evidence |
|---|---|---|
| Capture / DJI input | Data **model** only (fixture evidence named `DJI_0412.JPG`, aircraft IDs `AC-M4TD-01/02`); no DJI SDK, no ingestion pipeline | `src/domains/evidence/vault-fixtures.js:17-174`, `src/domains/atc/providers.js:100-128` (`AircraftTelemetryProvider`, mode `DISCONNECTED`) |
| ATC | Real state machine and readiness policy logic; all upstream data providers (weather, airspace, flight, telemetry, sensor) are `FIXTURE` or `DISCONNECTED` | `src/domains/atc/readiness.js`, `src/domains/atc/policy.js`, `src/domains/atc/providers.js:14-19` |
| Reality Foundry / reconstruction interfaces | Type registry and provider **contract** exist; no photogrammetry/LiDAR/CAD engine is connected; provider vendor field literally states `"development fixture — no reconstruction engine connected"` | `src/domains/reality/types.js`, `src/domains/reality/providers.js:20-24` |
| Cortex | Query/read logic over fixture findings/analyses; no model, no inference, no confidence computation beyond static fixture values | `src/domains/cortex/service.js`, `src/domains/cortex/fixtures.js` |
| **Core** | Represented **only** by a client-side adapter returning fixed status strings; `connected: false`. No execution engine exists in this repository. | `src/domains/core/adapter.js:9-10` |
| Passport | Read-only service over a single hard-coded property record (`SXP-004182`); no write path exposed here | `src/domains/passport/service.js`, `src/domains/passport/fixtures.js` |
| Comprehensive Property Intelligence Report | Eligibility/manifest **decision logic** exists (which report modules qualify and why); no renderer, no PDF generation; `CoreReportAdapter.connected = false` and `requestReport()` always rejects | `src/domains/reports/manifest.js`, `src/domains/reports/service.js:40-49` |
| 3D Digital Twin + Layers | Type/state vocabulary and layer list defined (`TWIN_LAYERS`, 20 layers); "PropertyRealityViewer" component is a stub with no 3D rendering engine wired | `src/domains/reality/types.js:27-31`; component confirmed as stub (no Three.js/WebGL dependency in `package.json`) |
| Stratex Pro (standalone) | Referenced only via `ProAdapter`, `connected: false`, generates a static mock deep-link URL | `src/domains/pro/adapter.js` |
| Stratex Habitat (standalone) | Referenced only via `HabitatAdapter`, `connected: false`, generates a static mock deep-link URL | `src/domains/habitat/adapter.js` |

### 2.3 Is Core embedded inside CENTCOM between Cortex and Passport?

**Confirmed by design intent, not by working software.** `src/domains/core/adapter.js` header comment states: *"CENTCOM supervises the engine; it does not run it."* Passport's fixture record shows a revision committed by `pipeline:core` (`passport/fixtures.js:15`), consistent with Core sitting between Cortex and Passport in the data flow. However, **no executable engine exists** — `CoreAdapter` returns static strings (`"Scope computed"`, `"Complete • 41 surfaces"`) with `connected: false` (`core/adapter.js:9-34`). The architectural *position* is correctly modeled; the *engine* is not built.

### 2.4 Are Pro and Habitat standalone product applications?

**Confirmed as intended architecture, not as verified fact.** Both adapters explicitly document that their real applications are separate and "not built inside CENTCOM" (`pro/adapter.js:1-6`, `habitat/adapter.js:1-4`). No such applications were available to inspect. Their deep-link URLs (`https://pro.stratex.app/...`, `https://habitat.stratex.app/...`) are hard-coded strings in fixture data, not evidence that those domains/services exist or resolve.

---

## 3. Subsystem classification

Classification legend: **IMPLEMENTED** (real logic, real data path, would work against a live backend) · **IMPLEMENTED / MOCK DATA** (real logic, but all data is fixture) · **PARTIAL** (real but incomplete, e.g. read-only or missing enforcement) · **DESIGNED / NOT IMPLEMENTED** (types/contracts exist, no working logic) · **BLOCKED BY REAL FIELD DATA** (cannot be meaningfully completed without real DJI captures).

| Domain | Classification | Basis |
|---|---|---|
| ATC | IMPLEMENTED / MOCK DATA | Real readiness state machine (`readiness.js`, 322 lines) and mission-gating policy; all 5 upstream providers are FIXTURE/DISCONNECTED |
| Evidence Vault | IMPLEMENTED / MOCK DATA | Real SHA-256 hashing (`integrity.js:38-50`), real immutability enforcement (`storage.js:56-57`), real append-only custody (`vault.js`); storage backend is an in-memory `Map`, source data is fixture |
| Mission | IMPLEMENTED / MOCK DATA | Real 15-stage lifecycle state machine with whitelisted transitions (`lifecycle.js`); history is fixture-seeded once at module load (`history.js:111-127`), does not grow with real activity |
| Reality / Digital Twin | IMPLEMENTED / MOCK DATA | Real type/version model, real property-scoping and eligibility rules; `PropertyRealityProcessingProvider.mode = FIXTURE`; every produced descriptor is explicitly `isSimulated: true` with null point/vertex/face counts (`reality/providers.js:36-54`) |
| Cortex | IMPLEMENTED / MOCK DATA | Real query/filter logic over analyses/findings; all analyses, findings, confidence values are static fixtures (`cortex/fixtures.js`); no inference engine exists |
| Core | DESIGNED / NOT IMPLEMENTED | Only a status-returning adapter stub; `connected: false`; no measurement/takeoff/estimating engine present |
| Passport | PARTIAL | Read-only over one fixture property record; no write path, no conflict resolution, no multi-property support demonstrated |
| Comprehensive Property Intelligence Report | DESIGNED / NOT IMPLEMENTED | Manifest/eligibility decision logic is real; no rendering/PDF generation exists; `CoreReportAdapter.connected = false`, `requestReport()` always rejects (`reports/service.js:47-48`) |
| Pro (standalone) | DESIGNED / NOT IMPLEMENTED | Client-side stub adapter only; no separate codebase provided |
| Habitat (standalone) | DESIGNED / NOT IMPLEMENTED | Client-side stub adapter only; no separate codebase provided |
| Property / directory | IMPLEMENTED / MOCK DATA | Real aggregation/summary logic (`property/service.js`); all rows are fixture |
| Measurements | IMPLEMENTED / MOCK DATA | Real truth-class accounting; fixture measurement values |
| AWE (Automated Weather/Energy — as named in code) | IMPLEMENTED / MOCK DATA | Real query logic; scoring explicitly fixture (`aweByProperty` fixtures) |
| Work (projects/repairs/maintenance) | IMPLEMENTED / MOCK DATA | Real grouping/filtering logic over fixture project/repair/maintenance rows |
| Sharing | IMPLEMENTED / MOCK DATA | Real scope/grant logic over fixture grants |
| Audit | PARTIAL / MOCK DATA | Read-only listing; no independent immutability enforcement observed in this module (append-only is a documented convention, not a mechanism inside `audit/service.js`) |
| Timeline | PARTIAL / MOCK DATA — **property isolation gap** | `TimelineService.listByProperty(propertyId)` **ignores its `propertyId` parameter and returns all events regardless of property** (`src/domains/timeline/service.js:8`). This is a real, present-day bug, not a field-data blocker, and it contradicts the "no cross-property bleed" architectural rule enforced elsewhere. |
| Shared (classification, RBAC, transport, states) | IMPLEMENTED | Pure, fixture-free vocabulary/policy definitions (`TRUTH_CLASS`, `REVIEW_STATE`, `ROLE_SCOPES`); these are real and load-bearing, but **RBAC is defined and displayed, not enforced** — `ROLE_SCOPES` is referenced in exactly one place in the whole app, a read-only admin panel table (`components/panels/DownstreamPanels.jsx:170`), not in any route guard or service call |
| Authentication / session | DESIGNED / NOT IMPLEMENTED | `centcomApi.getSession()` resolves a hard-coded fixture object (`src/domains/index.js:41-42`); no login flow, no identity provider, no token validation anywhere in the codebase |

---

## 4. Every mocked / simulated / stubbed / synthetic-data dependency identified

Grep-verified marker classes and representative locations (not exhaustive line lists — full detail in `STRATEX_TEST_AND_BUILD_EVIDENCE.md`):

- **`sourceMode: "FIXTURE"`** — `reality/providers.js:48`, and stamped onto every ATC provider payload via `stamp()` (`atc/providers.js:26-30`)
- **`isSimulated: true`** — every reconstruction artifact descriptor (`reality/providers.js:49`)
- **`PROVIDER_MODE.DISCONNECTED`** — `AirspaceProvider` (`atc/providers.js:54`), `FlightProvider`, `AircraftTelemetryProvider` (`atc/providers.js:100`)
- **`connected: false`** — `CoreAdapter` (`core/adapter.js:10`), `ProAdapter` (`pro/adapter.js:10`), `HabitatAdapter` (`habitat/adapter.js:10`), `CoreReportAdapter` (`reports/service.js:41`)
- **`STORAGE_MODE.IN_MEMORY_STORAGE`** — `evidence/storage.js:49`; storage is a JS `Map`, not a database or object store
- **`HASH_STATE.NOT_COMPUTED_FIXTURE`** — `evidence/integrity.js:16,77-83` — fixture evidence never gets a fabricated hash
- **`"vendor": "development fixture — no reconstruction engine connected"`** — `reality/providers.js:23`
- **Deterministic DJI-named fixtures** — `DJI_0412.JPG`, `DJI_0412_R.JPEG`, `AC-M4TD-01/02` throughout `evidence/vault-fixtures.js` and `evidence/fixtures.js` — filenames only, no real image bytes, no EXIF/RTK metadata parsing
- **Working (non-final) product names** — the three digital twin types are `TWIN_TYPE_A/B/C` with `permanentNameLocked: false`, enforced by a test (`reality/types.js:16`, README "Naming note")
- **Non-final brand assets** — only `stratex-centcom-logo.png` is `official: true`; all other brand assets are `official: false` (README "Branding")
- **Heuristic, unvalidated scoring** — the ATC thermal-suitability prediction explicitly disclaims itself: *"Predicted suitability from a development heuristic. Not a calibrated or scientifically validated model"* (`atc/policy.js:82-83`)
- **Hard-coded session/identity** — `centcomApi.getSession()` (`src/domains/index.js:41-42`)

---

## 5. What specifically requires real DJI property scans

| Requirement in directive | Current state | What real capture would change |
|---|---|---|
| M4E/M4T imagery | Fixture filenames only (`DJI_0412.JPG`); no real image files, no image processing | Would require an actual ingestion path (upload/API), not currently implemented anywhere |
| RTK metadata | ATC readiness references `GPS_RTK` category and an `rtkState` field, but values are canned strings (`"READY"`/`"UNAVAILABLE"`) in fixtures | Real telemetry would need `AircraftTelemetryProvider` connected (currently `DISCONNECTED`) |
| Reconstruction outputs (point clouds, meshes, orthomosaics) | `PropertyRealityProcessingProvider` returns descriptors with `pointCount`, `vertexCount`, `faceCount`, `resolution` **all explicitly null** — the code refuses to invent these numbers | Requires an actual photogrammetry/LiDAR engine; none exists in any provided repository |
| Radiometric R-JPEG thermal data | Evidence model defines `THERMAL_RJPEG` as an artifact type; fixture assets reference thermal filenames and a "Thermal 640x512" sensor label, but no radiometric decoding logic exists | Requires real R-JPEG files and a radiometric parser, neither present |
| Semantic geometry / Property Object Graph object extraction | Not implemented; no object-graph extraction code found anywhere in `src/domains/reality` or `src/domains/cortex` | This is a from-scratch build, and its accuracy cannot be validated without real reconstructed geometry to extract from |
| Real-world measurement tolerances | `measurements` domain enforces a `TRUTH_CLASS` distinction (MEASURED vs DERIVED vs PROBABLE) but has no real measurement source to validate tolerance against; all values are fixture | Tolerance/accuracy claims are currently unverifiable and unverified — none should be made |
| Cortex findings/confidence | Confidence values exist only as static fixture numbers on `PROBABLE` findings; no model producing them | Cannot be validated as "real" confidence until Cortex runs against real evidence |
| Core quantity/estimate validation | `CoreAdapter` returns static strings like `"Complete • 41 surfaces"`; no computation occurs | Entirely blocked — Core does not exist as an engine in this codebase |
| Passport truth promotion | Revision history is fixture; the write path from Cortex/Core into Passport is documented as a rule, not demonstrated as working code path with real inputs | Needs real upstream findings to promote; current revisions are pre-baked |
| Report accuracy | No renderer exists; `requestReport()` always rejects | N/A until Core report generation exists; nothing to validate for accuracy yet |
| Pro/Habitat real property synchronization | Both adapters return static mock sync status (`"synced"`, `syncFailures: 0`) with `connected: false` | Cannot be assessed at all without the actual Pro/Habitat codebases and a live property |
| Before/after verification workflows | `work/fixtures.js` references "completion evidence" and Passport revisions tied to repair completion, but this is fixture data illustrating the intended shape, not a working verification pipeline | Requires real before/after captures and a real comparison engine (`ComparisonProvider`, currently `mode: FIXTURE`, `isLive: () => false`, `evidence/... "no geometric difference computation is performed"`) |

See `STRATEX_FIELD_DATA_BLOCKERS.md` for the full blocker-by-blocker breakdown.

---

## 6. Remaining software work that does NOT depend on field data

These items are conventional engineering work that can and should be completed **before** or **independent of** obtaining real DJI scans:

1. **Fix the timeline property-isolation bug** — `TimelineService.listByProperty()` ignores its parameter and returns all events for all properties (`src/domains/timeline/service.js:8`). This directly violates the "no cross-property bleed" invariant enforced everywhere else and should be fixed immediately; it is a software bug, not a data-availability issue.
2. **Enforce RBAC, don't just declare it.** `ROLE_SCOPES`/`can()` exist (`shared/rbac.js`) but are referenced in exactly one read-only UI panel and nowhere else — no route guard, no service-call authorization check anywhere in `src/app` or `src/domains`.
3. **Implement real authentication/session management.** `getSession()` is a hard-coded fixture (`domains/index.js:41-42`); there is no login, token, or identity-provider integration.
4. **Add TypeScript or at least a static type-checking layer.** No `tsconfig.json` exists; all ~60 source files are untyped `.js`/`.jsx`.
5. **Add a linter.** No `.eslintrc*` exists; code style is convention-only.
6. **Add CI/CD.** No `.github/workflows/*` exists; there is no automated gate on tests, build, or lint for any pull request.
7. **Persist evidence storage to a real database/object store.** `EvidenceStorageProvider` is a JS `Map` that vanishes on process restart (`evidence/storage.js:44-49`). Building the real storage contract implementation is pure engineering work — the *interface* is already defined and does not require field data to implement.
8. **Build the Core report renderer and manifest execution.** `ReportManifestService` decision logic is real; the actual rendering/PDF generation step (`CoreReportAdapter`) does not exist and is conventional software engineering, not something requiring field data per se (though its content will need real evidence to populate later).
9. **Wire provider health monitoring into the UI.** Every provider defines a `health()` method (e.g. `atc/providers.js` health endpoints, `reality/realityProviderHealth()`), but nothing polls or surfaces them on an operational dashboard.
10. **Expand fixture data to multiple properties for realistic multi-tenant testing**, and add tests that exercise Passport's write/conflict path (currently read-only in this codebase).
11. **Address the two npm audit vulnerabilities** (see §7) — moderate/high severity in `esbuild`/`vite` dev dependencies, fixable via a version bump, unrelated to field data.
12. **Resolve the architectural ambiguity around Pro/Habitat/Core repositories.** If they exist elsewhere, produce them for audit; if they don't yet exist, that is itself a major scope item independent of field-data availability.

None of the above requires a drone flight to complete.

---

## 7. Build, test, and security evidence (summary — full detail in `STRATEX_TEST_AND_BUILD_EVIDENCE.md`)

- `npm install` — succeeded, 63 packages added, 2 vulnerabilities reported (1 moderate, 1 high, both in `esbuild`/`vite` dev tooling).
- `npm test` (`node scripts/run-tests.mjs`) — **all 5 suites pass**: Mission 65/65, ATC 79/79, Evidence Vault 107/107, Property Reality 144/144, Property Isolation full sweep pass. Total 395 discrete `check()` assertions across the four counted suites, independently re-run and confirmed, matching the README's claim.
- `npm run build` (`vite build`) — succeeded, produced `dist/index.html` and one 666.82 kB JS bundle (171.61 kB gzip), with a Vite warning about chunk size (no code-splitting configured).
- No lint command exists to run (no ESLint config).
- No TypeScript command exists to run (no `tsconfig.json`).
- No CI workflow exists to reference — the audit ran these commands directly and is the first independent execution/verification of this claim on record in this environment.

---

## 8. Cross-cutting audits

| Area | Finding | Evidence |
|---|---|---|
| Evidence lineage | Property → mission → capture → evidence → (analysis/finding) → Passport revision chain is fully modeled with ID references at every hop | `evidence/vault-fixtures.js`, `cortex/fixtures.js:16-71`, `passport/fixtures.js:14-17` |
| Audit/version history | `audit/service.js` is read-only listing; Passport revisions are append-style (`r12`→`r13`→`r14`) but no separate audit-service enforcement mechanism was found beyond convention | `audit/service.js`, `passport/fixtures.js` |
| Property isolation | Enforced and tested for 15 of 16 scoped record types via `isolation.test.mjs`; **Timeline is the one confirmed exception** (§3, §6) | `src/domains/isolation.test.mjs:30-40`, `timeline/service.js:8` |
| Security controls | RBAC model defined, not enforced (§6); no authentication; no server-side anything (this is a client-only SPA with an in-memory data layer) | `shared/rbac.js`, `domains/index.js:41-42` |
| Data contracts | Every provider/adapter declares an explicit mode/interface (`PROVIDER_MODE`, `STORAGE_MODE`) — a genuinely good practice that makes swapping in real backends traceable | `atc/providers.js:14-19`, `evidence/storage.js:14-20` |
| API boundaries | No real API layer exists; `serve()` (`shared/transport.js`) is an in-process `Promise`/`setTimeout` wrapper simulating network latency (260ms), not an HTTP client | `shared/transport.js:9-22` |
| Failure handling | `serve()` supports a `fail` flag and providers throw explicit errors when disconnected/live-but-unimplemented (`reality/providers.js:62`); UI has an error boundary (`Boundary` component in `App.jsx`) | `shared/transport.js`, `reality/providers.js:56-63` |
| Persistence | None beyond in-memory `Map`/arrays reset on process restart; no database anywhere in the stack | `evidence/storage.js:44-49`, all `*/fixtures.js` |
| Report generation | Decision/eligibility logic real; no renderer; no report ever produced | `reports/manifest.js`, `reports/service.js:40-49` |
| Deployment/configuration assumptions | No environment-variable-driven config found; no Dockerfile, no infra-as-code, `vite.config.js` is default/minimal | `vite.config.js` |
| Third-party dependency risk | Only 2 runtime deps (`react`, `react-dom`) and 2 dev deps (`vite`, `@vitejs/plugin-react`); `npm audit` shows esbuild/vite dev-only vulnerabilities (moderate/high), fixable with a breaking upgrade path (`npm audit fix --force` → Vite 8) | `package.json:11-12`, `npm audit` output |

---

## 9. Final investor-diligence conclusion

**A. What is demonstrably built today?**
A single-repository React/Vite front-end (`stratex-centcom`) with a genuinely well-structured domain layer: real state machines (mission lifecycle, ATC readiness), real cryptographic evidence hashing (SHA-256 via WebCrypto), real property-scoping/isolation enforcement (verified by a passing 395-assertion, 5-suite test run), real truth-classification discipline (MEASURED/DERIVED/PROBABLE), and a consistent, explicit convention for labeling every mock, fixture, and disconnected provider. The build succeeds and all existing tests pass.

**B. What works using synthetic/mock data?**
Everything that touches an external system or produces a data value: ATC's weather/airspace/flight/telemetry/sensor providers, Evidence's storage and DJI-style source ingestion, Reality's reconstruction pipeline (point clouds/meshes/orthomosaics — all descriptor-only with null counts), Cortex's findings/confidence, Passport's single fixture property record, and Core/Pro/Habitat's status adapters. This is the large majority of what an investor would see as "the product working."

**C. What remains conventional software engineering work (independent of field data)?**
Authentication, RBAC enforcement, a real persistence layer, TypeScript/lint/CI tooling, the Core report renderer, provider health monitoring, the timeline property-isolation bug fix, and dependency-vulnerability remediation. This is real, scoped, doable work that does not require a drone flight — see §6.

**D. What specifically cannot be responsibly completed or validated without real property scans?**
Any claim of measurement accuracy or tolerance, any claim about reconstruction fidelity (point cloud density, mesh quality, orthomosaic resolution), radiometric thermal interpretation, semantic/object-graph extraction from real geometry, Cortex confidence calibration against real findings, Core quantity/estimate correctness, Passport truth-promotion behavior under real conflicting inputs, and any before/after verification claim. See `STRATEX_FIELD_DATA_BLOCKERS.md`.

**E. Is it technically reasonable to state: "Stratex has reached the pre-field-validation boundary, where the next meaningful development stage requires real-world property capture data"?**

**Partially, with material caveats — not as an unqualified statement.** The domain logic, state machines, and honesty-by-construction patterns in `stratex-centcom` are genuinely at a point where real capture data would meaningfully advance the reconstruction/Cortex/Core/report chain. However, that statement **cannot be made about the whole platform**, because:
- Authentication, RBAC enforcement, persistence, CI/lint/type-checking, and the Core report renderer are **not field-data-blocked** — they are unstarted or partially-started conventional engineering work that should happen regardless of when field data arrives.
- Core, Pro, and Habitat exist in this audit only as client-side stubs; their actual state is unknown and unverifiable from what was provided.
- A real, present-day bug exists (timeline cross-property isolation) that has nothing to do with field data and should be fixed first.

The correct, non-inflated framing for investors is: **"The CENTCOM domain-modeling and evidence-handling layer has reached a point where its reconstruction, Cortex, and Core-facing interfaces are ready to be exercised by real capture data — but the platform as a whole has not reached a field-validation boundary, because material non-field-dependent engineering (auth, persistence, CI, Core/Pro/Habitat implementation) remains open and unverified."**

---

## 10. Determination

**Ready to enter funded field-validation phase: PASS WITH CONDITIONS**

Conditions:
1. Fix the confirmed timeline property-isolation defect before any real multi-property field data is ingested.
2. Implement real authentication and enforce the already-defined RBAC before any real property data (which is sensitive) is loaded into this system.
3. Replace in-memory storage with real persistence before treating any field-validation run as durable/auditable.
4. Produce (or provide for audit) the actual Pro, Habitat, and Core repositories — their current absence means no investor claim about "the full platform" can be verified.
5. Do not present any reconstruction, measurement, or confidence output as accurate until it has been validated against real captures with documented tolerance testing.
