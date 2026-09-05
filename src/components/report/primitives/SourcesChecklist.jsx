import React from "react";
import T from "../../../design/tokens.js";

/** C-11 */
export function SourcesChecklist({ items = [] }) {
  return (
    <ul data-c="C-11" style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
      {items.map((item) => (
        <li key={item.id || item.label} style={{ display: "flex", gap: 8, fontFamily: T.font.mono, fontSize: 11, color: item.ok ? T.color.ok : T.color.textFaint }}>
          <span>{item.ok ? "▣" : "☐"}</span>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
