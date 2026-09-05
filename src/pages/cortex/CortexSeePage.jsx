import React, { useEffect, useMemo, useRef, useState } from "react";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import EvidenceService from "../../domains/evidence/service.js";
import { FINDING_TREATMENT } from "../../domains/cortex/service.js";
import { useResource, useViewport } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, GhostButton, EmptyState, Resource, Breadcrumb,
  MetalText, ModuleIntro, Fact,
} from "../../components/common/primitives.jsx";
import { ROUTES } from "../../app/router/routes.js";
import { bytesToMb } from "../../utils/format.js";

const TREATMENT_LABELS = {
  [FINDING_TREATMENT.REPAIR]: "Repair",
  [FINDING_TREATMENT.OVERLAY]: "Overlay",
  [FINDING_TREATMENT.TEAR_OFF_REPLACE]: "Tear-off / Replace",
};

const emptyDraft = () => ({
  label: "",
  whatISee: "",
  likelyCause: "",
  treatment: "",
  repairDetail: "",
  userMaterialNotes: "",
  bbox: null,
  crop: { x: 0, y: 0, width: 100, height: 100 },
});

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function Field({ label, children, hint }) {
  return (
    <div>
      <Label style={{ marginBottom: 6 }}>{label}</Label>
      {children}
      {hint && (
        <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textFaint, marginTop: 5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function inputStyle(vp, extra) {
  return {
    width: "100%",
    background: T.color.inset,
    border: "1px solid " + T.color.edge,
    borderRadius: T.radius.sm,
    color: T.color.text,
    padding: vp.isPhone ? "10px 11px" : "8px 10px",
    fontFamily: T.font.body,
    fontSize: 12.5,
    outline: "none",
    boxSizing: "border-box",
    boxShadow: T.bevel.sunken,
    ...extra,
  };
}

function noteStyle(color) {
  return {
    background: color + "18",
    border: "1px solid " + color + "66",
    color,
    padding: "9px 10px",
    borderRadius: T.radius.sm,
    fontFamily: T.font.body,
    fontSize: 11.5,
  };
}

export function CortexSeePage({ missionId, propertyId, navigate, inline = false }) {
  const missionRes = useResource(() => centcomApi.getMissionDetail(missionId), [missionId]);
  const evidenceRes = useResource(() => EvidenceService.listByMission(missionId), [missionId]);
  const vp = useViewport();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);
  const [committed, setCommitted] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tool, setTool] = useState("box");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draw, setDraw] = useState(null);
  const gesture = useRef(null);
  const surfaceRef = useRef(null);

  useEffect(() => {
    if (!evidenceRes.data?.length) return;
    setSelectedId((current) => current || evidenceRes.data[0].evidenceId);
  }, [evidenceRes.data]);

  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const onWheel = (event) => {
      event.preventDefault();
      const dir = event.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => clamp(Number((z * dir).toFixed(2)), 0.5, 4));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [evidenceRes.data, selectedId]);

  const selectedAsset = useMemo(
    () => (evidenceRes.data || []).find((item) => item.evidenceId === selectedId) || null,
    [evidenceRes.data, selectedId]
  );

  const missingBytes = !selectedAsset || (selectedAsset.bytes ?? 0) <= 0;
  const sourceMode = selectedAsset?.sourceMode || "FIXTURE";
  const mission = missionRes.data?.mission;
  const bbox = draw || draft.bbox;

  const setField = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const pctFromEvent = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  };

  const handlePointerDown = (event) => {
    if (event.button === 1 || tool === "pan" || event.shiftKey) {
      gesture.current = { kind: "pan", lastX: event.clientX, lastY: event.clientY };
      return;
    }
    if (missingBytes) {
      setError("Evidence asset is missing bytes; cannot box this finding.");
      return;
    }
    const start = pctFromEvent(event);
    gesture.current = { kind: "box", start };
    setDraw({ x: start.x, y: start.y, width: 0, height: 0 });
  };

  const handlePointerMove = (event) => {
    const g = gesture.current;
    if (!g) return;
    if (g.kind === "pan") {
      setPan((p) => ({
        x: p.x + (event.clientX - g.lastX),
        y: p.y + (event.clientY - g.lastY),
      }));
      gesture.current = { ...g, lastX: event.clientX, lastY: event.clientY };
      return;
    }
    const now = pctFromEvent(event);
    setDraw({
      x: Math.min(g.start.x, now.x),
      y: Math.min(g.start.y, now.y),
      width: Math.abs(now.x - g.start.x),
      height: Math.abs(now.y - g.start.y),
    });
  };

  const handlePointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.kind !== "box" || !draw || draw.width < 2 || draw.height < 2) {
      setDraw(null);
      return;
    }
    setDraft((current) => ({
      ...current,
      bbox: {
        x: Math.round(draw.x),
        y: Math.round(draw.y),
        width: Math.round(draw.width),
        height: Math.round(draw.height),
      },
    }));
    setDraw(null);
  };

  const createFinding = async () => {
    setBusy(true);
    setError(null);
    try {
      const savedFinding = await centcomApi.createSeeFinding({
        missionId,
        propertyId: mission?.propertyId || propertyId || null,
        evidenceAssetId: selectedAsset?.evidenceId,
        bytes: selectedAsset?.bytes,
        ...draft,
      });
      setSaved(savedFinding);
      setCommitted(null);
      setDraft(emptyDraft());
    } catch (err) {
      setError(err.message || "Unable to save this inspection.");
    } finally {
      setBusy(false);
    }
  };

  const commitFinding = async () => {
    if (!saved?.findingId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await centcomApi.commitSeeToPassport(saved.findingId);
      setCommitted(result);
      setSaved({ ...saved, committedToPassport: true, passportVersionId: result.version.revisionId });
    } catch (err) {
      setError(err.message || "Unable to commit See to Passport.");
    } finally {
      setBusy(false);
    }
  };

  const desk = (assets) => (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      {!inline && (
        <Panel pad={vp.isPhone ? 12 : 14}>
          <Breadcrumb
            navigate={navigate}
            trail={[
              { label: "CENTCOM", to: ROUTES.dashboard },
              { label: "Missions", to: ROUTES.missions },
              { label: missionId, to: ROUTES.mission(missionId) },
              { label: "See" },
            ]}
          />
          <MetalText size={vp.isPhone ? 18 : 23} track="0.04em">Cortex See</MetalText>
          <div style={{ fontFamily: T.font.mono, fontSize: 12, color: T.color.bluePale, marginTop: 6 }}>
            {missionId}
          </div>
        </Panel>
      )}

      <Panel>
        <PanelHeader title="Inspection Desk" />
        <ModuleIntro purpose="Annotate one original capture. The box is an operator observation, not a Passport field, and it never rewrites the evidence asset." />
        <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12 }}>
          <Fact label="Mission" value={missionId} mono />
          <Fact label="Property" value={mission?.propertyId || propertyId || "—"} mono />
          <Fact label="Source" value={sourceMode} />
          <Fact label="Selected" value={selectedAsset?.filename || "—"} />
        </div>
      </Panel>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: vp.isPhone ? "1fr" : vp.isTablet ? "180px minmax(0,1fr)" : "196px minmax(0,1fr) 320px",
          gap: vp.gutter,
          alignItems: "stretch",
        }}
      >
        <Panel pad={10}>
          <PanelHeader title="Filmstrip" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: vp.isPhone ? 220 : 560, overflowY: "auto" }}>
            {assets.map((asset) => {
              const on = asset.evidenceId === selectedId;
              const empty = (asset.bytes ?? 0) <= 0;
              return (
                <button
                  key={asset.evidenceId}
                  type="button"
                  onClick={() => {
                    setSelectedId(asset.evidenceId);
                    setDraft(emptyDraft());
                    setError(null);
                    setSaved(null);
                    setCommitted(null);
                    resetView();
                  }}
                  style={{
                    width: "100%", textAlign: "left", cursor: "pointer",
                    padding: 9, minHeight: T.layout.tap,
                    borderRadius: T.radius.md,
                    border: "1px solid " + (on ? "rgba(30,107,255,0.55)" : T.color.edge),
                    background: on
                      ? "linear-gradient(180deg,rgba(30,107,255,0.28),rgba(10,24,48,0.9))"
                      : "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                    boxShadow: on ? T.glow.blueSoft : T.bevel.tile,
                    color: T.color.text,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div style={{
                    height: 54, marginBottom: 8, borderRadius: T.radius.sm,
                    background: empty
                      ? "repeating-linear-gradient(45deg,rgba(239,68,68,0.12),rgba(239,68,68,0.12) 6px,rgba(5,10,18,0.9) 6px,rgba(5,10,18,0.9) 12px)"
                      : "radial-gradient(80% 80% at 50% 20%, rgba(30,107,255,0.22), rgba(5,10,18,0.95))",
                    border: "1px solid " + T.color.edge,
                    display: "grid", placeItems: "center",
                    fontFamily: T.font.display, fontSize: 9, letterSpacing: "0.12em",
                    color: empty ? T.color.high : T.color.bluePale, textTransform: "uppercase",
                  }}>
                    {empty ? "No bytes" : (asset.sourceMode || "FIXTURE")}
                  </div>
                  <div style={{ fontFamily: T.font.mono, fontSize: 10, color: on ? "#FFFFFF" : T.color.bluePale }}>
                    {asset.filename}
                  </div>
                  <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textMute, marginTop: 3 }}>
                    {asset.sensor || asset.kind} · {asset.bytes ? bytesToMb(asset.bytes) : "missing bytes"}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel pad={10}>
          <PanelHeader
            title="Original capture"
            action={
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <GhostButton small onClick={() => setTool("box")}>{tool === "box" ? "● Box" : "Box"}</GhostButton>
                <GhostButton small onClick={() => setTool("pan")}>{tool === "pan" ? "● Pan" : "Pan"}</GhostButton>
                <GhostButton small onClick={() => setZoom((z) => clamp(Number((z * 1.15).toFixed(2)), 0.5, 4))}>Zoom +</GhostButton>
                <GhostButton small onClick={() => setZoom((z) => clamp(Number((z / 1.15).toFixed(2)), 0.5, 4))}>Zoom −</GhostButton>
                <GhostButton small onClick={() => setRotation((r) => (r + 90) % 360)}>Rotate 90°</GhostButton>
                <GhostButton small onClick={resetView}>Reset</GhostButton>
              </div>
            }
          />
          {selectedAsset ? (
            <>
              <div
                ref={surfaceRef}
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                style={{
                  position: "relative", overflow: "hidden", cursor: tool === "pan" ? "grab" : "crosshair",
                  height: vp.isPhone ? 320 : 520, borderRadius: T.radius.md,
                  border: "1px solid " + T.color.edge, background: T.color.inset, boxShadow: T.bevel.sunken,
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "50%", top: "50%",
                    width: "78%", height: "78%",
                    transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                    transformOrigin: "center",
                    background:
                      "linear-gradient(180deg,rgba(18,32,54,0.95),rgba(6,12,22,0.98)), repeating-linear-gradient(90deg,rgba(30,107,255,0.05) 0 1px, transparent 1px 32px), repeating-linear-gradient(0deg,rgba(30,107,255,0.05) 0 1px, transparent 1px 32px)",
                    border: "1px solid " + T.color.edgeBright,
                    boxShadow: T.bevel.panel,
                  }}
                >
                  <div style={{ position: "absolute", inset: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontFamily: T.font.display, fontSize: 11, letterSpacing: "0.14em", color: T.color.bluePale, textTransform: "uppercase" }}>
                        {sourceMode} capture
                      </div>
                      <div style={{ fontFamily: T.font.mono, fontSize: 13, color: T.color.text, marginTop: 6 }}>
                        {selectedAsset.filename}
                      </div>
                      <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 4 }}>
                        {selectedAsset.sensor} · {selectedAsset.device} · original immutable
                      </div>
                    </div>
                    <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textFaint }}>
                      {selectedAsset.evidenceId} · wheel zoom · drag box · shift-drag pan
                    </div>
                  </div>
                  {bbox && (
                    <div
                      style={{
                        position: "absolute",
                        left: bbox.x + "%", top: bbox.y + "%",
                        width: bbox.width + "%", height: bbox.height + "%",
                        border: "2px solid " + T.color.goldBright,
                        background: "rgba(240,180,41,0.12)",
                        boxShadow: T.glow.goldSoft,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                {missingBytes && (
                  <div style={{
                    position: "absolute", inset: 0, display: "grid", placeItems: "center",
                    background: "rgba(3,6,12,0.72)",
                  }}>
                    <EmptyState title="Missing bytes" hint="This asset cannot be boxed until bytes are present. The original record is unchanged." />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <Fact label="Zoom" value={zoom + "×"} />
                <Fact label="Rotation" value={rotation + "°"} />
                <Fact label="Box" value={draft.bbox ? `${draft.bbox.width}×${draft.bbox.height}` : "Not drawn"} />
              </div>
            </>
          ) : (
            <EmptyState title="No evidence on this mission" hint="Cortex See requires a mission capture to inspect. Nothing is invented here." />
          )}
        </Panel>

        {(!vp.isTablet || vp.isPhone) && (
          <SeeDrawer
            vp={vp}
            draft={draft}
            setField={setField}
            error={error}
            saved={saved}
            committed={committed}
            busy={busy}
            onSave={createFinding}
            onCommit={commitFinding}
            missingBytes={missingBytes}
          />
        )}
      </div>

      {vp.isTablet && !vp.isPhone && (
        <SeeDrawer
          vp={vp}
          draft={draft}
          setField={setField}
          error={error}
          saved={saved}
          committed={committed}
          busy={busy}
          onSave={createFinding}
          onCommit={commitFinding}
          missingBytes={missingBytes}
        />
      )}
    </div>
  );

  if (inline) {
    if (missionRes.loading || evidenceRes.loading) {
      return <Resource res={missionRes.loading ? missionRes : evidenceRes} loadingLines={5} label="Opening inspection desk" />;
    }
    if (missionRes.error) return <Resource res={missionRes} />;
    if (evidenceRes.error) return <Resource res={evidenceRes} />;
    if (!evidenceRes.data?.length) {
      return (
        <Panel>
          <EmptyState title="No evidence on this mission" hint="Cortex See stays empty until a capture exists. No live drone feed is connected." />
        </Panel>
      );
    }
    return desk(evidenceRes.data);
  }

  return (
    <Resource res={missionRes} loadingLines={5} label="Opening inspection desk">
      {() => (
        <Resource
          res={evidenceRes}
          loadingLines={4}
          label="Loading mission evidence"
          empty={
            <Panel>
              <EmptyState title="No evidence on this mission" hint="Cortex See stays empty until a capture exists. No live drone feed is connected." />
            </Panel>
          }
        >
          {(assets) => desk(assets)}
        </Resource>
      )}
    </Resource>
  );
}

function SeeDrawer({ vp, draft, setField, error, saved, committed, busy, onSave, onCommit, missingBytes }) {
  const style = inputStyle(vp);
  return (
    <Panel pad={10}>
      <PanelHeader title="Finding draft" />
      <div style={{ display: "grid", gap: 11 }}>
        <Field label="Label">
          <input value={draft.label} onChange={(e) => setField("label", e.target.value)} style={style} placeholder="e.g. MOISTURE" />
        </Field>
        <Field label="What I see">
          <textarea value={draft.whatISee} onChange={(e) => setField("whatISee", e.target.value)} style={{ ...style, minHeight: 78, resize: "vertical" }} />
        </Field>
        <Field label="Likely cause">
          <textarea value={draft.likelyCause} onChange={(e) => setField("likelyCause", e.target.value)} style={{ ...style, minHeight: 78, resize: "vertical" }} />
        </Field>
        <Field label="Treatment" hint="Required. Repair also needs repair detail.">
          <select value={draft.treatment} onChange={(e) => setField("treatment", e.target.value)} style={style}>
            <option value="">Select treatment</option>
            {Object.entries(TREATMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        {draft.treatment === FINDING_TREATMENT.REPAIR && (
          <Field label="Repair detail">
            <textarea value={draft.repairDetail} onChange={(e) => setField("repairDetail", e.target.value)} style={{ ...style, minHeight: 78, resize: "vertical" }} />
          </Field>
        )}
        <Field label="User material notes">
          <textarea value={draft.userMaterialNotes} onChange={(e) => setField("userMaterialNotes", e.target.value)} style={{ ...style, minHeight: 72, resize: "vertical" }} />
        </Field>
        <Field label="Bounding box">
          <div style={{ fontFamily: T.font.mono, fontSize: 11, color: T.color.textSoft }}>
            {draft.bbox
              ? `x ${draft.bbox.x}  y ${draft.bbox.y}  w ${draft.bbox.width}  h ${draft.bbox.height}`
              : "Draw a box on the original capture."}
          </div>
        </Field>
        {missingBytes && (
          <div style={noteStyle(T.color.warn)}>Boxing is blocked — this asset has no bytes.</div>
        )}
        {error && <div style={noteStyle(T.color.high)}>{error}</div>}
        {saved && !committed && (
          <div style={noteStyle(T.color.ok)}>
            Saved {saved.findingId}. Not a Passport field until Cortex commits a version.
          </div>
        )}
        {committed && (
          <div style={noteStyle(T.color.ok)}>
            Committed {saved?.findingId} as Passport {committed.version?.revisionId}. Evidence unchanged.
          </div>
        )}
        <GhostButton onClick={onSave}>{busy ? "Working…" : "Save inspection"}</GhostButton>
        {saved && !committed && (
          <GhostButton onClick={onCommit}>{busy ? "Working…" : "Commit See"}</GhostButton>
        )}
      </div>
    </Panel>
  );
}
