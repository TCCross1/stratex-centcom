import React from "react";
import T from "../../../design/tokens.js";
import { MISSING } from "../packet/bindPacket.js";

/** C-07 */
export function ScoreRing({ score, label, fixture = false, habitat = false }) {
  if (score == null && habitat) return null;
  const missing = score == null;
  const pct = missing ? 0 : Math.max(0, Math.min(100, score));
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const tone = missing ? T.color.textFaint : pct < 50 ? T.color.high : pct < 75 ? T.color.medium : T.color.ok;
  return (
    <div data-c="C-07" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
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
          transform="rotate(-90 55 55)"
          opacity={missing ? 0.55 : 1}
        />
        <text x="55" y="60" textAnchor="middle" fill={missing ? T.color.textFaint : T.color.text} fontFamily={T.font.display} fontSize="22" fontWeight="700">
          {missing ? MISSING : Math.round(pct)}
        </text>
      </svg>
      <div style={{ fontFamily: T.font.display, letterSpacing: "0.2em", fontSize: 11, color: T.color.bluePale, fontWeight: 700 }}>{label}</div>
      {fixture && !habitat ? (
        <div style={{ fontFamily: T.font.mono, fontSize: 9, color: T.color.medium, letterSpacing: "0.12em" }}>FIXTURE</div>
      ) : null}
    </div>
  );
}

export default ScoreRing;
