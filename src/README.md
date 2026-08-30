# STRATEX CENTCOM — module map

Directive 004 refactor, pass 1. The data layer is out of the monolith.

```
StratexCentcom.jsx          presentation layer (hooks, primitives, shell, pages, router)
                            imports everything below; owns no fixtures or services

src/
  design/tokens.js          the visual constitution — colors, chrome, gold, bevels
  utils/format.js           dates, relative time, byte and hash formatting
  utils/ids.js              property ID display format, tab slugs
  app/router/routes.js      THE route map + nav metadata + property tab list

  domains/
    shared/classification   TRUTH_CLASS · ARTIFACT_KIND · REVIEW_STATE · GOLD_STATE
    shared/states.js        STATE vocabularies · mission stages · blockers · timeline
    shared/rbac.js          roles and scopes
    shared/transport.js     the one place every service resolves

    property/               fixtures + service   (properties, twins, systems, ownership)
    mission/                fixtures + service   (missions, sensor packages, flight)
    evidence/               fixtures + service   (assets, packages — property scoped)
    cortex/                 fixtures + service   (analyses, findings, predictions, gold)
    passport/               fixtures + service
    atc/                    fixtures + service   + FlightProvider hardware seam
    timeline/ sharing/ audit/                    fixtures + service
    core/adapter.js         the WORK ENGINE (not contractor-facing)
    pro/adapter.js          the PROFESSIONAL application boundary
    habitat/adapter.js      the HOMEOWNER application boundary
    reports/service.js      report types + Core report boundary

    index.js                the service facade the presentation layer imports

  data/dashboard-fixtures.js  genuinely cross-domain seed (alerts, metrics, health)
```

## Rules

- A page never imports a fixture file. It calls a service.
- A domain owns its types, its fixtures and its service. No domain reaches into another's fixtures.
- `TRUTH_CLASS` and `REVIEW_STATE` are declared once, in `shared/`. Never re-declare them.
- Artifact category and truth classification are separate axes. Never collapse them.
- Route strings come from `ROUTES`. Nothing hand-builds a URL.

## Scoping guarantees

`PROPERTY 1 → MANY` for missions, twins, evidence assets, findings, grants.
`MISSION 1 → MANY` evidence assets. `ANALYSIS 1 → MANY` findings.
No dataset bleeds between properties.
