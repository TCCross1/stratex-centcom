import React from "react";
import T from "../../design/tokens.js";
import { CHECK_STATE, ATC_STATE } from "../../domains/atc/readiness.js";

/**
 * ATC status vocabulary. UNKNOWN and PROVIDER_UNAVAILABLE render differently
 * from PASS and FAIL on purpose — "we don't know" must never look like "clear".
 */
export const CHECK_STYLE = {
  [CHECK_STATE.PASS]: { color: T.color.ok, mark: "●", label: "PASS" },
  [CHECK_STATE.WARNING]: { color: T.color.medium, mark: "▲", label: "WARNING" },
  [CHECK_STATE.FAIL]: { color: T.color.high, mark: "✕", label: "FAIL" },
  [CHECK_STATE.UNKNOWN]: { color: T.color.textFaint, mark: "?", label: "UNKNOWN" },
  [CHECK_STATE.NOT_APPLICABLE]: { color: T.color.textFaint, mark: "–", label: "N/A" },
  [CHECK_STATE.PROVIDER_UNAVAILABLE]: { color: T.color.blueBright, mark: "⌀", label: "NO PROVIDER" },
};

export const ATC_STATE_STYLE = {
  [ATC_STATE.READY]: { color: T.color.ok, mark: "●" },
  [ATC_STATE.READY_WITH_WARNINGS]: { color: T.color.medium, mark: "▲" },
  [ATC_STATE.BLOCKED]: { color: T.color.high, mark: "✕" },
  [ATC_STATE.HOLD]: { color: T.color.warn, mark: "‖" },
  [ATC_STATE.EXPIRED]: { color: T.color.warn, mark: "⏻" },
  [ATC_STATE.NOT_EVALUATED]: { color: T.color.textFaint, mark: "○" },
  [ATC_STATE.EVALUATING]: { color: T.color.blueBright, mark: "◐" },
  [ATC_STATE.ERROR]: { color: T.color.high, mark: "✕" },
};

export function CheckPill({ state, small }) {
  const s = CHECK_STYLE[state] || CHECK_STYLE.UNKNOWN;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        fontFamily: T.font.display, fontSize: small ? 8.5 : 9.5, fontWeight: 700,
        letterSpacing: "0.1em", color: s.color, border: "1px solid " + s.color + "55",
        background: s.color + "14", borderRadius: T.radius.xs, padding: "3px 8px",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 8 }}>{s.mark}</span>
      {s.label}
    </span>
  );
}

export function AtcStatePill({ state, small }) {
  const s = ATC_STATE_STYLE[state] || ATC_STATE_STYLE.NOT_EVALUATED;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        fontFamily: T.font.display, fontSize: small ? 9 : 10, fontWeight: 700,
        letterSpacing: "0.1em", color: s.color, border: "1px solid " + s.color + "66",
        background: s.color + "16", borderRadius: T.radius.xs, padding: "3px 9px",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 8 }}>{s.mark}</span>
      {String(state).replace(/_/g, " ")}
    </span>
  );
}

/** Provider source badge. Says FIXTURE when it is a fixture. Never says LIVE
 *  unless the payload actually came from a live provider. */
export function SourceBadge({ mode, isLive }) {
  const live = isLive === true;
  const color = live ? T.color.ok : mode === "DISCONNECTED" ? T.color.high : T.color.blueBright;
  const label = live ? "LIVE" : mode === "DISCONNECTED" ? "NO PROVIDER" : "FIXTURE";
  return (
    <span
      style={{
        fontFamily: T.font.mono, fontSize: 8.5, letterSpacing: "0.1em",
        color, border: "1px solid " + color + "55", background: color + "12",
        borderRadius: T.radius.xs, padding: "2px 6px", whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}
