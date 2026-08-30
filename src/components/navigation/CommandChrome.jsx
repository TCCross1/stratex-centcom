import React, { useState, useEffect, useMemo } from "react";
import { NAV } from "../../app/router/routes.js";
import T from "../../design/tokens.js";
import centcomApi from "../../domains/index.js";
import { useResource, useTick, useViewport } from "../../app/hooks.js";
import { CentcomLockup, HexShell } from "../brand/StratexBrand.jsx";
import { Label, MetalText, StatusDot } from "../common/primitives.jsx";

export function NavGlyph({ glyph, active }) {
  const c = active ? T.color.blueBright : T.color.textMute;
  const s = { width: 19, height: 19, flex: "none" };
  const stroke = { fill: "none", stroke: c, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    target: <g {...stroke}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M1 12h4M19 12h4" /></g>,
    grid: <g {...stroke}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></g>,
    home: <g {...stroke}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></g>,
    signal: <g {...stroke}><path d="M4 18a12 12 0 0116 0" /><path d="M7.5 15a7.5 7.5 0 019 0" /><circle cx="12" cy="19" r="1.6" /></g>,
    shield: <g {...stroke}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></g>,
    chart: <g {...stroke}><path d="M4 20V9M10 20V4M16 20v-8M22 20H2" /></g>,
    lock: <g {...stroke}><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></g>,
    wrench: <g {...stroke}><path d="M14.5 3a5 5 0 00-6 6.5L3 15v6h6l5.5-5.5A5 5 0 0021 9.5L17.5 13 14 9.5 17.5 6z" /></g>,
    doc: <g {...stroke}><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5" /><path d="M9 13h7M9 17h7" /></g>,
    briefcase: <g {...stroke}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2" /><path d="M3 12h18" /></g>,
    gear: <g {...stroke}><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></g>,
  };
  return <svg viewBox="0 0 24 24" style={s} aria-hidden="true">{paths[glyph] || paths.grid}</svg>;
}

export function SystemStatusCard() {
  const res = useResource(() => centcomApi.getSystems(), []);
  const summary = useMemo(() => {
    if (!res.data) return { state: "offline", text: "Checking systems" };
    const bad = res.data.filter((s) => s.state === "failed").length;
    const deg = res.data.filter((s) => s.state === "degraded").length;
    if (bad) return { state: "fail", text: bad + " systems down" };
    if (deg) return { state: "caution", text: deg + " system degraded" };
    return { state: "ok", text: "All systems operational" };
  }, [res.data]);

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
        background: "linear-gradient(180deg,rgba(16,30,50,0.9),rgba(6,12,22,0.95))",
        border: "1px solid " + T.color.edgeBright, borderRadius: T.radius.md,
        boxShadow: T.bevel.tile,
      }}
    >
      <StatusDot state={summary.state} size={9} />
      <div style={{ minWidth: 0 }}>
        <Label style={{ color: T.color.textSoft }}>System Status</Label>
        <div
          style={{
            fontFamily: T.font.display, fontSize: 10.5, fontWeight: 700,
            letterSpacing: "0.09em", textTransform: "uppercase", marginTop: 3,
            color: summary.state === "ok" ? T.color.ok : summary.state === "caution" ? T.color.medium : T.color.high,
          }}
        >
          {summary.text}
        </div>
      </div>
    </div>
  );
}

export function SideNav({ route, navigate, open, onClose }) {
  const [hover, setHover] = useState(null);
  const vp = useViewport();
  const activeKey = "/" + (route.split("/")[1] || "centcom");
  const drawer = vp.isCompact;

  // Escape closes the drawer, and body scroll locks behind it.
  useEffect(() => {
    if (!drawer || !open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawer, open, onClose]);

  const go = (to) => {
    navigate(to);
    if (drawer) onClose();
  };

  const drawerStyle = drawer
    ? {
        position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 60,
        width: "min(84vw, 300px)", paddingTop: 14,
        background: "linear-gradient(180deg,#081221 0%,#03070E 100%)",
        borderRight: "1px solid " + T.color.edgeHot,
        boxShadow: "18px 0 50px rgba(0,0,0,0.75), " + T.glow.blueSoft,
        transform: open ? "translateX(0)" : "translateX(-102%)",
        transition: "transform " + T.motion.base,
        visibility: open ? "visible" : "hidden",
      }
    : { width: T.layout.railWidth, flex: "none" };

  return (
    <>
      {drawer && (
        <div
          onClick={onClose}
          aria-hidden="true"
          style={{
            position: "fixed", inset: 0, zIndex: 55,
            background: "rgba(0,4,10,0.72)",
            backdropFilter: "blur(2px)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            transition: "opacity " + T.motion.base,
          }}
        />
      )}
    <nav
      aria-label="CENTCOM command navigation"
      aria-hidden={drawer && !open ? "true" : undefined}
      style={{
        display: "flex", flexDirection: "column", gap: 2,
        padding: "0 10px 12px 12px", overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        ...drawerStyle,
      }}
    >
      {drawer && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2px 12px" }}>
          <CentcomLockup scale={0.72} />
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              width: T.layout.tap, height: T.layout.tap, flex: "none",
              background: "transparent", border: "none", cursor: "pointer",
              display: "grid", placeItems: "center",
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 5l14 14M19 5L5 19" fill="none" stroke={T.color.textSoft} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
      {NAV.map((item) => {
        const active = item.route === activeKey;
        const hot = hover === item.key;
        return (
          <button
            key={item.key}
            onClick={() => go(item.route)}
            onMouseEnter={() => setHover(item.key)}
            onMouseLeave={() => setHover(null)}
            aria-current={active ? "page" : undefined}
            style={{
              position: "relative", display: "flex", alignItems: "center", gap: 11,
              width: "100%", textAlign: "left", padding: "10px 12px",
              minHeight: T.layout.tap, WebkitTapHighlightColor: "transparent",
              background: active ? T.metal.railSelected : hot ? T.metal.railHover : "transparent",
              border: "1px solid " + (active ? "rgba(30,107,255,0.55)" : "transparent"),
              borderRadius: T.radius.md, cursor: "pointer",
              boxShadow: active ? "inset 0 1px 0 rgba(255,255,255,0.07), " + T.glow.blueSoft : "none",
              transition: "all " + T.motion.fast,
              borderBottom: active ? "1px solid rgba(30,107,255,0.55)" : "1px solid rgba(22,38,60,0.55)",
            }}
          >
            {active && (
              <span style={{ position: "absolute", left: 0, top: 8, bottom: 8, width: 2, background: T.color.blueBright, boxShadow: T.glow.blueHard, borderRadius: 2 }} />
            )}
            <NavGlyph glyph={item.glyph} active={active || hot} />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block", fontFamily: T.font.display, fontSize: 12.5,
                  fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase",
                  color: active ? "#FFFFFF" : T.color.textSoft,
                  textShadow: active ? T.glow.textBlue : "none",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  display: "block", fontFamily: T.font.body, fontSize: 9.5,
                  letterSpacing: "0.06em", textTransform: "uppercase",
                  color: active ? T.color.bluePale : T.color.textFaint, marginTop: 2,
                }}
              >
                {item.sub}
              </span>
            </span>
            {active && (
              <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke={T.color.blueBright} strokeWidth="2.4" strokeLinecap="round" />
              </svg>
            )}
          </button>
        );
      })}

      <div style={{ marginTop: "auto", paddingTop: 14 }}>
        <SystemStatusCard />
        <div style={{ fontFamily: T.font.mono, fontSize: 9, color: T.color.textFaint, textAlign: "center", marginTop: 9, letterSpacing: "0.08em" }}>
          v0.1.0 • BUILD 000001
        </div>
      </div>
    </nav>
    </>
  );
}

export function MenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Open navigation"
      style={{
        width: T.layout.tap, height: T.layout.tap, flex: "none",
        display: "grid", placeItems: "center", cursor: "pointer",
        background: "linear-gradient(180deg,rgba(20,36,60,0.9),rgba(8,15,27,0.9))",
        border: "1px solid " + T.color.edgeBright, borderRadius: T.radius.sm,
        boxShadow: T.bevel.raised, WebkitTapHighlightColor: "transparent",
      }}
    >
      <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke={T.color.blueBright} strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function AlertBell({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={"Alerts: " + count}
      style={{
        position: "relative", width: T.layout.tap, height: T.layout.tap, flex: "none",
        background: "transparent", border: "none", cursor: "pointer",
        display: "grid", placeItems: "center", WebkitTapHighlightColor: "transparent",
      }}
    >
      <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a6 6 0 00-6 6c0 4-1.5 5.5-2 6h16c-.5-.5-2-2-2-6a6 6 0 00-6-6z" fill="none" stroke={T.color.blueBright} strokeWidth="1.5" />
        <path d="M10 19a2 2 0 004 0" fill="none" stroke={T.color.blueBright} strokeWidth="1.5" />
      </svg>
      {count > 0 && (
        <span
          style={{
            position: "absolute", top: 5, right: 5, minWidth: 16, height: 16,
            borderRadius: 8, background: T.metal.gold, color: "#2B1D02",
            fontFamily: T.font.display, fontSize: 10, fontWeight: 700,
            display: "grid", placeItems: "center", boxShadow: T.glow.goldSoft,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export const BarDivider = () => (
  <span style={{ width: 1, height: 42, background: "linear-gradient(180deg,transparent,rgba(30,107,255,0.35),transparent)" }} />
);

export function CommandBar({ session, navigate, onMenu }) {
  useTick(1000);
  const vp = useViewport();
  const conditions = useResource(() => centcomApi.getConditions(), []);
  const alerts = useResource(() => centcomApi.getAlerts(), []);
  const t = new Date();
  const urgent = alerts.data ? alerts.data.filter((a) => a.severity !== "low").length : 0;

  // PHONE — the field bar. Identity, the alert count, the operator, and a way
  // back to navigation. Weather and the date live one tap away on the overview.
  if (vp.isPhone)
    return (
      <header
        style={{
          height: T.layout.barHeightPhone, flex: "none", display: "flex",
          alignItems: "center", gap: 8, padding: "0 8px",
          background: "linear-gradient(180deg,#0A1424 0%,#050A14 100%)",
          borderBottom: "1px solid " + T.color.edgeBright,
          boxShadow: "0 8px 22px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(30,107,255,0.25)",
          position: "sticky", top: 0, zIndex: 40,
        }}
      >
        <MenuButton onClick={onMenu} />
        <button
          onClick={() => navigate("/centcom")}
          aria-label="CENTCOM overview"
          style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
        >
          <HexShell id="bar-phone" size={28} glyph="centcom" />
          <span style={{ display: "flex", alignItems: "baseline", gap: 5, minWidth: 0 }}>
            <MetalText size={16} track="0.10em">STRATE</MetalText>
            <MetalText size={16} track="0.10em" variant="gold">X</MetalText>
            <span style={{ fontFamily: T.font.display, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.22em", color: T.color.blueBright, textShadow: T.glow.textBlue }}>
              CENTCOM
            </span>
          </span>
        </button>
        <span style={{ fontFamily: T.font.mono, fontSize: 12, color: T.color.textSoft, flex: "none" }}>
          {t.toTimeString().slice(0, 5)}
        </span>
        <AlertBell count={urgent} onClick={() => navigate("/centcom")} />
        <div
          title={session.role}
          style={{
            width: 32, height: 32, flex: "none", borderRadius: T.radius.sm,
            background: "linear-gradient(180deg,#1B3358,#0A1526)",
            border: "1px solid " + T.color.edgeHot, boxShadow: T.glow.blueSoft,
            display: "grid", placeItems: "center",
            fontFamily: T.font.display, fontSize: 12, fontWeight: 700, color: T.color.bluePale,
          }}
        >
          {session.name.split(" ").map((p) => p[0]).join("")}
        </div>
      </header>
    );

  return (
    <header
      style={{
        height: T.layout.barHeight, flex: "none", display: "flex", alignItems: "center",
        gap: vp.isTablet ? 12 : 18, padding: "0 18px 0 12px",
        background: "linear-gradient(180deg,#0A1424 0%,#050A14 100%)",
        borderBottom: "1px solid " + T.color.edgeBright,
        boxShadow: "0 10px 30px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(30,107,255,0.25)",
      }}
    >
      {vp.isTablet && <MenuButton onClick={onMenu} />}

      <button
        onClick={() => navigate("/centcom")}
        style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: T.radius.md }}
        aria-label="Go to CENTCOM overview"
      >
        <CentcomLockup scale={vp.isTablet ? 0.82 : 1} />
      </button>

      <div
        style={{
          fontFamily: T.font.display, fontSize: 13, fontWeight: 700,
          letterSpacing: "0.13em", textTransform: "uppercase",
          color: T.color.textSoft, flex: 1, textShadow: "0 0 14px rgba(30,107,255,0.28)",
        }}
      >
        {vp.isTablet ? "" : "Mission Control for Residential Property Intelligence"}
      </div>

      {!vp.isTablet && <BarDivider />}

      {!vp.isTablet && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 18h9a4 4 0 000-8 6 6 0 00-11.3 2.2A3.5 3.5 0 005 18z" fill="none" stroke={T.color.blueBright} strokeWidth="1.5" />
          </svg>
          <div>
            <div style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textSoft, letterSpacing: "0.05em" }}>
              {conditions.data?.city || "—"}
            </div>
            <div style={{ fontFamily: T.font.display, fontSize: 15, fontWeight: 700, color: T.color.text }}>
              {conditions.data ? conditions.data.tempF + "°F" : "—"}
            </div>
          </div>
        </div>
      )}

      <BarDivider />

      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: T.font.mono, fontSize: 17, color: T.color.text, letterSpacing: "0.06em" }}>
          {t.toTimeString().slice(0, 8)}
        </div>
        <div style={{ fontFamily: T.font.display, fontSize: 9.5, letterSpacing: "0.16em", color: T.color.textMute, textTransform: "uppercase", marginTop: 2 }}>
          {t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      <BarDivider />

      <button
        onClick={() => navigate("/centcom")}
        aria-label={"Alerts: " + (alerts.data?.length || 0)}
        style={{ position: "relative", background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3a6 6 0 00-6 6c0 4-1.5 5.5-2 6h16c-.5-.5-2-2-2-6a6 6 0 00-6-6z" fill="none" stroke={T.color.blueBright} strokeWidth="1.5" />
          <path d="M10 19a2 2 0 004 0" fill="none" stroke={T.color.blueBright} strokeWidth="1.5" />
        </svg>
        {alerts.data?.length ? (
          <span
            style={{
              position: "absolute", top: -2, right: -4, minWidth: 16, height: 16,
              borderRadius: 8, background: T.metal.gold, color: "#2B1D02",
              fontFamily: T.font.display, fontSize: 10, fontWeight: 700,
              display: "grid", placeItems: "center", boxShadow: T.glow.goldSoft,
            }}
          >
            {alerts.data.filter((a) => a.severity !== "low").length}
          </span>
        ) : null}
      </button>

      <BarDivider />

      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ textAlign: "right" }}>
          <Label style={{ color: T.color.textSoft }}>Operator</Label>
          <div style={{ fontFamily: T.font.display, fontSize: 13, fontWeight: 600, color: T.color.text, marginTop: 2 }}>
            {session.name}
          </div>
        </div>
        <div
          title={session.role}
          style={{
            width: 40, height: 40, borderRadius: T.radius.md,
            background: "linear-gradient(180deg,#1B3358,#0A1526)",
            border: "1px solid " + T.color.edgeHot, boxShadow: T.glow.blueSoft,
            display: "grid", placeItems: "center",
            fontFamily: T.font.display, fontSize: 14, fontWeight: 700, color: T.color.bluePale,
          }}
        >
          {session.name.split(" ").map((p) => p[0]).join("")}
        </div>
      </div>
    </header>
  );
}

export function StatusBar() {
  const vp = useViewport();

  if (vp.isPhone)
    return (
      <footer
        style={{
          height: T.layout.footerHeightPhone, flex: "none", display: "flex",
          alignItems: "center", justifyContent: "center", gap: 8, padding: "0 10px",
          background: "linear-gradient(180deg,#050B16,#02050B)",
          borderTop: "1px solid " + T.color.edgeBright,
          boxShadow: "inset 0 1px 0 rgba(30,107,255,0.24)",
        }}
      >
        <HexShell id="footer-phone" size={15} glyph="centcom" />
        <span
          style={{
            fontFamily: T.font.display, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.15em", color: T.color.blueBright,
            textShadow: T.glow.textBlue, textTransform: "uppercase",
          }}
        >
          Command • Control • Intelligence
        </span>
      </footer>
    );

  return (
    <footer
      style={{
        height: T.layout.footerHeight, flex: "none", display: "flex",
        alignItems: "center", justifyContent: "space-between", padding: "0 20px",
        background: "linear-gradient(180deg,#050B16,#02050B)",
        borderTop: "1px solid " + T.color.edgeBright,
        boxShadow: "inset 0 1px 0 rgba(30,107,255,0.24)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <HexShell id="footer" size={20} glyph="centcom" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <MetalText size={13} track="0.14em">STRATEX</MetalText>
          <span style={{ fontFamily: T.font.display, fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: T.color.blueBright, textShadow: T.glow.textBlue }}>
            CENTCOM
          </span>
        </div>
      </div>
      <div style={{ fontFamily: T.font.display, fontSize: 12, fontWeight: 700, letterSpacing: "0.22em", color: T.color.blueBright, textShadow: T.glow.textBlue, textTransform: "uppercase" }}>
        Command the data. Control the mission. Deliver the truth.
      </div>
      <div style={{ fontFamily: T.font.display, fontSize: 10, letterSpacing: "0.16em", color: T.color.textMute, textTransform: "uppercase" }}>
        Built for precision. Driven by intelligence.
      </div>
    </footer>
  );
}

/* =============================================================================
   10. CENTCOM OVERVIEW — the executive dashboard
============================================================================= */
