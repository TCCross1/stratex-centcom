import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import T from "../../design/tokens.js";

const VECTOR_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

/** RainViewer radar/IR native tiles stop at z7. Higher zooms return "zoom level not supported". */
const RAINVIEWER_MAX_ZOOM = 7;

function markerEl(kind) {
  const el = document.createElement("button");
  el.type = "button";
  el.style.cssText = "width:28px;height:28px;padding:0;border:0;background:transparent;cursor:pointer;z-index:3";
  el.innerHTML = kind === "truck"
    ? `<svg viewBox="0 0 24 24" width="26" height="26"><rect x="3" y="10" width="12" height="7" rx="1" fill="#C9A227" stroke="#fff" stroke-width="1"/><rect x="15" y="13" width="6" height="4" fill="#C9A227" stroke="#fff"/><circle cx="8" cy="18" r="2" fill="#111"/><circle cx="18" cy="18" r="2" fill="#111"/></svg>`
    : `<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 11l8-7 8 7v9H4z" fill="#1E6BFF" stroke="#fff" stroke-width="1.4"/><rect x="10" y="14" width="4" height="6" fill="#fff"/></svg>`;
  return el;
}

function placeMarkers(map, items, kind, onClick, bucket, { draggable, onDragEnd } = {}) {
  bucket.current.forEach((m) => m.remove());
  bucket.current = (items || [])
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .map((row) => {
      const el = markerEl(kind);
      el.title = kind === "truck"
        ? row.vehicleId
        : (row.jobNumber || row.missionId) + (row.address ? " · " + row.address : "");
      el.addEventListener("click", () => onClick && onClick(row));
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom", draggable: Boolean(draggable) })
        .setLngLat([row.lng, row.lat])
        .addTo(map);
      if (draggable && onDragEnd) {
        marker.on("dragend", () => {
          const ll = marker.getLngLat();
          onDragEnd(row, { lat: ll.lat, lng: ll.lng });
        });
      }
      return marker;
    });
}

function skySource(tiles) {
  return {
    type: "raster",
    tiles: [tiles],
    tileSize: 256,
    minzoom: 0,
    maxzoom: RAINVIEWER_MAX_ZOOM,
    attribution: "RainViewer",
  };
}

function applySkyLayers(instance, { overlay, clouds, opacity }) {
  ["radar-layer", "clouds-layer"].forEach((id) => {
    if (instance.getLayer(id)) instance.removeLayer(id);
  });
  ["radar", "clouds"].forEach((id) => {
    if (instance.getSource(id)) instance.removeSource(id);
  });
  const op = Number.isFinite(opacity) ? opacity : 0.55;
  if (clouds) {
    instance.addSource("clouds", skySource(clouds));
    instance.addLayer({
      id: "clouds-layer",
      type: "raster",
      source: "clouds",
      paint: {
        "raster-opacity": Math.min(0.32, op * 0.5),
        "raster-resampling": "linear",
      },
    });
  }
  if (overlay) {
    instance.addSource("radar", skySource(overlay));
    instance.addLayer({
      id: "radar-layer",
      type: "raster",
      source: "radar",
      paint: {
        "raster-opacity": op,
        "raster-resampling": "linear",
      },
    });
  }
}

export function CityMap({ center, pins, trucks, radarOverlay, radarClouds, radarOpacity, onHouse, onHouseMove, onTruck, height }) {
  const host = useRef(null);
  const mapRef = useRef(null);
  const houseRef = useRef([]);
  const truckRef = useRef([]);
  const houseCb = useRef(onHouse);
  const houseMoveCb = useRef(onHouseMove);
  const truckCb = useRef(onTruck);
  const pinsRef = useRef(pins);
  const trucksRef = useRef(trucks);
  const radarRef = useRef({ overlay: radarOverlay, clouds: radarClouds, opacity: radarOpacity });
  const [tilesFailed, setTilesFailed] = useState(false);
  const [ready, setReady] = useState(0);
  houseMoveCb.current = onHouseMove;
  houseCb.current = onHouse;
  truckCb.current = onTruck;
  pinsRef.current = pins;
  trucksRef.current = trucks;
  radarRef.current = { overlay: radarOverlay, clouds: radarClouds, opacity: radarOpacity };

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    let cancelled = false;
    let map;
    let usedFallback = false;

    const paintRadar = (instance) => applySkyLayers(instance, radarRef.current);

    const onReady = (instance) => {
      if (cancelled) return;
      instance.resize();
      setTilesFailed(false);
      setReady((n) => n + 1);
      placeMarkers(instance, pinsRef.current, "house", (row) => houseCb.current && houseCb.current(row), houseRef, {
        draggable: true,
        onDragEnd: (row, ll) => houseMoveCb.current && houseMoveCb.current(row, ll),
      });
      placeMarkers(instance, trucksRef.current, "truck", (row) => truckCb.current && truckCb.current(row), truckRef);
      paintRadar(instance);
    };

    const boot = (style) => {
      map = new maplibregl.Map({
        container: el,
        style,
        center: [center.lng, center.lat],
        zoom: 12.4,
        minZoom: 10,
        maxZoom: 18,
        attributionControl: true,
        failIfMajorPerformanceCaveat: false,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.on("load", () => onReady(map));
      map.on("idle", () => map.resize());
      map.on("error", (evt) => {
        const msg = String(evt?.error?.message || evt?.error || "");
        const fatal = /failed to fetch|error loading style|ajax/i.test(msg);
        if (!fatal || usedFallback) {
          if (fatal && usedFallback) setTilesFailed(true);
          return;
        }
        usedFallback = true;
        try { map.remove(); } catch { /* already gone */ }
        boot(OSM_RASTER_STYLE);
      });
    };

    boot(VECTOR_STYLE);
    const ro = typeof ResizeObserver === "function"
      ? new ResizeObserver(() => mapRef.current && mapRef.current.resize())
      : null;
    if (ro) ro.observe(el);
    const t1 = setTimeout(() => mapRef.current && mapRef.current.resize(), 80);
    const t2 = setTimeout(() => mapRef.current && mapRef.current.resize(), 400);

    return () => {
      cancelled = true;
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
      houseRef.current.forEach((m) => m.remove());
      truckRef.current.forEach((m) => m.remove());
      houseRef.current = [];
      truckRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    placeMarkers(map, pins, "house", (row) => houseCb.current && houseCb.current(row), houseRef, {
      draggable: true,
      onDragEnd: (row, ll) => houseMoveCb.current && houseMoveCb.current(row, ll),
    });
  }, [pins, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    placeMarkers(map, trucks, "truck", (row) => truckCb.current && truckCb.current(row), truckRef);
  }, [trucks, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    applySkyLayers(map, { overlay: radarOverlay, clouds: radarClouds, opacity: radarOpacity });
  }, [radarOverlay, radarClouds, radarOpacity, ready]);

  return (
    <div style={{
      position: "relative",
      height: height || 560,
      minHeight: 280,
      borderRadius: T.radius.md,
      overflow: "hidden",
      border: "1px solid " + T.color.edge,
      background: "#E8EEF6",
    }}>
      <div
        ref={host}
        data-basemap="maplibre-vector"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      {tilesFailed ? (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          background: "rgba(5,10,18,0.92)", color: T.color.warn, fontFamily: T.font.display,
          letterSpacing: "0.14em", zIndex: 2,
        }}>
          MAP TILES UNAVAILABLE
        </div>
      ) : null}
    </div>
  );
}
