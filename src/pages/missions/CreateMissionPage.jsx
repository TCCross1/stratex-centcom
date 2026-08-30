import React, { useState } from "react";
import T from "../../design/tokens.js";
import { shortDate } from "../../utils/format.js";
import { formatPropertyId } from "../../utils/ids.js";
import { ROUTES } from "../../app/router/routes.js";
import centcomApi, { MissionService } from "../../domains/index.js";
import {
  MISSION_ORIGIN, ASSESSMENT_OBJECTIVES, REQUESTED_PACKAGES,
  TIME_WINDOW_TYPES, sensorPackages,
} from "../../domains/mission/fixtures.js";
import { useResource, useViewport, useDebounced } from "../../app/hooks.js";
import {
  Panel, PanelHeader, Label, Fact, Resource, EmptyState, GhostButton,
  ModuleIntro, MetalText, Breadcrumb,
} from "../../components/common/primitives.jsx";

const STEPS = [
  "Property", "Origin", "Objective", "Package & Services", "Focus Areas",
  "Access & Authorization", "Requested Window", "Resource Planning", "Review", "Create",
];

const SERVICES = [
  "RGB_MAPPING", "THERMAL_CAPTURE", "ROOF_GEOMETRY", "EXTERIOR_CAPTURE", "MEASUREMENTS",
  "AWE", "DIGITAL_TWIN", "DAMAGE_ASSESSMENT", "PROJECT_VERIFICATION", "REPORT", "CAD_BIM_PREP", "OTHER",
];

const FOCUS_SUGGESTIONS = [
  "North roof slope", "Rear elevation", "Attic ventilation", "Suspected leak zone",
  "Windows", "Garage", "HVAC penetrations", "Commercial roof section B",
];

const label = (v) => String(v).replace(/_/g, " ");

/* ---------------------------------------------------------------- inputs -- */

function Field({ label: text, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <Label style={{ fontSize: 8.5, marginBottom: 7 }}>{text}</Label>
      {children}
      {hint && (
        <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 6 }}>{hint}</div>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, vp, multiline }) {
  const style = {
    width: "100%", fontFamily: T.font.body, color: T.color.text,
    // 16px on phone so iOS does not zoom the page on focus.
    fontSize: vp.isPhone ? 16 : 12,
    background: "rgba(6,12,22,0.9)", border: "1px solid " + T.color.edgeBright,
    borderRadius: T.radius.sm, outline: "none", boxShadow: T.bevel.sunken,
    padding: vp.isPhone ? "11px 12px" : "8px 11px",
    minHeight: multiline ? 74 : vp.isPhone ? 44 : undefined, resize: "vertical",
  };
  return multiline
    ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />
    : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={style} />;
}

function ChoiceGroup({ options, value, onChange, multi, vp }) {
  const selected = multi ? value || [] : [value];
  const toggle = (o) => {
    if (!multi) return onChange(o);
    const next = selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o];
    onChange(next);
  };
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            onClick={() => toggle(o)}
            aria-pressed={on}
            style={{
              cursor: "pointer", borderRadius: T.radius.sm,
              padding: vp.isPhone ? "10px 12px" : "6px 11px",
              minHeight: vp.isPhone ? 44 : undefined,
              fontFamily: T.font.display, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.09em", textTransform: "uppercase",
              color: on ? "#FFFFFF" : T.color.textMute,
              background: on ? "linear-gradient(180deg,rgba(30,107,255,0.34),rgba(10,24,48,0.9))" : "transparent",
              border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
              boxShadow: on ? T.glow.blueSoft : "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------- page --- */

/**
 * CREATE MISSION
 *
 * A guided operational flow, not a CRM form. Every field maps to the canonical
 * Mission model, and creation goes through MissionService — this page contains
 * no creation logic of its own and never touches a fixture array.
 */
export function CreateMission({ navigate, presetPropertyId }) {
  const vp = useViewport();
  const [step, setStep] = useState(presetPropertyId ? 1 : 0);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState({
    propertyId: presetPropertyId || null,
    originType: "STRATEX_INTERNAL",
    requestingPartyType: "STRATEX",
    requestingPartyRef: "u-001",
    missionType: "",
    assessmentObjective: "",
    requestedPackage: "",
    requestedServices: [],
    focusAreas: [],
    knownIssues: [],
    occupancyState: "OCCUPIED",
    accessNotes: "",
    petGateNotes: "",
    specialInstructions: "",
    authorizationState: "NOT_REQUIRED",
    requestedDate: "",
    timeWindowType: "DAY",
    estimatedDurationMinutes: 90,
    estimatedDurationIsPlanning: true,
    operatorId: null,
    aircraftId: null,
    sensorPackageId: null,
    vehicleId: null,
    priority: "NORMAL",
  });

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const validation = MissionService.validateDraft(draft);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const mission = await centcomApi.createMission(draft);
      setCreated(mission);
      setStep(9);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (created)
    return (
      <Panel>
        <PanelHeader title="Mission Created" />
        <MetalText size={vp.isPhone ? 20 : 26} track="0.04em">{created.id}</MetalText>
        <div style={{ display: "grid", gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4,1fr)", gap: 12, marginTop: 16 }}>
          <Fact label="Property" value={created.propertyId} mono />
          <Fact label="State" value={label(created.missionState)} />
          <Fact label="Objective" value={label(created.assessmentObjective)} />
          <Fact label="Package" value={label(created.requestedPackage)} />
        </div>
        <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 14 }}>
          A creation event has been written to this mission's timeline and audit record.
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
          <GhostButton onClick={() => navigate(ROUTES.mission(created.id))}>Open Mission Detail</GhostButton>
          <GhostButton onClick={() => navigate(ROUTES.property(created.propertyId, "missions"))}>Back to Property</GhostButton>
        </div>
      </Panel>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <Panel pad={vp.isPhone ? 12 : 14}>
        <Breadcrumb
          navigate={navigate}
          trail={[
            { label: "CENTCOM", to: ROUTES.dashboard },
            { label: "Missions", to: ROUTES.missions },
            { label: "Create" },
          ]}
        />
        <MetalText size={vp.isPhone ? 19 : 24} track="0.04em">CREATE MISSION</MetalText>
        <ModuleIntro purpose="A mission is one Stratex field operation on one property. This flow captures what is being asked for and why — it does not schedule the flight or authorize a launch." />

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {STEPS.slice(0, 9).map((name, i) => {
            const on = i === step;
            const done = i < step;
            return (
              <button
                key={name}
                onClick={() => setStep(i)}
                style={{
                  cursor: "pointer", borderRadius: T.radius.sm,
                  padding: vp.isPhone ? "8px 10px" : "5px 9px",
                  minHeight: vp.isPhone ? 36 : undefined,
                  fontFamily: T.font.display, fontSize: 9, fontWeight: 700, letterSpacing: "0.09em",
                  color: on ? "#FFFFFF" : done ? T.color.bluePale : T.color.textFaint,
                  background: on ? "rgba(30,107,255,0.30)" : "transparent",
                  border: "1px solid " + (on ? T.color.edgeHot : done ? "rgba(30,107,255,0.3)" : T.color.edge),
                }}
              >
                {i + 1}. {name}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={"Step " + (step + 1) + " — " + STEPS[step]} />
        <StepBody step={step} draft={draft} set={set} vp={vp} navigate={navigate} validation={validation} />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18, paddingTop: 14, borderTop: "1px solid " + T.color.divider }}>
          <GhostButton small onClick={() => setStep(Math.max(0, step - 1))}>← Back</GhostButton>
          {step < 8 ? (
            <GhostButton small onClick={() => setStep(Math.min(8, step + 1))}>Continue →</GhostButton>
          ) : (
            <span style={{ opacity: validation.valid ? 1 : 0.45 }}>
              <GhostButton
                accent="gold"
                onClick={() => validation.valid && submit()}
              >
                {busy ? "Creating…" : "Create Mission"}
              </GhostButton>
            </span>
          )}
        </div>

        {!validation.valid && (
          <div style={{ marginTop: 12 }}>
            <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Required before creation</Label>
            {validation.errors.map((e, i) => (
              <div key={i} style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.high }}>✕ {e}</div>
            ))}
          </div>
        )}
        {validation.warnings.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Label style={{ fontSize: 8.5, marginBottom: 6 }}>Warnings — creation is still allowed</Label>
            {validation.warnings.map((w, i) => (
              <div key={i} style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.medium }}>▲ {w}</div>
            ))}
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12, fontFamily: T.font.body, fontSize: 11.5, color: T.color.high }}>
            Creation refused: {error}
          </div>
        )}
      </Panel>
    </div>
  );
}

function StepBody({ step, draft, set, vp, validation }) {
  if (step === 0) return <PropertyStep draft={draft} set={set} vp={vp} />;

  if (step === 1)
    return (
      <>
        <Field label="Mission Origin" hint="Origin later controls authorization, visibility and cost intelligence.">
          <ChoiceGroup options={MISSION_ORIGIN} value={draft.originType} vp={vp}
            onChange={(o) => set({
              originType: o,
              requestingPartyType: o === "PROFESSIONAL" ? "ORGANIZATION" : o === "HOMEOWNER" ? "PARTY" : "STRATEX",
              authorizationState: o === "PROFESSIONAL" ? "PENDING" : "NOT_REQUIRED",
            })} />
        </Field>
        <Field
          label={draft.originType === "PROFESSIONAL" ? "Organization Reference" : "Requestor Reference"}
          hint="An identity reference only. Personal details stay in the Identity Vault, never in the mission record."
        >
          <TextInput vp={vp} value={draft.requestingPartyRef || ""} onChange={(v) => set({ requestingPartyRef: v })}
            placeholder={draft.originType === "PROFESSIONAL" ? "ORG-BLUEGRASS" : "u-001"} />
        </Field>
      </>
    );

  if (step === 2)
    return (
      <>
        <Field label="Assessment Objective">
          <ChoiceGroup options={ASSESSMENT_OBJECTIVES} value={draft.assessmentObjective} vp={vp}
            onChange={(o) => set({ assessmentObjective: o })} />
        </Field>
        <Field label="Mission Title" hint="What an operator will see in the queue.">
          <TextInput vp={vp} value={draft.missionType} onChange={(v) => set({ missionType: v })}
            placeholder="Roof Verification Scan" />
        </Field>
      </>
    );

  if (step === 3)
    return (
      <>
        <Field label="Requested Package" hint="A package describes outcomes, not drone settings.">
          <ChoiceGroup options={REQUESTED_PACKAGES} value={draft.requestedPackage} vp={vp}
            onChange={(o) => set({ requestedPackage: o })} />
        </Field>
        <Field label="Requested Services">
          <ChoiceGroup options={SERVICES} value={draft.requestedServices} multi vp={vp}
            onChange={(v) => set({ requestedServices: v })} />
        </Field>
      </>
    );

  if (step === 4) return <FocusStep draft={draft} set={set} vp={vp} />;

  if (step === 5)
    return (
      <>
        <Field label="Occupancy">
          <ChoiceGroup options={["OCCUPIED", "VACANT", "UNKNOWN"]} value={draft.occupancyState} vp={vp}
            onChange={(o) => set({ occupancyState: o })} />
        </Field>
        <Field label="Access Notes">
          <TextInput vp={vp} multiline value={draft.accessNotes} onChange={(v) => set({ accessNotes: v })}
            placeholder="Gate code, driveway access, where to stage" />
        </Field>
        <Field label="Pets / Gates">
          <TextInput vp={vp} value={draft.petGateNotes} onChange={(v) => set({ petGateNotes: v })} placeholder="Dog in the rear yard" />
        </Field>
        <Field label="Special Instructions">
          <TextInput vp={vp} multiline value={draft.specialInstructions} onChange={(v) => set({ specialInstructions: v })} />
        </Field>
        {draft.originType === "PROFESSIONAL" && (
          <div style={{ padding: "11px 13px", borderRadius: T.radius.sm,
                        background: "rgba(240,180,41,0.10)", border: "1px solid rgba(240,180,41,0.42)" }}>
            <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.goldBright }}>
              ▲ Homeowner authorization is required. The mission can be created now, but it cannot advance until
              authorization is confirmed. Requesting a scan never grants access to the property's history.
            </div>
          </div>
        )}
      </>
    );

  if (step === 6)
    return (
      <>
        <Field label="Requested Date" hint="A request, not a confirmed schedule. Scheduling happens in Mission Command.">
          <TextInput vp={vp} value={draft.requestedDate} onChange={(v) => set({ requestedDate: v })} placeholder="2026-09-15" />
        </Field>
        <Field label="Time Window">
          <ChoiceGroup options={TIME_WINDOW_TYPES} value={draft.timeWindowType} vp={vp}
            onChange={(o) => set({ timeWindowType: o })} />
        </Field>
        <Field label="Priority">
          <ChoiceGroup options={["LOW", "NORMAL", "HIGH", "URGENT"]} value={draft.priority} vp={vp}
            onChange={(o) => set({ priority: o })} />
        </Field>
      </>
    );

  if (step === 7) return <ResourceStep draft={draft} set={set} vp={vp} validation={validation} />;

  if (step === 8) return <ReviewStep draft={draft} vp={vp} validation={validation} />;

  return null;
}

/** Step 1 — resolve an existing property. Never create a duplicate. */
function PropertyStep({ draft, set, vp }) {
  const res = useResource(() => centcomApi.listPropertySummaries(), []);
  const [raw, setRaw] = useState("");
  const query = useDebounced(raw);

  return (
    <>
      <ModuleIntro purpose="Every mission belongs to a permanent STRATEX_PROPERTY_ID. Resolve the existing property rather than typing an address again — a house never gets a second identity." />
      <Field label="Search Existing Property">
        <TextInput vp={vp} value={raw} onChange={setRaw} placeholder="Property ID, address, city or ZIP" />
      </Field>
      <Resource res={res} loadingLines={3}>
        {(rows) => {
          const q = query.trim().toLowerCase();
          const matches = q
            ? rows.filter((p) => [p.stratexPropertyId, p.displayId, p.identity.addressLine1, p.identity.city, p.identity.postalCode]
                .join(" ").toLowerCase().includes(q))
            : rows.slice(0, 6);
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {matches.map((p) => {
                const on = draft.propertyId === p.stratexPropertyId;
                return (
                  <button
                    key={p.stratexPropertyId}
                    onClick={() => set({ propertyId: p.stratexPropertyId })}
                    style={{
                      textAlign: "left", cursor: "pointer", padding: "11px 13px", minHeight: 48,
                      borderRadius: T.radius.md,
                      background: on ? "linear-gradient(180deg,rgba(30,107,255,0.26),rgba(10,24,48,0.9))"
                                     : "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                      border: "1px solid " + (on ? T.color.edgeHot : T.color.edge),
                    }}
                  >
                    <div style={{ fontFamily: T.font.body, fontSize: 12.5, fontWeight: 600, color: T.color.text }}>
                      {p.identity.addressLine1}
                      <span style={{ color: T.color.textMute }}>{", " + p.identity.city + " " + p.identity.region}</span>
                    </div>
                    <div style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.bluePale, marginTop: 4 }}>
                      {formatPropertyId(p)}
                    </div>
                  </button>
                );
              })}
              {!matches.length && (
                <EmptyState title="No property matches" hint={'Nothing matches "' + query + '". Creating a new property shell is a deliberate, separate action so a typo never produces a second record for the same house.'} />
              )}
            </div>
          );
        }}
      </Resource>
    </>
  );
}

function FocusStep({ draft, set, vp }) {
  const [area, setArea] = useState("");
  const [note, setNote] = useState("");
  const [issue, setIssue] = useState("");

  return (
    <>
      <Field label="Focus Areas" hint="Specific places the operator must cover. These feed capture coverage requirements later.">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
          {FOCUS_SUGGESTIONS.map((s) => (
            <GhostButton key={s} small onClick={() => set({
              focusAreas: [...draft.focusAreas, { id: "FA-" + (draft.focusAreas.length + 1), area: s, note: "" }],
            })}>+ {s}</GhostButton>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 180 }}><TextInput vp={vp} value={area} onChange={setArea} placeholder="Custom area" /></div>
          <div style={{ flex: 1, minWidth: 180 }}><TextInput vp={vp} value={note} onChange={setNote} placeholder="Note" /></div>
          <GhostButton small onClick={() => {
            if (!area) return;
            set({ focusAreas: [...draft.focusAreas, { id: "FA-" + (draft.focusAreas.length + 1), area, note }] });
            setArea(""); setNote("");
          }}>Add</GhostButton>
        </div>
        {draft.focusAreas.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {draft.focusAreas.map((f, i) => (
              <div key={f.id + i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 2px", borderBottom: "1px solid rgba(22,38,60,0.7)" }}>
                <span style={{ flex: 1, fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft }}>
                  {f.area}{f.note ? " — " + f.note : ""}
                </span>
                <GhostButton small onClick={() => set({ focusAreas: draft.focusAreas.filter((_, j) => j !== i) })}>Remove</GhostButton>
              </div>
            ))}
          </div>
        )}
      </Field>

      <Field
        label="Reported Context"
        hint="What a customer or professional reports is context for the operator. It is never written into Passport as a verified fact — only validated evidence can do that."
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <TextInput vp={vp} value={issue} onChange={setIssue} placeholder="Owner reports a ceiling stain in the back bedroom" />
          </div>
          <GhostButton small onClick={() => {
            if (!issue) return;
            set({ knownIssues: [...draft.knownIssues, {
              id: "KI-" + (draft.knownIssues.length + 1), issue,
              reportedBy: draft.originType === "PROFESSIONAL" ? "PROFESSIONAL" : "HOMEOWNER",
              location: "", severity: null, notes: "Reported context — not a verified finding.",
            }] });
            setIssue("");
          }}>Add</GhostButton>
        </div>
        {draft.knownIssues.map((k, i) => (
          <div key={k.id + i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 2px", borderBottom: "1px solid rgba(22,38,60,0.7)" }}>
            <span style={{ flex: 1, fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft }}>
              {k.issue} <span style={{ color: T.color.textFaint }}>· reported by {k.reportedBy}</span>
            </span>
            <GhostButton small onClick={() => set({ knownIssues: draft.knownIssues.filter((_, j) => j !== i) })}>Remove</GhostButton>
          </div>
        ))}
      </Field>
    </>
  );
}

function ResourceStep({ draft, set, vp, validation }) {
  const ops = useResource(() => centcomApi.listOperators(), []);
  const air = useResource(() => centcomApi.listAircraft(), []);
  const chosen = sensorPackages.find((s) => s.id === draft.sensorPackageId);

  return (
    <>
      <ModuleIntro purpose="Provisional planning. Compatibility is checked now so an impossible mission is never created — a thermal package with an RGB-only sensor is refused here, not discovered in the field." />
      <Field label="Operator">
        <Resource res={ops} loadingLines={1}>
          {(rows) => <ChoiceGroup options={rows.map((o) => o.id)} value={draft.operatorId} vp={vp} onChange={(o) => set({ operatorId: o })} />}
        </Resource>
      </Field>
      <Field label="Aircraft">
        <Resource res={air} loadingLines={1}>
          {(rows) => <ChoiceGroup options={rows.map((a) => a.id)} value={draft.aircraftId} vp={vp} onChange={(a) => set({ aircraftId: a })} />}
        </Resource>
      </Field>
      <Field label="Sensor Package">
        <ChoiceGroup options={sensorPackages.map((s) => s.id)} value={draft.sensorPackageId} vp={vp}
          onChange={(s) => set({ sensorPackageId: s })} />
        {chosen && (
          <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute, marginTop: 8 }}>
            {chosen.label} — capabilities: {chosen.capabilities.join(", ")}
          </div>
        )}
      </Field>
      {validation.errors.some((e) => /sensor package/i.test(e)) && (
        <div style={{ padding: "11px 13px", borderRadius: T.radius.sm,
                      background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.45)",
                      fontFamily: T.font.body, fontSize: 11.5, color: T.color.high }}>
          ✕ {validation.errors.find((e) => /sensor package/i.test(e))}
        </div>
      )}
    </>
  );
}

function ReviewStep({ draft, vp, validation }) {
  const grid = vp.isPhone ? "1fr 1fr" : "repeat(3,1fr)";
  return (
    <>
      <ModuleIntro purpose="Everything the operator and ATC will act on. Nothing critical is hidden behind a later screen." />
      <div style={{ display: "grid", gridTemplateColumns: grid, gap: 12 }}>
        <Fact label="Property" value={draft.propertyId || "Not selected"} mono />
        <Fact label="Origin" value={label(draft.originType)} />
        <Fact label="Requestor" value={draft.requestingPartyRef || "—"} mono />
        <Fact label="Objective" value={draft.assessmentObjective ? label(draft.assessmentObjective) : "Not selected"} />
        <Fact label="Package" value={draft.requestedPackage ? label(draft.requestedPackage) : "Not selected"} />
        <Fact label="Services" value={draft.requestedServices.length + " selected"} />
        <Fact label="Focus Areas" value={draft.focusAreas.length || "None"} />
        <Fact label="Reported Context" value={draft.knownIssues.length || "None"} />
        <Fact label="Occupancy" value={draft.occupancyState} />
        <Fact label="Authorization" value={label(draft.authorizationState)} />
        <Fact label="Requested Date" value={draft.requestedDate || "Not specified"} />
        <Fact label="Window" value={draft.timeWindowType} />
        <Fact label="Operator" value={draft.operatorId || "Unassigned"} />
        <Fact label="Aircraft" value={draft.aircraftId || "Unassigned"} />
        <Fact label="Sensor Package" value={draft.sensorPackageId || "Unassigned"} mono />
        <Fact label="Priority" value={draft.priority} />
      </div>
      <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, marginTop: 14 }}>
        Duration estimate: {draft.estimatedDurationMinutes} min — a planning fixture derived from the package, not a
        computed route.
      </div>
    </>
  );
}
