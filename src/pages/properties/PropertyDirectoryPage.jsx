import React, { useState } from "react";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { STATE, STATE_TONE, stateOf } from "../../domains/shared/states.js";
import { relTime } from "../../utils/format.js";
import { formatPropertyId } from "../../utils/ids.js";
import { useDebounced, useResource, useViewport } from "../../app/hooks.js";
import { DataTable, EmptyState, GhostButton, Label, Loading, Panel, PanelHeader, Resource, StateBadge } from "../../components/common/primitives.jsx";

export const SORTS = [
  { key: "updated", label: "Recently Updated", cmp: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt) },
  { key: "alerts", label: "Open Alerts", cmp: (a, b) => b.openAlerts - a.openAlerts },
  { key: "scan", label: "Latest Scan", cmp: (a, b) => new Date(b.latestScanAt || 0) - new Date(a.latestScanAt || 0) },
  { key: "address", label: "Address", cmp: (a, b) => a.identity.addressLine1.localeCompare(b.identity.addressLine1) },
  { key: "status", label: "Property Status", cmp: (a, b) => a.status.localeCompare(b.status) },
];

export const FILTER_GROUPS = [
  { key: "status", label: "Status", domain: "property" },
  { key: "passportState", label: "Passport", domain: "passport" },
  { key: "cortexState", label: "Cortex", domain: "cortex" },
  { key: "coreState", label: "Core", domain: "core" },
  { key: "proState", label: "Pro", domain: "pro" },
  { key: "habitatState", label: "Habitat", domain: "habitat" },
];

/** Debounce so filtering stays responsive against a large future dataset. */

export function DirectorySummary({ navigate }) {
  const res = useResource(() => centcomApi.getDirectorySummary(), []);
  const vp = useViewport();
  const cells = (d) => [
    { label: "Total Properties", value: d.totalProperties, tone: "info", to: null },
    { label: "Active Missions", value: d.activeMissions, tone: "info", to: "/missions" },
    { label: "Open Alerts", value: d.openAlerts, tone: d.openAlerts ? "warn" : "ok", to: null },
    { label: "Passport Review", value: d.passportReview, tone: d.passportReview ? "bad" : "ok", to: "/passport" },
    { label: "Sync Exceptions", value: d.syncExceptions, tone: d.syncExceptions ? "warn" : "ok", to: "/systems" },
  ];
  return (
    <Resource res={res} loadingLines={1} label="Loading directory summary">
      {(d) => (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(5, minmax(0,1fr))",
            gap: vp.isPhone ? 8 : 10, marginBottom: 14,
          }}
        >
          {cells(d).map((c) => {
            const col = STATE_TONE[c.tone];
            const Tag = c.to ? "button" : "div";
            return (
              <Tag
                key={c.label}
                onClick={c.to ? () => navigate(c.to) : undefined}
                style={{
                  textAlign: "left", cursor: c.to ? "pointer" : "default",
                  padding: vp.isPhone ? "10px 11px" : "12px 14px",
                  minHeight: vp.isPhone ? 62 : undefined,
                  background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                  border: "1px solid " + T.color.edge, borderRadius: T.radius.md,
                  boxShadow: T.bevel.tile, WebkitTapHighlightColor: "transparent",
                }}
              >
                <Label style={{ fontSize: 8.5 }}>{c.label}</Label>
                <div style={{ fontFamily: T.font.display, fontSize: vp.isPhone ? 20 : 24, fontWeight: 700, color: col, marginTop: 4, textShadow: "0 0 14px " + col + "55" }}>
                  {c.value}
                </div>
              </Tag>
            );
          })}
        </div>
      )}
    </Resource>
  );
}

export function PropertyDirectory({ navigate }) {
  const res = useResource(() => centcomApi.listPropertySummaries(), []);
  const vp = useViewport();
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebounced(rawQuery);
  const [filters, setFilters] = useState({});
  const [sortKey, setSortKey] = useState("updated");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const toggleFilter = (group, value) =>
    setFilters((f) => ({ ...f, [group]: f[group] === value ? undefined : value }));

  const activeFilters = Object.entries(filters).filter(([, v]) => v);

  const matches = (p) => {
    const q = query.trim().toLowerCase();
    if (q) {
      const hay = [
        p.stratexPropertyId, p.displayId, p.identity.addressLine1, p.identity.city,
        p.identity.region, p.identity.postalCode, p.latestMissionId,
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return activeFilters.every(([group, value]) => p[group] === value);
  };

  const search = (
    <input
      value={rawQuery}
      onChange={(e) => setRawQuery(e.target.value)}
      placeholder={vp.isPhone ? "Search ID, address, mission" : "Search property ID, address, city, ZIP, or mission ID"}
      aria-label="Search properties"
      style={{
        fontFamily: T.font.body, color: T.color.text,
        fontSize: vp.isPhone ? 16 : 11.5,
        background: "rgba(6,12,22,0.9)", border: "1px solid " + T.color.edgeBright,
        borderRadius: T.radius.sm, outline: "none", boxShadow: T.bevel.sunken,
        padding: vp.isPhone ? "10px 12px" : "7px 11px",
        width: vp.isPhone ? "100%" : 340,
      }}
    />
  );

  const sortControl = (
    <select
      value={sortKey}
      onChange={(e) => setSortKey(e.target.value)}
      aria-label="Sort properties"
      style={{
        fontFamily: T.font.display, fontSize: vp.isPhone ? 16 : 10.5, fontWeight: 700,
        letterSpacing: "0.08em", textTransform: "uppercase", color: T.color.textSoft,
        background: "rgba(6,12,22,0.9)", border: "1px solid " + T.color.edgeBright,
        borderRadius: T.radius.sm, padding: vp.isPhone ? "10px 12px" : "6px 9px",
        outline: "none", minHeight: vp.isPhone ? T.layout.tap : undefined,
      }}
    >
      {SORTS.map((o) => (
        <option key={o.key} value={o.key}>{o.label}</option>
      ))}
    </select>
  );

  return (
    <>
      <DirectorySummary navigate={navigate} />
      <Panel>
        <PanelHeader
          title="Property Command"
          action={
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {!vp.isPhone && search}
              {sortControl}
              <GhostButton small onClick={() => setFiltersOpen((o) => !o)}>
                Filters{activeFilters.length ? " (" + activeFilters.length + ")" : ""}
              </GhostButton>
            </div>
          }
        />
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: -4, marginBottom: 12 }}>
          Permanent residential property intelligence. Every house carries one STRATEX_PROPERTY_ID for its entire life.
        </div>

        {vp.isPhone && <div style={{ marginBottom: 10 }}>{search}</div>}

        {filtersOpen && (
          <div
            style={{
              padding: 12, marginBottom: 12, borderRadius: T.radius.md,
              background: "rgba(6,12,22,0.7)", border: "1px solid " + T.color.edge,
            }}
          >
            {FILTER_GROUPS.map((g) => (
              <div key={g.key} style={{ marginBottom: 10 }}>
                <Label style={{ fontSize: 8.5, marginBottom: 6 }}>{g.label}</Label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.keys(STATE[g.domain]).map((k) => {
                    const on = filters[g.key] === k;
                    return (
                      <button
                        key={k}
                        onClick={() => toggleFilter(g.key, k)}
                        aria-pressed={on}
                        style={{
                          cursor: "pointer", borderRadius: T.radius.xs,
                          padding: vp.isPhone ? "8px 10px" : "4px 9px",
                          minHeight: vp.isPhone ? 36 : undefined,
                          fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700,
                          letterSpacing: "0.09em", textTransform: "uppercase",
                          color: on ? "#FFFFFF" : T.color.textMute,
                          background: on ? "rgba(30,107,255,0.30)" : "transparent",
                          border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        {stateOf(g.domain, k).label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <GhostButton small onClick={() => setFilters({})}>Clear all filters</GhostButton>
          </div>
        )}

        <Resource
          res={res}
          loadingLines={6}
          label="Loading property directory"
          empty={
            <EmptyState
              title="No properties on file"
              hint="Every house entering Stratex is issued a permanent STRATEX_PROPERTY_ID. Create the first mission to issue one."
              action={<GhostButton onClick={() => navigate("/missions")}>Open Mission Command</GhostButton>}
            />
          }
        >
          {(rows) => {
            const filtered = rows.filter(matches).sort(SORTS.find((x) => x.key === sortKey).cmp);

            if (!filtered.length)
              return (
                <EmptyState
                  title={query ? "No properties match that search" : "No properties match these filters"}
                  hint={
                    query
                      ? 'Nothing matches "' + query + '". Try a street name, a city, a ZIP, or an ID like STX-KY-LEX-00001842.'
                      : "Loosen or clear the filters to see the full directory."
                  }
                  action={
                    <GhostButton onClick={() => { setRawQuery(""); setFilters({}); }}>
                      Reset search and filters
                    </GhostButton>
                  }
                />
              );

            return (
              <>
                <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textFaint, marginBottom: 8 }}>
                  {filtered.length} of {rows.length} properties
                </div>
                <DataTable
                  keyOf={(r) => r.stratexPropertyId}
                  primary="property"
                  onRowClick={(r) => navigate("/properties/" + r.stratexPropertyId)}
                  rows={filtered}
                  columns={[
                    { key: "id", header: "Stratex Property ID", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10.5, color: T.color.bluePale }}>{formatPropertyId(r)}</span> },
                    { key: "property", header: "Property", wrap: true, render: (r) => (
                      <span>
                        <span style={{ color: T.color.text }}>{r.identity.addressLine1}</span>
                        <span style={{ color: T.color.textMute }}>{", " + r.identity.city + " " + r.identity.region + " " + r.identity.postalCode}</span>
                      </span>
                    ) },
                    { key: "status", header: "Status", render: (r) => <StateBadge domain="property" value={r.status} /> },
                    { key: "scan", header: "Latest Scan", render: (r) => (r.latestScanAt ? relTime(r.latestScanAt) : <span style={{ color: T.color.textFaint }}>Never scanned</span>) },
                    { key: "mission", header: "Latest Mission", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.latestMissionId || "—"}</span> },
                    { key: "cortex", header: "Cortex", render: (r) => <StateBadge domain="cortex" value={r.cortexState} compact /> },
                    { key: "passport", header: "Passport", render: (r) => <StateBadge domain="passport" value={r.passportState} compact /> },
                    { key: "core", header: "Core", render: (r) => <StateBadge domain="core" value={r.coreState} compact /> },
                    { key: "pro", header: "Pro", render: (r) => <StateBadge domain="pro" value={r.proState} compact /> },
                    { key: "habitat", header: "Habitat", render: (r) => <StateBadge domain="habitat" value={r.habitatState} compact /> },
                    { key: "alerts", header: "Alerts", align: "right", render: (r) => r.openAlerts ? <span style={{ fontFamily: T.font.display, fontWeight: 700, color: T.color.medium }}>{r.openAlerts}</span> : <span style={{ color: T.color.textFaint }}>0</span> },
                    { key: "updated", header: "Updated", render: (r) => relTime(r.updatedAt) },
                  ]}
                />
              </>
            );
          }}
        </Resource>
      </Panel>
    </>
  );
}
