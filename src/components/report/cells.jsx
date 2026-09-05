import React from "react";
import T from "../../design/tokens.js";
import { MISSING } from "../../domains/reports/packet.js";

export function isMissing(value) {
  return value == null || value === "" || value === MISSING;
}

export function Missing() {
  return (
    <span style={{ color: T.color.textFaint, fontFamily: T.font.mono, letterSpacing: "0.08em" }}>
      {MISSING}
    </span>
  );
}

export function CellValue({ value, unit, style }) {
  if (isMissing(value)) return <Missing />;
  return (
    <span
      style={{
        color: T.color.text,
        fontFamily: T.font.display,
        fontWeight: 700,
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {value}
      {unit ? <span style={{ color: T.color.textMute, fontWeight: 600, marginLeft: 6 }}>{unit}</span> : null}
    </span>
  );
}

export function Field({ label, value, unit, hint }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: T.metal.panel,
        border: "1px solid " + T.color.packetStroke,
        borderRadius: T.radius.md,
        boxShadow: T.bevel.sunken,
        minHeight: 58,
      }}
    >
      <div
        style={{
          fontFamily: T.font.display,
          fontSize: T.packet.type.chamber.size,
          fontWeight: T.packet.type.chamber.weight,
          letterSpacing: T.packet.type.chamber.track,
          color: T.color.bluePale,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: T.packet.type.cell.size }}>
        <CellValue value={value} unit={unit} />
      </div>
      {hint ? (
        <div style={{ marginTop: 4, fontFamily: T.font.body, fontSize: 10, color: T.color.textMute }}>{hint}</div>
      ) : null}
    </div>
  );
}

export function InstrumentFrame({ title, accent = "blue", children, style }) {
  const stroke = accent === "gold" ? T.color.gold : T.color.packetStrokeHot;
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        minHeight: 0,
        background: T.metal.panel,
        border: "1px solid " + stroke,
        borderRadius: T.radius.lg,
        boxShadow: T.bevel.panel + ", " + (accent === "gold" ? T.glow.goldSoft : T.glow.blueSoft),
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid " + T.color.divider,
          background: "linear-gradient(180deg,rgba(12,21,36,0.95),rgba(6,11,20,0.9))",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 1,
            background: accent === "gold" ? T.color.gold : T.color.blue,
            boxShadow: accent === "gold" ? T.glow.goldSoft : T.glow.blueSoft,
          }}
        />
        <span
          style={{
            fontFamily: T.font.display,
            fontSize: T.packet.type.chamber.size,
            fontWeight: 700,
            letterSpacing: "0.16em",
            color: T.color.text,
            textTransform: "uppercase",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 12, position: "relative" }}>{children}</div>
    </div>
  );
}

export function ExclusionPlate({ reason }) {
  return (
    <div
      style={{
        height: "100%",
        minHeight: 160,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        border: "1px dashed " + T.color.packetStroke,
        borderRadius: T.radius.md,
        background: "rgba(3,6,12,0.55)",
        textAlign: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          fontFamily: T.font.display,
          letterSpacing: "0.22em",
          fontSize: 11,
          color: T.color.gold,
          fontWeight: 700,
        }}
      >
        MODULE EXCLUDED
      </div>
      <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textSoft, maxWidth: 420, lineHeight: 1.45 }}>
        {reason}
      </div>
    </div>
  );
}

export function ScoreDial({ score, label, fixture }) {
  const missing = isMissing(score);
  const pct = missing ? 0 : Math.max(0, Math.min(100, score));
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const tone = missing ? T.color.textFaint : pct < 50 ? T.color.high : pct < 75 ? T.color.medium : T.color.ok;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="110" height="110" viewBox="0 0 110 110" aria-hidden="true">
        <circle cx="55" cy="55" r={r} fill="none" stroke={T.color.edge} strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth="8"
          strokeDasharray={missing ? "4 10" : dash + " " + c}
          strokeLinecap="butt"
          transform="rotate(-90 55 55)"
          opacity={missing ? 0.55 : 1}
        />
        <text
          x="55"
          y="60"
          textAnchor="middle"
          fill={missing ? T.color.textFaint : T.color.text}
          fontFamily={T.font.display}
          fontSize="22"
          fontWeight="700"
        >
          {missing ? MISSING : Math.round(pct)}
        </text>
      </svg>
      <div
        style={{
          fontFamily: T.font.display,
          letterSpacing: "0.2em",
          fontSize: 11,
          color: T.color.bluePale,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
      {fixture ? (
        <div style={{ fontFamily: T.font.mono, fontSize: 9, color: T.color.medium, letterSpacing: "0.12em" }}>
          FIXTURE SCORE
        </div>
      ) : null}
    </div>
  );
}

export function EmptySchedule({ noun }) {
  return (
    <div style={{ fontFamily: T.font.body, fontSize: 12, color: T.color.textMute, lineHeight: 1.5 }}>
      No verified {noun} schedule is on this Passport revision.{" "}
      <span style={{ color: T.color.textFaint }}>{MISSING}</span>
    </div>
  );
}
