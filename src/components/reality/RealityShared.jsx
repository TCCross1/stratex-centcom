import React from "react";
import T from "../../design/tokens.js";
import { TWIN_TYPES, WORKING_NAME_NOTICE } from "../../domains/reality/types.js";

const TONE = { ok: T.color.ok, info: T.color.blueBright, warn: T.color.medium, bad: T.color.high, mute: T.color.textFaint };

const STATE_TONE = {
  APPROVED: "ok", ACTIVE: "ok", COMPLETE: "ok", PASS: "ok", ALIGNED: "ok", AVAILABLE: "ok",
  APPROVED_WITH_WARNINGS: "warn", COMPLETE_WITH_WARNINGS: "warn", PASS_WITH_WARNINGS: "warn",
  ALIGNED_WITH_WARNINGS: "warn", PARTIAL: "warn", REVIEW_REQUIRED: "warn",
  DRAFT: "info", PROCESSING: "info", RUNNING: "info", QUEUED: "info", VALIDATING: "info",
  FAILED: "bad", FAIL: "bad", INCOMPLETE: "bad", REJECTED: "bad",
  SUPERSEDED: "mute", ARCHIVED: "mute", UNKNOWN: "mute", NOT_EVALUATED: "mute",
  NOT_STARTED: "mute", NOT_OBSERVED: "mute", NOT_PROCESSED: "mute", NOT_APPLICABLE: "mute",
  NO_REALITY: "mute", INSUFFICIENT_DATA: "warn", PROVIDER_UNAVAILABLE: "info",
  FIXTURE: "info", DISCONNECTED: "bad", CONNECTED: "ok",
  KNOWN: "ok", DERIVED: "info", PROBABLE: "warn",
};

const MARK = { ok: "●", info: "◐", warn: "▲", bad: "✕", mute: "○" };

export function RPill({ value, small, title }) {
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
 * Twin type badge. Always carries the working-name notice as a tooltip so a
 * placeholder label can never quietly become a product name.
 */
export function TwinTypeBadge({ typeId, small }) {
  const type = TWIN_TYPES[typeId];
  if (!type) return null;
  return (
    <span
      title={WORKING_NAME_NOTICE + " — " + type.description}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
        fontFamily: T.font.display, fontSize: small ? 9 : 10, fontWeight: 700,
        letterSpacing: "0.12em", color: T.color.bluePale,
        border: "1px solid rgba(30,107,255,0.45)", background: "rgba(30,107,255,0.12)",
        borderRadius: T.radius.xs, padding: "3px 9px",
      }}
    >
      {type.displayLabel}
      <span style={{ fontFamily: T.font.mono, fontSize: 7.5, color: T.color.textFaint, letterSpacing: "0.05em" }}>
        WORKING
      </span>
    </span>
  );
}

/** A metric the system cannot legitimately know renders as unavailable. */
export function MetricValue({ value, unit, unavailableNote }) {
  if (value === null || value === undefined)
    return (
      <span
        title={unavailableNote || "Not computed — no reconstruction was performed."}
        style={{ fontFamily: T.font.body, fontSize: 11, color: T.color.textFaint }}
      >
        not computed
      </span>
    );
  return (
    <span style={{ fontFamily: T.font.display, fontWeight: 700, color: T.color.text }}>
      {typeof value === "number" ? value.toLocaleString() : value}
      {unit && <span style={{ color: T.color.textMute, fontWeight: 500 }}>{" " + unit}</span>}
    </span>
  );
}

/** Layer state + observation class, shown together. */
export function LayerRow({ name, row }) {
  const tone = STATE_TONE[row.state] || "mute";
  const c = TONE[tone];
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 9, padding: "8px 2px",
        borderBottom: "1px solid rgba(22,38,60,0.7)", flexWrap: "wrap",
      }}
    >
      <span aria-hidden="true" style={{ color: c, fontSize: 9 }}>{MARK[tone]}</span>
      <span style={{ fontFamily: T.font.display, fontSize: 10.5, fontWeight: 700, letterSpacing: "0.1em",
                     color: T.color.textSoft, minWidth: 150 }}>
        {name.replace(/_/g, " ")}
      </span>
      <RPill value={row.state} small />
      {row.observation && row.observation !== "KNOWN" && <RPill value={row.observation} small />}
      {row.note && (
        <span style={{ fontFamily: T.font.body, fontSize: 10.5, color: T.color.textFaint, flex: 1, minWidth: 160 }}>
          {row.note}
        </span>
      )}
    </div>
  );
}
