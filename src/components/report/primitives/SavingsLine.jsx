import React from "react";
import T from "../../../design/tokens.js";
import { Missing } from "./missing.jsx";

/** C-15 */
export function SavingsLine({ value }) {
  return (
    <div data-c="C-15" style={{ fontFamily: T.font.display, fontSize: 14, color: T.color.textSoft }}>
      Projected envelope delta {value == null ? <Missing /> : value}
    </div>
  );
}
