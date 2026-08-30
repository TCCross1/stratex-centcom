import React, { useState } from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate } from "../../utils/format.js";
import { TRUTH_CLASS } from "../../domains/shared/classification.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Fact, DataTable, Resource, EmptyState, GhostButton,
  ClassBadge, SeverityPill, StatusDot, ModuleIntro,
} from "../common/primitives.jsx";

/* ---------------------------------------------------------------- shared -- */

const TONE = { ok: T.color.ok, info: T.color.blueBright, warn: T.color.medium, bad: T.color.high, mute: T.color.textFaint };

/** Small labelled pill used across the work domains. Icon + text + color. */
function Chip({ label, tone = "info", title }) {
  const c = TONE[tone] || TONE.info;
  return (
    <span
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        fontFamily: T.font.display, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: c, border: "1px solid " + c + "55",
        background: c + "14", borderRadius: T.radius.xs, padding: "3px 8px",
      }}
    >
      {label}
    </span>
  );
}

const statusTone = (s) =>
  ({ COMPLETE: "ok", VERIFIED: "ok", ACTIVE: "ok", READY: "ok",
     SCHEDULED: "info", AUTHORIZED: "info", ESTIMATING: "info", PROPOSED: "info",
     PLANNING: "info", UPCOMING: "info", EVIDENCE_RECEIVED: "info", GENERATING: "info", QUEUED: "info",
     DUE: "warn", COMPLETION_PENDING: "warn", REVIEW_PENDING: "warn", OVERDUE: "bad",
     REJECTED: "bad", FAILED: "bad", CANCELLED: "mute", DISMISSED: "mute", UNVERIFIED: "mute",
   }[s] || "mute");

/* ---------------------------------------------------------- measurements -- */

export function MeasurementsPanel({ propertyId, navigate, openTab }) {
  const rows = useResource(() => centcomApi.listMeasurements(propertyId), [propertyId]);
  const sum = useResource(() => centcomApi.getMeasurementSummary(propertyId), [propertyId]);
  const vp = useViewport();
  const [category, setCategory] = useState("ALL");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="Measurement Summary" />
        <Resource res={sum} loadingLines={1}>
          {(s) => (
            <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
              <Fact label="Total Measurements" value={s.total} />
              <Fact label="Measured" value={s.measured} tone="ok" />
              <Fact label="Derived" value={s.derived} />
              <Fact label="Probable" value={s.probable} tone={s.probable ? "warn" : "ok"} />
            </div>
          )}
        </Resource>
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 12 }}>
          A measured value came off an instrument. A derived value was computed from geometry. A probable value is an
          inference with a confidence attached. These are never totalled together.
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Measurement Schedule"
          action={
            <Resource res={sum} loadingLines={1}>
              {(s) => (
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["ALL", ...s.categories].map((c) => {
                    const on = c === category;
                    return (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        aria-pressed={on}
                        style={{
                          cursor: "pointer", borderRadius: T.radius.xs,
                          padding: vp.isPhone ? "8px 10px" : "4px 9px",
                          minHeight: vp.isPhone ? 36 : undefined,
                          fontFamily: T.font.display, fontSize: 9, fontWeight: 700,
                          letterSpacing: "0.1em", color: on ? "#FFFFFF" : T.color.textMute,
                          background: on ? "rgba(30,107,255,0.30)" : "transparent",
                          border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}
            </Resource>
          }
        />
        <Resource
          res={rows}
          loadingLines={5}
          empty={
            <EmptyState
              title="No measurements on record"
              hint="Measurements are produced from validated capture geometry. This property has no processed twin yet, so nothing has been measured."
            />
          }
        >
          {(list) => {
            const filtered = category === "ALL" ? list : list.filter((m) => m.category === category);
            if (!filtered.length)
              return <EmptyState title="No measurements in this category" hint="Choose ALL to see the full schedule." />;
            return (
              <DataTable
                keyOf={(r) => r.measurementId}
                primary="name"
                rows={filtered}
                columns={[
                  { key: "name", header: "Measurement", wrap: true, render: (r) => r.name },
                  { key: "value", header: "Value", align: "right", render: (r) => (
                    <span style={{ fontFamily: T.font.display, fontWeight: 700, color: T.color.text }}>
                      {r.value.toLocaleString()} <span style={{ color: T.color.textMute, fontWeight: 500 }}>{r.unit}</span>
                    </span>
                  ) },
                  { key: "class", header: "Classification", render: (r) => (
                    <span style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <ClassBadge classification={r.truthClassification} />
                      {r.truthClassification === TRUTH_CLASS.PROBABLE && r.confidence != null && (
                        <span style={{ fontFamily: T.font.mono, fontSize: 9.5, color: T.color.goldBright }}>
                          {(r.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </span>
                  ) },
                  { key: "category", header: "Category", render: (r) => r.category },
                  { key: "zone", header: "Zone", wrap: true, render: (r) => r.zone },
                  { key: "method", header: "Method", wrap: true, render: (r) => r.method },
                  { key: "mission", header: "Source Mission", render: (r) => r.missionId ? (
                    <button onClick={() => navigate(ROUTES.mission(r.missionId))}
                      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>
                      {r.missionId}
                    </button>
                  ) : <span style={{ color: T.color.textFaint }}>—</span> },
                  { key: "twin", header: "Source Twin", render: (r) => r.sourceTwinVersionId ? (
                    <button onClick={() => openTab && openTab("Reality Twin")}
                      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>
                      {r.sourceTwinVersionId}
                    </button>
                  ) : <span style={{ color: T.color.textFaint }}>—</span> },
                  { key: "evidence", header: "Evidence", render: (r) => r.sourceEvidenceIds.length ? (
                    <span style={{ display: "inline-flex", gap: 5 }}>
                      {r.sourceEvidenceIds.map((e) => (
                        <button key={e} onClick={() => navigate(ROUTES.evidenceAsset(e))}
                          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>
                          {e}
                        </button>
                      ))}
                    </span>
                  ) : <span style={{ color: T.color.textFaint }}>—</span> },
                  { key: "review", header: "Review", render: (r) => r.reviewState },
                ]}
              />
            );
          }}
        </Resource>
      </Panel>
    </div>
  );
}

/* -------------------------------------------------------------------- AWE -- */

const changeTone = (c) =>
  !c ? "mute" : /improv/i.test(c) ? "ok" : /new|-/.test(c) ? "warn" : "info";

export function AwePanel({ propertyId, navigate }) {
  const res = useResource(() => centcomApi.listAwe(propertyId), [propertyId]);
  const vp = useViewport();
  const accent = { AIR: T.color.blueBright, WATER: "#4DE1FF", ENERGY: T.color.goldBright };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="AWE — Air · Water · Energy" accent="gold" />
        <ModuleIntro purpose="Three dimensions of property health, each traced to the evidence that produced it. Where no validated observation exists the dimension reads NOT OBSERVED — it is never reported as a zero." />
      </Panel>

      <Resource res={res} loadingLines={4}>
        {(rows) => (
          <div style={{ display: "grid", gridTemplateColumns: vp.isCompact ? "1fr" : "repeat(3,1fr)", gap: vp.gutter }}>
            {rows.map((d) => {
              const c = accent[d.dimension];
              const observed = Boolean(d.latestObservation);
              return (
                <Panel key={d.dimension} glow={d.recommendedReview}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
                    <span style={{ width: 3, height: 15, borderRadius: 2, background: c, boxShadow: "0 0 12px " + c }} />
                    <span style={{ fontFamily: T.font.display, fontSize: 15, fontWeight: 700, letterSpacing: "0.16em", color: c, textShadow: "0 0 12px " + c + "88" }}>
                      {d.dimension}
                    </span>
                  </div>

                  <Label style={{ fontSize: 8.5 }}>Current State</Label>
                  <div style={{ fontFamily: T.font.display, fontSize: 17, fontWeight: 700, color: observed ? T.color.text : T.color.textFaint, marginTop: 5 }}>
                    {d.status}
                  </div>

                  {d.score != null ? (
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                      <span style={{ fontFamily: T.font.display, fontSize: 30, fontWeight: 700, color: c }}>{d.score}</span>
                      {d.scoreIsFixture && (
                        <span style={{ fontFamily: T.font.mono, fontSize: 8.5, color: T.color.textFaint, letterSpacing: "0.06em" }}>
                          development fixture — not calculated
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textFaint, marginTop: 8 }}>
                      no score — nothing observed
                    </div>
                  )}

                  <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginTop: 12, lineHeight: 1.5 }}>
                    {d.summary}
                  </div>

                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
                    {d.truthClassification && <ClassBadge classification={d.truthClassification} />}
                    {d.confidence != null && (
                      <Chip label={(d.confidence * 100).toFixed(0) + "% confidence"} tone="warn" />
                    )}
                    <Chip label={d.changeFromPrior || "change unknown"} tone={changeTone(d.changeFromPrior)} />
                    {d.recommendedReview && <Chip label="Review recommended" tone="warn" />}
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + T.color.divider }}>
                    <Label style={{ fontSize: 8, marginBottom: 6 }}>Latest Observation</Label>
                    <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute }}>
                      {observed ? relTime(d.latestObservation) : "Never observed"}
                    </div>

                    {(d.findingIds.length > 0 || d.evidenceIds.length > 0) && (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 9 }}>
                        {d.findingIds.map((f) => (
                          <button key={f} onClick={() => navigate(ROUTES.finding(f))}
                            style={{ background: "rgba(30,107,255,0.12)", border: "1px solid rgba(30,107,255,0.35)", borderRadius: T.radius.xs, padding: "3px 7px", cursor: "pointer", fontFamily: T.font.mono, fontSize: 9.5, color: T.color.bluePale }}>
                            {f}
                          </button>
                        ))}
                        {d.evidenceIds.map((e) => (
                          <button key={e} onClick={() => navigate(ROUTES.evidenceAsset(e))}
                            style={{ background: "transparent", border: "1px solid " + T.color.edge, borderRadius: T.radius.xs, padding: "3px 7px", cursor: "pointer", fontFamily: T.font.mono, fontSize: 9.5, color: T.color.textMute }}>
                            {e}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ fontFamily: T.font.display, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: T.color.textFaint, marginTop: 10 }}>
                      Review: {d.reviewState}
                    </div>
                  </div>
                </Panel>
              );
            })}
          </div>
        )}
      </Resource>
    </div>
  );
}

/* --------------------------------------------------------------- projects -- */

export function ProjectsPanel({ propertyId, navigate, openTab }) {
  const res = useResource(() => centcomApi.listProjects(propertyId), [propertyId]);
  const vp = useViewport();
  const [openId, setOpenId] = useState(null);

  return (
    <Panel>
      <PanelHeader title="Projects — Work On This Property" />
      <ModuleIntro purpose="A project is real-world work performed on the house. A mission is Stratex acquiring data about it. They are different things and are never labelled interchangeably. CENTCOM observes the project; the professional executes it in Stratex Pro." />
      <Resource
        res={res}
        loadingLines={4}
        empty={<EmptyState title="No projects on this property" hint="A project appears when a finding leads to planned work, or when a professional or homeowner opens one." />}
      >
        {(rows) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((p) => {
              const open = openId === p.projectId;
              return (
                <div
                  key={p.projectId}
                  style={{
                    padding: vp.isPhone ? "12px 13px" : "14px 16px", borderRadius: T.radius.md,
                    background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                    border: "1px solid " + T.color.edge, boxShadow: T.bevel.tile,
                  }}
                >
                  <button
                    onClick={() => setOpenId(open ? null : p.projectId)}
                    aria-expanded={open}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", minHeight: 40, flexWrap: "wrap" }}
                  >
                    <span style={{ fontFamily: T.font.body, fontSize: 13, fontWeight: 600, color: T.color.text, flex: 1, minWidth: 0 }}>
                      {p.title}
                    </span>
                    <Chip label={p.status.replace(/_/g, " ")} tone={statusTone(p.status)} />
                    <Chip label={"origin: " + p.origin.replace(/_/g, " ")} tone="mute" />
                    <span style={{ color: T.color.blueBright, fontSize: 12 }}>{open ? "▾" : "›"}</span>
                  </button>

                  {open && (
                    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid " + T.color.divider }}>
                      <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
                        <Fact label="Project ID" value={p.projectId} mono />
                        <Fact label="Category" value={p.category} />
                        <Fact label="Created" value={shortDate(p.createdAt)} />
                        <Fact label="Target Completion" value={p.targetCompletion ? shortDate(p.targetCompletion) : "Not scheduled"} />
                        <Fact label="Authorized Organization" value={p.authorizedProfessionalOrgId || "None authorized"} />
                        <Fact label="Estimate" value={p.estimateIds.length ? p.estimateIds.join(", ") : "None"} mono />
                        <Fact label="Core Work" value={p.coreWorkIds.length ? p.coreWorkIds.join(", ") : "None"} mono />
                        <Fact label="Completion Evidence" value={p.completionEvidenceIds.length ? p.completionEvidenceIds.length + " asset(s)" : "None received"} />
                      </div>

                      <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
                        {p.relatedFindingIds.map((f) => (
                          <GhostButton key={f} small onClick={() => navigate(ROUTES.finding(f))}>Finding {f}</GhostButton>
                        ))}
                        {p.relatedSharingGrantId && (
                          <GhostButton small onClick={() => openTab && openTab("Sharing")}>Grant {p.relatedSharingGrantId}</GhostButton>
                        )}
                        <GhostButton small onClick={() => openTab && openTab("Repairs")}>Repairs</GhostButton>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

/* ---------------------------------------------------------------- repairs -- */

export function RepairsPanel({ propertyId, navigate, openTab }) {
  const res = useResource(() => centcomApi.listRepairs(propertyId), [propertyId]);
  const vp = useViewport();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="Repairs — Completed Corrective Work" />
        <ModuleIntro purpose="A repair is finished work with completion evidence attached. Evidence returns through validation before Passport records it, which is how a contractor's claim becomes part of the property's history without the contractor ever writing to Passport directly." />
        <Resource
          res={res}
          loadingLines={3}
          empty={<EmptyState title="No repairs recorded" hint="Repairs appear once a project completes and its completion evidence is submitted." />}
        >
          {(rows) => (
            <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
              {rows.map((r) => (
                <div key={r.repairId}>
                  <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginBottom: 12 }}>
                    <Fact label="Repair" value={r.repairId} mono />
                    <Fact label="Title" value={r.title} />
                    <Fact label="Completed" value={shortDate(r.completedAt)} />
                    <Fact label="Verification" value={r.verifiedState.replace(/_/g, " ")} tone={r.verifiedState === "VERIFIED" ? "ok" : "warn"} />
                    <Fact label="Organization" value={r.professionalOrgId} />
                    <Fact label="Passport Revision" value={r.passportRevisionId} mono />
                    <Fact label="Completion Evidence" value={r.completionEvidenceIds.length + " asset(s)"} />
                    <Fact label="Project" value={r.projectId} mono />
                  </div>

                  {r.notes && (
                    <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginBottom: 12 }}>
                      {r.notes}
                    </div>
                  )}

                  {/* The closed loop, shown as it actually resolves. */}
                  <Label style={{ fontSize: 8.5, marginBottom: 8 }}>Closed Loop</Label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {r.relatedFindingIds.map((f) => (
                      <GhostButton key={f} small onClick={() => navigate(ROUTES.finding(f))}>Finding {f}</GhostButton>
                    ))}
                    <span style={{ color: T.color.textFaint }}>›</span>
                    <GhostButton small onClick={() => openTab && openTab("Projects")}>Project {r.projectId}</GhostButton>
                    <span style={{ color: T.color.textFaint }}>›</span>
                    <Chip label={"Repair " + r.repairId} tone="ok" />
                    <span style={{ color: T.color.textFaint }}>›</span>
                    {r.completionEvidenceIds.map((e) => (
                      <GhostButton key={e} small onClick={() => navigate(ROUTES.evidenceAsset(e))}>Evidence {e}</GhostButton>
                    ))}
                    <span style={{ color: T.color.textFaint }}>›</span>
                    <GhostButton small onClick={() => openTab && openTab("Passport")}>Passport {r.passportRevisionId}</GhostButton>
                    <span style={{ color: T.color.textFaint }}>›</span>
                    <Chip label="Cortex before/after — not yet available" tone="mute" title="Longitudinal comparison is modelled but not implemented." />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Resource>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------ maintenance -- */

export function MaintenancePanel({ propertyId, navigate }) {
  const res = useResource(() => centcomApi.getMaintenanceRoadmap(propertyId), [propertyId]);
  const vp = useViewport();

  return (
    <Panel>
      <PanelHeader title="Maintenance Roadmap" />
      <ModuleIntro purpose="Upkeep grouped into horizons rather than exact dates. Stratex states a range because that is what the intelligence supports — an inferred roof replacement window is honestly 1–3 years, not a specific Tuesday." />
      <Resource res={res} loadingLines={4}>
        {(groups) => (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {groups.map((g) => (
              <div key={g.horizon}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                  <span style={{ width: 3, height: 12, borderRadius: 2, background: g.items.length ? T.color.blue : T.color.edgeBright }} />
                  <span style={{ fontFamily: T.font.display, fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: g.items.length ? T.color.text : T.color.textFaint }}>
                    {g.horizon}
                  </span>
                  <span style={{ fontFamily: T.font.mono, fontSize: 9.5, color: T.color.textFaint }}>
                    {g.items.length || "none"}
                  </span>
                </div>

                {g.items.length === 0 ? (
                  <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, paddingLeft: 12 }}>
                    Nothing scheduled in this horizon.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 7, paddingLeft: 12 }}>
                    {g.items.map((m) => (
                      <div
                        key={m.maintenanceId}
                        style={{
                          padding: "11px 12px", borderRadius: T.radius.sm,
                          background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                          border: "1px solid " + T.color.edge,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: T.font.body, fontSize: 12.5, fontWeight: 600, color: T.color.text, flex: 1, minWidth: 0 }}>
                            {m.task}
                          </span>
                          <Chip label={m.status} tone={statusTone(m.status)} />
                          <SeverityPill severity={m.priority} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginTop: 10 }}>
                          <Fact label="System" value={m.systemId.replace("sys-", "")} />
                          <Fact label="Recommended" value={relTime(m.recommendedAt)} />
                          <Fact label="Due" value={m.dueDate ? shortDate(m.dueDate) : "Range only"} />
                          <Fact label="Recurrence" value={m.recurrenceRule || "One-time"} />
                        </div>
                        {m.sourceFindingId && (
                          <div style={{ marginTop: 10 }}>
                            <GhostButton small onClick={() => navigate(ROUTES.finding(m.sourceFindingId))}>
                              Recommended by {m.sourceFindingId}
                            </GhostButton>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

/* -------------------------------------------------------------- documents -- */

export function DocumentsPanel({ propertyId, openTab }) {
  const res = useResource(() => centcomApi.listDocuments(propertyId), [propertyId]);

  return (
    <Panel>
      <PanelHeader title="Documents" />
      <ModuleIntro purpose="Property documents are stored as references. The binaries live in object storage, never in the property record. CENTCOM shows what exists and who may see it; it does not serve the file." />
      <Resource
        res={res}
        loadingLines={3}
        empty={<EmptyState title="No documents on file" hint="Permits, warranties, manuals and plans appear here as they are attached to the property." />}
      >
        {(rows) => (
          <DataTable
            keyOf={(r) => r.documentId}
            primary="title"
            rows={rows}
            columns={[
              { key: "title", header: "Document", wrap: true, render: (r) => r.title },
              { key: "type", header: "Type", render: (r) => <Chip label={r.type.replace(/_/g, " ")} tone="info" /> },
              { key: "version", header: "Ver.", align: "center", render: (r) => "v" + r.version },
              { key: "date", header: "Added", render: (r) => shortDate(r.uploadedAt) },
              { key: "source", header: "Source", wrap: true, render: (r) => r.source },
              { key: "related", header: "Related", wrap: true, render: (r) => (
                <span style={{ display: "inline-flex", gap: 5, flexWrap: "wrap" }}>
                  {r.relatedProjectId && <Chip label={r.relatedProjectId} tone="mute" />}
                  {r.relatedRepairId && <Chip label={r.relatedRepairId} tone="mute" />}
                  {r.relatedSystemId && <Chip label={r.relatedSystemId.replace("sys-", "")} tone="mute" />}
                </span>
              ) },
              { key: "scope", header: "Access Scope", wrap: true, render: (r) => r.accessScope },
              { key: "artifact", header: "Artifact", render: (r) => (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <StatusDot state="fixture" size={6} />
                  <span style={{ fontFamily: T.font.mono, fontSize: 9.5, color: T.color.textFaint }}>
                    reference only — no store connected
                  </span>
                </span>
              ) },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}

/* ---------------------------------------------------------------- systems -- */

/** Property systems index. Each system links out to the findings, measurements
 *  and maintenance that concern it. */
export function PropertySystemsPanel({ propertyId, navigate, openTab }) {
  const sys = useResource(() => centcomApi.listPropertySystems(propertyId), [propertyId]);
  const mt = useResource(() => centcomApi.listMaintenance(propertyId), [propertyId]);
  const vp = useViewport();

  return (
    <Panel>
      <PanelHeader title="Systems & Components" />
      <ModuleIntro purpose="What the property is made of, and what Stratex has actually observed about each part of it. A system with no capture reads NOT OBSERVED rather than being assumed healthy." />
      <Resource
        res={sys}
        loadingLines={4}
        empty={<EmptyState title="No systems recorded" hint="Systems are populated once a capture has been processed into the property record." />}
      >
        {(rows) => (
          <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr" : "repeat(2,1fr)", gap: 10 }}>
            {rows.map((r) => {
              const tasks = (mt.data || []).filter((m) => m.systemId === r.id && m.status !== "COMPLETE");
              const c = TONE[r.tone] || TONE.mute;
              return (
                <div
                  key={r.id}
                  style={{
                    padding: "13px 14px", borderRadius: T.radius.md,
                    background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                    border: "1px solid " + T.color.edge, boxShadow: T.bevel.tile,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span aria-hidden="true" style={{ color: c, fontSize: 10 }}>{r.mark}</span>
                    <span style={{ fontFamily: T.font.display, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.color.text, flex: 1 }}>
                      {r.name}
                    </span>
                    <Chip label={r.status} tone={r.tone} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 11 }}>
                    <Fact label="Last Observed" value={relTime(r.lastObserved)} />
                    <Fact label="Open Maintenance" value={tasks.length} tone={tasks.length ? "warn" : "ok"} />
                  </div>
                  {tasks.length > 0 && (
                    <div style={{ marginTop: 11 }}>
                      <GhostButton small onClick={() => openTab && openTab("Maintenance")}>
                        {tasks.length} open task{tasks.length > 1 ? "s" : ""}
                      </GhostButton>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

/* ------------------------------------------------- overview work summary -- */

/**
 * Executive roll-up of the work domains for the property Overview. Each cell
 * navigates to the tab that explains it. Deliberately thin — Overview answers
 * "what needs attention", not "show me everything".
 */
export function PropertyWorkSummary({ propertyId, openTab }) {
  const projects = useResource(() => centcomApi.listProjects(propertyId), [propertyId]);
  const repairs = useResource(() => centcomApi.listRepairs(propertyId), [propertyId]);
  const maint = useResource(() => centcomApi.listMaintenance(propertyId), [propertyId]);
  const docs = useResource(() => centcomApi.listDocuments(propertyId), [propertyId]);
  const meas = useResource(() => centcomApi.getMeasurementSummary(propertyId), [propertyId]);
  const awe = useResource(() => centcomApi.listAwe(propertyId), [propertyId]);
  const grants = useResource(() => centcomApi.listGrants(propertyId), [propertyId]);
  const vp = useViewport();

  const loading = [projects, repairs, maint, docs, meas, awe, grants].some((r) => r.loading);

  const openProjects = (projects.data || []).filter((p) => !["COMPLETE", "CANCELLED"].includes(p.status)).length;
  const pendingVerify = (repairs.data || []).filter((r) => r.verifiedState !== "VERIFIED").length;
  const dueMaint = (maint.data || []).filter((m) => ["DUE", "OVERDUE"].includes(m.status)).length;
  const worstAwe = (awe.data || []).find((d) => d.recommendedReview);
  const expiring = (grants.data || []).filter((g) => g.status === "ACTIVE").length;

  const cells = [
    { label: "Open Projects", value: openProjects, tab: "Projects", tone: openProjects ? "info" : "mute" },
    { label: "Repair Verification Pending", value: pendingVerify, tab: "Repairs", tone: pendingVerify ? "warn" : "ok" },
    { label: "Maintenance Due", value: dueMaint, tab: "Maintenance", tone: dueMaint ? "warn" : "ok" },
    { label: "AWE Attention", value: worstAwe ? worstAwe.dimension : "None", tab: "AWE", tone: worstAwe ? "warn" : "ok" },
    { label: "Measurements", value: meas.data ? meas.data.total : "—", tab: "Measurements", tone: "info" },
    { label: "Documents", value: (docs.data || []).length, tab: "Documents", tone: "info" },
    { label: "Report Status", value: "Core not connected", tab: "Reports", tone: "mute" },
    { label: "Active Grants", value: expiring, tab: "Sharing", tone: expiring ? "info" : "mute" },
  ];

  return (
    <Panel>
      <PanelHeader title="Work & Records" />
      {loading ? (
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textFaint }}>Loading property work state…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
          {cells.map((c) => {
            const col = TONE[c.tone] || TONE.info;
            return (
              <button
                key={c.label}
                onClick={() => openTab && openTab(c.tab)}
                style={{
                  textAlign: "left", cursor: "pointer", padding: "11px 12px", minHeight: 62,
                  background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                  border: "1px solid " + T.color.edge, borderRadius: T.radius.md,
                  boxShadow: T.bevel.tile, WebkitTapHighlightColor: "transparent",
                }}
              >
                <Label style={{ fontSize: 8.5 }}>{c.label}</Label>
                <div style={{ fontFamily: T.font.display, fontSize: typeof c.value === "number" ? 22 : 12, fontWeight: 700, color: col, marginTop: 5 }}>
                  {c.value}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
