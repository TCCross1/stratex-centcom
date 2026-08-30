import React, { useState } from "react";
import T from "../../design/tokens.js";
import { relTime, shortDate, bytesToMb } from "../../utils/format.js";
import { ROUTES, EVIDENCE_TABS } from "../../app/router/routes.js";
import centcomApi from "../../domains/index.js";
import { TIER_DESCRIPTION, STORAGE_TIER } from "../../domains/evidence/storage.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Fact, DataTable, Resource, EmptyState, GhostButton,
  Breadcrumb, ModuleIntro, MetalText, LineageRail,
} from "../../components/common/primitives.jsx";
import { EvPill, OriginBadge, ThermalKindBadge, HashDisplay } from "../../components/evidence/EvidenceShared.jsx";

const slug = (n) => n.toLowerCase().replace(/\s+/g, "-");
const grid = (vp, n) => (vp.isPhone ? "1fr 1fr" : "repeat(" + n + ",1fr)");

export function EvidenceDetail({ evidenceId, tabSlug, navigate }) {
  const res = useResource(() => centcomApi.vaultGet(evidenceId), [evidenceId]);
  const fromSlug = EVIDENCE_TABS.find((t) => slug(t) === tabSlug);
  const [tab, setTab] = useState(fromSlug || "Overview");
  const vp = useViewport();

  const openTab = (name) => { setTab(name); navigate(ROUTES.evidenceAsset(evidenceId) + "/" + slug(name)); };

  return (
    <Resource
      res={res}
      loadingLines={5}
      label="Opening evidence record"
      empty={
        <Panel>
          <EmptyState title="No evidence with that ID" hint={'"' + evidenceId + '" is not in the vault.'}
            action={<GhostButton onClick={() => navigate(ROUTES.evidence)}>Back to Evidence Command</GhostButton>} />
        </Panel>
      }
    >
      {(d) => {
        const a = d.asset;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
            <Panel pad={vp.isPhone ? 12 : 14}>
              <Breadcrumb
                navigate={navigate}
                trail={[
                  { label: "CENTCOM", to: ROUTES.dashboard },
                  { label: "Evidence", to: ROUTES.evidence },
                  { label: a.evidenceId, to: ROUTES.evidenceAsset(a.evidenceId) },
                  { label: tab },
                ]}
              />
              <MetalText size={vp.isPhone ? 17 : 22} track="0.04em">{a.filename}</MetalText>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 11 }}>
                <OriginBadge origin={a.origin} />
                {a.thermalKind && <ThermalKindBadge kind={a.thermalKind} />}
                <EvPill value={a.reviewState} small />
                <EvPill value={a.qualityState} small />
                <EvPill value={a.hashState} small />
                <EvPill value={a.storageTier} small />
                <EvPill value={d.eligibility.state} small title={d.eligibility.reasons.join(" ")} />
              </div>
              <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 12 }}>
                {a.origin === "ORIGINAL"
                  ? "This is a captured artifact. It is immutable — review changes its state, never its content."
                  : "This is a computed artifact. It declares the source evidence it was derived from."}
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
              {EVIDENCE_TABS.map((name) => {
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

            <EvidenceTabBody tab={tab} detail={d} navigate={navigate} vp={vp} reload={res.reload} />
          </div>
        );
      }}
    </Resource>
  );
}

function EvidenceTabBody({ tab, detail: d, navigate, vp, reload }) {
  const a = d.asset;

  if (tab === "Overview")
    return (
      <Panel>
        <PanelHeader title="Overview" />
        <div style={{ display: "grid", gridTemplateColumns: grid(vp, 4), gap: 12 }}>
          <Fact label="Evidence ID" value={a.evidenceId} mono />
          <Fact label="Property" value={a.propertyId} mono />
          <Fact label="Mission" value={a.missionId} mono />
          <Fact label="Capture Package" value={a.capturePackageId || "—"} mono />
          <Fact label="Artifact Type" value={a.artifactType.replace(/_/g, " ")} />
          <Fact label="Origin" value={a.origin} />
          <Fact label="Sensor" value={a.sensorType || "—"} />
          <Fact label="Captured" value={a.capturedAt ? shortDate(a.capturedAt) : "—"} />
          <Fact label="Ingested" value={relTime(a.ingestedAt)} />
          <Fact label="Review" value={a.reviewState.replace(/_/g, " ")} />
          <Fact label="Quality" value={a.qualityState.replace(/_/g, " ")} />
          <Fact label="Storage Tier" value={a.storageTier} />
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <GhostButton small onClick={() => navigate(ROUTES.property(a.propertyId, "evidence"))}>Property evidence</GhostButton>
          <GhostButton small onClick={() => navigate(ROUTES.mission(a.missionId, "evidence"))}>Mission evidence</GhostButton>
          {a.capturePackageId && (
            <GhostButton small onClick={() => navigate(ROUTES.capturePackage(a.capturePackageId))}>Capture package</GhostButton>
          )}
        </div>
      </Panel>
    );

  if (tab === "Source")
    return (
      <Panel>
        <PanelHeader title="Source" />
        <ModuleIntro purpose="Where this artifact came from. No capture source is connected — these values are recorded from the fixture package, not pulled from an aircraft." />
        <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
          <Fact label="Source Mode" value={a.sourceMode} />
          <Fact label="Device" value={a.deviceId || "—"} mono />
          <Fact label="Aircraft" value={a.aircraftId || "—"} mono />
          <Fact label="Sensor ID" value={a.sensorId || "—"} mono />
          <Fact label="Operator" value={a.operatorId || "—"} mono />
          <Fact label="Capture Session" value={a.captureSessionId || "—"} mono />
          <Fact label="Original Filename" value={a.originalFilename} />
          <Fact label="Media Type" value={a.mediaType || "—"} />
          <Fact label="Size" value={a.byteSize ? bytesToMb(a.byteSize) : "—"} />
        </div>
      </Panel>
    );

  if (tab === "Integrity") return <IntegrityPanel detail={d} vp={vp} reload={reload} />;

  if (tab === "Metadata")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Capture Metadata" />
          <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
            <Fact label="Latitude" value={a.location?.latitude ?? "Not supplied"} mono />
            <Fact label="Longitude" value={a.location?.longitude ?? "Not supplied"} mono />
            <Fact label="Altitude" value={a.altitude ?? "Not supplied"} />
            <Fact label="Heading" value={a.heading ?? "Not supplied"} />
            <Fact label="Yaw" value={a.pose?.yaw ?? "Not supplied"} />
            <Fact label="Pitch" value={a.pose?.pitch ?? "Not supplied"} />
            <Fact label="Roll" value={a.pose?.roll ?? "Not supplied"} />
          </div>
          <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 12 }}>
            Fields read "Not supplied" where the capture did not include them. No coordinate or orientation is invented.
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Additional Metadata" />
          {Object.keys(a.metadata || {}).length === 0 ? (
            <EmptyState title="No additional metadata" hint="Nothing beyond the standard capture fields was recorded." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 2), gap: 12 }}>
              {Object.entries(a.metadata).map(([k, v]) => (
                <Fact key={k} label={k} value={String(v)} />
              ))}
            </div>
          )}
        </Panel>
      </div>
    );

  if (tab === "Quality")
    return (
      <Panel>
        <PanelHeader title="Quality Assessment" />
        <ModuleIntro purpose="Every check names who judged it. Automated inspection and human judgment are recorded separately — one is never presented as the other." />
        {d.quality ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
              <Fact label="Quality State" value={d.quality.qualityState.replace(/_/g, " ")} />
              <Fact label="Reviewed By" value={d.quality.reviewedBy} />
              <Fact label="Reviewed" value={relTime(d.quality.reviewedAt)} />
            </div>
            <DataTable
              keyOf={(c) => c.code}
              primary="label"
              rows={d.quality.checks}
              columns={[
                { key: "state", header: "Result", render: (c) => <EvPill value={c.state} small /> },
                { key: "label", header: "Check", render: (c) => c.label },
                { key: "source", header: "Judged By", render: (c) => c.source },
                { key: "detail", header: "Detail", wrap: true, render: (c) => c.detail || "—" },
              ]}
            />
            {d.quality.notes && (
              <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginTop: 12 }}>
                {d.quality.notes}
              </div>
            )}
          </>
        ) : (
          <EmptyState title="Not evaluated" hint="No quality assessment has been performed on this artifact." />
        )}
      </Panel>
    );

  if (tab === "Coverage") return <CoveragePanel asset={a} vp={vp} navigate={navigate} />;

  if (tab === "Processing")
    return (
      <Panel>
        <PanelHeader title="Processing" />
        <ModuleIntro purpose="Every derived artifact knows which processor and version produced it and from which inputs. No real photogrammetry, CAD or ML pipeline runs yet — these are recorded jobs, not executed ones." />
        <Resource res={{ data: d.jobs, loading: false, error: null, reload: () => {} }}
          empty={<EmptyState title="No processing jobs" hint="This artifact is neither an input nor an output of a recorded job." />}>
          {(rows) => (
            <DataTable
              keyOf={(j) => j.processingJobId}
              primary="processorType"
              rows={rows}
              columns={[
                { key: "processingJobId", header: "Job", render: (j) => <span style={{ fontFamily: T.font.mono }}>{j.processingJobId}</span> },
                { key: "processorType", header: "Processor", render: (j) => j.processorType.replace(/_/g, " ") },
                { key: "processorVersion", header: "Version", render: (j) => <span style={{ fontFamily: T.font.mono }}>{j.processorVersion}</span> },
                { key: "status", header: "Status", render: (j) => <EvPill value={j.status} small /> },
                { key: "inputs", header: "Inputs", wrap: true, render: (j) => j.inputEvidenceIds.join(", ") || "—" },
                { key: "outputs", header: "Outputs", wrap: true, render: (j) => j.outputEvidenceIds.join(", ") || "—" },
                { key: "failure", header: "Failure", wrap: true, render: (j) => j.failureReason || "—" },
              ]}
            />
          )}
        </Resource>
      </Panel>
    );

  if (tab === "Lineage")
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Provenance Chain" />
          <LineageRail
            navigate={navigate}
            steps={[
              { label: "Property", value: a.propertyId, to: ROUTES.property(a.propertyId) },
              { label: "Mission", value: a.missionId, to: ROUTES.mission(a.missionId) },
              { label: "Operator", value: a.operatorId || "—" },
              { label: "Aircraft", value: a.aircraftId || "—" },
              { label: "Sensor", value: a.sensorId || "—" },
              { label: "Capture", value: a.captureSessionId || "—" },
              { label: "Package", value: a.capturePackageId || "—", to: a.capturePackageId ? ROUTES.capturePackage(a.capturePackageId) : null },
              { label: "Evidence", value: a.evidenceId, current: true },
              { label: "Processing", value: a.parentEvidenceId ? "from " + a.parentEvidenceId : "original" },
              { label: "Cortex", value: a.propertyId ? "analyses" : "—", to: ROUTES.property(a.propertyId, "cortex") },
              { label: "Finding", value: "findings", to: ROUTES.property(a.propertyId, "findings") },
              { label: "Review", value: a.reviewState },
              { label: "Passport", value: "record", to: ROUTES.property(a.propertyId, "passport") },
            ]}
          />
        </Panel>

        {d.parent && (
          <Panel>
            <PanelHeader title="Source Evidence" />
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <GhostButton small onClick={() => navigate(ROUTES.evidenceAsset(d.parent.evidenceId))}>
                {d.parent.evidenceId} — {d.parent.filename}
              </GhostButton>
              <OriginBadge origin={d.parent.origin} />
              {d.parent.thermalKind && <ThermalKindBadge kind={d.parent.thermalKind} />}
            </div>
          </Panel>
        )}

        <Panel>
          <PanelHeader title="Derived From This Artifact" />
          <Resource res={{ data: d.derived, loading: false, error: null, reload: () => {} }}
            empty={<EmptyState title="Nothing derived yet" hint="No processing output references this artifact as its source." />}>
            {(rows) => (
              <DataTable
                keyOf={(r) => r.evidenceId}
                primary="filename"
                onRowClick={(r) => navigate(ROUTES.evidenceAsset(r.evidenceId))}
                rows={rows}
                columns={[
                  { key: "evidenceId", header: "Evidence", render: (r) => <span style={{ fontFamily: T.font.mono, color: T.color.bluePale }}>{r.evidenceId}</span> },
                  { key: "filename", header: "Artifact", wrap: true, render: (r) => r.filename },
                  { key: "type", header: "Type", render: (r) => r.artifactType.replace(/_/g, " ") },
                  { key: "thermal", header: "Thermal Kind", render: (r) => (r.thermalKind ? <ThermalKindBadge kind={r.thermalKind} /> : "—") },
                  { key: "class", header: "Truth Class", render: (r) => r.truthClassification || "—" },
                ]}
              />
            )}
          </Resource>
        </Panel>
      </div>
    );

  if (tab === "Custody")
    return (
      <Panel>
        <PanelHeader title="Chain of Custody" />
        <ModuleIntro purpose="Append-only. Every hand this artifact passed through is recorded, and no entry is ever removed or edited." />
        <DataTable
          keyOf={(c) => c.custodyEventId}
          primary="action"
          rows={d.custody}
          columns={[
            { key: "timestamp", header: "When", render: (c) => relTime(c.timestamp) },
            { key: "action", header: "Action", render: (c) => <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale }}>{c.action}</span> },
            { key: "actor", header: "Actor", render: (c) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{c.actor}</span> },
            { key: "actorType", header: "Type", render: (c) => c.actorType },
            { key: "source", header: "System", render: (c) => <span style={{ fontFamily: T.font.mono, fontSize: 10 }}>{c.sourceSystem}</span> },
            { key: "notes", header: "Notes", wrap: true, render: (c) => c.notes || "—" },
          ]}
        />
      </Panel>
    );

  if (tab === "Storage") return <StoragePanel asset={a} vp={vp} reload={reload} />;

  if (tab === "Review") return <ReviewPanel asset={a} vp={vp} reload={reload} />;

  if (tab === "Cortex")
    return (
      <Panel>
        <PanelHeader title="Cortex Eligibility" accent="gold" />
        <ModuleIntro purpose="Cortex never scans the vault. It receives a scoped manifest built from one capture package, containing only evidence that passed review." />
        <div style={{ display: "grid", gridTemplateColumns: grid(vp, 2), gap: 12 }}>
          <Fact label="Eligibility" value={d.eligibility.state.replace(/_/g, " ")}
            tone={d.eligibility.state === "ELIGIBLE" ? "ok" : d.eligibility.state === "NOT_ELIGIBLE" ? "warn" : undefined} />
          <Fact label="Review State" value={a.reviewState.replace(/_/g, " ")} />
        </div>
        {d.eligibility.reasons.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Why</Label>
            {d.eligibility.reasons.map((r, i) => (
              <div key={i} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft }}>• {r}</div>
            ))}
          </div>
        )}
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 14 }}>
          Cortex may produce analyses, findings, annotations and derived artifacts. It cannot rewrite this record.
        </div>
      </Panel>
    );

  if (tab === "Audit")
    return <AuditPanelEv evidenceId={a.evidenceId} vp={vp} />;

  return <Panel><EmptyState title={tab} hint="No content for this section." /></Panel>;
}

function IntegrityPanel({ detail: d, vp, reload }) {
  const a = d.asset;
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    setBusy(true);
    try { setResult(await centcomApi.vaultVerify(a.evidenceId)); reload(); }
    finally { setBusy(false); }
  };

  return (
    <Panel>
      <PanelHeader title="Integrity"
        action={<GhostButton small onClick={verify}>{busy ? "Verifying…" : "Verify hash"}</GhostButton>} />
      <ModuleIntro purpose="A content hash answers one question: have these bytes changed? It is not a truth score, not a confidence, and not a property integrity rating." />
      <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
        <Fact label="Hash State" value={a.hashState.replace(/_/g, " ")} />
        <Fact label="Algorithm" value={a.hashAlgorithm} />
        <Fact label="Verified At" value={a.hashVerifiedAt ? relTime(a.hashVerifiedAt) : "Never verified"} />
        <Fact label="Immutability" value={a.immutabilityState.replace(/_/g, " ")} />
        <Fact label="Ingest State" value={a.ingestState.replace(/_/g, " ")} />
        <Fact label="Storage Reference" value={a.storageReference} mono />
      </div>

      <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Content Hash</Label>
      <HashDisplay state={a.hashState} value={a.contentHash} algorithm={a.hashAlgorithm} vp={vp} />

      {result && (
        <div
          style={{
            marginTop: 14, padding: "11px 13px", borderRadius: T.radius.sm,
            background: result.state === "VERIFIED" ? "rgba(34,197,94,0.10)"
              : result.state === "MISMATCH" ? "rgba(239,68,68,0.10)" : "rgba(30,107,255,0.10)",
            border: "1px solid " + (result.state === "VERIFIED" ? "rgba(34,197,94,0.45)"
              : result.state === "MISMATCH" ? "rgba(239,68,68,0.45)" : "rgba(30,107,255,0.35)"),
          }}
        >
          <div style={{ fontFamily: T.font.display, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                        color: result.state === "VERIFIED" ? T.color.ok : result.state === "MISMATCH" ? T.color.high : T.color.blueBright }}>
            {result.state.replace(/_/g, " ")}
          </div>
          {result.reason && (
            <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginTop: 6 }}>{result.reason}</div>
          )}
        </div>
      )}
    </Panel>
  );
}

function CoveragePanel({ asset, vp, navigate }) {
  const res = useResource(
    () => (asset.capturePackageId ? centcomApi.vaultGetCoverage(asset.capturePackageId) : Promise.resolve(null)),
    [asset.capturePackageId]
  );
  return (
    <Panel>
      <PanelHeader title="Coverage" />
      <ModuleIntro purpose="Coverage is assessed per capture package against what this mission's objective and focus areas required — never against one global checklist. Missing areas are named, not hidden behind a percentage." />
      <Resource res={res} loadingLines={2}
        empty={<EmptyState title="Not evaluated" hint="No coverage assessment exists for this artifact's capture package." />}>
        {(c) => (
          <>
            <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
              <Fact label="Coverage State" value={c.coverageState.replace(/_/g, " ")} />
              <Fact label="Completion" value={c.completionPercent != null ? c.completionPercent + "%" : "—"} />
              <Fact label="Reviewed" value={relTime(c.reviewedAt)} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr" : "1fr 1fr", gap: 14 }}>
              <div>
                <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Captured</Label>
                {c.capturedAreas.map((x) => (
                  <div key={x} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.ok }}>● {x}</div>
                ))}
              </div>
              <div>
                <Label style={{ fontSize: 8.5, marginBottom: 7 }}>Missing — required but not captured</Label>
                {c.missingAreas.length === 0 ? (
                  <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textFaint }}>None.</div>
                ) : c.missingAreas.map((x) => (
                  <div key={x} style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.warn }}>▲ {x}</div>
                ))}
              </div>
            </div>
            {c.missingAreas.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <GhostButton small onClick={() => navigate(ROUTES.atcMission(c.missionId, "post-flight"))}>
                  ATC post-flight review
                </GhostButton>
              </div>
            )}
          </>
        )}
      </Resource>
    </Panel>
  );
}

function StoragePanel({ asset: a, vp, reload }) {
  const health = useResource(() => centcomApi.vaultProviderHealth(), []);
  const [busy, setBusy] = useState(false);

  const move = async (tier) => {
    setBusy(true);
    try { await centcomApi.vaultChangeTier(a.evidenceId, tier, { reason: "Operator lifecycle action" }); reload(); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel>
        <PanelHeader title="Storage" />
        <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12 }}>
          <Fact label="Current Tier" value={a.storageTier} />
          <Fact label="Reference" value={a.storageReference} mono />
          <Fact label="Size" value={a.byteSize ? bytesToMb(a.byteSize) : "—"} />
        </div>
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 12 }}>
          {TIER_DESCRIPTION[a.storageTier]}
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10, marginTop: 14,
            padding: "11px 13px", borderRadius: T.radius.sm,
            background: "rgba(30,107,255,0.08)", border: "1px solid rgba(30,107,255,0.35)",
          }}
        >
          <span aria-hidden="true" style={{ color: T.color.blueBright }}>⌀</span>
          <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textSoft }}>
            No bytes are materialized for fixture evidence, so there is nothing to download. A signed access link
            requires a connected object storage provider; none is configured.
          </span>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 14 }}>
          {Object.values(STORAGE_TIER).map((tier) => (
            <GhostButton key={tier} small onClick={() => move(tier)}>
              {busy ? "…" : "Move to " + tier}
            </GhostButton>
          ))}
        </div>
        <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 10 }}>
          Archived is not deleted. A tier change writes a custody event and an audit record.
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Provider" />
        <Resource res={health} loadingLines={2}>
          {(rows) => (
            <DataTable
              keyOf={(r) => r.id}
              primary="name"
              rows={rows}
              columns={[
                { key: "name", header: "Provider", render: (r) => r.name },
                { key: "mode", header: "Mode", render: (r) => <EvPill value={r.mode} small /> },
                { key: "live", header: "Live", align: "center", render: (r) => (r.isLive ? "yes" : "no") },
                { key: "detail", header: "Detail", wrap: true, render: (r) => r.detail },
              ]}
            />
          )}
        </Resource>
      </Panel>
    </div>
  );
}

function ReviewPanel({ asset: a, vp, reload }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const act = async (decision, reason) => {
    setBusy(decision); setError(null);
    try { await centcomApi.vaultReview(a.evidenceId, decision, { reason }); reload(); }
    catch (e) { setError(e.message); }
    finally { setBusy(null); }
  };

  return (
    <Panel>
      <PanelHeader title="Human Review" />
      <ModuleIntro purpose="A review decision changes this artifact's state. It never modifies the captured file — rejected and quarantined evidence stays in the vault exactly as it was received." />
      <div style={{ display: "grid", gridTemplateColumns: grid(vp, 3), gap: 12, marginBottom: 14 }}>
        <Fact label="Current State" value={a.reviewState.replace(/_/g, " ")} />
        <Fact label="Reviewed By" value={a.reviewedBy || "—"} />
        <Fact label="Reviewed" value={a.reviewedAt ? relTime(a.reviewedAt) : "—"} />
      </div>
      {a.reviewReason && (
        <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, marginBottom: 14 }}>
          {a.reviewReason}
        </div>
      )}
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        <GhostButton small onClick={() => act("APPROVED", "Reviewed and accepted.")}>Approve</GhostButton>
        <GhostButton small onClick={() => act("APPROVED_WITH_WARNINGS", "Accepted with warnings.")}>Approve with warning</GhostButton>
        <GhostButton small onClick={() => act("RECAPTURE_REQUIRED", "Insufficient for the mission.")}>Request recapture</GhostButton>
        <GhostButton small accent="gold" onClick={() => act("REJECTED", "Rejected in review.")}>Reject</GhostButton>
        <GhostButton small accent="gold" onClick={() => act("QUARANTINED", "Held for integrity concerns.")}>Quarantine</GhostButton>
        {a.reviewState === "QUARANTINED" && (
          <GhostButton small onClick={async () => { await centcomApi.vaultRelease(a.evidenceId, "Concern resolved."); reload(); }}>
            Release from quarantine
          </GhostButton>
        )}
      </div>
      {busy && <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 10 }}>Recording {busy}…</div>}
      {error && <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.high, marginTop: 10 }}>{error}</div>}
    </Panel>
  );
}

function AuditPanelEv({ evidenceId, vp }) {
  const res = useResource(() => centcomApi.vaultListAudit ? centcomApi.vaultListAudit(evidenceId) : Promise.resolve([]), [evidenceId]);
  return (
    <Panel>
      <PanelHeader title="Evidence Audit" />
      <Resource res={res} loadingLines={3}
        empty={<EmptyState title="No audit records in this session" hint="Audit entries are written as evidence is ingested, reviewed or moved. Seeded fixtures carry no prior audit history." />}>
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
            ]}
          />
        )}
      </Resource>
    </Panel>
  );
}
