import React from "react";
import T from "../../design/tokens.js";
import { shortDate } from "../../utils/format.js";
import centcomApi, { CoreReportAdapter } from "../../domains/index.js";
import { buildManifest } from "../../domains/reports/manifest.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Resource, EmptyState, DataTable, GhostButton, StatusDot, ModuleIntro,
} from "../common/primitives.jsx";

/**
 * PROPERTY REPORTS
 *
 * Two honest states are kept apart here. "No reports exist" and "the service
 * that would generate reports is not connected" are different facts, and an
 * operator must never have to guess which one they are looking at.
 */
export function PropertyReportsPanel({ propertyId, openTab }) {
  const jobs = useResource(() => centcomApi.listReportJobs(), [propertyId]);
  const vp = useViewport();

  // Capability map for the manifest, derived from what this property has.
  const available = useResource(async () => {
    const [twins, findings, measurements, awe, maintenance, analyses] = await Promise.all([
      centcomApi.listTwins(propertyId),
      centcomApi.listFindings(propertyId),
      centcomApi.listMeasurements(propertyId),
      centcomApi.listAwe(propertyId),
      centcomApi.listMaintenance(propertyId),
      centcomApi.listAnalyses(propertyId),
    ]);
    return {
      property: true,
      mission: true,
      passport: true,
      twin: twins.length > 0,
      findings: findings.length > 0,
      measurements: measurements.length > 0,
      awe: awe.some((d) => d.latestObservation),
      maintenance: maintenance.length > 0,
      analysis: analyses.length > 0,
      thermal_evidence: findings.some((f) => f.category === "Moisture" || f.category === "HVAC"),
      teardown_evidence: false,
      cad: false,
      core_takeoff: false,
      core_estimate: false,
      habitat_projection: false,
    };
  }, [propertyId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="Report Requests" />
        <ModuleIntro purpose="Core performs report generation. CENTCOM requests and supervises it. Nothing is rendered here, and no artifact is claimed to exist that does not." />

        {!CoreReportAdapter.connected ? (
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
              borderRadius: T.radius.md, background: "rgba(251,146,60,0.10)",
              border: "1px solid rgba(251,146,60,0.45)",
            }}
          >
            <span aria-hidden="true" style={{ color: T.color.warn }}>▲</span>
            <span style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>
              Core report service not connected. No report can be requested or generated. This is a disconnected
              service, not an empty result — nothing has been generated and nothing has failed.
            </span>
          </div>
        ) : (
          <Resource
            res={jobs}
            loadingLines={3}
            empty={<EmptyState title="No reports requested" hint="No report has been requested for this property yet." />}
          >
            {(rows) => (
              <DataTable
                keyOf={(r) => r.reportId}
                primary="type"
                rows={rows}
                columns={[
                  { key: "id", header: "Report", render: (r) => r.reportId },
                  { key: "type", header: "Type", render: (r) => r.type },
                  { key: "status", header: "Status", render: (r) => r.status },
                  { key: "missions", header: "Source Missions", render: (r) => r.sourceMissionIds.join(", ") },
                  { key: "rev", header: "Passport Rev.", render: (r) => r.passportRevisionId },
                  { key: "job", header: "Core Job", render: (r) => r.coreJobId },
                  { key: "gen", header: "Generated", render: (r) => shortDate(r.generatedAt) },
                ]}
              />
            )}
          </Resource>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Report Manifest — What This Property Can Support" accent="gold" />
        <ModuleIntro purpose="What a report contains is decided by the ordered package, the evidence actually captured, the outputs that exist, and entitlements. A module is never fabricated to fill a template — an excluded module carries the reason it was excluded." />
        <Resource res={available} loadingLines={4}>
          {(caps) => {
            const manifest = buildManifest(caps);
            const included = manifest.filter((m) => m.included);
            const excluded = manifest.filter((m) => !m.included);
            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
                  {[
                    { label: "Modules Eligible", value: manifest.length, tone: T.color.blueBright },
                    { label: "Supported by Evidence", value: included.length, tone: T.color.ok },
                    { label: "Excluded", value: excluded.length, tone: T.color.medium },
                  ].map((c) => (
                    <div key={c.label} style={{ padding: "11px 13px", borderRadius: T.radius.md, background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))", border: "1px solid " + T.color.edge }}>
                      <Label style={{ fontSize: 8.5 }}>{c.label}</Label>
                      <div style={{ fontFamily: T.font.display, fontSize: 22, fontWeight: 700, color: c.tone, marginTop: 4 }}>{c.value}</div>
                    </div>
                  ))}
                </div>

                <DataTable
                  keyOf={(r) => r.module}
                  primary="module"
                  rows={manifest}
                  columns={[
                    { key: "module", header: "Module", wrap: true, render: (r) => r.module.replace(/_/g, " ") },
                    { key: "included", header: "Included", render: (r) => (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <StatusDot state={r.included ? "ok" : "offline"} size={6} />
                        {r.included ? "Yes" : "No"}
                      </span>
                    ) },
                    { key: "requires", header: "Requires", wrap: true, render: (r) => r.requires.length ? r.requires.join(", ") : "—" },
                    { key: "reason", header: "Reason Excluded", wrap: true, render: (r) => r.reason
                      ? <span style={{ color: T.color.textMute }}>{r.reason}</span>
                      : <span style={{ color: T.color.textFaint }}>—</span> },
                  ]}
                />

                <div style={{ marginTop: 14 }}>
                  <GhostButton onClick={() => openTab && openTab("Evidence")}>
                    Review the evidence behind these modules
                  </GhostButton>
                </div>
              </>
            );
          }}
        </Resource>
      </Panel>
    </div>
  );
}
