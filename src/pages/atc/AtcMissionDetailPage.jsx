import React, { useState, useEffect } from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate } from "../../utils/format.js";
import { ROUTES, ATC_TABS } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { ATC_STATE, CHECK_STATE, isExpired } from "../../domains/atc/readiness.js";
import { HOLD_REASONS, LIVE_STATE } from "../../domains/atc/service.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Fact, DataTable, Resource, EmptyState, GhostButton,
  Breadcrumb, ModuleIntro, MetalText,
} from "../../components/common/primitives.jsx";
import { CheckPill, AtcStatePill, SourceBadge } from "../../components/atc/AtcShared.jsx";

const slug = (n) => n.toLowerCase().replace(/\s+/g, "-");
const grid = (vp, n) => (vp.isPhone ? "1fr 1fr" : "repeat(" + n + ",1fr)");

export function AtcMissionDetail({ missionId, tabSlug, navigate }) {
  const mission = useResource(() => centcomApi.getMission(missionId), [missionId]);
  const [assessment, setAssessment] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const fromSlug = ATC_TABS.find((t) => slug(t) === tabSlug);
  const [tab, setTab] = useState(fromSlug || "Overview");
  const vp = useViewport();

  // ATC evaluates on open. Readiness is time-sensitive; a stale assessment is
  // worse than none.
  useEffect(() => {
    let alive = true;
    setEvaluating(true);
    centcomApi.atcEvaluate(missionId)
      .then((a) => alive && setAssessment(a))
      .finally(() => alive && setEvaluating(false));
    return () => { alive = false; };
  }, [missionId]);

  const openTab = (name) => { setTab(name); navigate(ROUTES.atcMission(missionId, slug(name))); };

  return (
    <Resource
      res={mission}
      loadingLines={5}
      label="Opening ATC record"
      empty={
        <Panel>
          <EmptyState title="No mission with that ID" hint={'"' + missionId + '" is not on file.'}
            action={<GhostButton onClick={() => navigate(ROUTES.atc)}>Back to ATC Command</GhostButton>} />
        </Panel>
      }
    >
      {(m) => (
        <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
          <Panel pad={vp.isPhone ? 12 : 14}>
            <Breadcrumb
              navigate={navigate}
              trail={[
                { label: "CENTCOM", to: ROUTES.dashboard },
                { label: "ATC", to: ROUTES.atc },
                { label: m.id, to: ROUTES.atcMission(m.id) },
                { label: tab },
              ]}
            />
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: vp.isPhone ? "100%" : 0 }}>
                <MetalText size={vp.isPhone ? 18 : 23} track="0.04em">{m.missionType}</MetalText>
                <div style={{ fontFamily: T.font.mono, fontSize: 12, color: T.color.bluePale, marginTop: 6 }}>{m.id}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
                  <GhostButton small onClick={() => navigate(ROUTES.mission(m.id))}>Mission Command</GhostButton>
                  <GhostButton small onClick={() => navigate(ROUTES.property(m.propertyId))}>Property {m.propertyId}</GhostButton>
                </div>
              </div>
              <div style={{ width: vp.isPhone ? "100%" : 300, flex: "none" }}>
                <Label>ATC Readiness</Label>
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {evaluating ? (
                    <span style={{ fontFamily: T.font.mono, fontSize: 11, color: T.color.textMute }}>Evaluating…</span>
                  ) : assessment ? (
                    <>
                      <AtcStatePill state={isExpired(assessment) ? ATC_STATE.EXPIRED : assessment.overallState} />
                      <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textMute }}>
                        {assessment.blockingCount} blocking · {assessment.unresolvedCount} unresolved · {assessment.warningCount} warning
                      </span>
                    </>
                  ) : (
                    <AtcStatePill state={ATC_STATE.NOT_EVALUATED} />
                  )}
                </div>
                {assessment && isExpired(assessment) && (
                  <div style={{ marginTop: 10, fontFamily: T.font.body, fontSize: 11, color: T.color.warn }}>
                    ▲ Readiness expired — re-evaluate before launch.
                  </div>
                )}
              </div>
            </div>
          </Panel>

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
            {ATC_TABS.map((name) => {
              const on = name === tab;
              return (
                <button
                  key={name} role="tab" aria-selected={on} onClick={() => openTab(name)}
                  style={{
                    fontFamily: T.font.display, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: on ? "#FFFFFF" : T.color.textMute,
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

          <AtcTabBody tab={tab} mission={m} assessment={assessment} evaluating={evaluating}
                      navigate={navigate} openTab={openTab} vp={vp} />
        </div>
      )}
    </Resource>
  );
}

/** One check row. Shows source and expiry so nothing looks more certain than it is. */
function CheckGrid({ checks, vp }) {
  return (
    <DataTable
      keyOf={(c) => c.checkId}
      primary="label"
      rows={checks}
      columns={[
        { key: "state", header: "State", render: (c) => <CheckPill state={c.state} small /> },
        { key: "label", header: "Check", render: (c) => c.label },
        { key: "category", header: "Category", render: (c) => c.category.replace(/_/g, " ") },
        { key: "message", header: "Detail", wrap: true, render: (c) => c.message },
        { key: "required", header: "Required", align: "center", render: (c) => (c.required === false ? "—" : "yes") },
        { key: "source", header: "Source", render: (c) => <span style={{ fontFamily: T.font.mono, fontSize: 9.5 }}>{c.source}</span> },
        { key: "hint", header: "Resolution", wrap: true, render: (c) => c.resolutionHint || "—" },
      ]}
    />
  );
}

const byCategory = (assessment, cats) =>
  assessment ? assessment.checks.filter((c) => cats.includes(c.category)) : [];

function AtcTabBody({ tab, mission: m, assessment, evaluating, navigate, openTab, vp }) {
  if (evaluating && !assessment)
    return <Panel><EmptyState title="Evaluating readiness" hint="Querying every provider and composing the assessment." /></Panel>;

  if (tab === "Overview")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Operational Summary" />
          <div style={{ display: "grid", gridTemplateColumns: grid(vp, 4), gap: 12 }}>
            <Fact label="Property" value={m.propertyId} mono />
            <Fact label="Scheduled" value={m.scheduledStart ? shortDate(m.scheduledStart) : "Not scheduled"} />
            <Fact label="Window" value={m.timeWindowType} />
            <Fact label="Objective" value={m.assessmentObjective.replace(/_/g, " ")} />
            <Fact label="Package" value={m.requestedPackage.replace(/_/g, " ")} />
            <Fact label="Operator" value={m.operatorId || "Unassigned"} />
            <Fact label="Aircraft" value={m.aircraftId || "Unassigned"} />
            <Fact label="Mission State" value={m.missionState.replace(/_/g, " ")} />
            {assessment && <Fact label="Blocking" value={assessment.blockingCount} tone={assessment.blockingCount ? "warn" : "ok"} />}
            {assessment && <Fact label="Unresolved" value={assessment.unresolvedCount} tone={assessment.unresolvedCount ? "warn" : "ok"} />}
            {assessment && <Fact label="Warnings" value={assessment.warningCount} />}
            {assessment && <Fact label="Thermal" value={assessment.thermal.band.replace(/_/g, " ")} />}
          </div>
          {assessment && (
            <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 14 }}>
              Policy: {assessment.policyPackage} · {assessment.policySource}
            </div>
          )}
        </Panel>
        <Panel>
          <PanelHeader title="Blocking & Unresolved" />
          {assessment ? (
            <CheckGrid vp={vp} checks={assessment.checks.filter(
              (c) => c.required !== false && [CHECK_STATE.FAIL, CHECK_STATE.UNKNOWN, CHECK_STATE.PROVIDER_UNAVAILABLE].includes(c.state)
            )} />
          ) : <EmptyState title="Not evaluated" hint="Run an evaluation to see readiness." />}
        </Panel>
      </div>
    );

  if (tab === "Readiness")
    return (
      <Panel>
        <PanelHeader title="Readiness Grid" />
        <ModuleIntro purpose="Every check ATC ran, with its source and whether it is required for this package. UNKNOWN and NO PROVIDER are shown distinctly from PASS — not knowing something is never the same as it being clear." />
        {assessment ? <CheckGrid vp={vp} checks={assessment.checks} /> : <EmptyState title="Not evaluated" hint="Run an evaluation." />}
      </Panel>
    );

  if (tab === "Weather")
    return (
      <Panel>
        <PanelHeader title="Weather" />
        <ModuleIntro purpose="Weather is development fixture data, not a forecast, and is labelled as such wherever it appears." />
        {assessment ? <CheckGrid vp={vp} checks={byCategory(assessment, ["WEATHER", "WIND", "PRECIPITATION", "VISIBILITY", "TEMPERATURE", "SUNLIGHT"])} />
          : <EmptyState title="Not evaluated" hint="Run an evaluation." />}
      </Panel>
    );

  if (tab === "Airspace")
    return (
      <Panel>
        <PanelHeader title="Airspace & Geofence" />
        <ModuleIntro purpose="No airspace provider is connected. CENTCOM has not checked airspace, has not requested authorization, and does not render a clearance. Confirming airspace and any required authorization remains the operator's responsibility." />
        {assessment ? <CheckGrid vp={vp} checks={byCategory(assessment, ["AIRSPACE", "GEOFENCE"])} />
          : <EmptyState title="Not evaluated" hint="Run an evaluation." />}
      </Panel>
    );

  if (tab === "Aircraft")
    return (
      <Panel>
        <PanelHeader title="Aircraft Readiness" />
        <ModuleIntro purpose="Aircraft state comes from a telemetry provider. None is connected, so battery, storage and GPS report UNKNOWN rather than a value CENTCOM cannot see." />
        {assessment ? <CheckGrid vp={vp} checks={byCategory(assessment, ["AIRCRAFT", "BATTERY", "STORAGE", "GPS_RTK"])} />
          : <EmptyState title="Not evaluated" hint="Run an evaluation." />}
      </Panel>
    );

  if (tab === "Sensors")
    return (
      <Panel>
        <PanelHeader title="Sensor Readiness" />
        <ModuleIntro purpose="Required capability comes from the mission's package. A sensor that is not required is marked N/A rather than passed." />
        {assessment ? <CheckGrid vp={vp} checks={byCategory(assessment, ["CAMERA", "THERMAL_SENSOR", "CALIBRATION"])} />
          : <EmptyState title="Not evaluated" hint="Run an evaluation." />}
      </Panel>
    );

  if (tab === "Operator")
    return (
      <Panel>
        <PanelHeader title="Operator Readiness" />
        <ModuleIntro purpose="ATC may find a mission systemically ready. The operator always retains the authority to hold, abort or refuse launch." />
        {assessment ? <CheckGrid vp={vp} checks={byCategory(assessment, ["OPERATOR"])} />
          : <EmptyState title="Not evaluated" hint="Run an evaluation." />}
      </Panel>
    );

  if (tab === "Mission Plan")
    return (
      <Panel>
        <PanelHeader title="Mission Plan" />
        <ModuleIntro purpose="Planning completeness only — whether there is enough operational information to attempt this mission. No autonomous flight path is generated." />
        <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
          <Fact label="Objective" value={m.assessmentObjective.replace(/_/g, " ")} />
          <Fact label="Services" value={m.requestedServices.length + " requested"} />
          <Fact label="Focus Areas" value={(m.focusAreas || []).length || "None"} />
          <Fact label="Estimated Duration" value={m.estimatedDurationMinutes + " min (planning estimate)"} />
          <Fact label="Occupancy" value={m.occupancyState || "Unknown"} />
          <Fact label="Access Notes" value={m.accessNotes || "None recorded"} />
        </div>
        {assessment && <CheckGrid vp={vp} checks={byCategory(assessment, ["MISSION_PLAN", "PROPERTY_ACCESS", "MISSION", "AUTHORIZATION"])} />}
      </Panel>
    );

  if (tab === "Thermal")
    return <ThermalPanel mission={m} assessment={assessment} vp={vp} />;

  if (tab === "Launch")
    return <LaunchPanel mission={m} assessment={assessment} vp={vp} />;

  if (tab === "Live Ops")
    return <LiveOpsPanel mission={m} vp={vp} />;

  if (tab === "Post-Flight")
    return <PostFlightPanel mission={m} navigate={navigate} vp={vp} />;

  if (tab === "Timeline" || tab === "Audit")
    return <AtcHistoryPanel mission={m} audit={tab === "Audit"} vp={vp} />;

  return <Panel><EmptyState title={tab} hint="No content for this section." /></Panel>;
}

function ThermalPanel({ mission: m, assessment, vp }) {
  const t = assessment?.thermal;
  if (!t || t.band === "NOT_APPLICABLE")
    return (
      <Panel>
        <PanelHeader title="Thermal Window" />
        <EmptyState title="Not applicable" hint={"The " + m.requestedPackage.replace(/_/g, " ") + " package does not require a thermal window."} />
      </Panel>
    );
  return (
    <Panel>
      <PanelHeader title="Predicted Thermal Window" accent="gold" />
      <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
        <Fact label="Predicted Band" value={t.band.replace(/_/g, " ")} />
        <Fact label="Score" value={t.score == null ? "No score — insufficient data" : t.score} />
        <Fact label="Recommended Start" value={t.recommendedStart ? shortDate(t.recommendedStart) : "—"} />
        <Fact label="Recommended End" value={t.recommendedEnd ? shortDate(t.recommendedEnd) : "—"} />
      </div>
      {t.score != null && t.scoreIsFixture && (
        <div style={{ marginTop: 12, fontFamily: T.font.mono, fontSize: 9.5, color: T.color.textFaint }}>
          DEVELOPMENT / FIXTURE SCORE — not production calibrated
        </div>
      )}
      {t.factors?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Supporting Factors</Label>
          {t.factors.map((f, i) => (
            <div key={i} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft }}>• {f}</div>
          ))}
        </div>
      )}
      {t.risks?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Risk Factors</Label>
          {t.risks.map((r, i) => (
            <div key={i} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>▲ {r}</div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 16, fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, lineHeight: 1.5 }}>
        {t.disclaimer}
      </div>
    </Panel>
  );
}

function LaunchPanel({ mission: m, assessment, vp }) {
  const auth = useResource(() => centcomApi.getLaunchAuthorization(m.id), [m.id]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const request = async (simulation) => {
    setBusy(true); setError(null);
    try { await centcomApi.requestLaunchAuthorization(m.id, { simulation }); auth.reload(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Panel>
      <PanelHeader title="Launch Authorization" />
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", marginBottom: 14,
          borderRadius: T.radius.md, background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.45)",
        }}
      >
        <span aria-hidden="true" style={{ color: T.color.high }}>✕</span>
        <span style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.high }}>
          LIVE LAUNCH AUTHORIZATION UNAVAILABLE — no flight provider is connected. CENTCOM cannot authorize a real flight.
        </span>
      </div>

      <ModuleIntro purpose="The launch gate requires a READY mission, a current unexpired assessment, and every required check satisfied. Simulation exists so the workflow can be exercised; it is never a real authorization." />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={{ opacity: 0.5 }}>
          <GhostButton small onClick={() => {}}>Live launch — provider required</GhostButton>
        </span>
        <GhostButton small accent="gold" onClick={() => request(true)}>
          {busy ? "Requesting…" : "Request SIMULATED authorization"}
        </GhostButton>
      </div>

      {error && (
        <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: T.radius.sm,
                      background: "rgba(251,146,60,0.10)", border: "1px solid rgba(251,146,60,0.45)",
                      fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>
          ▲ Launch refused: {error}
        </div>
      )}

      <Resource res={auth} loadingLines={2} empty={<EmptyState title="No authorization requested" hint="No launch authorization has been requested for this mission." />}>
        {(a) => (
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
            <Fact label="State" value={a.state.replace(/_/g, " ")} tone={a.state === "DENIED" ? "warn" : undefined} />
            <Fact label="Mode" value={a.authorizationMode || "—"} />
            <Fact label="Requested" value={relTime(a.requestedAt)} />
            <Fact label="Authorized By" value={a.authorizedBy || "—"} />
            <Fact label="Assessment" value={a.readinessAssessmentId || "—"} mono />
            <Fact label="Reason" value={a.reason || "—"} />
          </div>
        )}
      </Resource>
    </Panel>
  );
}

function LiveOpsPanel({ mission: m, vp }) {
  const live = useResource(() => centcomApi.getLiveState(m.id), [m.id]);
  const [frame, setFrame] = useState(null);
  const [holdReason, setHoldReason] = useState("WEATHER");
  const [error, setError] = useState(null);

  useEffect(() => {
    const stop = centcomApi.subscribeTelemetry(m.id, setFrame);
    return stop;
  }, [m.id]);

  const act = async (fn) => {
    setError(null);
    try { await fn(); live.reload(); } catch (e) { setError(e.message); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="Live Operations" action={<SourceBadge mode="FIXTURE" isLive={false} />} />
        <ModuleIntro purpose="No aircraft is connected. The frames below come from a deterministic simulator and exist so the operational surface can be exercised. Nothing here reflects a real aircraft." />
        <Resource res={live} loadingLines={2}>
          {(s) => (
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 4), gap: 12 }}>
              <Fact label="Live State" value={s.state.replace(/_/g, " ")} />
              <Fact label="Hold Reason" value={s.holdReason || "—"} tone={s.holdReason ? "warn" : undefined} />
              <Fact label="Mission State" value={m.missionState.replace(/_/g, " ")} />
              <Fact label="Capture" value={m.captureState.replace(/_/g, " ")} />
            </div>
          )}
        </Resource>
      </Panel>

      <Panel>
        <PanelHeader title="Telemetry — SIMULATION" />
        {frame ? (
          <div style={{ display: "grid", gridTemplateColumns: grid(vp, 4), gap: 12 }}>
            <Fact label="Battery" value={frame.batteryPercent + "%"} />
            <Fact label="Altitude" value={frame.altitudeFt + " ft"} />
            <Fact label="Ground Speed" value={frame.groundSpeedMph + " mph"} />
            <Fact label="Heading" value={frame.heading + "°"} />
            <Fact label="GPS" value={frame.gpsState} />
            <Fact label="RTK" value={frame.rtkState} />
            <Fact label="Link Quality" value={frame.connectionQuality + "/5"} />
            <Fact label="Storage" value={frame.storageRemainingGb + " GB"} />
            <Fact label="Active Sensor" value={frame.activeSensor} />
            <Fact label="Capture Progress" value={frame.captureProgress + "% (simulated)"} />
            <Fact label="Warnings" value={frame.warningCodes.length ? frame.warningCodes.join(", ") : "None"} />
            <Fact label="Source" value="SIMULATION" />
          </div>
        ) : (
          <EmptyState title="No telemetry" hint="The simulator has not emitted a frame yet." />
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Operator Controls" />
        <ModuleIntro purpose="Hold and abort are always available to the operator. Nothing in this system forces a launch or resumes an operation on its own." />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select
            value={holdReason}
            onChange={(e) => setHoldReason(e.target.value)}
            aria-label="Hold reason"
            style={{
              fontFamily: T.font.display, fontSize: vp.isPhone ? 16 : 10.5, fontWeight: 700,
              color: T.color.textSoft, background: "rgba(6,12,22,0.9)",
              border: "1px solid " + T.color.edgeBright, borderRadius: T.radius.sm,
              padding: vp.isPhone ? "10px 12px" : "6px 9px",
              minHeight: vp.isPhone ? T.layout.tap : undefined,
            }}
          >
            {HOLD_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <GhostButton small onClick={() => act(() => centcomApi.holdMission(m.id, holdReason))}>Place hold</GhostButton>
          <GhostButton small onClick={() => act(() => centcomApi.resumeMission(m.id, { blockerResolved: true }))}>Resume</GhostButton>
          <GhostButton small accent="gold" onClick={() => act(() => centcomApi.abortMission(m.id, "SAFETY"))}>Abort</GhostButton>
        </div>
        {error && (
          <div style={{ marginTop: 12, fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>▲ {error}</div>
        )}
      </Panel>
    </div>
  );
}

function PostFlightPanel({ mission: m, navigate, vp }) {
  const validation = useResource(() => centcomApi.getCaptureValidation(m.id), [m.id]);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try { await centcomApi.validateCapture(m.id); validation.reload(); }
    finally { setBusy(false); }
  };

  return (
    <Panel>
      <PanelHeader title="Post-Flight — Capture Validation"
        action={<GhostButton small onClick={run}>{busy ? "Validating…" : "Run validation"}</GhostButton>} />
      <ModuleIntro purpose="Landing is not approval. The capture package is checked for required outputs and coverage before anything moves downstream. A completed flight that did not capture what the mission asked for goes to recapture, not to Cortex." />
      <Resource res={validation} loadingLines={3}
        empty={<EmptyState title="Not reviewed" hint="No post-flight review has been performed for this mission." />}>
        {(v) => (
          <>
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
              <Fact label="State" value={v.state.replace(/_/g, " ")} tone={v.state === "APPROVED" ? "ok" : v.state === "RECAPTURE_REQUIRED" ? "warn" : undefined} />
              <Fact label="Coverage" value={v.coverageState} />
              <Fact label="Capture Session" value={v.captureId || "—"} mono />
              <Fact label="Required Outputs" value={v.requiredOutputs.join(", ") || "—"} />
              <Fact label="Completed" value={v.completedOutputs.join(", ") || "None"} />
              <Fact label="Missing" value={v.missingOutputs.join(", ") || "None"} tone={v.missingOutputs.length ? "warn" : "ok"} />
              <Fact label="Reviewed By" value={v.reviewedBy} />
              <Fact label="Reviewed" value={relTime(v.reviewedAt)} />
            </div>
            {v.qualityFlags.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Quality Flags</Label>
                {v.qualityFlags.map((f, i) => (
                  <div key={i} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>▲ {f}</div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <GhostButton small onClick={() => navigate(ROUTES.mission(m.id, "capture"))}>Capture sessions</GhostButton>
              <GhostButton small onClick={() => navigate(ROUTES.property(m.propertyId, "evidence"))}>Property evidence</GhostButton>
            </div>
          </>
        )}
      </Resource>
    </Panel>
  );
}

function AtcHistoryPanel({ mission: m, audit, vp }) {
  const res = useResource(() => (audit ? centcomApi.listAtcAudit(m.id) : centcomApi.listAtcEvents(m.id)), [m.id, audit]);
  return (
    <Panel>
      <PanelHeader title={audit ? "ATC Audit" : "ATC Timeline"} />
      <ModuleIntro purpose={audit
        ? "Who changed what, from which state to which, and on whose authority. Readiness and authorization never change silently."
        : "The operational story of this mission from ATC's side."} />
      <Resource res={res} loadingLines={3}
        empty={<EmptyState title="No ATC events yet" hint="Events are recorded as ATC evaluates, authorizes, holds or closes out this mission." />}>
        {(rows) => (
          <DataTable
            keyOf={(r) => r.eventId || r.auditId}
            primary="type"
            rows={rows.slice().reverse()}
            columns={audit ? [
              { key: "at", header: "When", render: (r) => relTime(r.at) },
              { key: "actor", header: "Actor", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{r.actor}</span> },
              { key: "action", header: "Action", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{r.action}</span> },
              { key: "prev", header: "Previous", render: (r) => r.previousState || "—" },
              { key: "next", header: "New", render: (r) => r.newState || "—" },
              { key: "reason", header: "Reason", wrap: true, render: (r) => r.reason || "—" },
            ] : [
              { key: "at", header: "When", render: (r) => relTime(r.at) },
              { key: "type", header: "Event", render: (r) => <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{r.type}</span> },
              { key: "actor", header: "Actor", render: (r) => r.actor },
              { key: "reason", header: "Detail", wrap: true, render: (r) => r.reason || "—" },
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}
