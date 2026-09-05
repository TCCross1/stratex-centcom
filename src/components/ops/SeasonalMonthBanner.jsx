import React from "react";
import T from "../../design/tokens.js";
import { seasonOfMonth } from "../../domains/ops/calendar.js";

const SCENES = {
  winter: {
    sky: ["#0B1A33", "#1A3358", "#8CA6C4"],
    accent: "#E9F1F9",
    caption: "Winter canopy",
  },
  spring: {
    sky: ["#12301C", "#2F6A3A", "#C9E4A8"],
    accent: "#D4F0A8",
    caption: "Spring woodland",
  },
  summer: {
    sky: ["#0C2A12", "#1F6B2A", "#C9A227"],
    accent: "#FFD873",
    caption: "Summer hardwoods",
  },
  autumn: {
    sky: ["#2A1208", "#8A3B12", "#F0B429"],
    accent: "#FFD873",
    caption: "Autumn ridge",
  },
};

/** Slow-turning seasonal nature field behind the month name. */
export function SeasonalMonthBanner({ month, monthName, compact }) {
  const season = seasonOfMonth(month);
  const scene = SCENES[season] || SCENES.summer;
  const h = compact ? 92 : 128;
  return (
    <div
      data-season={season}
      style={{
        position: "relative",
        overflow: "hidden",
        height: h,
        borderRadius: T.radius.md,
        marginBottom: 14,
        border: "1px solid " + T.color.edge,
        background: "linear-gradient(180deg," + scene.sky[0] + "," + scene.sky[1] + ")",
      }}
    >
      <svg
        viewBox="0 0 800 200"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute", inset: "-18%", width: "136%", height: "136%",
          animation: "centcomSeasonSpin 72s linear infinite",
          opacity: 0.92,
        }}
      >
        <defs>
          <radialGradient id="seasonSun" cx="50%" cy="42%" r="48%">
            <stop offset="0%" stopColor={scene.accent} stopOpacity="0.95" />
            <stop offset="55%" stopColor={scene.sky[2]} stopOpacity="0.35" />
            <stop offset="100%" stopColor={scene.sky[0]} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="400" cy="92" r="86" fill="url(#seasonSun)" />
        {season === "winter" ? <WinterTrees /> : null}
        {season === "spring" ? <SpringTrees /> : null}
        {season === "summer" ? <SummerTrees /> : null}
        {season === "autumn" ? <AutumnTrees /> : null}
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg,rgba(3,6,12,0.15),rgba(3,6,12,0.62))",
      }} />
      <div style={{
        position: "relative", zIndex: 1, height: "100%",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          fontFamily: T.font.display, fontSize: compact ? 26 : 42, fontWeight: 800,
          letterSpacing: "0.22em", color: "#FFFFFF", textShadow: "0 2px 18px rgba(0,0,0,0.55)",
        }}>
          {monthName}
        </div>
        <div style={{
          marginTop: 6, fontFamily: T.font.display, fontSize: 9, letterSpacing: "0.16em",
          textTransform: "uppercase", color: scene.accent,
        }}>
          {scene.caption}
        </div>
      </div>
      <style>{`
        @keyframes centcomSeasonSpin {
          from { transform: rotate(0deg) scale(1.05); }
          to { transform: rotate(360deg) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

function WinterTrees() {
  return (
    <g fill="#D7E4F2" opacity="0.88">
      <path d="M90 200 L130 70 L170 200Z" />
      <path d="M210 200 L250 48 L290 200Z" />
      <path d="M520 200 L570 40 L620 200Z" />
      <path d="M650 200 L700 80 L750 200Z" />
      <circle cx="160" cy="54" r="10" fill="#F4F8FC" />
      <circle cx="430" cy="36" r="7" fill="#F4F8FC" />
      <circle cx="610" cy="62" r="8" fill="#F4F8FC" />
    </g>
  );
}

function SpringTrees() {
  return (
    <g>
      <path d="M80 200 C120 120 80 90 140 70 C180 50 210 90 200 200Z" fill="#4FA35A" />
      <path d="M240 200 C280 110 250 70 320 55 C380 40 400 110 390 200Z" fill="#67B86F" />
      <path d="M520 200 C560 100 540 60 620 50 C690 40 720 110 700 200Z" fill="#3E8C4A" />
      <circle cx="150" cy="78" r="8" fill="#F4C6D6" />
      <circle cx="330" cy="62" r="7" fill="#F7D5E2" />
      <circle cx="610" cy="58" r="9" fill="#F4C6D6" />
    </g>
  );
}

function SummerTrees() {
  return (
    <g>
      <path d="M40 200 C90 90 70 40 170 36 C260 30 280 110 250 200Z" fill="#1F6B2A" />
      <path d="M220 200 C270 80 250 30 360 28 C470 24 490 100 460 200Z" fill="#2E8A3A" />
      <path d="M500 200 C550 70 540 20 650 26 C750 32 780 110 740 200Z" fill="#176024" />
      <circle cx="400" cy="70" r="28" fill="#C9A227" opacity="0.35" />
    </g>
  );
}

function AutumnTrees() {
  return (
    <g>
      <path d="M70 200 C120 110 90 50 170 44 C250 38 270 110 250 200Z" fill="#C45A12" />
      <path d="M260 200 C310 90 290 40 380 34 C470 28 490 110 460 200Z" fill="#E08A1A" />
      <path d="M530 200 C580 80 560 30 650 36 C740 42 770 120 730 200Z" fill="#8A3B12" />
      <circle cx="200" cy="70" r="6" fill="#F0B429" />
      <circle cx="420" cy="52" r="7" fill="#FFD873" />
      <circle cx="640" cy="64" r="6" fill="#F0B429" />
    </g>
  );
}
