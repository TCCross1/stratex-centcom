import React, { useState, useEffect, useCallback, useRef } from "react";
import T from "../design/tokens.js";

/**
 * Viewport. One source of truth for "which device am I on", so no component
 * ever guesses. Read it with useViewport(); never inspect window directly.
 *   phone   — single column, drawer navigation, tables become cards
 *   tablet  — single column, drawer navigation, tables stay tables
 *   desktop — the reference layout: rail + main + intelligence column
 */
export const ViewportContext = React.createContext({
  kind: "desktop", width: 1440, isPhone: false, isTablet: false, isCompact: false,
  gutter: T.layout.gutter, pad: T.layout.edgePad,
});

export const readViewport = () => {
  const width = typeof window === "undefined" ? 1440 : window.innerWidth;
  const isPhone = width < T.breakpoint.phone;
  const isTablet = width >= T.breakpoint.phone && width < T.breakpoint.tablet;
  return {
    width, isPhone, isTablet,
    isCompact: isPhone || isTablet,
    kind: isPhone ? "phone" : isTablet ? "tablet" : "desktop",
    gutter: isPhone ? T.layout.gutterPhone : T.layout.gutter,
    pad: isPhone ? T.layout.edgePadPhone : T.layout.edgePad,
  };
};

export function useViewportValue() {
  const [vp, setVp] = useState(readViewport);
  useEffect(() => {
    let frame = null;
    const on = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setVp(readViewport()));
    };
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
  return vp;
}

export const useViewport = () => React.useContext(ViewportContext);

export function useTick(ms = 1000) {
  const [, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}

export function useResource(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(() => loaderRef.current())
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState({ data: null, loading: false, error }));
    return () => {
      alive = false;
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(run, [run]);
  return { ...state, reload: run };
}

/**
 * Viewport. One source of truth for "which device am I on", so no component
 * ever guesses. Read it with useViewport(); never inspect window directly.
 *   phone   — single column, drawer navigation, tables become cards
 *   tablet  — single column, drawer navigation, tables stay tables
 *   desktop — the reference layout: rail + main + intelligence column
 */

export function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, "") || "/centcom";
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const navigate = useCallback((to) => {
    window.location.hash = to;
    setRoute(to);
  }, []);
  return [route, navigate];
}

/* =============================================================================
   7. PRIMITIVES
============================================================================= */

/** Debounce so filtering stays responsive against a large future dataset. */
export function useDebounced(value, ms = 180) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
