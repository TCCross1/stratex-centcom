import React, { useMemo, useState } from "react";
import T from "../../design/tokens.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { useResource, useViewport } from "../../app/hooks.js";
import { DataTable, EmptyState, GhostButton, ModuleIntro, ModuleMetrics, Panel, PanelHeader, Resource } from "../../components/common/primitives.jsx";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "PENDING_REVIEW", label: "Pending Review" },
  { key: "OPEN_CONFLICTS", label: "Open Conflicts" },
  { key: "INTEGRITY_WARNING", label: "Integrity Warning" },
  { key: "TRANSFER_PENDING", label: "Transfer Pending" },
  { key: "RECENTLY_UPDATED", label: "Recently Updated" },
  { key: "BLOCKED_INGESTION", label: "Blocked Ingestion" },
];

export function PassportCommand({ navigate }) {
  const summaryRes = useResource(() => centcomApi.getPassportCommandSummary(), []);
  const filtersRes = useResource(() => centcomApi.getPassportDirectoryFilters(), []);
  const [filter, setFilter] = useState("ALL");
  const directoryRes = useResource(() => centcomApi.listPassportDirectory(filter), [filter]);
  const vp = useViewport();
  const filterOptions = filtersRes.data || FILTERS;

  const activeFilterRows = useMemo(() => {
    if (!directoryRes.data) return [];
    return directoryRes.data;
  }, [directoryRes.data]);

  return (
    <>
      <Resource res={summaryRes} loadingLines={1}>
        {(summary) => (
          <ModuleMetrics cells={[
            { label: "Total Passports", value: summary.totalPassports || 0, tone: "info" },
            { label: "Revisions Pending", value: summary.revisionsPending || 0, tone: "warn" },
            { label: "Conflicts Open", value: summary.conflictsOpen || 0, tone: "bad" },
            { label: "Ingestions Blocked", value: summary.ingestionsBlocked || 0, tone: "bad" },
            { label: "Truth Reviews Required", value: summary.truthReviewsRequired || 0, tone: "warn" },
            { label: "Ownership Transfers", value: summary.ownershipTransfers || 0, tone: "info" },
            { label: "Integrity Warnings", value: summary.integrityWarnings || 0, tone: "warn" },
            { label: "Recent Canonical Updates", value: summary.recentCanonicalUpdates || 0, tone: "ok" },
          ]} />
        )}
      </Resource>

      <Panel>
        <PanelHeader title="Passport Directory" />
        <ModuleIntro purpose="Every property has one governing Passport. The directory shows the current canonical state, ownership posture, integrity, and live review backlog without allowing edits in the command shell itself." />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 14px" }}>
          {(filterOptions || FILTERS).map((item) => {
            const active = item.key === filter;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                style={{
                  border: "1px solid " + (active ? T.color.blueBright : T.color.edge),
                  background: active ? "rgba(30,107,255,0.14)" : "rgba(12,18,32,0.9)",
                  color: active ? "#FFFFFF" : T.color.textSoft,
                  borderRadius: T.radius.sm,
                  padding: vp.isPhone ? "8px 10px" : "6px 10px",
                  fontFamily: T.font.display,
                  fontSize: 9.5,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <Resource res={directoryRes} loadingLines={5} empty={<EmptyState title="No Passport records" hint="Every property eventually receives a canonical Passport record and revision chain." />}>
          {(rows) => (
            rows.length === 0 ? (
              <EmptyState title="No rows in this filter" hint="This filter has no matching Passport records. Select ALL to restore the full directory." />
            ) : (
              <DataTable
                keyOf={(r) => r.propertyId}
                primary="propertyId"
                onRowClick={(r) => navigate(ROUTES.passportDetail(r.propertyId, "overview"))}
                rows={rows}
                columns={[
                  { key: "propertyId", header: "Property", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.propertyId}</span> },
                  { key: "passportId", header: "Passport ID", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.passportId}</span> },
                  { key: "currentRevision", header: "Current Revision", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.currentRevision}</span> },
                  { key: "lastAccepted", header: "Last Accepted", render: (r) => r.lastAccepted ? new Date(r.lastAccepted).toLocaleDateString() : "—" },
                  { key: "ownerState", header: "Owner Relationship", render: (r) => r.ownerState },
                  { key: "openConflicts", header: "Open Conflicts", render: (r) => r.openConflicts || 0 },
                  { key: "pendingIngestions", header: "Pending Ingestions", render: (r) => r.pendingIngestions || 0 },
                  { key: "twinCoverage", header: "Twin Coverage", render: (r) => r.twinCoverage || 0 },
                  { key: "activeConditions", header: "Conditions", render: (r) => r.activeConditions || 0 },
                  { key: "integrityState", header: "Integrity", render: (r) => <span style={{ fontFamily: T.font.display, letterSpacing: "0.08em", textTransform: "uppercase", color: r.integrityState === "CLEAN" ? T.color.ok : T.color.warn }}>{r.integrityState}</span> },
                  { key: "action", header: "Action", render: (r) => <GhostButton small onClick={(e) => { e.stopPropagation(); navigate(ROUTES.passportDetail(r.propertyId, "overview")); }}>Open</GhostButton> },
                ]}
              />
            )
          )}
        </Resource>
      </Panel>
    </>
  );
}

export default PassportCommand;
