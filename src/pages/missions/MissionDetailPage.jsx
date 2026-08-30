import React, { useState } from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate } from "../../utils/format.js";
import { ROUTES, MISSION_TABS } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { stageByKey, isHardBlocker } from "../../domains/mission/lifecycle.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Fact, DataTable, Resource, EmptyState, GhostButton,
  Breadcrumb, ModuleIntro, MetalText,
} from "../../components/common/primitives.jsx";
import { StateChip, LifecycleRail } from "../../components/mission/MissionShared.jsx";

export function MissionDetail({ missionId, tabSlug, navigate }) {
  const res = useResource(() => centcomApi.getMissionDetail(missionId), [missionId]);
  const fromSlug = MISSION_TABS.find((t) => slugOf(t) === tabSlug);
  const [tab, setTab] = useState(fromSlug || "Overview");
  const vp = useViewport();

  const openTab = (name) => {
    setTab(name);
    navigate(ROUTES.mission(missionId, slugOf(name)));
  };

  return (
    <Resource
      res={res}
      loadingLines={6}
      label="Opening mission record"
      empty={
        <Panel>
          <EmptyState
            title="No mission with that ID"
            hint={'"' + missionId + '" is not on file.'}
            action={<GhostButton onClick={() => navigate(ROUTES.missions)}>Back to Mission Command</GhostButton>}
          />
        </Panel>
      }
    >
      {(d) => (
        <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
          <MissionContextHeader detail={d} navigate={navigate} tab={tab} vp={vp} />

          <div
            style={{
              display: "flex", flexWrap: vp.isPhone ? "nowrap" : "wrap",
              overflowX: vp.isPhone ? "auto" : "visible", WebkitOverflowScrolling: "touch",
              gap: 4, padding: 6, background: "rgba(6,12,22,0.75)",
              border: "1px solid " + T.color.edge, borderRadius: T.radius.md,
              position: vp.isPhone ? "sticky" : "static", top: 0, zIndex: 20,
            }}
            role="tablist"
          >
            {MISSION_TABS.map((name) => {
              const on = name === tab;
              return (
                <button
                  key={name}
                  role="tab"
                  aria-selected={on}
                  onClick={() => openTab(name)}
                  style={{
                    fontFamily: T.font.display, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: on ? "#FFFFFF" : T.color.textMute,
                    background: on ? "linear-gradient(180deg,rgba(30,107,255,0.34),rgba(10,24,48,0.9))" : "transparent",
                    border: "1px solid " + (on ? "rgba(30,107,255,0.55)" : "transparent"),
                    borderRadius: T.radius.sm, cursor: "pointer", flex: "none", whiteSpace: "nowrap",
                    padding: vp.isPhone ? "9px 12px" : "6px 10px",
                    boxShadow: on ? T.glow.blueSoft : "none",
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>

          <MissionTabBody tab={tab} detail={d} navigate={navigate} openTab={openTab} vp={vp} />
        </div>
      )}
    </Resource>
  );
}


function MissionContextHeader({ detail: d, navigate, tab, vp }) {
  const m = d.mission;
  const hard = d.blockers.filter(isHardBlocker);
  return (
    <Panel pad={vp.isPhone ? 12 : 14}>
      <Breadcrumb
        navigate={navigate}
        trail={[
          { label: "CENTCOM", to: ROUTES.dashboard },
          { label: "Missions", to: ROUTES.missions },
          { label: m.id, to: ROUTES.mission(m.id) },
          { label: tab },
        ]}
      />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: vp.isPhone ? "100%" : 0 }}>
          <MetalText size={vp.isPhone ? 18 : 23} track="0.04em">{m.missionType}</MetalText>
          <div style={{ fontFamily: T.font.mono, fontSize: 12, color: T.color.bluePale, marginTop: 6 }}>{m.id}</div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 10 }}>
            <StateChip value={m.originType} small />
            <StateChip value={m.assessmentObjective} small />
            <StateChip value={m.requestedPackage} small />
            <StateChip value={m.priority} small />
          </div>
          {/* The property is the durable record. The mission belongs to it. */}
          <div style={{ marginTop: 11 }}>
            <GhostButton small onClick={() => navigate(ROUTES.property(m.propertyId))}>
              ← Property {m.propertyId}
            </GhostButton>
          </div>
        </div>
        <div style={{ width: vp.isPhone ? "100%" : 320, flex: "none" }}>
          <Label>Mission Lifecycle</Label>
          <div style={{ marginTop: 8 }}><LifecycleRail missionState={m.missionState} /></div>
          {hard.length > 0 && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 9, marginTop: 12,
                padding: "9px 11px", borderRadius: T.radius.sm,
                background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.45)",
              }}
            >
              <span aria-hidden="true" style={{ color: T.color.high }}>✕</span>
              <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.high }}>
                {hard.length} blocking issue{hard.length > 1 ? "s" : ""} — {hard[0].message}
              </span>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

/** The state matrix. One overloaded status field would hide all of this. */

function MissionStatusMatrix({ mission: m, vp }) {
  const cells = [
    { label: "Mission", value: m.missionState },
    { label: "Capture", value: m.captureState },
    { label: "Evidence", value: m.evidenceState },
    { label: "Processing", value: m.processingState },
    { label: "Cortex", value: m.cortexState },
    { label: "Passport", value: m.passportState },
    { label: "Report", value: m.reportState },
    { label: "ATC", value: m.atcState },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 10 }}>
      {cells.map((c) => (
        <div
          key={c.label}
          style={{
            padding: "11px 12px", borderRadius: T.radius.md,
            background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
            border: "1px solid " + T.color.edge, boxShadow: T.bevel.tile,
          }}
        >
          <Label style={{ fontSize: 8.5 }}>{c.label}</Label>
          <div style={{ marginTop: 7 }}><StateChip value={c.value} /></div>
        </div>
      ))}
    </div>
  );
}


function MissionActions({ detail: d, navigate }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  // Every action is gated by the same guard the service enforces. A disabled
  // control always states its reason — it is never silently hidden.
  const act = async (label, fn) => {
    setBusy(label); setError(null);
    try { await fn(); window.location.reload(); }
    catch (e) { setError(e.message); }
    finally { setBusy(null); }
  };

  const advance = d.nextStates.filter((s) => s.state !== "CANCELLED");

  return (
    <Panel>
      <PanelHeader title="Actions" />
      <ModuleIntro purpose="Launch authorization is not here. That decision belongs to ATC, which owns flight readiness. Mission Command owns intent, resources and lifecycle." />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {advance.map((s) => (
          <span key={s.state} title={s.reason || "Allowed"} style={{ opacity: s.allowed ? 1 : 0.45 }}>
            <GhostButton
              small
              onClick={() => s.allowed && act(s.state, () => centcomApi.transitionMission(d.mission.id, s.state))}
            >
              {busy === s.state ? "Working…" : "→ " + stageByKey(s.state).label}
            </GhostButton>
          </span>
        ))}
      </div>

      {advance.some((s) => !s.allowed) && (
        <div style={{ marginTop: 12 }}>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Why an action is unavailable</Label>
          {advance.filter((s) => !s.allowed).map((s) => (
            <div key={s.state} style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginBottom: 4 }}>
              <span style={{ color: T.color.textSoft }}>{stageByKey(s.state).label}:</span> {s.reason}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 12, fontFamily: T.font.body, fontSize: 11, color: T.color.high }}>
          Refused: {error}
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------ tab bodies -- */


function MissionTabBody({ tab, detail: d, navigate, openTab, vp }) {
  const m = d.mission;
  const facts = (n) => (vp.isPhone ? "1fr 1fr" : "repeat(" + n + ",1fr)");

  if (tab === "Overview")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Why This Mission Exists" />
          <div style={{ display: "grid", gridTemplateColumns: facts(3), gap: 12 }}>
            <Fact label="Objective" value={m.assessmentObjective.replace(/_/g, " ")} />
            <Fact label="Package" value={m.requestedPackage.replace(/_/g, " ")} />
            <Fact label="Origin" value={m.originType.replace(/_/g, " ")} />
            <Fact label="Requested By" value={m.requestingPartyRef} mono />
            <Fact label="Requested Date" value={shortDate(m.requestedDate)} />
            <Fact label="Created" value={relTime(m.createdAt)} />
          </div>
          <div style={{ marginTop: 14 }}>
            <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Requested Services — what success means</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {m.requestedServices.map((s) => (
                <span key={s} style={{
                  fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.09em",
                  color: T.color.bluePale, border: "1px solid rgba(30,107,255,0.4)",
                  background: "rgba(30,107,255,0.12)", borderRadius: T.radius.xs, padding: "4px 8px",
                }}>{s.replace(/_/g, " ")}</span>
              ))}
            </div>
          </div>
          {m.focusAreas?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Focus Areas</Label>
              {m.focusAreas.map((f) => (
                <div key={f.id} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginBottom: 4 }}>
                  <span style={{ color: T.color.text }}>{f.area}</span> — {f.note}
                </div>
              ))}
            </div>
          )}
          {m.knownIssues?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Reported Context — not verified findings</Label>
              {m.knownIssues.map((k) => (
                <div key={k.id} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginBottom: 4 }}>
                  <span style={{ color: T.color.text }}>{k.issue}</span> · {k.location} · reported by {k.reportedBy}
                </div>
              ))}
              <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 6 }}>
                What a customer or professional reports is context for the operator. It never enters Passport as a
                verified fact — only validated evidence can do that.
              </div>
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Downstream State" />
          <MissionStatusMatrix mission={m} vp={vp} />
        </Panel>

        <MissionActions detail={d} navigate={navigate} />
        <MissionBlockers detail={d} vp={vp} />
      </div>
    );

  if (tab === "Authorization")
    return (
      <Panel>
        <PanelHeader title="Homeowner Authorization" />
        <ModuleIntro purpose="A professional requesting a scan does not thereby receive the property's history. Authorization covers this mission, this window and this scope — nothing more." />
        {d.authorization ? (
          <div style={{ display: "grid", gridTemplateColumns: facts(3), gap: 12 }}>
            <Fact label="Authorization" value={d.authorization.authorizationId} mono />
            <Fact label="Status" value={d.authorization.status} tone={d.authorization.status === "CONFIRMED" ? "ok" : "warn"} />
            <Fact label="Requesting Organization" value={d.authorization.requestingOrganizationId || "—"} />
            <Fact label="Party Reference" value={d.authorization.partyRef} mono />
            <Fact label="Scope" value={d.authorization.scope.join(", ")} />
            <Fact label="Requested" value={relTime(d.authorization.requestedAt)} />
            <Fact label="Confirmed" value={d.authorization.confirmedAt ? shortDate(d.authorization.confirmedAt) : "—"} />
            <Fact label="Expires" value={d.authorization.expiresAt ? shortDate(d.authorization.expiresAt) : "—"} />
            <Fact label="Revoked" value={d.authorization.revokedAt ? shortDate(d.authorization.revokedAt) : "—"} />
          </div>
        ) : (
          <EmptyState
            title={m.authorizationState === "NOT_REQUIRED" ? "No authorization required" : "No authorization on record"}
            hint={m.authorizationState === "NOT_REQUIRED"
              ? "This mission was originated internally or by the property owner, so no separate homeowner authorization is needed."
              : "This mission requires authorization but none has been requested yet."}
          />
        )}
      </Panel>
    );

  if (tab === "Schedule")
    return (
      <Panel>
        <PanelHeader title="Schedule" />
        <div style={{ display: "grid", gridTemplateColumns: facts(3), gap: 12 }}>
          <Fact label="Requested Date" value={shortDate(m.requestedDate)} />
          <Fact label="Window Type" value={m.timeWindowType} />
          <Fact label="Scheduled Start" value={m.scheduledStart ? shortDate(m.scheduledStart) : "Not scheduled"} />
          <Fact label="Scheduled End" value={m.scheduledEnd ? shortDate(m.scheduledEnd) : "—"} />
          <Fact label="Estimated Duration" value={m.estimatedDurationMinutes + " min"} />
          <Fact label="Priority" value={m.priority} />
        </div>
        {m.estimatedDurationIsPlanning && (
          <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 12 }}>
            Duration is a planning fixture derived from the package. No routing or capacity engine is computing it.
          </div>
        )}
      </Panel>
    );

  if (tab === "Resources")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Assigned Resources" />
          <div style={{ display: "grid", gridTemplateColumns: facts(4), gap: 12 }}>
            <Fact label="Operator" value={m.operatorId || "Unassigned"} tone={m.operatorId ? undefined : "warn"} />
            <Fact label="Aircraft" value={m.aircraftId || "Unassigned"} tone={m.aircraftId ? undefined : "warn"} />
            <Fact label="Sensor Package" value={d.sensorPackage ? d.sensorPackage.label : "Unassigned"} tone={m.sensorPackageId ? undefined : "warn"} />
            <Fact label="Vehicle" value={m.vehicleId || "—"} />
          </div>
          {d.sensorPackage && (
            <div style={{ marginTop: 14 }}>
              <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Sensor Capabilities</Label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {d.sensorPackage.capabilities.map((c) => <StateChip key={c} value={c} small />)}
              </div>
              {d.sensorMissing?.length > 0 && (
                <div style={{
                  marginTop: 12, padding: "10px 12px", borderRadius: T.radius.sm,
                  background: "rgba(251,146,60,0.10)", border: "1px solid rgba(251,146,60,0.45)",
                  fontFamily: T.font.body, fontSize: 11, color: T.color.warn,
                }}>
                  ▲ This package cannot deliver what the mission requested. Missing: {d.sensorMissing.join(", ")}.
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Assignment History" />
          <ModuleIntro purpose="A reassignment supersedes the previous record. It never overwrites it — who was assigned, and when, stays on file." />
          <Resource
            res={{ data: d.assignments, loading: false, error: null, reload: () => {} }}
            empty={<EmptyState title="No assignment history" hint="Resources on this mission were set at creation." />}
          >
            {(rows) => (
              <DataTable
                keyOf={(r) => r.assignmentId}
                primary="resourceId"
                rows={rows}
                columns={[
                  { key: "type", header: "Resource", render: (r) => r.resourceType },
                  { key: "resourceId", header: "Assigned", render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.resourceId}</span> },
                  { key: "state", header: "State", render: (r) => <StateChip value={r.state} small /> },
                  { key: "at", header: "When", render: (r) => relTime(r.assignedAt) },
                  { key: "by", header: "Replaced By", render: (r) => r.replacedBy || "—" },
                ]}
              />
            )}
          </Resource>
        </Panel>
      </div>
    );

  if (tab === "ATC")
    return <MissionAtcHandoff missionId={m.id} navigate={navigate} vp={vp} />;

  if (tab === "Capture")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Capture Sessions" />
          <ModuleIntro purpose="One mission may take several attempts. A recapture adds an attempt to this mission; it never creates a second mission or a second property. Earlier attempts are never edited." />
          <Resource
            res={{ data: d.captureSessions, loading: false, error: null, reload: () => {} }}
            empty={<EmptyState title="No capture attempt yet" hint="Capture sessions appear once the aircraft launches." />}
          >
            {(rows) => (
              <DataTable
                keyOf={(r) => r.captureId}
                primary="captureId"
                rows={rows}
                columns={[
                  { key: "captureId", header: "Session", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.captureId}</span> },
                  { key: "attempt", header: "Attempt", align: "center", render: (r) => "#" + r.attemptNumber },
                  { key: "status", header: "Status", render: (r) => <StateChip value={r.status} small /> },
                  { key: "coverage", header: "Coverage", align: "right", render: (r) => r.coverageState },
                  { key: "started", header: "Started", render: (r) => relTime(r.startedAt) },
                  { key: "ended", header: "Ended", render: (r) => r.endedAt ? relTime(r.endedAt) : "—" },
                  { key: "abort", header: "Abort Reason", render: (r) => r.abortReason || "—" },
                  { key: "notes", header: "Notes", wrap: true, render: (r) => r.notes || "—" },
                ]}
              />
            )}
          </Resource>
          {m.rescanReason && (
            <div style={{ marginTop: 12, fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>
              ▲ {m.rescanReason}
            </div>
          )}
        </Panel>

        {d.relatedMissions.length > 0 && (
          <Panel>
            <PanelHeader title="Related Missions" />
            <ModuleIntro purpose="A recapture is another attempt at this mission. A rescan is a new mission on the same property at a later time. They are different things and are linked, not merged." />
            <DataTable
              keyOf={(r) => r.id}
              primary="id"
              onRowClick={(r) => navigate(ROUTES.mission(r.id))}
              rows={d.relatedMissions}
              columns={[
                { key: "id", header: "Mission", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.id}</span> },
                { key: "rel", header: "Relationship", render: (r) => r.relationshipType.replace(/_/g, " ") },
                { key: "type", header: "Type", wrap: true, render: (r) => r.missionType },
                { key: "state", header: "State", render: (r) => <StateChip value={r.missionState} small /> },
                { key: "when", header: "Scheduled", render: (r) => r.scheduledStart ? shortDate(r.scheduledStart) : "—" },
              ]}
            />
          </Panel>
        )}
      </div>
    );

  if (tab === "Evidence") return <MissionEvidence missionId={m.id} propertyId={m.propertyId} navigate={navigate} />;
  if (tab === "Cortex") return <MissionCortex missionId={m.id} propertyId={m.propertyId} navigate={navigate} vp={vp} />;

  if (tab === "Processing")
    return (
      <Panel>
        <PanelHeader title="Processing" />
        <div style={{ display: "grid", gridTemplateColumns: facts(3), gap: 12 }}>
          <Fact label="Capture" value={m.captureState} />
          <Fact label="Evidence Validation" value={m.evidenceState} />
          <Fact label="Processing" value={m.processingState} />
        </div>
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 14 }}>
          Data validation is a gate, not a formality. A mission only advances past it when coverage and integrity
          conditions are met — otherwise it moves to RECAPTURE REQUIRED. No automated AI validation is running yet;
          the current gate is a coverage and hash check.
        </div>
      </Panel>
    );

  if (tab === "Passport")
    return (
      <Panel>
        <PanelHeader title="Passport Sync" />
        <ModuleIntro purpose="A mission contributes to the property record; it never becomes the record. Passport remains canonical." />
        <div style={{ display: "grid", gridTemplateColumns: facts(3), gap: 12 }}>
          <Fact label="Sync State" value={m.passportState} tone={m.passportState === "SYNCED" ? "ok" : m.passportState === "CONFLICT" ? "warn" : undefined} />
          <Fact label="Property" value={m.propertyId} mono />
          <Fact label="Cortex State" value={m.cortexState} />
        </div>
        <div style={{ marginTop: 14 }}>
          <GhostButton small onClick={() => navigate(ROUTES.property(m.propertyId, "passport"))}>
            Open the property's Passport record
          </GhostButton>
        </div>
      </Panel>
    );

  if (tab === "Reports")
    return (
      <Panel>
        <PanelHeader title="Reports" />
        <div style={{ display: "grid", gridTemplateColumns: facts(3), gap: 12, marginBottom: 14 }}>
          <Fact label="Report State" value={m.reportState} />
          <Fact label="Report Requested" value={m.requestedServices.includes("REPORT") ? "Yes — in package" : "No"} />
          <Fact label="Package" value={m.requestedPackage.replace(/_/g, " ")} />
        </div>
        <EmptyState
          title="Core report service not connected"
          hint="Core performs report generation; CENTCOM requests and supervises it. Nothing has been generated and nothing has failed — the service is simply not reachable."
          action={<GhostButton onClick={() => navigate(ROUTES.property(m.propertyId, "reports"))}>Property report manifest</GhostButton>}
        />
      </Panel>
    );

  if (tab === "Timeline")
    return (
      <Panel>
        <PanelHeader title="Mission Timeline" />
        <ModuleIntro purpose="The operator-facing history of this mission. Every state change writes one — nothing moves silently." />
        <Resource
          res={{ data: d.timeline, loading: false, error: null, reload: () => {} }}
          empty={<EmptyState title="No events yet in this session" hint="Timeline events are recorded as the mission moves. Seeded fixtures carry no prior event history." />}
        >
          {(rows) => (
            <div style={{ position: "relative", paddingLeft: 16 }}>
              <span style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 1, background: "linear-gradient(180deg," + T.color.blue + ",transparent)" }} />
              {rows.slice().reverse().map((e) => (
                <div key={e.eventId} style={{ position: "relative", padding: "8px 0" }}>
                  <span style={{ position: "absolute", left: -16, top: 13, width: 7, height: 7, borderRadius: "50%", background: T.color.blueBright, boxShadow: T.glow.blueSoft }} />
                  <div style={{ fontFamily: T.font.mono, fontSize: 9.5, letterSpacing: "0.08em", color: T.color.blueBright }}>{e.type}</div>
                  <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginTop: 3 }}>{e.summary}</div>
                  <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textFaint, marginTop: 2 }}>
                    {relTime(e.at)}{e.fromState ? " · " + e.fromState + " → " + e.toState : ""} · {e.actor}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Resource>
      </Panel>
    );

  if (tab === "Audit")
    return (
      <Panel>
        <PanelHeader title="Mission Audit" />
        <ModuleIntro purpose="Audit is distinct from the timeline. The timeline tells the operator what happened; audit records who did it, from which state, to which state, and on whose authority." />
        <Resource
          res={{ data: d.audit, loading: false, error: null, reload: () => {} }}
          empty={<EmptyState title="No audit records in this session" hint="Audit entries are written as actions are taken. Seeded fixtures carry no prior audit history." />}
        >
          {(rows) => (
            <DataTable
              keyOf={(r) => r.auditId}
              primary="action"
              rows={rows.slice().reverse()}
              columns={[
                { key: "at", header: "When", render: (r) => relTime(r.at) },
                { key: "actor", header: "Actor", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.actor}</span> },
                { key: "action", header: "Action", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{r.action}</span> },
                { key: "prev", header: "Previous", render: (r) => r.previousState || "—" },
                { key: "next", header: "New", render: (r) => r.newState || "—" },
                { key: "reason", header: "Reason", wrap: true, render: (r) => r.reason || "—" },
                { key: "src", header: "Source", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.sourceSystem}</span> },
              ]}
            />
          )}
        </Resource>
      </Panel>
    );

  return <Panel><EmptyState title={tab} hint="This section has no content yet." /></Panel>;
}


function MissionBlockers({ detail: d, vp }) {
  return (
    <Panel>
      <PanelHeader title="Blockers" />
      <Resource
        res={{ data: d.blockers, loading: false, error: null, reload: () => {} }}
        empty={<EmptyState title="No blockers" hint="Nothing is currently preventing this mission from advancing." />}
      >
        {(rows) => (
          <DataTable
            keyOf={(r) => r.blockerId}
            primary="message"
            rows={rows}
            columns={[
              { key: "severity", header: "Severity", render: (r) => <StateChip value={r.severity} small /> },
              { key: "category", header: "Category", render: (r) => r.category },
              { key: "message", header: "Issue", wrap: true, render: (r) => r.message },
              { key: "status", header: "Status", render: (r) => <StateChip value={r.status} small /> },
              { key: "created", header: "Raised", render: (r) => relTime(r.createdAt) },
              { key: "source", header: "Source", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.sourceSystem}</span> },
              { key: "resolution", header: "Resolution", wrap: true, render: (r) => r.resolution || "—" },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}


function MissionAtcHandoff({ missionId, navigate, vp }) {
  const res = useResource(() => centcomApi.getReadinessRequest(missionId), [missionId]);
  return (
    <Panel>
      <PanelHeader title="ATC Handoff — Readiness Request" />
      <ModuleIntro purpose="Mission Command hands ATC a normalized readiness request. ATC consumes this projection rather than reading the mission record, and ATC alone decides launch." />
      <Resource res={res} loadingLines={3}>
        {(r) => (
          <>
            <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(3,1fr)", gap: 12 }}>
              <Fact label="Mission" value={r.missionId} mono />
              <Fact label="Property" value={r.propertyId} mono />
              <Fact label="Objective" value={r.objective.replace(/_/g, " ")} />
              <Fact label="Window" value={r.scheduledWindow.start ? shortDate(r.scheduledWindow.start) + " · " + r.scheduledWindow.type : "Not scheduled"} />
              <Fact label="Aircraft" value={r.assignedAircraft || "Unassigned"} />
              <Fact label="Operator" value={r.operator || "Unassigned"} />
              <Fact label="Sensor Package" value={r.sensorPackage || "Unassigned"} mono />
              <Fact label="Priority" value={r.priority} />
            </div>
            <div style={{ marginTop: 14 }}>
              <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Required Capabilities</Label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {r.requiredCapabilities.map((c) => <StateChip key={c} value={c} small />)}
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <GhostButton small onClick={() => navigate(ROUTES.atc)}>Open ATC Command</GhostButton>
            </div>
          </>
        )}
      </Resource>
    </Panel>
  );
}


function MissionEvidence({ missionId, propertyId, navigate }) {
  const res = useResource(() => centcomApi.vaultListByMission(missionId), [missionId]);
  return (
    <Panel>
      <PanelHeader title="Mission Evidence" />
      <ModuleIntro purpose="Only evidence captured on this mission. The vault-wide view lives in Evidence Command." />
      <Resource res={res} loadingLines={4}>
        {(rows) => {
          if (!rows.length)
            return <EmptyState title="No evidence from this mission" hint="Evidence appears after capture completes and ingest seals the package." />;
          return (
            <DataTable
              keyOf={(r) => r.evidenceId}
              primary="filename"
              onRowClick={(r) => navigate(ROUTES.evidenceAsset(r.evidenceId))}
              rows={rows}
              columns={[
                { key: "filename", header: "Artifact", wrap: true, render: (r) => <span style={{ fontFamily: T.font.mono }}>{r.filename}</span> },
                { key: "kind", header: "Category", render: (r) => r.kind },
                { key: "class", header: "Classification", render: (r) => <StateChip value={r.truthClassification} small /> },
                { key: "sensor", header: "Sensor", render: (r) => r.sensor },
                { key: "tier", header: "Tier", render: (r) => r.storageTier.toUpperCase() },
                { key: "review", header: "Review", render: (r) => r.reviewState },
              ]}
            />
          );
        }}
      </Resource>
    </Panel>
  );
}


function MissionCortex({ missionId, propertyId, navigate, vp }) {
  const res = useResource(() => centcomApi.listAnalyses(propertyId), [propertyId]);
  return (
    <Panel>
      <PanelHeader title="Cortex Analyses" accent="gold" />
      <Resource res={res} loadingLines={3}>
        {(rows) => {
          if (!rows.length)
            return <EmptyState title="No analysis for this mission" hint="Cortex is enqueued once an evidence package is sealed." />;
          return (
            <DataTable
              keyOf={(r) => r.analysisId}
              primary="analysisType"
              onRowClick={(r) => navigate(ROUTES.property(propertyId, "cortex"))}
              rows={rows}
              columns={[
                { key: "analysisId", header: "Analysis", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.goldBright }}>{r.analysisId}</span> },
                { key: "analysisType", header: "Type", wrap: true, render: (r) => r.analysisType },
                { key: "status", header: "State", render: (r) => <StateChip value={r.status} small /> },
                { key: "model", header: "Model", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.modelName + " " + r.modelVersion}</span> },
                { key: "inputs", header: "Input Evidence", align: "right", render: (r) => r.inputEvidenceIds.length },
                { key: "findings", header: "Findings", align: "right", render: (r) => r.findingIds.length },
                { key: "review", header: "Review", render: (r) => r.reviewState },
              ]}
            />
          );
        }}
      </Resource>
    </Panel>
  );
}
