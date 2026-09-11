# STRATEX TEST AND BUILD EVIDENCE

**Repository:** `TCCross1/stratex-centcom`
**Commit audited:** `a69d35247d666f18b6d57038acc1645b7da6b12f`
**Environment:** Node `v22.23.2`, sandboxed Linux container, fresh `npm install` (no cached prior state)
**Date (UTC):** 2026-09-11

All commands below were executed directly in this audit session. Output is reproduced exactly (trimmed only where noted).

---

## 1. Dependency install

```
$ npm install
added 63 packages, and audited 64 packages in 9s

7 packages are looking for funding
  run `npm fund` for details

2 vulnerabilities (1 moderate, 1 high)

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

**Result: PASS** (installs cleanly).

---

## 2. Build

```
$ npm run build

> stratex-centcom@0.1.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 117 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  0.46 kB │ gzip:   0.31 kB
dist/assets/index-CP3H9iDm.js  666.82 kB │ gzip: 171.61 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.41s
```

**Result: PASS**, with one non-fatal advisory warning (bundle size / no code-splitting). This is a legitimate engineering observation: the entire application ships as a single ~667 kB JS chunk.

---

## 3. Unit / domain test suites

Command: `npm test` → `node scripts/run-tests.mjs`, which `spawnSync`s five independent Node scripts and aggregates their `RESULT` lines. There is no separate "integration test" suite distinct from these — the repository does not distinguish unit vs. integration; all five are domain-level behavioral suites run against in-process fixture data.

```
$ npm test

> stratex-centcom@0.1.0 test
> node scripts/run-tests.mjs

  PASS  Mission             RESULT: ALL 65 TESTS PASS
  PASS  ATC                 RESULT: ALL 79 TESTS PASS
  PASS  Evidence Vault      RESULT: ALL 107 TESTS PASS
  PASS  Property Reality    RESULT: ALL 144 TESTS PASS
  PASS  Property Isolation  RESULT: ALL TESTS PASS

ALL SUITES PASS
```

Exact pass/fail counts, independently re-derived (not taken from the README) by running each suite file directly with `node <file>` and reading its terminal `RESULT` line:

| Suite | File | Assertions | Result |
|---|---|---|---|
| Mission | `src/domains/mission/mission.test.mjs` | 65 | ALL 65 TESTS PASS |
| ATC | `src/domains/atc/atc.test.mjs` | 79 | ALL 79 TESTS PASS |
| Evidence Vault | `src/domains/evidence/evidence.test.mjs` | 107 | ALL 107 TESTS PASS |
| Property Reality | `src/domains/reality/reality.test.mjs` | 144 | ALL 144 TESTS PASS |
| Property Isolation & Integrity | `src/domains/isolation.test.mjs` | Full sweep across 16 relationship classes (no per-assertion count printed; see full output §3.1) | ALL TESTS PASS |

**Total counted assertions across the four numbered suites: 395** (65+79+107+144), matching the figure previously stated in the repository's own `README.md`. This is one of the few README claims in this repository that independently re-checks out exactly.

**Result: PASS.** 0 failures observed across all 5 suites in this run.

### 3.1 Full output — Property Isolation & Integrity suite (representative excerpt, tail)

```
  ok   Finding → Evidence — every evidence resolves to the same property
  ok   Finding → Analysis — every analysis resolves to the same property
  ok   Finding → Mission — every mission resolves to the same property
  ok   Evidence → Mission — every mission resolves to the same property
  ok   Analysis → Mission — every mission resolves to the same property
  ok   Twin → Source Mission — every mission resolves to the same property
  ok   Repair → Project — every project resolves to the same property
  ok   Repair → Evidence — every evidence resolves to the same property
  ok   Project → Findings — every finding resolves to the same property
  ok   Maintenance → Finding — every finding resolves to the same property
  ok   Document → Project — every project resolves to the same property
  ok   Gold → Finding — every finding resolves to the same property
  ok   Prediction → Finding — every finding resolves to the same property

=== 4. TRUTH DISCIPLINE ===
  ok   no MEASURED or DERIVED record carries a confidence score
  ok   every PROBABLE record states its confidence

RESULT: ALL TESTS PASS
```

**Caveat:** this test explicitly checks only relationships **within the domain's own fixture data** (`src/domains/isolation.test.mjs:9-17` imports fixtures directly). It does **not** cover `TimelineService.listByProperty()`, which is implemented in `src/domains/timeline/service.js` and does not filter by property at all (`listByProperty: (propertyId) => serve(() => timelineEvents)`), because the Timeline domain's fixtures were not included in this isolation sweep's import list. This is a real, present-day gap in the isolation guarantee, not a field-data blocker — see the technical report §3/§6.

---

## 4. Lint / type checks

**No lint or type-check command exists in this repository.**

- `package.json` scripts: `dev`, `build`, `preview`, `test` only — no `lint` or `typecheck` script.
- No `.eslintrc*` file anywhere in the repository root or `src/`.
- No `tsconfig.json`; all source files are plain `.js`/`.jsx`.

**Result: N/A — not configured.** This is reported as a gap, not assumed to be silently passing.

---

## 5. Security / static-analysis checks

```
$ npm audit
# npm audit report

esbuild  <=0.24.2
Severity: moderate
esbuild enables any website to send any requests to the development server and read the response - https://github.com/advisories/GHSA-67mh-4wv8-2f99
fix available via `npm audit fix --force`
Will install vite@8.3.0, which is a breaking change
node_modules/esbuild
  vite  <=6.4.2
  Depends on vulnerable versions of esbuild
  node_modules/vite

2 vulnerabilities (1 moderate, 1 high)
```

```
$ npm audit --json | jq .metadata.vulnerabilities
{ "info": 0, "low": 0, "moderate": 1, "high": 1, "critical": 0, "total": 2 }
```

**Result:** 2 known vulnerabilities, both in **development-only** tooling (`esbuild`/`vite`), not in runtime production dependencies (`react`, `react-dom` — 2 total runtime deps). No secrets, credentials, or hard-coded tokens were found during this audit's manual review of `src/`. No dedicated static-analysis tool (e.g. CodeQL, Semgrep) is configured in this repository; `npm audit` is the only security tooling actually runnable here.

---

## 6. Existing CI-equivalent commands

There is **no CI configuration** (`.github/workflows/*` absent). The commands executed in this audit (`npm install`, `npm run build`, `npm test`, `npm audit`) represent the full set of automatable checks this repository currently defines via `package.json`. They were run here for the first time in this audit environment; no historical CI run record exists to compare against.

---

## 7. Summary

| Check | Command | Result |
|---|---|---|
| Install | `npm install` | PASS (63 packages, 2 known vulns in dev deps) |
| Build | `npm run build` | PASS (1 non-fatal bundle-size warning) |
| Unit/domain tests | `npm test` | PASS — 395 assertions across 4 counted suites + 1 full isolation sweep, 0 failures |
| Lint | *(none configured)* | N/A |
| Type check | *(none configured)* | N/A |
| Security scan | `npm audit` | 2 vulnerabilities (1 moderate, 1 high), dev-dependency only |
| CI | *(none configured)* | N/A — no `.github/workflows` |
