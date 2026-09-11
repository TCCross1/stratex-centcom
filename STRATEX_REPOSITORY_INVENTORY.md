# STRATEX REPOSITORY INVENTORY

**Audit date (UTC):** 2026-09-11T05:30:34Z
**Auditor scope:** Evidence-based inspection of the repository actually present in this sandbox. No prior status report was assumed correct; every claim below was independently re-derived from source, `git`, and command output.

---

## 1. Repositories in scope

**Only one Stratex repository was available to this audit environment: `TCCross1/stratex-centcom`.**

The directive requests findings "for every Stratex repository," including references to standalone Stratex Pro and Stratex Habitat applications. This sandbox contains **no clone of a Pro repository, no clone of a Habitat repository, and no clone of any Core/Cortex/reconstruction backend repository**. Their existence, state, and code quality **cannot be verified** from this environment. Everything this audit says about Pro, Habitat, Core, and reconstruction services is derived **only** from how `stratex-centcom` references them (client-side adapter stubs), not from inspecting their actual code.

This is itself a diligence finding: **repository fragmentation cannot be confirmed either way.** If Pro/Habitat/Core exist as separate codebases, they were not provided to this audit and must be separately audited before any investor claim is made about their state.

---

## 2. `TCCross1/stratex-centcom`

| Field | Value | Evidence |
|---|---|---|
| Repository name | `stratex-centcom` (package name: `stratex-centcom`) | `package.json:2` |
| Active branch | `copilot/stratex-technical-validation-audit` | `git branch --show-current` |
| Remote | `http://localhost:26831/TCCross1/stratex-centcom` (sandboxed proxy of `github.com/TCCross1/stratex-centcom`) | `git remote -v` |
| HEAD commit SHA | `a69d35247d666f18b6d57038acc1645b7da6b12f` | `git log -1` |
| Prior commit | `b1e31d01395cf854b593cab4447218cb02c99a19` | `git log --oneline` |
| Total commit count reachable in this clone | 2 | `git log --all --oneline` |
| Shallow clone marker | present, boundary at `b1e31d0` | `.git/shallow` |
| Last meaningful development status | HEAD commit message is `"Update push instructions for the existing TCCross1 repository"` — an edit to `PUSH.md`, not application code. The prior commit `b1e31d0` ("Add push instructions") is the actual code-bearing initial commit. **This repository was pushed to GitHub as a single squashed snapshot; no incremental development history exists in git.** All claimed engineering history is undocumented outside this snapshot. | `git log --oneline`, `PUSH.md` |
| Application/service purpose | "STRATEX CENTCOM — Command, Control, Intelligence," described in-repo as "Mission control for residential property intelligence," the operational command layer that supervises ATC, Evidence, Reality, Cortex, Passport, and the embedded Core engine, and oversees (but does not contain) the standalone Pro and Habitat applications. | `package.json:5`, `README.md:1-45` |

### Repository structure

```
stratex-centcom/
├── index.html, package.json, vite.config.js, package-lock.json
├── PUSH.md            — one-time git/GitHub push instructions (not app documentation)
├── README.md          — architecture, honesty constraints, known disconnected providers
├── public/brand/       — one approved logo asset; others explicitly flagged official:false
├── scripts/run-tests.mjs — custom Node test-suite runner (no external test framework)
└── src/
    ├── app/            — routing, session bootstrap, viewport hooks, error boundary
    ├── components/     — navigation chrome, panels, shared domain UI
    ├── data/            — dashboard-level fixtures (session, alerts, metrics)
    ├── design/          — design tokens / brand constants
    ├── domains/         — one directory per canonical domain (18 domains, see below)
    ├── pages/           — one module per route (7 route groups, 15 page files)
    └── utils/           — formatting/identifier helpers
```

### Domains present (`src/domains/*`)

`atc`, `audit`, `awe`, `core`, `cortex`, `evidence`, `habitat`, `measurements`, `mission`, `passport`, `pro`, `property`, `reality`, `reports`, `shared`, `sharing`, `timeline`, `work` — 18 domains, ~6,550 lines of JS across ~60 files (`wc -l` over `src/domains/*/*.js`).

### Absent tooling (directly verified)

| Tool/config | Present? | Check performed |
|---|---|---|
| `.github/workflows/*` (CI) | ❌ Not found | `find .github` → no such directory |
| `tsconfig*` (TypeScript) | ❌ Not found | `find . -maxdepth 1 -iname tsconfig*` → empty |
| `.eslintrc*` / ESLint config | ❌ Not found | `find . -maxdepth 1 -iname '*.eslint*'` → empty |
| Jest/Vitest/Mocha config | ❌ Not found | Test runner is a hand-written `scripts/run-tests.mjs` that `spawnSync`s plain Node scripts |
| `.gitignore` | ✅ Present (57 bytes) | `ls -la` |
| Dockerfile / IaC / deployment manifests | ❌ Not found | `find . -iname 'Dockerfile*' -o -iname '*.tf'` → empty |

---

## 3. External applications referenced but not present as code

| Name | Referenced role in `stratex-centcom` | Actual code in this audit? |
|---|---|---|
| **Stratex Pro** | Professional-facing standalone app; consumes Core services and Passport projections via `ProAdapter` (`src/domains/pro/adapter.js`, `connected: false`) | ❌ Not in this repo/sandbox |
| **Stratex Habitat** | Homeowner-facing standalone app; consumes Passport projections via `HabitatAdapter` (`src/domains/habitat/adapter.js`, `connected: false`) | ❌ Not in this repo/sandbox |
| **Core** | "the work/execution engine," described as embedded between Cortex and Passport, represented only by `src/domains/core/adapter.js` (`connected: false`) and a visibility policy stub | ❌ Not in this repo/sandbox — only a client-side stand-in exists |
| **Reconstruction/photogrammetry engine** | `PropertyRealityProcessingProvider`, mode `FIXTURE`, vendor literally recorded as `"development fixture — no reconstruction engine connected"` | ❌ Not present anywhere |

No investor claim should treat Pro, Habitat, Core, or a reconstruction engine as "built" based on this repository — `stratex-centcom` contains only the CENTCOM-side stub interfaces that such systems would eventually satisfy.
