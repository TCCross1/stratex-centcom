/**
 * STRATEX CENTCOM — DESIGN TOKENS
 * The visual constitution. Every color, gradient, bevel, glow and spacing value
 * in the application originates here. Screens never hand-roll a style; they add
 * a token. Changing the look of CENTCOM means changing this file, nothing else.
 */

export const T = {
  color: {
    // Structure
    void: "#000000",
    abyss: "#03060C",
    hull: "#060B14",
    panel: "#080F1B",
    panelTop: "#0C1524",
    glass: "rgba(10, 20, 36, 0.72)",
    inset: "#050A12",

    // Edges
    edge: "#16263C",
    edgeBright: "#22374F",
    edgeHot: "#1E6BFF",
    divider: "rgba(30, 107, 255, 0.14)",

    // Royal blue illumination — dominant brand energy
    blue: "#1E6BFF",
    blueBright: "#4D9BFF",
    bluePale: "#9CC6FF",
    blueDeep: "#0B2A63",
    blueInk: "#071A3A",

    // True metallic gold — secondary illumination
    gold: "#F0B429",
    goldBright: "#FFD873",
    goldDeep: "#8A5D0F",

    // Text
    text: "#E9F1F9",
    textSoft: "#A8BCD2",
    textMute: "#6E839B",
    textFaint: "#48596E",

    // Status
    ok: "#22C55E",
    low: "#3BA55D",
    medium: "#F0B429",
    warn: "#FB923C",
    high: "#EF4444",
    offline: "#5A6B80",

    // Packet instrument stroke — Core report chrome, never hand-rolled in JSX
    packetStroke: "rgba(30, 107, 255, 0.28)",
    packetStrokeHot: "rgba(30, 107, 255, 0.55)",
    packetInner: "rgba(30, 107, 255, 0.22)",
    rowWash: "rgba(255, 255, 255, 0.03)",
    thermalViolet: "#6D28D9",
    thermalMagenta: "#DB2777",
    thermalOrange: "#FB923C",
    thermalYellow: "#FEF3C7",
  },

  /**
   * Core intelligence packet. 1920×1080 classified instrument panel.
   * Screens and report renderers consume these; they never invent page chrome.
   */
  packet: {
    artboardW: 1920,
    artboardH: 1080,
    headerH: 72,
    footerH: 86,
    identityH: 28,
    gutter: 18,
    chamberW: 320,
    pad: 24,
    innerStroke: "rgba(30, 107, 255, 0.22)",
    hairline: "rgba(30, 107, 255, 0.28)",
    icon: 16,
    kicker: { size: 10, weight: 700, track: "0.16em" },
    section: { size: 12, weight: 700, track: "0.14em" },
    tableHead: { size: 9.5, weight: 700, track: "0.14em" },
    tableCell: { size: 12, weight: 500, track: "0" },
    heroMoney: { size: 32, weight: 700, track: "0.02em" },
    type: {
      brand: { size: 22, weight: 700, track: "0.18em" },
      tagline: { size: 9.5, weight: 700, track: "0.34em" },
      title: { size: 18, weight: 700, track: "0.14em" },
      chamber: { size: 10, weight: 700, track: "0.16em" },
      identity: { size: 11, weight: 600, track: "0.08em" },
      cell: { size: 13, weight: 600, track: "0.04em" },
    },
    thermal: {
      cold: "#1E6BFF",
      mid: "#22C55E",
      warm: "#F0B429",
      hot: "#EF4444",
      violet: "#6D28D9",
      magenta: "#DB2777",
      orange: "#FB923C",
      paleYellow: "#FEF3C7",
    },
  },

  // Metallic surface recipes. Chrome is a gradient, never a flat gray.
  metal: {
    chrome:
      "linear-gradient(180deg,#FFFFFF 0%,#DCE7F2 18%,#8FA4BC 46%,#5E7189 52%,#B9CBDE 66%,#F4F9FF 88%,#AFC0D3 100%)",
    chromeSoft:
      "linear-gradient(180deg,#F6FAFF 0%,#C3D2E3 40%,#7C8FA6 55%,#D8E5F2 100%)",
    gold:
      "linear-gradient(180deg,#FFF0BF 0%,#FFD873 20%,#F0B429 48%,#9A6A12 56%,#F5CB5C 74%,#FFE9A8 100%)",
    goldClean:
      "linear-gradient(180deg,#FFF2C4 0%,#FFD873 22%,#F0B429 50%,#A0710F 58%,#F7CE63 78%,#FFEFB8 100%)",
    panel:
      "linear-gradient(180deg,rgba(20,34,56,0.92) 0%,rgba(8,15,27,0.96) 42%,rgba(5,10,20,0.98) 100%)",
    railSelected:
      "linear-gradient(90deg,rgba(30,107,255,0.34) 0%,rgba(30,107,255,0.10) 62%,rgba(30,107,255,0.02) 100%)",
    railHover:
      "linear-gradient(90deg,rgba(30,107,255,0.14) 0%,rgba(30,107,255,0.03) 70%,transparent 100%)",
  },

  glow: {
    blueSoft: "0 0 18px rgba(30,107,255,0.28)",
    blueHard: "0 0 26px rgba(30,107,255,0.55)",
    goldSoft: "0 0 18px rgba(240,180,41,0.30)",
    goldHard: "0 0 26px rgba(240,180,41,0.55)",
    textBlue: "0 0 12px rgba(77,155,255,0.55)",
    textGold: "0 0 12px rgba(255,216,115,0.5)",
  },

  // Dimensional depth: outer drop, inner top highlight, inner bottom shade.
  bevel: {
    panel:
      "0 18px 40px rgba(0,0,0,0.62), inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(0,0,0,0.55)",
    tile:
      "0 10px 26px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.5)",
    sunken:
      "inset 0 2px 8px rgba(0,0,0,0.75), inset 0 -1px 0 rgba(255,255,255,0.04)",
    raised:
      "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.10)",
  },

  radius: { xs: 3, sm: 5, md: 7, lg: 10, pill: 999 },

  space: (n) => n * 4,

  font: {
    display:
      "'Rajdhani','Saira Condensed','Barlow Condensed','Helvetica Neue',sans-serif",
    body: "'Inter','SF Pro Text',-apple-system,BlinkMacSystemFont,sans-serif",
    mono: "'JetBrains Mono','SF Mono',ui-monospace,Menlo,monospace",
  },

  type: {
    hero: { size: 30, weight: 700, track: "0.04em" },
    h1: { size: 21, weight: 700, track: "0.05em" },
    h2: { size: 14, weight: 700, track: "0.13em" },
    h3: { size: 12, weight: 700, track: "0.11em" },
    stat: { size: 27, weight: 700, track: "0.01em" },
    body: { size: 12.5, weight: 500, track: "0.005em" },
    label: { size: 10, weight: 600, track: "0.15em" },
    micro: { size: 9.5, weight: 600, track: "0.12em" },
  },

  // Breakpoints. Phone is the field device: one operator, one hand, gloves on.
  // Tablet is the truck cab. Desktop is the operations room.
  breakpoint: { phone: 720, tablet: 1100 },

  layout: {
    railWidth: 250,
    barWidth: 0,
    barHeight: 84,
    barHeightPhone: 58,
    footerHeight: 44,
    footerHeightPhone: 34,
    intelWidth: 400,
    gutter: 14,
    gutterPhone: 10,
    edgePad: 16,
    edgePadPhone: 10,
    tap: 44, // minimum touch target, every interactive element clears this
  },

  motion: {
    fast: "140ms cubic-bezier(.22,.61,.36,1)",
    base: "260ms cubic-bezier(.22,.61,.36,1)",
    slow: "520ms cubic-bezier(.22,.61,.36,1)",
  },
};

// goldClean is the canonical gold. Both names point at one recipe so a future
// change to the gold treatment happens in exactly one place.
T.metal.goldClean = T.metal.gold;

export const FONT_IMPORT =
  "@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');";

/** Global stylesheet injected once at app start. Mobile hardening lives here. */
export const globalCss =
  FONT_IMPORT +
  "\n.sx-print-only{display:none}" +
  "\n@media print{" +
  "@page{size:1920px 1080px landscape;margin:0}" +
  "html,body{background:" + T.color.abyss + "!important;margin:0!important}" +
  ".sx-no-print{display:none!important}" +
  ".sx-print-only{display:block!important}" +
  ".sx-packet-page{break-after:page;page-break-after:always;box-shadow:none!important;outline:none!important}" +
  "}" +
  "\n@keyframes sxShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}" +
  "\n*{box-sizing:border-box}" +
  "\nhtml{-webkit-text-size-adjust:100%;text-size-adjust:100%}" +
  "\nbody{margin:0;overscroll-behavior-y:none}" +
  "\ninput,button,select,textarea{font:inherit}" +
  "\nbutton:focus-visible,[tabindex]:focus-visible,input:focus-visible{outline:2px solid " + T.color.blueBright + ";outline-offset:2px}" +
  "\n[style*='overflow-x: auto']::-webkit-scrollbar,[style*='overflow-x:auto']::-webkit-scrollbar{height:0;display:none}" +
  "\n::-webkit-scrollbar{width:9px;height:9px}" +
  "\n::-webkit-scrollbar-track{background:#04080F}" +
  "\n::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#1E3A5F,#12233A);border-radius:5px}" +
  "\n::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#2A5590,#16304F)}" +
  "\n@media (prefers-reduced-motion: reduce){*{animation-duration:.001ms !important;transition-duration:.001ms !important}}";

export default T;
