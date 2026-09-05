import React from "react";
import T from "../../../design/tokens.js";
import RT from "../tokens-report.js";
import { Kicker } from "./Kicker.jsx";

export function ReportPanel({ title, kicker, accent = "blue", children, style }) {
  return (
    <section
      style={{
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: T.metal.panel,
        border: "1px solid " + (accent === "gold" ? T.color.goldDeep : RT.hairline),
        borderRadius: RT.radiusLg,
        boxShadow: T.bevel.panel,
        overflow: "hidden",
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
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: RT.icon,
            height: 2,
            background: accent === "gold" ? T.color.gold : T.color.blue,
            boxShadow: accent === "gold" ? T.glow.goldSoft : T.glow.blueSoft,
          }}
        />
        <div>
          {kicker ? <Kicker gold={accent === "gold"}>{kicker}</Kicker> : null}
          <div
            style={{
              fontFamily: T.font.display,
              fontSize: RT.section.size,
              fontWeight: RT.section.weight,
              letterSpacing: RT.section.track,
              color: T.color.text,
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: 12 }}>{children}</div>
    </section>
  );
}

export default ReportPanel;
