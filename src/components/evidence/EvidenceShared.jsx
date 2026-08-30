import React from "react";
import T from "../../design/tokens.js";

const TONE = { ok: T.color.ok, info: T.color.blueBright, warn: T.color.medium, bad: T.color.high, mute: T.color.textFaint };

const STATE_TONE = {
  // review
  APPROVED: "ok", APPROVED_WITH_WARNINGS: "warn", NOT_REVIEWED: "mute", REVIEWING: "info",
  RECAPTURE_REQUIRED: "warn", REJECTED: "bad", QUARANTINED: "bad",
  // quality / coverage
  PASS: "ok", PASS_WITH_WARNINGS: "warn", FAIL: "bad", UNKNOWN: "mute", NOT_EVALUATED: "mute",
  COMPLETE: "ok", COMPLETE_WITH_WARNINGS: "warn", INCOMPLETE: "warn",
  // hash
  VERIFIED: "ok", COMPUTED: "info", MISMATCH: "bad",
  NOT_COMPUTED: "mute", NOT_COMPUTED_FIXTURE: "info", UNAVAILABLE: "mute",
  // eligibility
  ELIGIBLE: "ok", ELIGIBLE_WITH_WARNINGS: "warn", NOT_ELIGIBLE: "bad", PENDING_REVIEW: "info",
  // ingest / processing
  COMPLETE_WITH_WARNINGS_: "warn", QUEUED: "info", RUNNING: "info", FAILED: "bad", CANCELLED: "mute",
  // origin
  ORIGINAL: "info", DERIVED: "mute",
  // tiers
  HOT: "ok", WARM: "info", COLD: "mute", ARCHIVE: "mute",
};

const MARK = { ok: "●", info: "◐", warn: "▲", bad: "✕", mute: "○" };

export function EvPill({ value, small, title }) {
  const tone = STATE_TONE[value] || "mute";
  const c = TONE[tone];
  return (
    <span
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        fontFamily: T.font.display, fontSize: small ? 8.5 : 9.5, fontWeight: 700,
        letterSpacing: "0.1em", color: c, border: "1px solid " + c + "55",
        background: c + "14", borderRadius: T.radius.xs, padding: "3px 8px",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 8 }}>{MARK[tone]}</span>
      {String(value).replace(/_/g, " ")}
    </span>
  );
}

/**
 * Thermal artifacts must be visually distinguishable. A rendered picture of
 * temperature is not radiometric data, and an overlay is neither.
 */
export function ThermalKindBadge({ kind }) {
  if (!kind) return null;
  const map = {
    RADIOMETRIC_SOURCE: { c: "#FF8A3D", label: "RADIOMETRIC SOURCE", note: "Original radiometric data" },
    RENDERED_THERMAL_IMAGE: { c: "#C9D8E8", label: "RENDERED IMAGE", note: "A picture of temperature — not radiometric data" },
    THERMAL_DERIVED_OVERLAY: { c: T.color.goldBright, label: "DERIVED OVERLAY", note: "Computed overlay" },
  };
  const m = map[kind];
  if (!m) return null;
  return (
    <span
      title={m.note}
      style={{
        fontFamily: T.font.display, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.1em",
        color: m.c, border: "1px solid " + m.c + "66", background: m.c + "14",
        borderRadius: T.radius.xs, padding: "3px 8px", whiteSpace: "nowrap",
      }}
    >
      {m.label}
    </span>
  );
}

/** ORIGINAL vs DERIVED, always visible. */
export function OriginBadge({ origin }) {
  const isOriginal = origin === "ORIGINAL";
  const c = isOriginal ? T.color.bluePale : T.color.textMute;
  return (
    <span
      title={isOriginal ? "Captured artifact — immutable" : "Computed from source evidence"}
      style={{
        fontFamily: T.font.display, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.11em",
        color: c, border: "1px solid " + c + "55", background: c + "12",
        borderRadius: T.radius.xs, padding: "3px 8px", whiteSpace: "nowrap",
      }}
    >
      {origin}
    </span>
  );
}

/** Hash display. A fixture never shows a digest-shaped string. */
export function HashDisplay({ state, value, algorithm, vp }) {
  if (state === "NOT_COMPUTED_FIXTURE")
    return (
      <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.blueBright }}>
        No hash computed — this is fixture evidence with no stored bytes. Nothing was hashed, so nothing is claimed.
      </div>
    );
  if (!value)
    return <div style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textMute }}>No hash recorded.</div>;
  return (
    <div>
      <div style={{ fontFamily: T.font.mono, fontSize: 9, color: T.color.textFaint, marginBottom: 4 }}>{algorithm}</div>
      <div style={{ fontFamily: T.font.mono, fontSize: vp?.isPhone ? 10 : 11, color: T.color.bluePale, overflowWrap: "anywhere", lineHeight: 1.5 }}>
        {value}
      </div>
    </div>
  );
}
