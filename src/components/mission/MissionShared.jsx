import React from "react";
import T from "../../design/tokens.js";
import { MISSION_STAGES, stageByKey } from "../../domains/mission/lifecycle.js";

export const TONE = { ok: T.color.ok, info: T.color.blueBright, warn: T.color.medium, bad: T.color.high, mute: T.color.textFaint };


export const stateTone = (s) =>
  ({ COMPLETE: "ok", READY: "ok", SYNCED: "ok", VALIDATED: "ok",
     CAPTURING: "info", LAUNCHED: "info", PROCESSING: "info", CORTEX_ANALYSIS: "info",
     PASSPORT_SYNC: "info", SCHEDULED: "info", AUTHORIZED: "info", CONFIRMED: "ok",
     ATC_REVIEW: "warn", AUTHORIZATION_PENDING: "warn", RECAPTURE_REQUIRED: "warn",
     RESCHEDULE_REQUIRED: "warn", CONFLICT: "bad", ABORTED: "bad", FAILED: "bad",
     CANCELLED: "mute", CREATED: "mute", NOT_STARTED: "mute", NOT_REQUIRED: "mute",
   }[s] || "mute");


export function StateChip({ value, small }) {
  const c = TONE[stateTone(value)] || TONE.mute;
  const mark = { ok: "●", info: "◐", warn: "▲", bad: "✕", mute: "○" }[stateTone(value)];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
        fontFamily: T.font.display, fontSize: small ? 9 : 9.5, fontWeight: 700,
        letterSpacing: "0.1em", color: c, border: "1px solid " + c + "55",
        background: c + "14", borderRadius: T.radius.xs, padding: "3px 8px",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 8 }}>{mark}</span>
      {String(value).replace(/_/g, " ")}
    </span>
  );
}

/** The 15-stage rail. Exception states light the rail amber at the current stop. */

export function LifecycleRail({ missionState }) {
  const cur = stageByKey(missionState);
  const exception = cur.n === 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontFamily: T.font.display, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: exception ? T.color.warn : T.color.text }}>
          {cur.label}
        </span>
        <span style={{ fontFamily: T.font.mono, fontSize: 10, color: T.color.textMute }}>
          {exception ? "exception" : cur.n + "/15"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {MISSION_STAGES.map((s) => {
          const done = !exception && s.n <= cur.n;
          return (
            <span
              key={s.key}
              title={s.n + ". " + s.label}
              style={{
                flex: 1, height: 5, borderRadius: 1,
                background: done ? T.color.blue : exception ? "rgba(240,180,41,0.25)" : "rgba(30,50,78,0.85)",
                boxShadow: done ? "0 0 7px " + T.color.blue : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- directory -- */

