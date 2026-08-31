import React, { useState, useEffect } from "react";
import {
  MeasurementsPanel, AwePanel, ProjectsPanel, RepairsPanel, MaintenancePanel, DocumentsPanel,
  PropertySystemsPanel,
} from "../../components/panels/DomainPanels.jsx";
import { PropertyReportsPanel } from "../../components/panels/ReportsPanel.jsx";
import { PropertyWorkSummary } from "../../components/panels/DomainPanels.jsx";
import { PROPERTY_TABS } from "../../app/router/routes.js";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { TRUTH_CLASS } from "../../domains/shared/classification.js";
import { stageByKey } from "../../domains/shared/states.js";
import { relTime, shortDate } from "../../utils/format.js";
import { formatPropertyId, tabSlugOf } from "../../utils/ids.js";
import { useResource, useViewport } from "../../app/hooks.js";
import { Breadcrumb, ClassBadge, ContextChip, DownstreamCell, EmptyState, Fact, GhostButton, Label, MetalText, Panel, PanelHeader, Resource, StageBar, StateBadge } from "../../components/common/primitives.jsx";
import { CoreOversight, HabitatOversight, ProOversight } from "../../components/panels/DownstreamPanels.jsx";
import { CortexPanel, EvidencePanel, FindingsPanel, MissionsPanel, PassportPanel } from "../../components/panels/PipelinePanels.jsx";
import { AuditPanel, IdentityVaultPanel, SharingPanel, SharingSummaryPanel, SystemsHealthGrid, TimelinePanel, TwinPanel } from "../../components/panels/PropertyPanels.jsx";
import { PropertyRealityViewer } from "../../components/reality/PropertyRealityViewer.jsx";

export function PropertyCommand({ propertyId, tabSlug, navigate, session }) {
  const res = useResource(() => centcomApi.getProperty(propertyId), [propertyId]);
  const fromSlug = PROPERTY_TABS.find((t) => tabSlugOf(t) === tabSlug);
  const [tab, setTab] = useState(fromSlug || "Overview");
  const vp = useViewport();
  const sm = vp.isPhone;

  // A deep link decides the tab. Changing tabs updates the URL so any view of a
  // property is linkable and the back button behaves.
  useEffect(() => {
    if (fromSlug && fromSlug !== tab) setTab(fromSlug);
  }, [fromSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  const openTab = (name) => {
    setTab(name);
    navigate("/properties/" + propertyId + "/" + tabSlugOf(name));
  };

  return (
    <Resource
      res={res}
      loadingLines={6}
      label="Opening property record"
      empty={
        <Panel>
          <EmptyState
            title="No property with that ID"
            hint={'"' + propertyId + '" does not match a STRATEX_PROPERTY_ID on file. Property IDs are permanent — they are never reissued or reused.'}
            action={<GhostButton onClick={() => navigate("/properties")}>Back to Property Command</GhostButton>}
          />
        </Panel>
      }
    >
      {(p) => (
        <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
          <Panel pad={sm ? 12 : 14}>
            <div
              style={{
                display: "flex", alignItems: "flex-start",
                gap: sm ? 14 : 18, flexWrap: sm ? "wrap" : "nowrap",
              }}
            >
              <div style={{ flex: 1, minWidth: sm ? "100%" : 0 }}>
                <Breadcrumb
                  navigate={navigate}
                  trail={[
                    { label: "CENTCOM", to: "/centcom" },
                    { label: "Properties", to: "/properties" },
                    { label: formatPropertyId(p), to: "/properties/" + p.stratexPropertyId },
                    { label: tab },
                  ]}
                />
                <MetalText size={sm ? 19 : 25} track="0.04em">{p.identity.addressLine1}</MetalText>
                <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textMute, marginTop: 5 }}>
                  {p.identity.city}, {p.identity.region} {p.identity.postalCode} • Built {p.identity.yearBuilt} • {p.identity.squareFeet?.toLocaleString()} sq ft
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: T.font.mono, fontSize: 11.5, color: T.color.bluePale,
                      background: "rgba(30,107,255,0.12)", border: "1px solid rgba(30,107,255,0.42)",
                      borderRadius: T.radius.sm, padding: "4px 9px",
                    }}
                  >
                    {formatPropertyId(p)}
                  </span>
                  <StateBadge domain="property" value={p.status} />
                  <span style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint }}>
                    Permanent identity • issued {shortDate(p.createdAt)}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 7, marginTop: 11, flexWrap: "wrap" }}>
                  <ContextChip label="Last observed" value={p.latestScanAt ? relTime(p.latestScanAt) : "Never scanned"} onClick={() => openTab("Missions")} />
                  <ContextChip label="Mission" value={p.latestMissionId || "—"} onClick={() => openTab("Missions")} />
                  <ContextChip label="Twin" value={p.twinVersion} onClick={() => openTab("Reality Twin")} />
                  <ContextChip label="Alerts" value={p.openAlerts} tone={p.openAlerts ? "warn" : "ok"} onClick={() => openTab("Findings")} />
                  <ContextChip label="Cortex" state={["cortex", p.cortexState]} onClick={() => openTab("Cortex")} />
                  <ContextChip label="Passport" state={["passport", p.passportState]} onClick={() => openTab("Passport")} />
                  <ContextChip label="Core" state={["core", p.coreState]} onClick={() => openTab("Core")} />
                  <ContextChip label="Pro" state={["pro", p.proState]} onClick={() => openTab("Pro")} />
                  <ContextChip label="Habitat" state={["habitat", p.habitatState]} onClick={() => openTab("Habitat")} />
                </div>
              </div>

              <div style={{ width: sm ? "auto" : 250, flex: sm ? 1 : "none", minWidth: sm ? 150 : undefined }}>
                <Label>Pipeline Stage</Label>
                <div style={{ marginTop: 8 }}>
                  <StageBar stage={p.currentStage} blocker={p.blocker} />
                </div>
              </div>

              <div style={{ width: sm ? 84 : 108, flex: "none", textAlign: "center" }}>
                <Label>Health</Label>
                <div style={{ fontFamily: T.font.display, fontSize: sm ? 32 : 40, fontWeight: 700, color: "#FFFFFF", textShadow: T.glow.textBlue, lineHeight: 1.1 }}>
                  {p.healthScore}
                </div>
                <div style={{ marginTop: 4 }}><ClassBadge classification={TRUTH_CLASS.DERIVED} /></div>
              </div>
            </div>
          </Panel>

          <div
            style={{
              display: "flex",
              flexWrap: sm ? "nowrap" : "wrap",
              overflowX: sm ? "auto" : "visible",
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              gap: 4, padding: 6,
              background: "rgba(6,12,22,0.75)", border: "1px solid " + T.color.edge,
              borderRadius: T.radius.md,
              position: sm ? "sticky" : "static",
              top: sm ? 0 : undefined,
              zIndex: sm ? 20 : undefined,
            }}
            role="tablist"
          >
            {PROPERTY_TABS.map((tname) => {
              const on = tname === tab;
              return (
                <button
                  key={tname}
                  role="tab"
                  aria-selected={on}
                  onClick={() => openTab(tname)}
                  style={{
                    fontFamily: T.font.display, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: on ? "#FFFFFF" : T.color.textMute,
                    background: on ? "linear-gradient(180deg,rgba(30,107,255,0.34),rgba(10,24,48,0.9))" : "transparent",
                    border: "1px solid " + (on ? "rgba(30,107,255,0.55)" : "transparent"),
                    borderRadius: T.radius.sm, cursor: "pointer",
                    padding: sm ? "9px 12px" : "6px 10px",
                    flex: "none", whiteSpace: "nowrap",
                    boxShadow: on ? T.glow.blueSoft : "none",
                    transition: "all " + T.motion.fast,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {tname}
                </button>
              );
            })}
          </div>

          <PropertyTabBody tab={tab} property={p} navigate={navigate} session={session} openTab={openTab} />
        </div>
      )}
    </Resource>
  );
}

export function PropertyTabBody({ tab, property, navigate, session, openTab = () => {} }) {
  const id = property.stratexPropertyId;
  const vp = useViewport();
  // One column on a phone. Two on a tablet. The reference layout on desktop.
  const split = (desktop) => (vp.isPhone ? "1fr" : vp.isTablet ? "1fr" : desktop);
  const facts = (n) => (vp.isPhone ? "1fr 1fr" : "repeat(" + n + ",1fr)");

  if (tab === "Overview")
    return (
      <div style={{ display: "grid", gridTemplateColumns: split("1.4fr 1fr"), gap: vp.gutter }}>
        <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
          <Panel>
            <PanelHeader
              title="Current Property State"
              action={<GhostButton small onClick={() => openTab("Reality Twin")}>Open Reality Twin</GhostButton>}
            />
            <div style={{ display: "grid", gridTemplateColumns: facts(3), gap: 12 }}>
              <Fact label="Property Type" value={property.propertyType} />
              <Fact label="Health Score" value={property.healthScore} />
              <Fact label="Last Observed" value={property.latestScanAt ? relTime(property.latestScanAt) : "Never scanned"} />
              <Fact label="Missions" value={property.missionCount} />
              <Fact label="Evidence Assets" value={property.evidenceCount.toLocaleString()} />
              <Fact label="Findings" value={property.findingCount} />
              <Fact label="Current Twin" value={property.twinVersion} />
              <Fact label="Passport Revision" value={property.passportRevision} />
              <Fact label="Blocker" value={property.blocker || "None"} tone={property.blocker ? "warn" : "ok"} />
            </div>
            <div style={{ marginTop: 16, height: vp.isPhone ? 170 : 230 }}>
              <PropertyRealityViewer propertyId={id} activeLayer="twin" scanProgress={100} />
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Latest Observation" />
            <div style={{ display: "grid", gridTemplateColumns: facts(4), gap: 12 }}>
              <Fact label="Mission" value={property.latestMissionId || "—"} mono />
              <Fact label="Captured" value={property.latestScanAt ? shortDate(property.latestScanAt) : "—"} />
              <Fact label="Pipeline Stage" value={stageByKey(property.currentStage).label} />
              <Fact label="Record Updated" value={relTime(property.updatedAt)} />
            </div>
            <div style={{ marginTop: 14 }}>
              <GhostButton small onClick={() => openTab("Missions")}>All missions for this property</GhostButton>
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="System & Component Health" />
            <SystemsHealthGrid propertyId={id} />
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
          <PropertyWorkSummary propertyId={id} openTab={openTab} />

          <Panel>
            <PanelHeader title="Downstream State" accent="gold" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <DownstreamCell label="Cortex" domain="cortex" value={property.cortexState} onClick={() => openTab("Cortex")} />
              <DownstreamCell label="Passport" domain="passport" value={property.passportState} onClick={() => openTab("Passport")} />
              <DownstreamCell label="Core" domain="core" value={property.coreState} onClick={() => openTab("Core")} />
              <DownstreamCell label="Pro" domain="pro" value={property.proState} onClick={() => openTab("Pro")} />
              <DownstreamCell label="Habitat" domain="habitat" value={property.habitatState} onClick={() => openTab("Habitat")} />
              <DownstreamCell label="Open Alerts" value={property.openAlerts} tone={property.openAlerts ? "warn" : "ok"} onClick={() => openTab("Findings")} />
            </div>
          </Panel>

          <FindingsPanel propertyId={id} compact />
          <TimelinePanel />
          <SharingSummaryPanel propertyId={id} openTab={openTab} />
        </div>
      </div>
    );

  if (tab === "Identity")
    return (
      <div style={{ display: "grid", gridTemplateColumns: split("1fr 1fr"), gap: vp.gutter }}>
        <Panel>
          <PanelHeader title="Property Identity" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Fact label="Stratex Property ID" value={property.stratexPropertyId} mono />
            <Fact label="Parcel ID" value={property.identity.parcelId} mono />
            <Fact label="Address" value={property.identity.addressLine1} />
            <Fact label="City / Region" value={property.identity.city + ", " + property.identity.region} />
            <Fact label="Year Built" value={property.identity.yearBuilt} />
            <Fact label="Floor Area" value={property.identity.squareFeet?.toLocaleString() + " sq ft"} />
            <Fact label="Latitude" value={property.identity.lat} mono />
            <Fact label="Longitude" value={property.identity.lng} mono />
          </div>
        </Panel>
        <IdentityVaultPanel propertyId={id} />
      </div>
    );

  if (tab === "Current State")
    return (
      <Panel>
        <PanelHeader title="Current State" />
        <EmptyState
          title="Wired to the property projection contract"
          hint="This tab renders the HOT-tier property projection: current scores, systems, latest findings, active maintenance and current alerts. It reads centcomApi.getPropertyProjection() once that read model exists — no component changes required."
        />
      </Panel>
    );

  if (tab === "Reality Twin") return <TwinPanel propertyId={id} />;
  if (tab === "Missions") return <MissionsPanel propertyId={id} navigate={navigate} />;
  if (tab === "Evidence") return <EvidencePanel propertyId={id} />;
  if (tab === "Cortex") return <CortexPanel propertyId={id} />;
  if (tab === "Findings") return <FindingsPanel propertyId={id} navigate={navigate} />;
  if (tab === "Passport") return <PassportPanel propertyId={id} navigate={navigate} />;
  if (tab === "Timeline") return <TimelinePanel full />;
  if (tab === "Sharing") return <SharingPanel propertyId={id} />;
  if (tab === "Audit") return <AuditPanel propertyId={id} />;
  if (tab === "Measurements") return <MeasurementsPanel propertyId={id} navigate={navigate} openTab={openTab} />;
  if (tab === "AWE") return <AwePanel propertyId={id} navigate={navigate} />;
  if (tab === "Projects") return <ProjectsPanel propertyId={id} navigate={navigate} openTab={openTab} />;
  if (tab === "Repairs") return <RepairsPanel propertyId={id} navigate={navigate} openTab={openTab} />;
  if (tab === "Maintenance") return <MaintenancePanel propertyId={id} navigate={navigate} />;
  if (tab === "Documents") return <DocumentsPanel propertyId={id} openTab={openTab} />;
  if (tab === "Reports") return <PropertyReportsPanel propertyId={id} openTab={openTab} />;
  if (tab === "Systems") return <PropertySystemsPanel propertyId={id} navigate={navigate} openTab={openTab} />;
  if (tab === "Core") return <CoreOversight propertyId={id} />;
  if (tab === "Pro") return <ProOversight propertyId={id} />;
  if (tab === "Habitat") return <HabitatOversight propertyId={id} />;

  return (
    <Panel>
      <PanelHeader title={tab} />
      <EmptyState
        title={tab + " is contracted, not yet populated"}
        hint={"The " + tab + " domain has a typed contract in section 3 and an adapter slot in section 5. When its service returns records they render here through the same Resource component — loading, empty and error states already handled."}
        action={<GhostButton onClick={() => navigate("/systems")}>Check integration status</GhostButton>}
      />
    </Panel>
  );
}
