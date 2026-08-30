import { BRAND } from "../../design/brand-assets.js";
import React, { useState } from "react";
import T from "../../design/tokens.js";
import { MetalText } from "../common/primitives.jsx";

export function HexShell({ id, size = 34, glyph = "centcom", accent = "blue" }) {
  const c = size / 2;
  const hex = (r) =>
    Array.from({ length: 6 })
      .map((_, i) => {
        const a = (Math.PI / 180) * (60 * i - 90);
        return c + r * Math.cos(a) + "," + (c + r * Math.sin(a));
      })
      .join(" ");
  const glowC = accent === "gold" ? T.color.gold : T.color.blue;

  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size} aria-hidden="true">
      <defs>
        <linearGradient id={id + "-chrome"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="34%" stopColor="#B7C8DA" />
          <stop offset="52%" stopColor="#5E7189" />
          <stop offset="70%" stopColor="#D9E6F3" />
          <stop offset="100%" stopColor="#8FA4BC" />
        </linearGradient>
        <linearGradient id={id + "-gold"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF0BF" />
          <stop offset="45%" stopColor="#F0B429" />
          <stop offset="58%" stopColor="#9A6A12" />
          <stop offset="100%" stopColor="#FFE9A8" />
        </linearGradient>
        <filter id={id + "-glow"} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={size * 0.05} result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <polygon points={hex(c * 0.96)} fill="none" stroke={glowC} strokeWidth={size * 0.055} opacity="0.85" filter={"url(#" + id + "-glow)"} />
      <polygon points={hex(c * 0.80)} fill="#050A14" stroke={"url(#" + id + "-chrome)"} strokeWidth={size * 0.07} />
      <polygon points={hex(c * 0.62)} fill="none" stroke={"url(#" + id + "-chrome)"} strokeWidth={size * 0.045} opacity="0.9" />

      {glyph === "centcom" && (
        <g>
          <circle cx={c} cy={c} r={size * 0.20} fill="none" stroke={T.color.blueBright} strokeWidth={size * 0.03} opacity="0.9" />
          <circle cx={c} cy={c} r={size * 0.12} fill={T.color.blueDeep} opacity="0.9" />
          <path d={"M" + c + " " + (c - size * 0.26) + "L" + (c + size * 0.05) + " " + c + "L" + c + " " + (c + size * 0.26) + "L" + (c - size * 0.05) + " " + c + "Z"} fill={"url(#" + id + "-gold)"} filter={"url(#" + id + "-glow)"} />
        </g>
      )}
      {glyph === "core" && <rect x={c - size * 0.10} y={c - size * 0.10} width={size * 0.20} height={size * 0.20} rx="2" fill={T.color.blueBright} filter={"url(#" + id + "-glow)"} />}
      {glyph === "passport" && (
        <g fill={"url(#" + id + "-chrome)"}>
          <circle cx={c} cy={c - size * 0.05} r={size * 0.075} />
          <path d={"M" + (c - size * 0.035) + " " + c + "h" + size * 0.07 + "l" + size * 0.02 + " " + size * 0.16 + "h-" + size * 0.11 + "Z"} />
        </g>
      )}
      {glyph === "cortex" && (
        <g>
          <polygon points={hex(c * 0.34)} fill={"url(#" + id + "-gold)"} filter={"url(#" + id + "-glow)"} />
          <polygon points={hex(c * 0.20)} fill="#5A3C08" opacity="0.65" />
        </g>
      )}
      {glyph === "habitat" && (
        <g>
          <path d={"M" + (c - size * 0.16) + " " + (c + size * 0.16) + "V" + (c - size * 0.02) + "L" + c + " " + (c - size * 0.16) + "L" + (c + size * 0.16) + " " + (c - size * 0.02) + "V" + (c + size * 0.16) + "Z"} fill="none" stroke={"url(#" + id + "-gold)"} strokeWidth={size * 0.05} />
          <rect x={c - size * 0.045} y={c + size * 0.01} width={size * 0.09} height={size * 0.09} fill={T.color.goldBright} />
        </g>
      )}
    </svg>
  );
}



/**
 * Renders an approved brand asset at a given height. If the file is missing —
 * not yet supplied, or the app is running somewhere /brand is not served — the
 * fallback renders instead, marked so nobody mistakes it for approved artwork.
 */

/**
 * Renders an approved brand asset at a given height. If the file is missing —
 * not yet supplied, or the app is running somewhere /brand is not served — the
 * fallback renders instead, marked so nobody mistakes it for approved artwork.
 */
export function BrandLogo({ id, height = 46, fallback = null, style }) {
  const asset = BRAND[id];
  const [failed, setFailed] = useState(!asset || !asset.official);

  if (failed)
    return (
      <span style={{ position: "relative", display: "inline-flex", ...style }} data-temp-asset={id}>
        {fallback}
      </span>
    );

  return (
    <img
      src={asset.src}
      alt={asset.alt}
      height={height}
      onError={() => setFailed(true)}
      style={{ height, width: "auto", display: "block", ...style }}
    />
  );
}

export function CentcomLockup({ scale = 1 }) {
  return (
    <BrandLogo
      id="centcom"
      height={54 * scale}
      fallback={<CentcomLockupFallback scale={scale} />}
    />
  );
}

/** Temporary boundary only. Never ships as the finished mark. */

/** Temporary boundary only. Never ships as the finished mark. */
export function CentcomLockupFallback({ scale = 1 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 * scale }}>
      <HexShell id="lockup" size={46 * scale} glyph="centcom" />
      <div style={{ lineHeight: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <MetalText size={27 * scale} track="0.12em">STRATE</MetalText>
          <MetalText size={27 * scale} track="0.12em" variant="gold">X</MetalText>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 * scale, marginTop: 3 * scale }}>
          <span style={{ height: 1, width: 12 * scale, background: "linear-gradient(90deg,transparent," + T.color.blue + ")" }} />
          <MetalText size={12.5 * scale} track="0.42em" style={{ fontWeight: 600 }}>CENTCOM</MetalText>
          <span style={{ height: 1, width: 12 * scale, background: "linear-gradient(90deg," + T.color.blue + ",transparent)" }} />
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   9. APPLICATION SHELL
============================================================================= */
