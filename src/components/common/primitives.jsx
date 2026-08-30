import React, { useState, useMemo } from "react";
import T from "../../design/tokens.js";
import { TRUTH_CLASS_STYLE } from "../../domains/shared/classification.js";
import { MISSION_STAGES, STATE_TONE, stageByKey, stateOf } from "../../domains/shared/states.js";
import { useViewport } from "../../app/hooks.js";
import { BRAND } from "../../design/brand-assets.js";

export function MetalText({ children, variant = "chrome", size = 20, weight = 700, track = "0.06em", style }) {
  return (
    <span
      style={{
        fontFamily: T.font.display,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: track,
        backgroundImage: variant === "gold" ? T.metal.gold : T.metal.chrome,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        WebkitTextFillColor: "transparent",
        filter:
          variant === "gold"
            ? "drop-shadow(0 0 8px rgba(240,180,41,0.45))"
            : "drop-shadow(0 1px 0 rgba(0,0,0,0.9)) drop-shadow(0 0 10px rgba(120,170,255,0.22))",
        lineHeight: 1.05,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export function Panel({ children, style, glow = false, pad = 14 }) {
  return (
    <div
      style={{
        position: "relative",
        background: T.metal.panel,
        border: "1px solid " + T.color.edge,
        borderRadius: T.radius.lg,
        boxShadow: glow
          ? T.bevel.panel + ", " + T.glow.blueSoft
          : T.bevel.panel,
        padding: pad,
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background:
            "radial-gradient(120% 80% at 50% -20%, rgba(30,107,255,0.10) 0%, transparent 60%)",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

export function PanelHeader({ title, action, accent = "blue" }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, flexWrap: "wrap",
        marginBottom: 12, paddingBottom: 10,
        borderBottom: "1px solid " + T.color.divider,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
        <span
          style={{
            width: 3, height: 13, borderRadius: 2, flex: "none",
            background: accent === "gold" ? T.color.gold : T.color.blue,
            boxShadow: accent === "gold" ? T.glow.goldSoft : T.glow.blueSoft,
          }}
        />
        <span
          style={{
            fontFamily: T.font.display, fontSize: T.type.h2.size,
            fontWeight: T.type.h2.weight, letterSpacing: T.type.h2.track,
            color: T.color.text, textTransform: "uppercase",
            minWidth: 0, overflowWrap: "anywhere",
          }}
        >
          {title}
        </span>
      </div>
      {action}
    </div>
  );
}

export function GhostButton({ children, onClick, accent = "blue", small = false }) {
  const [hot, setHot] = useState(false);
  const vp = useViewport();
  const c = accent === "gold" ? T.color.gold : T.color.blueBright;
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      style={{
        fontFamily: T.font.display,
        fontSize: small ? 9.5 : 10.5,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: hot ? "#FFFFFF" : c,
        background: hot
          ? "linear-gradient(180deg,rgba(30,107,255,0.28),rgba(30,107,255,0.10))"
          : "linear-gradient(180deg,rgba(20,36,60,0.9),rgba(8,15,27,0.9))",
        border: "1px solid " + (hot ? c : T.color.edgeBright),
        borderRadius: T.radius.sm,
        padding: vp.isPhone ? (small ? "8px 12px" : "11px 15px") : small ? "4px 8px" : "6px 11px",
        minHeight: vp.isPhone ? (small ? 34 : T.layout.tap) : undefined,
        cursor: "pointer",
        whiteSpace: "nowrap",
        WebkitTapHighlightColor: "transparent",
        boxShadow: hot ? T.glow.blueSoft : T.bevel.raised,
        transition: "all " + T.motion.fast,
      }}
    >
      {children}
    </button>
  );
}

export function Label({ children, style }) {
  return (
    <div
      style={{
        fontFamily: T.font.display, fontSize: T.type.label.size,
        fontWeight: T.type.label.weight, letterSpacing: T.type.label.track,
        textTransform: "uppercase", color: T.color.textMute, ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ClassBadge({ classification }) {
  const s = TRUTH_CLASS_STYLE[classification] || TRUTH_CLASS_STYLE.DERIVED;
  return (
    <span
      style={{
        fontFamily: T.font.mono, fontSize: 9, letterSpacing: "0.1em",
        color: s.fg, background: s.bg, border: "1px solid " + s.bd,
        borderRadius: T.radius.xs, padding: "2px 6px", whiteSpace: "nowrap",
      }}
    >
      {classification}
    </span>
  );
}

export function SeverityPill({ severity }) {
  const map = {
    high: { c: T.color.high, t: "HIGH" },
    medium: { c: T.color.medium, t: "MEDIUM" },
    low: { c: T.color.low, t: "LOW" },
  };
  const m = map[severity] || map.low;
  return (
    <span
      style={{
        fontFamily: T.font.display, fontSize: 9, fontWeight: 700,
        letterSpacing: "0.12em", color: m.c,
        border: "1px solid " + m.c + "66",
        background: m.c + "18",
        borderRadius: T.radius.xs, padding: "2px 7px",
      }}
    >
      {m.t}
    </span>
  );
}

export function StatusDot({ state = "ok", size = 7 }) {
  const map = {
    ok: T.color.ok, operational: T.color.ok, synced: T.color.ok, pass: T.color.ok,
    caution: T.color.medium, degraded: T.color.medium, warm: T.color.medium,
    fail: T.color.high, failed: T.color.high, fault: T.color.high,
    fixture: T.color.blueBright, offline: T.color.offline,
  };
  const c = map[state] || T.color.offline;
  return (
    <span
      style={{
        width: size, height: size, borderRadius: "50%",
        background: c, boxShadow: "0 0 8px " + c, display: "inline-block", flex: "none",
      }}
    />
  );
}

export function Sparkline({ series, color = T.color.blueBright, height = 44, fill = true }) {
  const { path, area } = useMemo(() => {
    if (!series || series.length < 2) return { path: "", area: "" };
    const min = Math.min(...series);
    const max = Math.max(...series);
    const span = max - min || 1;
    const w = 200;
    const pts = series.map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = height - 4 - ((v - min) / span) * (height - 10);
      return [x, y];
    });
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    return { path: d, area: d + " L" + w + " " + height + " L0 " + height + " Z" };
  }, [series, height]);

  const gid = "spark-" + color.replace("#", "");
  return (
    <svg viewBox={"0 0 200 " + height} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.30" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={"url(#" + gid + ")"} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px " + color + "aa)" }} />
    </svg>
  );
}

export function Loading({ lines = 3, label = "Loading" }) {
  return (
    <div role="status" aria-live="polite">
      <Label style={{ marginBottom: 8, color: T.color.textFaint }}>{label}…</Label>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 12, marginBottom: 8, borderRadius: T.radius.xs,
            background:
              "linear-gradient(90deg,rgba(30,107,255,0.05) 0%,rgba(30,107,255,0.16) 50%,rgba(30,107,255,0.05) 100%)",
            backgroundSize: "200% 100%",
            animation: "sxShimmer 1.4s ease-in-out infinite",
            width: [92, 74, 84, 66][i % 4] + "%",
          }}
        />
      ))}
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div style={{ padding: "22px 6px", textAlign: "left" }}>
      <div style={{ fontFamily: T.font.display, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", color: T.color.textSoft, textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textMute, marginTop: 6, maxWidth: 460 }}>
        {hint}
      </div>
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div style={{ padding: "18px 6px" }} role="alert">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <StatusDot state="fail" />
        <span style={{ fontFamily: T.font.display, fontSize: 12.5, fontWeight: 700, letterSpacing: "0.1em", color: T.color.high, textTransform: "uppercase" }}>
          Data unavailable
        </span>
      </div>
      <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textSoft, marginTop: 7 }}>
        {error?.message || "The service did not return a result."} Retry, or check System Operations for upstream status.
      </div>
      {onRetry && <div style={{ marginTop: 11 }}><GhostButton onClick={onRetry}>Retry</GhostButton></div>}
    </div>
  );
}

export function Denied({ scope }) {
  return (
    <EmptyState
      title="Not authorized"
      hint={"Your role does not carry the " + scope + " scope. Request access from a CENTCOM Administrator in Admin → Roles."}
    />
  );
}

/** One resource renderer for every screen: loading, error, empty, data. */

/** One resource renderer for every screen: loading, error, empty, data. */
export function Resource({ res, empty, children, loadingLines = 3, label }) {
  if (res.loading) return <Loading lines={loadingLines} label={label} />;
  if (res.error) return <ErrorState error={res.error} onRetry={res.reload} />;
  const isEmpty = !res.data || (Array.isArray(res.data) && res.data.length === 0);
  if (isEmpty) return empty || <EmptyState title="Nothing here yet" hint="No records match this view." />;
  return children(res.data);
}

/**
 * On a phone a nine-column table is unreadable no matter how you scroll it.
 * So each row becomes a card: the primary column is the card title, the rest
 * become label/value pairs. Same data, same props — the table decides.
 * Pass `primary` to choose the title column; it defaults to the first.
 */

/**
 * On a phone a nine-column table is unreadable no matter how you scroll it.
 * So each row becomes a card: the primary column is the card title, the rest
 * become label/value pairs. Same data, same props — the table decides.
 * Pass `primary` to choose the title column; it defaults to the first.
 */
export function DataCards({ columns, rows, onRowClick, keyOf, primary }) {
  const titleCol = columns.find((c) => c.key === primary) || columns[0];
  const rest = columns.filter((c) => c !== titleCol);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r, i) => {
        const k = keyOf ? keyOf(r) : i;
        const Tag = onRowClick ? "button" : "div";
        return (
          <Tag
            key={k}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "12px 13px", borderRadius: T.radius.md,
              background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
              border: "1px solid " + T.color.edge,
              boxShadow: T.bevel.tile,
              cursor: onRowClick ? "pointer" : "default",
              minHeight: T.layout.tap,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 10, paddingBottom: 9, marginBottom: 9,
                borderBottom: "1px solid " + T.color.divider,
              }}
            >
              <span style={{ fontFamily: T.font.body, fontSize: 13, fontWeight: 600, color: T.color.text, minWidth: 0 }}>
                {titleCol.render ? titleCol.render(r) : r[titleCol.key]}
              </span>
              {onRowClick && (
                <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" style={{ flex: "none" }}>
                  <path d="M9 5l7 7-7 7" fill="none" stroke={T.color.blueBright} strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(92px,38%) 1fr", rowGap: 7, columnGap: 10 }}>
              {rest.map((c) => (
                <React.Fragment key={c.key}>
                  <Label style={{ fontSize: 8.5, paddingTop: 2 }}>{c.header}</Label>
                  <span style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, minWidth: 0, overflowWrap: "anywhere" }}>
                    {c.render ? c.render(r) : r[c.key]}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </Tag>
        );
      })}
    </div>
  );
}

export function DataTable({ columns, rows, onRowClick, keyOf, primary }) {
  const [hover, setHover] = useState(null);
  const vp = useViewport();

  if (vp.isPhone)
    return <DataCards columns={columns} rows={rows} onRowClick={onRowClick} keyOf={keyOf} primary={primary} />;

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: T.font.body }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: c.align || "left", padding: "8px 10px",
                  fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700,
                  letterSpacing: "0.14em", textTransform: "uppercase",
                  color: T.color.textMute, borderBottom: "1px solid " + T.color.edge,
                  whiteSpace: "nowrap",
                }}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const k = keyOf ? keyOf(r) : i;
            const hot = hover === k;
            return (
              <tr
                key={k}
                onMouseEnter={() => setHover(k)}
                onMouseLeave={() => setHover(null)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e) => e.key === "Enter" && onRowClick(r) : undefined}
                style={{
                  cursor: onRowClick ? "pointer" : "default",
                  background: hot ? "rgba(30,107,255,0.09)" : "transparent",
                  boxShadow: hot ? "inset 2px 0 0 " + T.color.blue : "none",
                  transition: "background " + T.motion.fast,
                }}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: "9px 10px", textAlign: c.align || "left",
                      fontSize: 11.5, color: T.color.textSoft,
                      borderBottom: "1px solid rgba(22,38,60,0.6)",
                      whiteSpace: c.wrap ? "normal" : "nowrap",
                    }}
                  >
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =============================================================================
   8. BRAND MARKS
   Vector marks in the supplied brand language: chrome hexagon shell, royal-blue
   illumination ring, gold core accent. Drop the official raster/SVG files into
   /public/brand and swap the <BrandMark> body when they are available — every
   call site already goes through this one component.
============================================================================= */

export function Fact({ label, value, mono, tone }) {
  const c = tone === "warn" ? T.color.warn : tone === "ok" ? T.color.ok : T.color.text;
  return (
    <div>
      <Label style={{ fontSize: 9 }}>{label}</Label>
      <div style={{ fontFamily: mono ? T.font.mono : T.font.display, fontSize: mono ? 12 : 15, fontWeight: mono ? 400 : 700, color: c, marginTop: 4 }}>
        {value ?? "—"}
      </div>
    </div>
  );
}

/** Status badge: icon + text + color. Never color alone (§8). */
export function StateBadge({ domain, value, compact }) {
  const st = stateOf(domain, value);
  const c = STATE_TONE[st.tone];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        fontFamily: T.font.display, fontSize: compact ? 9 : 9.5, fontWeight: 700,
        letterSpacing: "0.09em", textTransform: "uppercase", color: c,
        border: "1px solid " + c + "55", background: c + "14",
        borderRadius: T.radius.xs, padding: compact ? "2px 6px" : "3px 8px",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 8, lineHeight: 1 }}>{st.mark}</span>
      {st.label}
    </span>
  );
}

/** A compact, tappable context signal in the property header. */
export function ContextChip({ label, value, state, tone, onClick }) {
  const st = state ? stateOf(state[0], state[1]) : null;
  const c = st ? STATE_TONE[st.tone] : tone ? STATE_TONE[tone] : T.color.textSoft;
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
        padding: "5px 9px", minHeight: 30, borderRadius: T.radius.xs,
        background: "rgba(8,16,30,0.85)", border: "1px solid " + T.color.edge,
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <span style={{ fontFamily: T.font.display, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: T.color.textFaint }}>
        {label}
      </span>
      <span style={{ fontFamily: T.font.display, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: c }}>
        {st ? st.mark + " " + st.label : value}
      </span>
    </button>
  );
}

export function Breadcrumb({ trail, navigate }) {
  const vp = useViewport();
  const items = vp.isPhone ? trail.slice(-2) : trail;
  return (
    <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
      {items.map((c, i) => (
        <React.Fragment key={c.label + i}>
          {i > 0 && <span style={{ color: T.color.textFaint, fontSize: 10 }}>›</span>}
          {c.to ? (
            <button
              onClick={() => navigate(c.to)}
              style={{
                background: "transparent", border: "none", padding: 0, cursor: "pointer",
                fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: T.color.blueBright,
              }}
            >
              {c.label}
            </button>
          ) : (
            <span
              style={{
                fontFamily: T.font.display, fontSize: 9.5, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: T.color.textMute,
              }}
            >
              {c.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

/** A compact, tappable context signal in the property header. */

export function LineageRail({ steps, navigate }) {
  const vp = useViewport();
  return (
    <div
      style={{
        display: "flex", alignItems: "stretch", gap: 6,
        flexDirection: vp.isCompact ? "column" : "row",
        overflowX: vp.isCompact ? "visible" : "auto", paddingBottom: 4,
      }}
    >
      {steps.map((st, i) => (
        <React.Fragment key={st.label}>
          <button
            onClick={st.to ? () => navigate(st.to) : undefined}
            style={{
              flex: 1, minWidth: vp.isCompact ? 0 : 118, textAlign: "left",
              cursor: st.to ? "pointer" : "default", padding: "10px 11px",
              borderRadius: T.radius.sm,
              background: st.current
                ? "linear-gradient(180deg,rgba(30,107,255,0.28),rgba(10,24,48,0.9))"
                : "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
              border: "1px solid " + (st.current ? T.color.edgeHot : T.color.edge),
              boxShadow: st.current ? T.glow.blueSoft : T.bevel.tile,
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <Label style={{ fontSize: 8, color: st.current ? T.color.bluePale : T.color.textFaint }}>{st.label}</Label>
            <div style={{ fontFamily: T.font.mono, fontSize: 10, color: st.value ? T.color.text : T.color.textFaint, marginTop: 4, overflowWrap: "anywhere" }}>
              {st.value || "—"}
            </div>
          </button>
          {i < steps.length - 1 && !vp.isCompact && (
            <span style={{ display: "grid", placeItems: "center", color: T.color.textFaint, flex: "none" }}>›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

/** A reusable module header: purpose, live/fixture state, and actions. */
export function ModuleIntro({ purpose, fixture, actions }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: T.font.body, fontSize: 11.5, color: T.color.textSoft, lineHeight: 1.55, maxWidth: 760 }}>
        {purpose}
      </div>
      {fixture && <div style={{ marginTop: 10 }}><AdapterNotice name={fixture} /></div>}
      {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>{actions}</div>}
    </div>
  );
}

/** Small metric row used by module foundations. */

/** Small metric row used by module foundations. */
export function ModuleMetrics({ cells }) {
  const vp = useViewport();
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: vp.isPhone ? "1fr 1fr" : "repeat(" + Math.min(cells.length, 5) + ", minmax(0,1fr))",
        gap: vp.isPhone ? 8 : 10, marginBottom: 14,
      }}
    >
      {cells.map((c) => {
        const col = STATE_TONE[c.tone || "info"];
        return (
          <div
            key={c.label}
            style={{
              padding: vp.isPhone ? "10px 11px" : "12px 14px",
              background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
              border: "1px solid " + T.color.edge, borderRadius: T.radius.md, boxShadow: T.bevel.tile,
            }}
          >
            <Label style={{ fontSize: 8.5 }}>{c.label}</Label>
            <div style={{ fontFamily: T.font.display, fontSize: vp.isPhone ? 20 : 24, fontWeight: 700, color: col, marginTop: 4, textShadow: "0 0 14px " + col + "55" }}>
              {c.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ModuleShell({ title, children }) {
  const vp = useViewport();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: vp.gutter }}>
      <div>
        <MetalText size={vp.isPhone ? 19 : 26} track="0.05em">{title}</MetalText>
      </div>
      {children}
    </div>
  );
}

/* =============================================================================
   13. ROUTER + APP
============================================================================= */

export function AdapterNotice({ name }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
        padding: "9px 12px", borderRadius: T.radius.sm,
        background: "rgba(30,107,255,0.08)", border: "1px solid rgba(30,107,255,0.35)",
      }}
    >
      <StatusDot state="fixture" size={7} />
      <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textSoft }}>
        {name} is returning development fixtures. The application it observes is not connected yet. Wiring it changes only the adapter — no screen in CENTCOM changes.
      </span>
    </div>
  );
}

export function DownstreamCell({ label, domain, value, tone, onClick }) {
  const st = domain ? stateOf(domain, value) : null;
  const c = st ? STATE_TONE[st.tone] : STATE_TONE[tone || "info"];
  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left", cursor: "pointer", padding: "10px 11px", minHeight: 58,
        background: "linear-gradient(180deg,rgba(16,29,49,0.9),rgba(6,12,22,0.95))",
        border: "1px solid " + T.color.edge, borderRadius: T.radius.md,
        boxShadow: T.bevel.tile, WebkitTapHighlightColor: "transparent",
      }}
    >
      <Label style={{ fontSize: 8.5 }}>{label}</Label>
      <div style={{ fontFamily: T.font.display, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: c, marginTop: 5 }}>
        {st ? st.mark + "  " + st.label : value}
      </div>
    </button>
  );
}

/** Property systems index (§37). Fixture-backed until Passport serves it. */

export function StageBar({ stage, blocker }) {
  const cur = stageByKey(stage);
  const pct = Math.round((cur.n / 15) * 100);
  const blocked = Boolean(blocker);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
        <span style={{ fontFamily: T.font.display, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: blocked ? T.color.warn : T.color.text }}>
          {cur.label}
        </span>
        <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textMute }}>
          {Math.min(cur.n, 15)}/15
        </span>
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {MISSION_STAGES.map((s) => {
          const done = s.n <= cur.n;
          return (
            <span
              key={s.key}
              title={s.n + ". " + s.label}
              style={{
                flex: 1, height: 5, borderRadius: 1,
                background: done ? (blocked && s.n === cur.n ? T.color.warn : T.color.blue) : "rgba(30,50,78,0.85)",
                boxShadow: done ? "0 0 7px " + (blocked && s.n === cur.n ? T.color.warn : T.color.blue) : "none",
              }}
            />
          );
        })}
      </div>
      {blocked && (
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8 }}>
          <StatusDot state="caution" size={6} />
          <span style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.warn }}>{blocker}</span>
        </div>
      )}
      <div style={{ display: "none" }}>{pct}</div>
    </div>
  );
}


/** Status badge: icon + text + color. Never color alone (§8). */

export class Boundary extends React.Component {
  constructor(p) {
    super(p);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error)
      return (
        <Panel>
          <ErrorState error={this.state.error} onRetry={() => this.setState({ error: null })} />
        </Panel>
      );
    return this.props.children;
  }
}
