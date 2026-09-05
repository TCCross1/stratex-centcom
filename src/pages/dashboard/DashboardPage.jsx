import React, { useState } from "react";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { can } from "../../domains/shared/rbac.js";
import { relTime } from "../../utils/format.js";
import { useResource, useViewport } from "../../app/hooks.js";
import { HexShell } from "../../components/brand/StratexBrand.jsx";
import { Denied, EmptyState, GhostButton, Label, Loading, MetalText, Panel, PanelHeader, Resource, SeverityPill, Sparkline, StatusDot } from "../../components/common/primitives.jsx";
import { LiveMissionFeed } from "../../components/panels/PipelinePanels.jsx";

export function StatTile({ glyph, label, value, delta, caption, onClick }) {
  const [hot, setHot] = useState(false);
  const vp = useViewport();
  const sm = vp.isPhone;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      aria-label={onClick ? label + ": " + value + ". Open." : undefined}
      style={{
        textAlign: "left", cursor: onClick ? "pointer" : "default",
        minHeight: sm ? 68 : undefined, WebkitTapHighlightColor: "transparent",
        flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: sm ? 10 : 13,
        padding: sm ? "12px" : "15px 16px",
        background: "linear-gradient(180deg,rgba(18,32,54,0.92),rgba(6,12,22,0.96))",
        border: "1px solid " + (hot ? "rgba(30,107,255,0.55)" : T.color.edge),
        borderRadius: T.radius.lg,
        boxShadow: hot ? T.bevel.tile + ", " + T.glow.blueSoft : T.bevel.tile,
        transition: "all " + T.motion.base,
      }}
    >
      <div
        style={{
          width: sm ? 34 : 42, height: sm ? 34 : 42, flex: "none", borderRadius: T.radius.md,
          background: "linear-gradient(180deg,rgba(30,107,255,0.20),rgba(10,20,38,0.9))",
          border: "1px solid rgba(30,107,255,0.42)", display: "grid", placeItems: "center",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
        }}
      >
        {glyph}
      </div>
      <div style={{ minWidth: 0 }}>
        <Label style={{ fontSize: sm ? 8.5 : T.type.label.size }}>{label}</Label>
        <div
          style={{
            display: "flex", alignItems: "baseline", gap: sm ? 5 : 7, marginTop: 5,
            flexWrap: "wrap", minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: T.font.display, fontSize: sm ? 19 : T.type.stat.size, fontWeight: 700,
              color: "#FFFFFF", letterSpacing: "0.01em", textShadow: "0 0 16px rgba(120,175,255,0.35)",
              minWidth: 0, overflowWrap: "anywhere",
            }}
          >
            {value}
          </span>
          {delta && (
            <span
              style={{
                fontFamily: T.font.display, fontSize: sm ? 10.5 : 12, fontWeight: 700,
                color: T.color.ok, whiteSpace: "nowrap",
              }}
            >
              ({delta})
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: T.font.body, fontSize: sm ? 9.5 : 10.5, color: T.color.textMute,
            marginTop: 3, overflowWrap: "anywhere",
          }}
        >
          {caption}
        </div>
      </div>
    </Tag>
  );
}

export const TileGlyphs = {
  drone: (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={T.color.blueBright} strokeWidth="1.5" strokeLinecap="round">
      <rect x="9" y="9.5" width="6" height="5" rx="1.2" />
      <path d="M9.5 9.5L6 6M14.5 9.5L18 6M9.5 14.5L6 18M14.5 14.5L18 18" />
      <circle cx="5" cy="5" r="2.2" /><circle cx="19" cy="5" r="2.2" />
      <circle cx="5" cy="19" r="2.2" /><circle cx="19" cy="19" r="2.2" />
    </svg>
  ),
  home: (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={T.color.blueBright} strokeWidth="1.5" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7" /><path d="M5.5 10v10h13V10" /><path d="M10 20v-6h4v6" />
    </svg>
  ),
  doc: (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={T.color.blueBright} strokeWidth="1.5" strokeLinejoin="round">
      <path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5" /><path d="M9 13h7M9 17h5" />
    </svg>
  ),
  revenue: (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke={T.color.goldBright} strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 3v18" /><path d="M16 7.5C16 5.6 14.2 4.5 12 4.5S8 5.6 8 7.5s1.8 2.6 4 3.2 4 1.3 4 3.3-1.8 3-4 3-4-1.1-4-3" />
    </svg>
  ),
};

export function EcosystemStrip({ navigate }) {
  const vp = useViewport();
  const NODES = [
    { key: "cortex", name: "CORTEX", role: "The Intelligence", lines: ["AI Analysis • Learning", "Projections • Insights"], accent: "blue", action: "Intelligence Engine", route: "/cortex" },
    { key: "passport", name: "PASSPORT", role: "The Record", lines: ["Canonical Record", "Timeline • Truth"], accent: "blue", action: "System of Record", route: "/passport" },
    { key: "core", name: "CORE", role: "The Work", lines: ["Measurement • Takeoff", "Estimating • Reporting"], accent: "blue", action: "Work Engine", route: "/core" },
    { key: "pro", name: "PRO", role: "The Professional", lines: ["Contractor Operations", "Projects • Proposals"], accent: "gold", action: "Professional App", route: "/pro" },
    { key: "habitat", name: "HABITAT", role: "The Relationship", lines: ["Homeowner Experience", "Guidance • Stewardship"], accent: "gold", action: "Homeowner App", route: "/habitat" },
  ];

  return (
    <Panel>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: T.font.display, fontSize: T.type.h2.size, fontWeight: 700, letterSpacing: T.type.h2.track, color: T.color.text, textTransform: "uppercase" }}>
          Stratex Ecosystem
        </div>
        <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textMute, marginTop: 4 }}>
          Core systems working together • Data flows • Intelligence powers decisions
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 8, marginTop: 10,
            padding: "7px 11px", borderRadius: T.radius.sm,
            background: "linear-gradient(90deg,rgba(30,107,255,0.16),rgba(6,14,28,0.6))",
            border: "1px solid rgba(30,107,255,0.42)",
          }}
        >
          <HexShell id="eco-centcom" size={20} glyph="centcom" />
          <span style={{ fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: T.color.bluePale }}>
            CENTCOM commands the ecosystem • ATC controls the mission • Evidence preserves what happened
          </span>
        </div>
      </div>

      <div
        style={
          vp.isPhone
            ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "stretch", gridAutoRows: "1fr" }
            : { display: "grid", gridTemplateColumns: "repeat(5, minmax(0,1fr))", gap: 10, alignItems: "stretch", gridAutoRows: "1fr" }
        }
      >
        {NODES.map((n, i) => (
          <React.Fragment key={n.key}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minWidth: 0,
                minHeight: vp.isPhone ? 220 : 240,
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: vp.isPhone ? 8 : 11, flex: 1, minHeight: 0 }}>
                <HexShell id={"eco-" + n.key} size={vp.isPhone ? 40 : 54} glyph={n.key} accent={n.accent} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: T.font.display, fontSize: 13, fontWeight: 700,
                      letterSpacing: "0.13em", textTransform: "uppercase",
                      color: n.accent === "gold" ? T.color.goldBright : T.color.bluePale,
                      textShadow: n.accent === "gold" ? T.glow.textGold : T.glow.textBlue,
                    }}
                  >
                    {n.name}
                  </div>
                  <div style={{ fontFamily: T.font.display, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: T.color.textMute, marginTop: 2 }}>
                    {n.role}
                  </div>
                  {!vp.isPhone &&
                    n.lines.map((l) => (
                      <div key={l} style={{ fontFamily: T.font.body, fontSize: 9.5, color: T.color.textFaint, marginTop: 2 }}>{l}</div>
                    ))}
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", flex: "none" }}>
                <button
                  onClick={() => navigate(n.route)}
                  style={{
                    width: "100%", padding: "8px 6px", cursor: "pointer",
                    minHeight: vp.isPhone ? 40 : 42, lineHeight: 1.35,
                    WebkitTapHighlightColor: "transparent",
                    alignSelf: "stretch",
                    background: n.accent === "gold"
                      ? "linear-gradient(180deg,rgba(240,180,41,0.16),rgba(30,20,4,0.85))"
                      : "linear-gradient(180deg,rgba(30,107,255,0.16),rgba(6,14,28,0.85))",
                    border: "1px solid " + (n.accent === "gold" ? "rgba(240,180,41,0.5)" : "rgba(30,107,255,0.5)"),
                    borderRadius: T.radius.sm,
                    fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    color: n.accent === "gold" ? T.color.goldBright : T.color.bluePale,
                    boxShadow: T.bevel.raised,
                  }}
                >
                  {n.action}
                </button>
              </div>
            </div>
            {false && i < NODES.length - 1 && !vp.isPhone && (
              <div style={{ display: "grid", placeItems: "center", padding: "0 2px", flex: "none" }}>
                <svg width="26" height="14" viewBox="0 0 26 14" aria-hidden="true">
                  <path d="M1 7h20M17 3l5 4-5 4" fill="none" stroke={i === 1 ? T.color.gold : T.color.blueBright} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </Panel>
  );
}

export function AlertsPanel({ navigate }) {
  const res = useResource(() => centcomApi.getAlerts(), []);
  const sevColor = { high: T.color.high, medium: T.color.medium, low: T.color.low };

  return (
    <Panel>
      <PanelHeader
        title="Stratex Intelligence Alerts"
        action={<GhostButton small onClick={() => navigate("/cortex")}>View All</GhostButton>}
      />
      <Resource
        res={res}
        loadingLines={5}
        empty={<EmptyState title="No open alerts" hint="Cortex has not raised anything requiring attention. New findings appear here as analyses complete." />}
      >
        {(alerts) => (
          <div>
            {alerts.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.target || "/centcom")}
                style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%",
                  padding: "10px 4px", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(22,38,60,0.7)", cursor: "pointer", textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 30, height: 30, flex: "none", display: "grid", placeItems: "center",
                    border: "1px solid " + sevColor[a.severity] + "77",
                    background: sevColor[a.severity] + "14",
                    borderRadius: T.radius.sm,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 4l9 16H3z" fill="none" stroke={sevColor[a.severity]} strokeWidth="1.7" strokeLinejoin="round" />
                    <path d="M12 10v4M12 17h.01" stroke={sevColor[a.severity]} strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: T.font.body, fontSize: 12, fontWeight: 600, color: T.color.text }}>
                    {a.title}
                  </span>
                  <span style={{ display: "block", fontFamily: T.font.body, fontSize: 10.5, color: T.color.textMute, marginTop: 2 }}>
                    <span style={{ fontFamily: T.font.mono, fontSize: 9, color: T.color.textFaint, letterSpacing: "0.08em" }}>
                      {a.category}
                    </span>
                    {"  •  " + a.detail}
                  </span>
                </span>
                <span style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textFaint, whiteSpace: "nowrap" }}>
                  {relTime(a.at)}
                </span>
                <SeverityPill severity={a.severity} />
              </button>
            ))}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

export function ActivityPanel({ navigate }) {
  const res = useResource(() => centcomApi.getActivity(), []);
  return (
    <Panel>
      <PanelHeader title="Recent Activity" action={<GhostButton small onClick={() => navigate("/missions")}>View All</GhostButton>} />
      <Resource res={res} loadingLines={5} empty={<EmptyState title="No activity yet" hint="Mission, evidence and Passport events land here as they happen." />}>
        {(items) => (
          <div>
            {items.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(a.target || "/centcom")}
                style={{
                  display: "flex", gap: 13, width: "100%", padding: "9px 4px",
                  background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(22,38,60,0.7)", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{ fontFamily: T.font.mono, fontSize: 11, color: T.color.textMute, flex: "none", paddingTop: 1 }}>
                  {a.at}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontFamily: T.font.body, fontSize: 11.5, fontWeight: 600, color: T.color.text }}>
                    {a.title}
                  </span>
                  <span style={{ display: "block", fontFamily: T.font.body, fontSize: 10.5, color: T.color.textMute, marginTop: 2 }}>
                    {a.sub}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

export function MetricsPanel() {
  const res = useResource(() => centcomApi.getMetrics(), []);
  return (
    <Panel>
      <PanelHeader
        title="Performance Metrics"
        action={
          <span
            style={{
              fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em",
              color: T.color.textSoft, textTransform: "uppercase",
              border: "1px solid " + T.color.edgeBright, borderRadius: T.radius.sm,
              padding: "4px 9px", background: "rgba(10,20,36,0.8)",
            }}
          >
            This Month ▾
          </span>
        }
      />
      <Resource res={res} loadingLines={4} label="Computing metrics">
        {(metrics) => (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {metrics.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: "11px 12px 4px",
                  background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
                  border: "1px solid " + T.color.edge, borderRadius: T.radius.md,
                  boxShadow: T.bevel.tile, overflow: "hidden",
                }}
              >
                <Label style={{ fontSize: 9 }}>{m.label}</Label>
                <div style={{ fontFamily: T.font.display, fontSize: 22, fontWeight: 700, color: "#FFFFFF", marginTop: 5, textShadow: "0 0 14px rgba(120,175,255,0.3)" }}>
                  {m.value}
                </div>
                {m.sub && (
                  <div style={{ fontFamily: T.font.body, fontSize: 10, color: T.color.textFaint, marginTop: 1 }}>{m.sub}</div>
                )}
                <div style={{ position: "relative", marginTop: 4 }}>
                  <Sparkline series={m.series} />
                  <span
                    style={{
                      position: "absolute", right: 2, bottom: 2,
                      fontFamily: T.font.display, fontSize: 10, fontWeight: 700, color: T.color.ok,
                    }}
                  >
                    {m.delta}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Resource>
    </Panel>
  );
}

export function CentcomOverview({ navigate, session }) {
  const res = useResource(() => centcomApi.getOverview(), []);
  const cond = useResource(() => centcomApi.getConditions(), []);
  const vp = useViewport();
  if (!can(session, "centcom:read")) return <Denied scope="centcom:read" />;

  // Phone and tablet read as one column: command summary, the live mission,
  // then intelligence. Alerts sit above activity because alerts are why an
  // operator opens this on a phone in the first place.
  const stacked = vp.isCompact;

  return (
    <div
      style={{
        display: "flex", gap: vp.gutter, minHeight: 0,
        flexDirection: stacked ? "column" : "row",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: vp.gutter }}>
        <Panel pad={vp.isPhone ? 12 : 14}>
          <div style={{ marginBottom: vp.isPhone ? 12 : 14 }}>
            <MetalText size={vp.isPhone ? 21 : T.type.hero.size} track="0.045em">CENTCOM OVERVIEW</MetalText>
            <div style={{ fontFamily: T.font.body, fontSize: vp.isPhone ? 11 : 12, color: T.color.textMute, marginTop: 5 }}>
              Command, Control, and Intelligence for Every Home
            </div>
            {vp.isPhone && cond.data && (
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
                <StatusDot state="ok" size={6} />
                <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textSoft }}>
                  {cond.data.city} • {cond.data.tempF}°F • {cond.data.sky}
                </span>
              </div>
            )}
          </div>

          <Resource res={res} loadingLines={2} label="Loading command summary">
            {(o) => (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(4, minmax(0,1fr))",
                  gap: vp.isPhone ? 8 : 11,
                }}
              >
                <StatTile glyph={TileGlyphs.drone} label="Active Missions" value={o.activeMissions.value} delta={o.activeMissions.delta} caption={o.activeMissions.caption} onClick={() => navigate("/missions?filter=active")} />
                <StatTile glyph={TileGlyphs.home} label="Properties Scanned" value={o.propertiesScanned.value.toLocaleString()} delta={o.propertiesScanned.delta} caption={o.propertiesScanned.caption} onClick={() => navigate("/properties")} />
                <StatTile glyph={TileGlyphs.doc} label="Reports Delivered" value={o.reportsDelivered.value} delta={o.reportsDelivered.delta} caption={o.reportsDelivered.caption} onClick={() => navigate("/reports")} />
                <StatTile glyph={TileGlyphs.revenue} label="Revenue This Month" value={"$" + o.revenue.value.toLocaleString()} delta={o.revenue.delta} caption={o.revenue.caption} onClick={() => navigate("/operations")} />
              </div>
            )}
          </Resource>
        </Panel>

        <LiveMissionFeed navigate={navigate} />
        {!stacked && <EcosystemStrip navigate={navigate} />}
      </div>

      <div
        style={{
          width: stacked ? "100%" : T.layout.intelWidth,
          flex: "none", display: "flex", flexDirection: "column", gap: vp.gutter,
        }}
      >
        <AlertsPanel navigate={navigate} />
        <ActivityPanel navigate={navigate} />
        <MetricsPanel />
        {stacked && <EcosystemStrip navigate={navigate} />}
      </div>
    </div>
  );
}

/* =============================================================================
   11. PROPERTY COMMAND
============================================================================= */

export function LiveOperations({ navigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: T.layout.gutter }}>
      <LiveMissionFeed navigate={navigate} />
      <Panel>
        <PanelHeader title="Live Map — Geographic Operational Awareness" />
        <EmptyState
          title="Map surface reserved"
          hint="The live map is an operational command surface, not decoration: property locations, active and scheduled missions, operator and aircraft assignment, weather, airspace, regional workload and capacity. It renders from centcomApi.listProperties() plus a tile provider once a map key is configured."
          action={<GhostButton onClick={() => navigate("/properties")}>Open the property directory instead</GhostButton>}
        />
      </Panel>
    </div>
  );
}
