import React, { useState, useEffect, useCallback, useRef } from "react";
import T, { globalCss } from "../design/tokens.js";
import centcomApi from "../domains/index.js";
import { can } from "../domains/shared/rbac.js";
import { ViewportContext, useHashRoute, useResource, useViewportValue } from "./hooks.js";
import { CentcomLockup } from "../components/brand/StratexBrand.jsx";
import { Boundary, EmptyState, ErrorState, GhostButton, Loading, ModuleIntro, ModuleShell, Panel, PanelHeader } from "../components/common/primitives.jsx";
import { CommandBar, SideNav, StatusBar } from "../components/navigation/CommandChrome.jsx";
import { AdminCommand, CoreCommand, HabitatOversight, ProOversight, SystemsCommand } from "../components/panels/DownstreamPanels.jsx";
import {
  CortexPanel,
  EvidencePanel,
  PassportDetail,
  PassportPanel,
  PassportRevisionDetail,
  PassportIngestionReview,
  PassportConflictReview,
  PassportProjectionInspector,
} from "../components/panels/PipelinePanels.jsx";
import { RealityCommand } from "../pages/reality/RealityCommandPage.jsx";
import { RealityDetail } from "../pages/reality/RealityDetailPage.jsx";
import { AtcCommand } from "../pages/atc/AtcCommandPage.jsx";
import { AtcMissionDetail } from "../pages/atc/AtcMissionDetailPage.jsx";
import { CentcomOverview, LiveOperations } from "../pages/dashboard/DashboardPage.jsx";
import { EvidenceDetail } from "../pages/evidence/EvidenceDetailPage.jsx";
import { EvidenceCommand, EvidenceReviewQueue } from "../pages/evidence/EvidenceCommandPage.jsx";
import { CapturePackagePage } from "../pages/evidence/CapturePackagePage.jsx";
import { FindingDetail } from "../pages/findings/FindingDetailPage.jsx";
import { MissionCommand } from "../pages/missions/MissionDirectoryPage.jsx";
import { MissionDetail } from "../pages/missions/MissionDetailPage.jsx";
import { CreateMission } from "../pages/missions/CreateMissionPage.jsx";
import { MissionBoard } from "../pages/missions/MissionBoardPage.jsx";
import { AtcDayMap } from "../pages/atc/AtcDayMapPage.jsx";
import { PropertyCommand } from "../pages/properties/PropertyDetailPage.jsx";
import { PropertyDirectory } from "../pages/properties/PropertyDirectoryPage.jsx";
import { PassportCommand } from "../pages/passport/PassportCommandPage.jsx";
import { CortexSeePage } from "../pages/cortex/CortexSeePage.jsx";
import { ReportsCommand } from "../pages/reports/ReportsCommandPage.jsx";

export function Screen({ route, navigate, session }) {
  const [, seg1, seg2] = route.split("/");

  if (!seg1 || seg1 === "centcom") return <CentcomOverview navigate={navigate} session={session} />;
  if (seg1 === "live") return <ModuleShell title="LIVE OPERATIONS"><LiveOperations navigate={navigate} /></ModuleShell>;
  if (seg1 === "missions" && seg2 === "new") {
    const preset = (route.split("?")[1] || "").replace("property=", "") || null;
    return <CreateMission navigate={navigate} presetPropertyId={preset} />;
  }
  if (seg1 === "missions" && seg2 && route.split("/")[3] === "see")
    return <CortexSeePage missionId={seg2} navigate={navigate} />;
  if (seg1 === "missions" && seg2)
    return <MissionDetail missionId={seg2} tabSlug={route.split("/")[3]} navigate={navigate} />;
  if (seg1 === "missions") return <ModuleShell title="MISSION COMMAND"><MissionCommand navigate={navigate} /></ModuleShell>;
  if (seg1 === "board") return <ModuleShell title="MISSION BOARD"><MissionBoard route={route} navigate={navigate} /></ModuleShell>;
  if (seg1 === "properties" && seg2) {
    const seg3 = route.split("/")[3];
    return <PropertyCommand propertyId={seg2} tabSlug={seg3} navigate={navigate} session={session} />;
  }
  if (seg1 === "properties") return <ModuleShell title="PROPERTY COMMAND"><PropertyDirectory navigate={navigate} /></ModuleShell>;
  if (seg1 === "reality" && seg2) {
    const parts = route.split("/");
    return (
      <RealityDetail
        propertyId={seg2}
        twinTypeId={parts[3] || "TWIN_TYPE_A"}
        tabSlug={parts[4]}
        navigate={navigate}
      />
    );
  }
  if (seg1 === "reality")
    return <ModuleShell title="PROPERTY REALITY"><RealityCommand navigate={navigate} /></ModuleShell>;
  if (seg1 === "atc" && seg2 === "day")
    return <ModuleShell title="ATC DAY MAP"><AtcDayMap route={route} navigate={navigate} /></ModuleShell>;
  if (seg1 === "atc" && seg2 === "missions" && route.split("/")[3])
    return (
      <AtcMissionDetail
        missionId={route.split("/")[3]}
        tabSlug={route.split("/")[4]}
        navigate={navigate}
      />
    );
  if (seg1 === "atc") return <ModuleShell title="AIR TRAFFIC CONTROL"><AtcCommand navigate={navigate} /></ModuleShell>;
  if (seg1 === "findings" && seg2) return <FindingDetail findingId={seg2} navigate={navigate} />;
  if (seg1 === "captures" && seg2)
    return <CapturePackagePage packageId={seg2} navigate={navigate} />;
  if (seg1 === "evidence" && seg2 === "review")
    return <ModuleShell title="EVIDENCE REVIEW"><EvidenceReviewQueue navigate={navigate} /></ModuleShell>;
  if (seg1 === "evidence" && seg2)
    return <EvidenceDetail evidenceId={seg2} tabSlug={route.split("/")[3]} navigate={navigate} />;
  if (seg1 === "evidence")
    return <ModuleShell title="EVIDENCE COMMAND"><EvidenceCommand navigate={navigate} /></ModuleShell>;
  if (seg1 === "cortex")
    return (
      <ModuleShell title="CORTEX COMMAND">
        <Panel>
          <PanelHeader title="Property Intelligence Engine" accent="gold" />
          <ModuleIntro purpose="Cortex interprets evidence. It compares captures across years, detects change, and produces findings with stated confidence. It never rewrites raw evidence, and a PROBABLE conclusion stays labelled probable until a human verifies it." />
        </Panel>
        <CortexPanel />
      </ModuleShell>
    );
  if (seg1 === "passport" && seg2 && route.includes("/revisions/"))
    return <PassportRevisionDetail propertyId={seg2} revisionId={route.split("/")[4]} navigate={navigate} />;
  if (seg1 === "passport" && seg2 && route.includes("/ingestions/"))
    return <PassportIngestionReview propertyId={seg2} ingestionId={route.split("/")[4]} navigate={navigate} />;
  if (seg1 === "passport" && seg2 && route.includes("/conflicts/"))
    return <PassportConflictReview propertyId={seg2} conflictId={route.split("/")[4]} navigate={navigate} />;
  if (seg1 === "passport" && seg2 && route.includes("/projections/"))
    return <PassportProjectionInspector propertyId={seg2} projectionType={route.split("/")[4]} navigate={navigate} />;
  if (seg1 === "passport" && seg2)
    return <PassportDetail propertyId={seg2} tabSlug={route.split("/")[3]} navigate={navigate} />;
  if (seg1 === "passport")
    return (
      <ModuleShell title="PASSPORT COMMAND">
        <Panel>
          <PanelHeader title="Canonical Property Record" />
          <ModuleIntro purpose="One property. One record. One truth — which means one canonical history with revisions, not one mutable row. Core and Cortex write through controlled pathways. Professionals never write here at all." />
        </Panel>
        <PassportCommand navigate={navigate} />
      </ModuleShell>
    );
  if (seg1 === "core") return <ModuleShell title="CORE COMMAND"><CoreCommand /></ModuleShell>;
  if (seg1 === "pro") return <ModuleShell title="PRO OVERSIGHT"><ProOversight /></ModuleShell>;
  if (seg1 === "habitat")
    return (
      <ModuleShell title="HABITAT OVERSIGHT">
        <Panel>
          <PanelHeader title="Homeowner Experience" accent="gold" />
          <ModuleIntro purpose="Habitat is a separate application that reads authorized Passport projections. CENTCOM watches sync health and homeowner-visible state; it does not contain Habitat, and Habitat is never the source of property truth." />
        </Panel>
        <HabitatOversight />
      </ModuleShell>
    );
  if (seg1 === "reports") return <ReportsCommand navigate={navigate} session={session} />;
  if (seg1 === "operations")
    return (
      <ModuleShell title="BUSINESS OPERATIONS">
        <Panel>
          <PanelHeader title="Operational & Financial Performance" />
          <EmptyState
            title="No financial source connected"
            hint="Revenue on the dashboard is fixture data and is labelled as such in /data/fixtures. This module reads centcomApi.getBusinessPerformance() once a billing or accounting source is connected. Nothing here invents a number."
          />
        </Panel>
      </ModuleShell>
    );
  if (seg1 === "systems")
    return (
      <ModuleShell title="SYSTEM OPERATIONS">
        <Panel>
          <PanelHeader title="Platform Health" />
          <ModuleIntro purpose="Health for every domain CENTCOM depends on. Anything marked as a development fixture is not connected to a running service — that label is the difference between a system that is healthy and a system that does not exist yet." />
        </Panel>
        <SystemsCommand />
      </ModuleShell>
    );
  if (seg1 === "admin")
    return (
      <ModuleShell title="ADMINISTRATION">
        <Panel>
          <PanelHeader title="Governance" />
          <ModuleIntro purpose="CENTCOM is privileged operational software. Access is domain-aware: a professional with one authorized project never inherits command authority, and external roles do not receive CENTCOM access by default." />
        </Panel>
        <AdminCommand session={session} />
      </ModuleShell>
    );

  return (
    <Panel>
      <EmptyState
        title="No such command surface"
        hint={'The route "' + route + '" does not exist. Use the navigation on the left.'}
        action={<GhostButton onClick={() => navigate("/centcom")}>Return to CENTCOM</GhostButton>}
      />
    </Panel>
  );
}

export default function StratexCentcom() {
  const [route, navigate] = useHashRoute();
  const sessionRes = useResource(() => centcomApi.getSession(), []);
  const vp = useViewportValue();
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);

  // Never leave the drawer open behind a desktop layout after a rotate/resize.
  useEffect(() => {
    if (!vp.isCompact) setNavOpen(false);
  }, [vp.isCompact]);

  // Scroll the content back to the top on every route change, the way a real
  // page load would. On a phone this matters — otherwise you land mid-screen.
  const mainRef = useRef(null);
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [route]);

  useEffect(() => {
    const el = document.getElementById("sx-global-style");
    if (el) return;
    const s = document.createElement("style");
    s.id = "sx-global-style";
    s.textContent = globalCss;
    document.head.appendChild(s);
  }, []);

  return (
    <ViewportContext.Provider value={vp}>
    <div
      style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        background:
          "radial-gradient(120% 80% at 50% -10%, #071021 0%, #03060C 45%, #000000 100%)",
        color: T.color.text, fontFamily: T.font.body,
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {sessionRes.loading ? (
        <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <CentcomLockup scale={vp.isPhone ? 0.85 : 1.4} />
            <div style={{ marginTop: 20, width: vp.isPhone ? 200 : 260, marginInline: "auto" }}>
              <Loading lines={1} label="Establishing command session" />
            </div>
          </div>
        </div>
      ) : sessionRes.error ? (
        <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
          <Panel style={{ maxWidth: 520 }}>
            <ErrorState error={sessionRes.error} onRetry={sessionRes.reload} />
          </Panel>
        </div>
      ) : (
        <>
          <CommandBar session={sessionRes.data} navigate={navigate} onMenu={() => setNavOpen(true)} />
          <div style={{ flex: 1, display: "flex", minHeight: 0, paddingTop: vp.isPhone ? 10 : 12 }}>
            <SideNav route={route} navigate={navigate} open={navOpen} onClose={closeNav} />
            <main
              ref={mainRef}
              style={{
                flex: 1, minWidth: 0, overflowY: "auto",
                WebkitOverflowScrolling: "touch",
                padding: vp.isPhone ? "0 10px 16px" : "0 16px 18px 4px",
              }}
              aria-live="polite"
            >
              <Boundary key={route}>
                <Screen route={route} navigate={navigate} session={sessionRes.data} />
              </Boundary>
            </main>
          </div>
          <StatusBar />
        </>
      )}
    </div>
    </ViewportContext.Provider>
  );
}
