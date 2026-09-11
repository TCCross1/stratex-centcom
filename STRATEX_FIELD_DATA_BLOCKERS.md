# STRATEX FIELD DATA BLOCKERS

**Purpose:** Enumerate, with code citations, exactly which capabilities in `stratex-centcom` cannot be completed or validated without real DJI property scans — as distinct from work that is merely unfinished software engineering (see the companion technical report §6 for that list).

A "blocker" here means: the code has a defined seam/interface for the real capability, but the only way to prove that seam works correctly is to feed it real capture data. Fixture data can exercise the *shape* of these systems but can never validate their *correctness*.

---

## 1. M4E/M4T imagery ingestion

- **Current state:** Fixture evidence assets carry filenames modeled on real DJI output naming (`DJI_0412.JPG`, `DJI_0088.JPG`) and aircraft IDs `AC-M4TD-01`/`AC-M4TD-02` (`src/domains/evidence/vault-fixtures.js:17-174`, `src/domains/evidence/fixtures.js:30-91`). No actual image bytes exist; `byteSize` fields are fixture numbers (e.g. `byteSize: 11200000`), not measured from real files.
- **Why field data is required:** There is no way to validate that an ingestion path correctly parses real M4E/M4T output (file structure, EXIF, sensor tags) without real files from the aircraft. This is not a logic gap that can be closed with more fixture design — it requires actual captured imagery.

## 2. RTK metadata

- **Current state:** ATC readiness checks a `GPS_RTK` category (`src/pages/atc/AtcMissionDetailPage.jsx:233`) and displays an `rtkState` field per capture frame (`AtcMissionDetailPage.jsx:443`). `AircraftTelemetryProvider` is `DISCONNECTED` (`src/domains/atc/providers.js:100-128`); all RTK values seen in fixtures are canned strings such as `"READY"`.
- **Why field data is required:** RTK fix quality, latency, and correction-stream behavior can only be validated against a live GPS/RTK telemetry stream from an actual aircraft in the field. No amount of fixture data proves the telemetry provider contract is correct against real hardware.

## 3. Reconstruction outputs (general)

- **Current state:** `PropertyRealityProcessingProvider.mode = FIXTURE` (`src/domains/reality/providers.js:22`). `produceDescriptor()` explicitly sets `pointCount: null, vertexCount: null, faceCount: null, resolution: null` and stamps `isSimulated: true` with the notice `"SIMULATED DERIVED ARTIFACT — no photogrammetry, LiDAR or CAD processing was performed."` (`reality/providers.js:36-53`).
- **Why field data is required:** There is no reconstruction engine in any repository provided to this audit. Building and validating one requires real overlapping imagery/LiDAR from real property flights — this is a hard blocker, not a software-only gap.

## 4. Point clouds

- **Current state:** `SPATIAL_ARTIFACT_TYPE.POINT_CLOUD` is a defined enum value (`reality/types.js:19`); format is recorded as `"LAS/LAZ (descriptor only)"` (`reality/providers.js:78`); `pointCloudSource` can be `POINT_CLOUD_SOURCE.FIXTURE_POINT_CLOUD` only.
- **Why field data is required:** Point density, noise characteristics, and registration accuracy are properties of a real capture and real processing run; cannot be fabricated or approximated meaningfully with fixtures.

## 5. Meshes

- **Current state:** `MESH`/`TEXTURED_MESH` artifact types defined, format recorded as `"OBJ (descriptor only)"`/`"glTF (descriptor only)"` (`reality/providers.js:79-80`). No mesh geometry is ever generated.
- **Why field data is required:** Mesh fidelity (watertightness, topology correctness, texture alignment) is inseparable from the quality of the source imagery/point cloud it's built from.

## 6. Orthomosaics

- **Current state:** `ORTHOMOSAIC` artifact type defined, format `"GeoTIFF (descriptor only)"` (`reality/providers.js:81`). No orthomosaic is ever stitched.
- **Why field data is required:** Orthomosaic geometric accuracy depends on real overlapping aerial imagery and ground control — nothing fixture-based can validate this.

## 7. Radiometric R-JPEG thermal data

- **Current state:** `THERMAL_RJPEG` is a defined artifact/origin type (`src/domains/evidence/model.js:30`); fixture thermal assets (e.g. `DJI_0412_R.JPEG`, sensor `"Thermal 640x512"`) exist as filenames/metadata only (`evidence/fixtures.js:37-43`). No radiometric decoding (temperature-per-pixel extraction) logic exists anywhere in the codebase.
- **Why field data is required:** Radiometric calibration, environmental compensation (ambient temp, emissivity, reflected temp), and interpretation of a real R-JPEG payload can only be built and validated against real DJI thermal captures.

## 8. Semantic geometry

- **Current state:** Not implemented. No code in `src/domains/reality` or `src/domains/cortex` performs semantic labeling of geometry (e.g. identifying "this mesh region is a roof plane," "this is a window").
- **Why field data is required:** This is a from-scratch capability that depends on having real reconstructed geometry to label in the first place — it is blocked transitively by reconstruction (§3) and cannot be prototyped meaningfully on synthetic geometry alone if the goal is real-world accuracy.

## 9. Property Object Graph object extraction

- **Current state:** No object-graph extraction logic found in the codebase. `TWIN_LAYERS` (`reality/types.js:27-31`) defines a *vocabulary* of 20 layers (roof, exterior envelope, windows, doors, HVAC, electrical, plumbing, foundation, drainage, etc.) but there is no code that extracts or populates these layers from geometry.
- **Why field data is required:** Object extraction accuracy is only meaningful when measured against real structures; fixture "layers" are just labeled empty categories today.

## 10. Real-world measurement tolerances

- **Current state:** `measurements` domain enforces the `TRUTH_CLASS` distinction (`MEASURED` vs `DERIVED` vs `PROBABLE`) as a matter of policy (`shared/classification.js`), and the README states "Photogrammetric dimensions are DERIVED, never MEASURED" as a design rule. No actual tolerance/accuracy figures exist anywhere, because no real measurement has ever been taken.
- **Why field data is required:** Tolerance can only be established by comparing derived measurements against ground truth from real properties. Any tolerance number quoted today would be fabricated.

## 11. Cortex findings/confidence

- **Current state:** `cortex/fixtures.js` contains static, hand-authored findings with fixed confidence values. `CortexService` (`cortex/service.js`) only filters/queries this static data — there is no inference engine.
- **Why field data is required:** Confidence calibration (e.g., "a finding marked 0.82 confidence is correct 82% of the time") is an empirical claim that requires a real corpus of evidence and ground-truth outcomes. None exists.

## 12. Core quantity/estimate validation

- **Current state:** `CoreAdapter.getPropertyWorkState()` returns hard-coded strings like `"Complete • 41 surfaces"` and `"Complete • 3 assemblies"` (`core/adapter.js:24-34`). No quantity computation, takeoff, or estimating logic exists.
- **Why field data is required:** Blocked twice over — first because Core itself does not exist as an engine in any provided repository, and second because even a built engine's quantity/estimate outputs can only be validated against real measured properties.

## 13. Passport truth promotion

- **Current state:** `passportRecord.revisions` is a static, pre-written array showing what a promotion history *would* look like (`passport/fixtures.js:8-17`). `PassportService` is read-only (`passport/service.js:9-12`) — there is no code path in this repository that actually promotes a Cortex finding or Core output into a new Passport revision.
- **Why field data is required:** The promotion *rule* (only Cortex/Core write through controlled pathways, professionals never write directly) is documented but unexercised. Validating that it behaves correctly under real conflicting or ambiguous findings requires real-world evidence streams, not just more fixture rows.

## 14. Report accuracy

- **Current state:** `ReportManifestService`/`buildManifest()` correctly decides which report modules are eligible given available capability flags (`reports/manifest.js:72-89`) — this logic is real and testable independent of field data. However, `CoreReportAdapter.requestReport()` unconditionally rejects (`reports/service.js:47-48`), so no report is ever actually generated, and no report *content* exists to assess for accuracy.
- **Why field data is required:** Once a renderer exists, report accuracy (are the stated measurements, findings, and thermal readings correct) can only be assessed against a real property with independently verified ground truth.

## 15. Pro/Habitat real property synchronization

- **Current state:** Both `ProAdapter.getOversight()` and `HabitatAdapter.getOversight()` return static mock sync states (`syncState: "synced"`, `syncFailures: 0`) with `connected: false` (`pro/adapter.js:9-25`, `habitat/adapter.js:9-25`).
- **Why field data is required:** Real synchronization correctness (data arriving in Pro/Habitat matching the canonical Passport record, latency, conflict handling) can only be verified once real Pro/Habitat applications exist and are fed real property data — currently neither exists as inspectable code, and no real property flows through the system at all.

## 16. Before/after verification workflows

- **Current state:** `work/fixtures.js` models "completion evidence" tied to repairs and Passport revisions, illustrating the intended shape of a before/after comparison. The actual comparison engine, `ComparisonProvider` (`reality/providers.js:90-100`), is `mode: FIXTURE`, `isLive: () => false`, and its own health description states plainly: *"Fixture comparison — no geometric difference computation is performed."*
- **Why field data is required:** Before/after verification is fundamentally a geometric-diffing problem between two real captures of the same property at different times. It cannot be validated — or arguably even meaningfully built — without real repeated captures of real properties.

---

## Summary table

| # | Item | Blocking reason | Primary citation |
|---|---|---|---|
| 1 | M4E/M4T imagery | No real files exist to ingest/parse | `evidence/vault-fixtures.js:17-174` |
| 2 | RTK metadata | Telemetry provider disconnected; no real GPS stream | `atc/providers.js:100-128` |
| 3 | Reconstruction outputs | No engine exists; needs real overlapping capture | `reality/providers.js:20-53` |
| 4 | Point clouds | Density/accuracy unverifiable without real scans | `reality/providers.js:78` |
| 5 | Meshes | Fidelity tied to real source data quality | `reality/providers.js:79-80` |
| 6 | Orthomosaics | Geometric accuracy needs real aerial imagery | `reality/providers.js:81` |
| 7 | R-JPEG thermal | No radiometric decoder; needs real thermal files | `evidence/model.js:30` |
| 8 | Semantic geometry | No labeling logic; depends on real geometry | n/a (not implemented) |
| 9 | Property Object Graph extraction | No extraction logic; depends on real geometry | `reality/types.js:27-31` |
| 10 | Measurement tolerances | No ground truth exists to establish tolerance | `shared/classification.js` |
| 11 | Cortex confidence | No inference engine; confidence is fixture | `cortex/fixtures.js` |
| 12 | Core quantity/estimate validation | No engine; needs real measured properties | `core/adapter.js:24-34` |
| 13 | Passport truth promotion | Write path unexercised; needs real conflicting evidence | `passport/service.js:9-12` |
| 14 | Report accuracy | No renderer; content accuracy needs real ground truth | `reports/service.js:47-48` |
| 15 | Pro/Habitat sync | Neither app exists as code; no real property flows | `pro/adapter.js`, `habitat/adapter.js` |
| 16 | Before/after verification | Comparison engine is fixture-only, admittedly non-functional | `reality/providers.js:90-100` |
