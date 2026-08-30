import React from "react";
import T from "../../design/tokens.js";
import { can } from "../../domains/shared/rbac.js";
import { StatusDot } from "../common/primitives.jsx";

/**
 * The layer registry. Each entry declares what kind of data backs it and
 * whether that data exists yet, so the viewer can never imply it is showing a
 * thermal capture it does not have.
 */
export const VIEWER_LAYERS = [
  { key: "twin", label: "3D Twin", tint: "#4D9BFF", source: "twin.mesh" },
  { key: "aerial", label: "Aerial", tint: "#9CC6FF", source: "capture.ortho" },
  { key: "rgb", label: "RGB", tint: "#C9D8E8", source: "capture.rgb" },
  { key: "thermal", label: "Thermal", tint: "#FF8A3D", source: "capture.thermal" },
  { key: "roof", label: "Roof Health", tint: "#7CE7A0", source: "cortex.roof" },
  { key: "moisture", label: "Moisture", tint: "#4DE1FF", source: "cortex.moisture" },
  { key: "awe", label: "AWE", tint: "#F0B429", source: "cortex.awe" },
  { key: "structural", label: "Structural", tint: "#C9D8E8", source: "cortex.structural" },
  { key: "systems", label: "Systems", tint: "#FFD873", source: "passport.systems" },
  { key: "findings", label: "Findings", tint: "#EF4444", source: "cortex.findings" },
  { key: "measurements", label: "Measurements", tint: "#4D9BFF", source: "core.measurements" },
  { key: "evidence", label: "Evidence", tint: "#4D9BFF", source: "evidence.assets" },
];

export const layerByKey = (k) => VIEWER_LAYERS.find((l) => l.key === k) || VIEWER_LAYERS[0];

/**
 * PropertyRealityViewer — the property visualization surface.
 *
 * This is a component boundary, not a finished 3D viewer. Today it renders the
 * `fixture` representation below. When real photogrammetry, meshes and point
 * clouds exist, a WebGL renderer replaces the internals of this one component
 * and every screen that mounts it keeps working unchanged.
 */

/**
 * PropertyRealityViewer — the property visualization surface.
 *
 * This is a component boundary, not a finished 3D viewer. Today it renders the
 * `fixture` representation below. When real photogrammetry, meshes and point
 * clouds exist, a WebGL renderer replaces the internals of this one component
 * and every screen that mounts it keeps working unchanged.
 */
export function PropertyRealityViewer({
  propertyId,
  missionId,
  activeLayer = "twin",
  findings = [],
  measurements = [],
  evidenceMarkers = [],
  scanProgress = 0,
  telemetry = null,
  renderer = "fixture",
}) {
  const layer = layerByKey(activeLayer);
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <FixturePropertyScene
        layer={layer}
        progressPct={scanProgress}
        markers={activeLayer === "findings" ? findings : activeLayer === "evidence" ? evidenceMarkers : activeLayer === "measurements" ? measurements : []}
        telemetry={telemetry}
      />
      <div
        style={{
          position: "absolute", left: 6, top: 6, display: "flex", alignItems: "center", gap: 7,
          padding: "4px 9px", borderRadius: T.radius.xs,
          background: "rgba(4,10,20,0.72)", border: "1px solid " + T.color.edge,
        }}
      >
        <StatusDot state="fixture" size={5} />
        <span style={{ fontFamily: T.font.mono, fontSize: 9, letterSpacing: "0.08em", color: T.color.textMute }}>
          {layer.source} • development fixture
        </span>
      </div>
    </div>
  );
}

export function FixturePropertyScene({ layer, progressPct, markers = [], telemetry }) {
  const tint = layer.tint;

  const nodes = [
    [232, 214], [318, 176], [404, 150], [486, 178], [560, 216],
    [286, 268], [372, 250], [458, 262], [540, 288], [330, 330], [470, 330],
  ];

  return (
    <svg
      viewBox="0 0 700 330"
      style={{ width: "100%", height: "100%", display: "block" }}
      role="img"
      aria-label={"Property reality viewer, " + layer.label + " layer, capture " + progressPct + " percent"}
    >
      <defs>
        <linearGradient id="tw-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tint} stopOpacity="0.16" />
          <stop offset="100%" stopColor={tint} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="tw-roof" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#16304F" />
          <stop offset="100%" stopColor="#0A1A2E" />
        </linearGradient>
        <linearGradient id="tw-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12253E" />
          <stop offset="100%" stopColor="#081426" />
        </linearGradient>
        <linearGradient id="tw-cone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tint} stopOpacity="0.42" />
          <stop offset="100%" stopColor={tint} stopOpacity="0.02" />
        </linearGradient>
        <filter id="tw-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Ground plane grid */}
      <ellipse cx="400" cy="308" rx="330" ry="34" fill="url(#tw-ground)" />
      {Array.from({ length: 9 }).map((_, i) => (
        <line key={"gx" + i} x1={140 + i * 65} y1="296" x2={110 + i * 72} y2="322" stroke={tint} strokeOpacity="0.16" strokeWidth="0.8" />
      ))}
      {Array.from({ length: 3 }).map((_, i) => (
        <ellipse key={"gy" + i} cx="400" cy="308" rx={130 + i * 100} ry={13 + i * 11} fill="none" stroke={tint} strokeOpacity="0.13" strokeWidth="0.8" />
      ))}

      {/* House body */}
      <path d="M226 216 L226 300 L574 300 L574 216 Z" fill="url(#tw-wall)" stroke={tint} strokeOpacity="0.55" strokeWidth="1.1" />
      {/* Roof */}
      <path d="M206 220 L400 128 L594 220 Z" fill="url(#tw-roof)" stroke={tint} strokeOpacity="0.8" strokeWidth="1.3" />
      <path d="M400 128 L400 300" stroke={tint} strokeOpacity="0.28" strokeWidth="0.9" />
      {/* Dormer */}
      <path d="M340 186 L376 166 L412 186 L412 216 L340 216 Z" fill="url(#tw-wall)" stroke={tint} strokeOpacity="0.6" strokeWidth="1" />
      {/* Chimney */}
      <path d="M504 176 L504 146 L528 146 L528 190 Z" fill="#0C1B2E" stroke={tint} strokeOpacity="0.6" strokeWidth="1" />
      {/* Porch */}
      <path d="M246 300 L246 252 L358 252 L358 300" fill="none" stroke={tint} strokeOpacity="0.45" strokeWidth="1" />
      {[258, 292, 326, 350].map((x) => (
        <line key={"p" + x} x1={x} y1="252" x2={x} y2="300" stroke={tint} strokeOpacity="0.35" strokeWidth="1" />
      ))}

      {/* Windows — warm interior light, the one non-blue warmth in the scene */}
      {[[262, 264], [300, 264], [432, 262], [472, 262], [512, 262], [356, 188]].map(([x, y], i) => (
        <rect key={"w" + i} x={x} y={y} width="22" height="28" rx="1.5" fill="#F2B761" opacity="0.5" style={{ filter: "url(#tw-glow)" }} />
      ))}

      {/* Wireframe roof panels */}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={"rl" + i} x1={206 + i * 32} y1={220 - i * 4} x2={400} y2={128} stroke={tint} strokeOpacity="0.20" strokeWidth="0.7" />
      ))}
      {Array.from({ length: 7 }).map((_, i) => (
        <line key={"rr" + i} x1={594 - i * 32} y1={220 - i * 4} x2={400} y2={128} stroke={tint} strokeOpacity="0.20" strokeWidth="0.7" />
      ))}

      {/* Capture nodes */}
      {nodes.map(([x, y], i) => {
        const captured = (i / nodes.length) * 100 < progressPct;
        return (
          <circle
            key={"n" + i} cx={x} cy={y} r={captured ? 3.2 : 2}
            fill={captured ? tint : "#2A3E58"}
            style={captured ? { filter: "url(#tw-glow)" } : undefined}
          >
            {captured && <animate attributeName="opacity" values="1;0.45;1" dur={2 + (i % 4) * 0.4 + "s"} repeatCount="indefinite" />}
          </circle>
        );
      })}

      {/* Aircraft + scan cone */}
      <g>
        <path d="M150 74 L246 148 L188 178 Z" fill="url(#tw-cone)" />
        <g stroke={T.color.bluePale} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <rect x="132" y="66" width="34" height="13" rx="3" fill="#0B1728" />
          <line x1="136" y1="66" x2="120" y2="54" /><line x1="162" y1="66" x2="178" y2="54" />
          <line x1="136" y1="79" x2="120" y2="90" /><line x1="162" y1="79" x2="178" y2="90" />
          <ellipse cx="118" cy="52" rx="12" ry="2.6" /><ellipse cx="180" cy="52" rx="12" ry="2.6" />
          <ellipse cx="118" cy="92" rx="12" ry="2.6" /><ellipse cx="180" cy="92" rx="12" ry="2.6" />
          <circle cx="149" cy="83" r="4" fill={tint} />
        </g>
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -5; 0 0" dur="4s" repeatCount="indefinite" />
      </g>

      {/* Marker overlay. Only drawn for layers whose data actually exists. */}
      {markers.slice(0, 8).map((m, i) => {
        const x = 250 + ((i * 97) % 300);
        const y = 168 + ((i * 61) % 110);
        return (
          <g key={m.id || i}>
            <circle cx={x} cy={y} r="9" fill="none" stroke={tint} strokeWidth="1.3" opacity="0.9" />
            <circle cx={x} cy={y} r="2.6" fill={tint} style={{ filter: "url(#tw-glow)" }} />
            <text x={x + 13} y={y + 3.5} fontFamily={T.font.mono} fontSize="8.5" fill={tint} opacity="0.9">
              {m.id || m.label || "M" + (i + 1)}
            </text>
          </g>
        );
      })}

      {telemetry && (
        <text x="16" y="322" fontFamily={T.font.mono} fontSize="9" fill={T.color.textFaint}>
          link {telemetry.linkQuality}/5 • {telemetry.source}
        </text>
      )}
    </svg>
  );
}
