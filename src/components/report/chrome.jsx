import React from "react";
import T from "../../design/tokens.js";
import { MetalText } from "../common/primitives.jsx";
import { HexShell } from "../brand/StratexBrand.jsx";
import { PACKET_CHROME, PACKET_PACKAGE, PACKET_TITLES } from "../../domains/reports/packet-contract.js";
import { MISSING } from "../../domains/reports/packet.js";

function typeStyle(key, extra) {
  const t = T.packet.type[key];
  return {
    fontFamily: T.font.display,
    fontSize: t.size,
    fontWeight: t.weight,
    letterSpacing: t.track,
    ...extra,
  };
}

export function PacketHeader({ page, total, title, reportId }) {
  return (
    <header
      style={{
        height: T.packet.headerH,
        flex: "none",
        display: "grid",
        gridTemplateColumns: "320px 1fr 360px",
        alignItems: "center",
        padding: "0 22px",
        borderBottom: "1px solid " + T.color.packetStrokeHot,
        background:
          "linear-gradient(180deg,rgba(14,24,42,0.98) 0%,rgba(5,10,18,0.98) 100%)",
        boxShadow: T.glow.blueSoft,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <HexShell id={"pkt-h-" + page} size={42} glyph="core" />
        <div>
          <MetalText size={T.packet.type.brand.size} track={T.packet.type.brand.track}>
            {PACKET_CHROME.product}
          </MetalText>
          <div style={{ ...typeStyle("tagline", { color: T.color.gold, marginTop: 2 }) }}>
            {PACKET_CHROME.tagline}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...typeStyle("title", { color: T.color.text, textTransform: "uppercase" }) }}>
          {title || PACKET_TITLES[page] || "INTELLIGENCE PACKET"}
        </div>
        <div style={{ ...typeStyle("chamber", { color: T.color.textMute, marginTop: 4 }) }}>{PACKET_PACKAGE}</div>
      </div>
      <div style={{ textAlign: "right", fontFamily: T.font.mono, color: T.color.bluePale, fontSize: 12 }}>
        <div style={{ letterSpacing: "0.12em" }}>{reportId || MISSING}</div>
        <div style={{ marginTop: 4, color: T.color.textSoft, letterSpacing: "0.16em" }}>
          PAGE {page} OF {total}
        </div>
      </div>
    </header>
  );
}

export function IdentityBar({ identity }) {
  const idn = identity || {};
  const bits = [
    idn.addressFull || MISSING,
    idn.propertyId || MISSING,
    idn.passportId ? "PASSPORT " + idn.passportId : null,
    idn.revision ? "REV " + idn.revision : null,
    idn.twinVersion ? "TWIN " + idn.twinVersion : null,
  ].filter(Boolean);
  return (
    <div
      style={{
        height: T.packet.identityH,
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 22px",
        borderBottom: "1px solid " + T.color.packetStroke,
        background: T.color.blueInk,
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}
    >
      {bits.map((bit, i) => (
        <span
          key={i}
          style={{
            ...typeStyle("identity", { color: i === 0 ? T.color.text : T.color.bluePale }),
            fontFamily: i === 0 ? T.font.body : T.font.mono,
          }}
        >
          {i > 0 ? <span style={{ color: T.color.textFaint, marginRight: 18 }}>|</span> : null}
          {bit}
        </span>
      ))}
    </div>
  );
}

function Chamber({ item, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <ChamberGlyph kind={item.key} />
      <div style={{ minWidth: 0 }}>
        <div style={{ ...typeStyle("chamber", { color: T.color.gold }) }}>{item.label}</div>
        <div
          style={{
            fontFamily: T.font.mono,
            fontSize: 10,
            color: T.color.textSoft,
            letterSpacing: "0.08em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: 180,
          }}
        >
          {value || MISSING}
        </div>
      </div>
    </div>
  );
}

function ChamberGlyph({ kind }) {
  const stroke = T.color.blueBright;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <rect x="1.5" y="1.5" width="25" height="25" rx="3" fill={T.color.abyss} stroke={stroke} strokeWidth="1.2" />
      {kind === "LOCK" && (
        <path d="M10 13h8v7H10zm2-3a2 2 0 114 0v3h-4z" fill="none" stroke={T.color.gold} strokeWidth="1.4" />
      )}
      {kind === "SHIELD" && (
        <path d="M14 6l7 3v6c0 4-3.2 6.5-7 8-3.8-1.5-7-4-7-8V9z" fill="none" stroke={T.color.gold} strokeWidth="1.4" />
      )}
      {kind === "BRAIN" && (
        <circle cx="14" cy="14" r="6" fill="none" stroke={T.color.gold} strokeWidth="1.4" />
      )}
      {kind === "CALENDAR" && (
        <path d="M8 8h12v12H8zm0 4h12" fill="none" stroke={T.color.gold} strokeWidth="1.4" />
      )}
      {kind === "PREPARED" && (
        <path d="M9 19l3-8 3 8M10.2 16h3.6" fill="none" stroke={T.color.gold} strokeWidth="1.4" />
      )}
    </svg>
  );
}

export function FooterStampRail({ packet }) {
  const idn = packet?.identity || {};
  const values = {
    LOCK: idn.revision ? "REV " + idn.revision : null,
    SHIELD: idn.propertyId,
    BRAIN: packet?.thermal?.cortexFindingId || "NO FINDING",
    CALENDAR: idn.twinVersion,
    PREPARED: packet?.preparedBy,
  };
  return (
    <footer
      style={{
        height: T.packet.footerH,
        flex: "none",
        display: "grid",
        gridTemplateColumns: "1fr 86px",
        borderTop: "1px solid " + T.color.packetStrokeHot,
        background: "linear-gradient(0deg,rgba(14,24,42,0.98),rgba(5,10,18,0.96))",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5,1fr)",
          alignItems: "center",
          padding: "0 18px",
          gap: 8,
        }}
      >
        {PACKET_CHROME.chambers.map((c) => (
          <Chamber key={c.key} item={c} value={values[c.key]} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderLeft: "1px solid " + T.color.packetStroke,
        }}
      >
        <HexShell id={"pkt-seal-" + (packet?.reportId || "x")} size={54} glyph="core" accent="gold" />
      </div>
    </footer>
  );
}

export function PacketPage({ page, packet, title, children }) {
  const total = packet?.totalPages || 27;
  return (
    <article
      data-packet-page={page}
      style={{
        width: T.packet.artboardW,
        height: T.packet.artboardH,
        background: T.color.abyss,
        color: T.color.text,
        display: "flex",
        flexDirection: "column",
        border: "1px solid " + T.color.edgeHot,
        boxShadow: T.bevel.panel + ", " + T.glow.blueHard,
        overflow: "hidden",
      }}
    >
      <PacketHeader page={page} total={total} title={title} reportId={packet?.reportId} />
      <IdentityBar identity={packet?.identity} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: T.packet.gutter,
          background:
            "radial-gradient(80% 70% at 50% 0%, rgba(30,107,255,0.10), transparent 60%), " + T.color.hull,
        }}
      >
        {children}
      </div>
      <FooterStampRail packet={packet} />
    </article>
  );
}

export function PacketStage({ children }) {
  return (
    <div style={{ width: "100%", overflow: "auto", background: T.color.void, padding: 16 }}>
      <div style={{ width: T.packet.artboardW, margin: "0 auto" }}>{children}</div>
    </div>
  );
}
