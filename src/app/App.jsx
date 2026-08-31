/**
 * STRATEX CENTCOM — root application composition.
 *
 * This file mounts providers, the layout chrome and the router. It contains no
 * page implementations, no domain rules, no fixtures and no navigation
 * definitions. Everything it renders lives in its own module.
 *
 *   src/design/       the visual constitution
 *   src/domains/      one canonical model per domain
 *   src/components/   reusable command surfaces
 *   src/pages/        one module per route
 *   src/app/          hooks, layout, router
 */
import React, { useState, useEffect, useCallback, useRef } from "react";

import T, { globalCss } from "../design/tokens.js";
import centcomApi from "../domains/index.js";
import { ROUTES } from "./router/routes.js";
import {
  ViewportContext, useViewportValue, useHashRoute, useResource,
} from "./hooks.js";
import {
  CommandBar, SideNav, StatusBar,
} from "../components/navigation/CommandChrome.jsx";
import {
  Panel, Loading, ErrorState, Boundary,
} from "../components/common/primitives.jsx";
import { BrandLogo, CentcomLockup } from "../components/brand/StratexBrand.jsx";
import { Screen } from "./Screen.jsx";

/** Injects the global stylesheet once. Mobile hardening lives in tokens.js. */
function useGlobalStyles() {
  useEffect(() => {
    if (document.getElementById("sx-global-style")) return;
    const el = document.createElement("style");
    el.id = "sx-global-style";
    el.textContent = globalCss;
    document.head.appendChild(el);
  }, []);
}

export default function StratexCentcom() {
  const [route, navigate] = useHashRoute();
  const sessionRes = useResource(() => centcomApi.getSession(), []);
  const vp = useViewportValue();
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);
  const mainRef = useRef(null);

  useGlobalStyles();

  // Never leave the drawer open behind a desktop layout after a rotate/resize.
  useEffect(() => {
    if (!vp.isCompact) setNavOpen(false);
  }, [vp.isCompact]);

  // Scroll content to the top on every route change, the way a page load would.
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [route]);

  return (
    <ViewportContext.Provider value={vp}>
      <div
        style={{
          minHeight: "100dvh", display: "flex", flexDirection: "column",
          background:
            "radial-gradient(120% 80% at 50% -10%, #071021 0%, #03060C 45%, #000000 100%)",
          color: T.color.text, fontFamily: T.font.body,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {sessionRes.loading ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <CentcomLockup scale={vp.isPhone ? 0.85 : 1.4} />
              <div style={{ marginTop: 20, width: vp.isPhone ? 200 : 260, marginInline: "auto" }}>
                <Loading lines={1} label="Establishing command session" />
              </div>
            </div>
          </div>
        ) : sessionRes.error ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
            <Panel style={{ maxWidth: 520 }}>
              <ErrorState error={sessionRes.error} onRetry={sessionRes.reload} />
            </Panel>
          </div>
        ) : (
          <>
            <CommandBar
              session={sessionRes.data}
              navigate={navigate}
              onMenu={() => setNavOpen(true)}
            />
            <div style={{ flex: 1, display: "flex", minHeight: 0, paddingTop: vp.isPhone ? 10 : 12 }}>
              <SideNav route={route} navigate={navigate} open={navOpen} onClose={closeNav} />
              <main
                ref={mainRef}
                style={{
                  position: "relative", isolation: "isolate",
                  flex: 1, minWidth: 0, overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                  padding: vp.isPhone ? "0 10px 16px" : "0 16px 18px 4px",
                }}
                aria-live="polite"
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                    zIndex: 0,
                    opacity: 0.1,
                    overflow: "hidden",
                  }}
                >
                  <BrandLogo id="centcom" height={Math.min(520, vp.width * 0.42)} style={{ maxWidth: "72%", width: "auto", filter: "drop-shadow(0 0 12px rgba(17,36,62,0.9))" }} />
                </div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* One broken visualization must not take down the shell. */}
                  <Boundary key={route}>
                    <Screen route={route} navigate={navigate} session={sessionRes.data} />
                  </Boundary>
                </div>
              </main>
            </div>
            <StatusBar />
          </>
        )}
      </div>
    </ViewportContext.Provider>
  );
}
