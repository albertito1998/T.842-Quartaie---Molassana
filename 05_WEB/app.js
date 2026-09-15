const map = L.map("map", { zoomControl: false, preferCanvas: true });
L.control.zoom({ position: "topright" }).addTo(map);
L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);
const imagery = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 20, attribution: "Tiles © Esri" },
).addTo(map);
const labels = L.tileLayer(
  "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 20, pane: "overlayPane" },
).addTo(map);
const topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
  maxZoom: 17,
  attribution: "© OpenTopoMap",
});
const grey = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  { maxZoom: 18, attribution: "Esri Light Gray" },
);
const basemaps = { satellite: imagery, topo, grey };
let activeBasemap = imagery;
const layers = {},
  towerIndex = new Map();
const loading = document.getElementById("loading-overlay");
const safe = (v) => v ?? "—";
const nav = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
async function json(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}
function towerIcon(f) {
  const p = f.properties || {},
    anchor = /AMARRO/i.test(p.tipo || "");
  return L.divIcon({
    className: "",
    html: `<div class="tower-icon" style="background:${anchor ? "#e11928" : "#fff"};color:${anchor ? "#fff" : "#263746"};border:2px solid ${anchor ? "#fff" : "#7d8b99"}">${safe(p.torre_id)}</div>`,
    iconSize: [19, 19],
    iconAnchor: [9, 9],
  });
}
const TIRATA_PLANS = [
  { from: 225, to: 245, label: "Tirata 01 · 225–245" },
  { from: 245, to: 267, label: "Tirata 02 · 245–267" },
  { from: 267, to: 285, label: "Tirata 03 · 267–285" },
  { from: 285, to: 304, label: "Tirata 04 · 285–304" },
  { from: 304, to: 317, label: "Tirata 05 · 304–317" },
  { from: 317, to: 9999, label: "Tirata 06 · 317–Portale Molassana" },
];
function chainLinks(id) {
  const n = parseInt(String(id).match(/\d+/)?.[0], 10);
  if (!Number.isFinite(n))
    return `<a class="plan-link" target="_blank" href="assets/pdf/23842B1_Piano_di_stendimento.pdf">Apri piano della catena</a>`;
  return TIRATA_PLANS.filter((x) => n >= x.from && n <= x.to)
    .map(
      (x) =>
        `<a class="plan-link" target="_blank" href="assets/pdf/23842B1_Piano_di_stendimento.pdf" title="${x.label}">Piano catena · ${x.label}</a>`,
    )
    .join("");
}
function towerPopup(f, ll) {
  const p = f.properties || {};
  return `<div class="popup-title">Sostegno ${safe(p.torre_id)}</div><div class="popup-grid"><b>Tipo</b><span>${safe(p.tipo)}</span><b>Tratto</b><span>${safe(p.tramo)}</span><b>Quota</b><span>${safe(p.cota_z)} m</span><b>Altezza</b><span>${safe(p.altura_m)} m</span><b>UTM Est</b><span>${safe(p.utm_este)}</span><b>UTM Nord</b><span>${safe(p.utm_norte)}</span></div><div class="popup-plan-section"><b>Documentazione della catena</b>${chainLinks(p.torre_id)}</div><a class="maps-link" target="_blank" href="${nav(ll.lat, ll.lng)}">Apri navigazione</a>`;
}
const defs = [
  [
    "linea/buffer_400m.geojson",
    "Buffer operativo 400 m",
    {
      style: {
        color: "#ffd400",
        weight: 1.5,
        fillColor: "#ffd400",
        fillOpacity: 0.05,
        dashArray: "7 6",
      },
    },
  ],
  [
    "linea/ejes_linea.geojson",
    "Asse della linea",
    { style: { color: "#e11928", weight: 4 } },
  ],
  [
    "linea/vani_attese.geojson",
    "Vani con attese",
    {
      style: { color: "#f4c542", weight: 8, opacity: 0.9 },
      tooltip: (p) => `Vano ${safe(p.vano)} · ${safe(p.numero_sfere)} sfere`,
      popup: (p) => `<div class="popup-title">Vano ${safe(p.vano)}</div><div class="popup-grid"><b>Attese</b><span>${safe(p.numero_sfere)} sfere</span></div>`,
    },
  ],
  [
    "wbk/accessi_temporanei.geojson",
    "Accessi temporanei",
    { style: { color: "#00b7d9", weight: 4 } },
  ],
  [
    "wbk/strade_temporanee_3_5m.geojson",
    "Strade temporanee 3,5 m",
    {
      style: {
        color: "#007d9b",
        weight: 1.5,
        fillColor: "#00d9ff",
        fillOpacity: 0.5,
      },
    },
  ],
  [
    "wbk/aree_macchine.geojson",
    "Aree argano e freno",
    {
      style: {
        color: "#680068",
        weight: 2,
        fillColor: "#e000e0",
        fillOpacity: 0.5,
      },
      popup: (p) =>
        `<div class="popup-title">Area macchina</div><div class="popup-grid"><b>Tirata</b><span>${safe(p.tirada)}</span><b>Ruolo</b><span>${safe(p.rol)}</span><b>Sostegno</b><span>${safe(p.torre_id || p.torre_nombre)}</span><b>Distanza</b><span>${safe(p.distanza_m)} m</span><b>Stato</b><span>${safe(p.estado)}</span></div>`,
    },
  ],
  [
    "infrastructure/magazzino_terna.geojson",
    "Magazzino Terna",
    {
      pointToLayer: (f, ll) =>
        L.marker(ll, {
          icon: L.divIcon({
            className: "",
            html: '<div class="warehouse-marker">M</div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
        }),
      popup: (p, f, l) => {
        const ll = l.getLatLng();
        return `<div class="popup-title">${safe(p.name)}</div><div class="popup-grid"><b>Indirizzo</b><span>${safe(p.address)}</span><b>Coordinate</b><span>${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}</span></div><a class="maps-link" target="_blank" href="${nav(ll.lat, ll.lng)}">Apri navigazione</a>`;
      },
    },
  ],
  [
    "environment/habitat_natura2000.geojson",
    "Habitat Natura 2000",
    {
      style: {
        color: "#8e44ad",
        weight: 2,
        fillColor: "#9b59b6",
        fillOpacity: 0.3,
      },
    },
  ],
  [
    "environment/pericolosita_alluvione.geojson",
    "Pericolosità alluvionale",
    {
      style: (f) => {
        const n = Number(f.properties?.pericolo || 1);
        return {
          color: "#1769a6",
          weight: 1,
          fillColor: n >= 3 ? "#2455a4" : n === 2 ? "#3f88c5" : "#72b7dc",
          fillOpacity: 0.32,
        };
      },
      popup: (p) =>
        `<div class="popup-title">Pericolosità alluvionale</div><div class="popup-grid"><b>Classe</b><span>${safe(p.pericolo)}</span><b>Ambito</b><span>${safe(p.ambito)}</span><b>Nome</b><span>${safe(p.name)}</span></div>`,
    },
  ],
  [
    "infrastructure/red_viaria.geojson",
    "Rete viaria",
    {
      style: (f) => ({
        color: f.properties?.paved ? "#ff9f1c" : "#f5f5f5",
        weight: f.properties?.paved ? 2.6 : 1.5,
        opacity: 0.85,
      }),
      popup: (p) =>
        `<div class="popup-title">Viabilità</div><div class="popup-grid"><b>Tipo</b><span>${safe(p.highway)}</span><b>Superficie</b><span>${safe(p.surface)}</span><b>Nome</b><span>${safe(p.name)}</span></div>`,
    },
  ],
  [
    "catasto/fabbricati.geojson",
    "Fabbricati catastali",
    {
      style: {
        color: "#50b5ff",
        weight: 1,
        fillColor: "#50b5ff",
        fillOpacity: 0.08,
      },
    },
  ],
  [
    "catasto/parcelle.geojson",
    "Particelle catastali",
    {
      style: { color: "#f47c00", weight: 0.8, fillOpacity: 0 },
      popup: (p) =>
        `<div class="popup-title">Particella catastale</div><div class="popup-grid"><b>Comune</b><span>${safe(p.ct24_cod_com)}</span><b>Foglio</b><span>${safe(p.ct24_foglio)}</span><b>Particella</b><span>${safe(p.ct24_numero)}</span><b>Area</b><span>${safe(p.ct24_area)} m²</span></div>`,
    },
  ],
];
async function buildLayer(path, name, opt) {
  const data = await json(`data/${path}`);
  const layer = L.geoJSON(data, {
    style: opt.style,
    pointToLayer: opt.pointToLayer,
    onEachFeature: (f, l) => {
      if (opt.popup) l.bindPopup(opt.popup(f.properties || {}, f, l));
      if (opt.tooltip) l.bindTooltip(opt.tooltip(f.properties || {}), { permanent: true, direction: "center", className: "wait-label" });
    },
  });
  layers[name] = layer;
  return layer;
}
async function init() {
  try {
    const [buffer, axis] = await Promise.all(
      defs.slice(0, 2).map((d) => buildLayer(...d)),
    );
    buffer.addTo(map);
    axis.addTo(map);
    map.fitBounds(buffer.getBounds(), { padding: [20, 20] });
    const towers = await json("data/linea/apoyos.geojson");
    layers["Sostegni"] = L.geoJSON(towers, {
      pointToLayer: (f, ll) => L.marker(ll, { icon: towerIcon(f) }),
      onEachFeature: (f, l) => {
        const id = String(f.properties?.torre_id || "").toUpperCase();
        towerIndex.set(id, l);
        l.bindPopup(towerPopup(f, l.getLatLng()));
      },
    }).addTo(map);
    const overlays = {
      Sostegni: layers["Sostegni"],
      "Asse della linea": axis,
      "Buffer operativo 400 m": buffer,
    };
    for (const d of defs.slice(2)) {
      const layer = await buildLayer(...d);
      overlays[d[1]] = layer;
      if (
        [
          "Accessi temporanei",
          "Aree argano e freno",
          "Habitat Natura 2000",
          "Magazzino Terna",
        ].includes(d[1])
      )
        layer.addTo(map);
    }
    wireLayerControls();
  } catch (e) {
    console.error(e);
    loading.innerHTML = "<p>Errore nel caricamento dei dati</p>";
    return;
  }
  loading.classList.add("hidden");
  setTimeout(() => loading.remove(), 450);
}
function searchTower() {
  const q = document
    .getElementById("tower-search")
    .value.trim()
    .toUpperCase()
    .replace("PORT.", "PORTALE");
  const result = document.getElementById("search-result");
  let pair =
    [...towerIndex].find(([id]) => id === q) ||
    [...towerIndex].find(([id]) => id.includes(q));
  if (!q || !pair) {
    result.textContent = "Sostegno non trovato";
    return;
  }
  const l = pair[1],
    ll = l.getLatLng();
  if (is3d && map3d)
    map3d.flyTo({
      center: [ll.lng, ll.lat],
      zoom: 17,
      pitch: 65,
      duration: 1200,
    });
  else {
    map.setView(ll, 18);
    l.openPopup();
  }
  result.textContent = `Sostegno ${pair[0]} selezionato`;
}
const parcelLabels = L.layerGroup();
let parcelsEnabled = false,
  parcelNumbersEnabled = false;
function refreshParcelLabels() {
  parcelLabels.clearLayers();
  if (!parcelsEnabled || !parcelNumbersEnabled || map.getZoom() < 16) return;
  const bounds = map.getBounds();
  let count = 0;
  layers["Particelle catastali"]?.eachLayer((layer) => {
    if (
      count >= 500 ||
      !layer.getBounds ||
      !bounds.intersects(layer.getBounds())
    )
      return;
    const p = layer.feature?.properties || {},
      foglio = String(p.ct24_foglio ?? "").trim(),
      numero = String(p.ct24_numero ?? "").trim();
    if (!numero) return;
    L.marker(layer.getBounds().getCenter(), {
      interactive: false,
      icon: L.divIcon({
        className: "parcel-label",
        html: `F.${foglio} · ${numero}`,
        iconSize: null,
      }),
    }).addTo(parcelLabels);
    count++;
  });
}
map.on("zoomend moveend", refreshParcelLabels);
function wireLayerControls() {
  document.querySelectorAll("[data-layer]").forEach((input) => {
    const name = input.dataset.layer,
      layer = layers[name];
    if (!layer) {
      input.disabled = true;
      return;
    }
    if (input.checked && !map.hasLayer(layer)) layer.addTo(map);
    input.addEventListener("change", () => {
      if (input.checked) layer.addTo(map);
      else map.removeLayer(layer);
      MAP3D_LAYER_GROUPS[name]?.forEach((id) => {
        if (map3d?.getLayer(id))
          map3d.setLayoutProperty(
            id,
            "visibility",
            input.checked ? "visible" : "none",
          );
      });
      if (name === "Particelle catastali") {
        parcelsEnabled = input.checked;
        if (parcelsEnabled) {
          parcelLabels.addTo(map);
          refreshParcelLabels();
        } else map.removeLayer(parcelLabels);
      }
    });
  });
}
document
  .getElementById("chk-parcel-numbers")
  .addEventListener("change", (event) => {
    parcelNumbersEnabled = event.target.checked;
    if (parcelNumbersEnabled && parcelsEnabled) {
      parcelLabels.addTo(map);
      refreshParcelLabels();
    } else {
      parcelLabels.clearLayers();
      if (map.hasLayer(parcelLabels)) map.removeLayer(parcelLabels);
    }
  });
document.querySelectorAll("[data-basemap]").forEach((btn) =>
  btn.addEventListener("click", () => {
    map.removeLayer(activeBasemap);
    activeBasemap = basemaps[btn.dataset.basemap];
    activeBasemap.addTo(map);
    if (btn.dataset.basemap === "satellite") labels.addTo(map);
    else if (map.hasLayer(labels)) map.removeLayer(labels);
    document
      .querySelectorAll("[data-basemap]")
      .forEach((b) => b.classList.toggle("active", b === btn));
  }),
);
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-backdrop").classList.toggle("visible");
}
document.getElementById("btn-menu-toggle").onclick = toggleSidebar;
document.getElementById("btn-sidebar-close").onclick = toggleSidebar;
document.getElementById("sidebar-backdrop").onclick = toggleSidebar;
function wgs84ToUtm32(lat, lng) {
  const a = 6378137,
    f = 1 / 298.257223563,
    k = 0.9996,
    e2 = f * (2 - f),
    ep2 = e2 / (1 - e2),
    lon0 = (9 * Math.PI) / 180,
    la = (lat * Math.PI) / 180,
    lo = (lng * Math.PI) / 180,
    s = Math.sin(la),
    c = Math.cos(la),
    t = Math.tan(la),
    n = a / Math.sqrt(1 - e2 * s * s),
    tt = t * t,
    cc = ep2 * c * c,
    aa = c * (lo - lon0),
    m =
      a *
      ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * la -
        ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) *
          Math.sin(2 * la) +
        ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * la) -
        ((35 * e2 ** 3) / 3072) * Math.sin(6 * la));
  return {
    e:
      k *
        n *
        (aa +
          ((1 - tt + cc) * aa ** 3) / 6 +
          ((5 - 18 * tt + tt ** 2 + 72 * cc - 58 * ep2) * aa ** 5) / 120) +
      500000,
    n:
      k *
      (m +
        n *
          t *
          (aa ** 2 / 2 +
            ((5 - tt + 9 * cc + 4 * cc ** 2) * aa ** 4) / 24 +
            ((61 - 58 * tt + tt ** 2 + 600 * cc - 330 * ep2) * aa ** 6) / 720)),
  };
}
map.on("mousemove", (ev) => {
  const u = wgs84ToUtm32(ev.latlng.lat, ev.latlng.lng);
  document.getElementById("coords-bar").innerHTML =
    `Lat: ${ev.latlng.lat.toFixed(5)} &nbsp; Lng: ${ev.latlng.lng.toFixed(5)} &nbsp; | &nbsp; UTM32N EPSG:25832 E: ${u.e.toFixed(1)} &nbsp; N: ${u.n.toFixed(1)}`;
});
let locationMarker = null,
  accuracyCircle = null;
function fixLocation(p) {
  const ll = [p.coords.latitude, p.coords.longitude];
  if (locationMarker) map.removeLayer(locationMarker);
  if (accuracyCircle) map.removeLayer(accuracyCircle);
  accuracyCircle = L.circle(ll, {
    radius: p.coords.accuracy || 0,
    color: "#1e88ff",
    weight: 1,
    fillColor: "#1e88ff",
    fillOpacity: 0.15,
  }).addTo(map);
  locationMarker = L.circleMarker(ll, {
    radius: 8,
    color: "#fff",
    weight: 3,
    fillColor: "#1e88ff",
    fillOpacity: 1,
  })
    .addTo(map)
    .bindPopup("Posizione corrente fissata")
    .openPopup();
  map.flyTo(ll, 17);
}
const Locate = L.Control.extend({
  options: { position: "topright" },
  onAdd() {
    const b = L.DomUtil.create("button", "leaflet-bar locate-btn");
    b.title = "Fissa la mia posizione";
    b.setAttribute("aria-label", "Fissa la mia posizione");
    b.innerHTML = "◎";
    L.DomEvent.disableClickPropagation(b);
    L.DomEvent.on(b, "click", () =>
      navigator.geolocation
        ? navigator.geolocation.getCurrentPosition(
            fixLocation,
            () => alert("Posizione non disponibile"),
            { enableHighAccuracy: true, timeout: 10000 },
          )
        : alert("Geolocalizzazione non supportata"),
    );
    return b;
  },
});
map.addControl(new Locate());
let measure = false,
  pts = [],
  draw = [];
const Measure = L.Control.extend({
  options: { position: "topright" },
  onAdd() {
    const b = L.DomUtil.create("button", "leaflet-bar measure-btn");
    b.title = "Misura distanza";
    b.innerHTML = "↔";
    L.DomEvent.disableClickPropagation(b);
    L.DomEvent.on(b, "click", () => {
      measure = !measure;
      b.classList.toggle("active", measure);
      map.getContainer().style.cursor = measure ? "crosshair" : "";
      if (!measure) {
        draw.forEach((x) => map.removeLayer(x));
        draw = [];
        pts = [];
        document.getElementById("measure-result").classList.add("hidden");
      }
    });
    return b;
  },
});
map.addControl(new Measure());
map.on("click", (e) => {
  if (!measure) return;
  if (pts.length === 2) {
    draw.forEach((x) => map.removeLayer(x));
    draw = [];
    pts = [];
  }
  pts.push(e.latlng);
  draw.push(
    L.circleMarker(e.latlng, {
      radius: 5,
      color: "#fff",
      fillColor: "#ff7700",
      fillOpacity: 1,
    }).addTo(map),
  );
  if (pts.length === 2) {
    draw.push(
      L.polyline(pts, { color: "#ff7700", weight: 3, dashArray: "7 5" }).addTo(
        map,
      ),
    );
    const d = pts[0].distanceTo(pts[1]),
      el = document.getElementById("measure-result");
    el.textContent =
      d > 1000 ? `${(d / 1000).toFixed(3)} km` : `${Math.round(d)} m`;
    el.classList.remove("hidden");
  }
});
let map3d = null,
  is3d = false;
const MAP3D_LAYER_GROUPS = {
  Sostegni: ["3d-tower-symbol", "3d-tower-label"],
  "Asse della linea": ["3d-axis"],
  "Vani con attese": ["3d-waits-line", "3d-waits-label"],
  "Buffer operativo 400 m": ["3d-buffer-fill", "3d-buffer-line"],
  "Accessi temporanei": ["3d-access"],
  "Strade temporanee 3,5 m": ["3d-temp-fill", "3d-temp-line"],
  "Aree argano e freno": ["3d-machine-fill", "3d-machine-line"],
  "Habitat Natura 2000": ["3d-habitat-fill", "3d-habitat-line"],
  "Pericolosità alluvionale": ["3d-flood-fill", "3d-flood-line"],
  "Particelle catastali": ["3d-parcels"],
  "Fabbricati catastali": ["3d-buildings-fill", "3d-buildings-line"],
  "Rete viaria": ["3d-roads"],
  "Magazzino Terna": ["3d-warehouse-symbol", "3d-warehouse-label"],
};
function add3dGeoSource(id, path) {
  map3d.addSource(id, { type: "geojson", data: `data/${path}` });
}
function add3dLine(id, source, color, width = 2, dash) {
  map3d.addLayer({
    id,
    type: "line",
    source,
    paint: {
      "line-color": color,
      "line-width": width,
      ...(dash ? { "line-dasharray": dash } : {}),
    },
  });
}
function add3dFill(id, source, color, opacity = 0.3) {
  map3d.addLayer({
    id,
    type: "fill",
    source,
    paint: { "fill-color": color, "fill-opacity": opacity },
  });
}
function init3d() {
  if (map3d) return;
  const c = map.getCenter();
  document.getElementById("terrain-status").classList.remove("hidden");
  map3d = new maplibregl.Map({
    container: "map3d",
    center: [c.lng, c.lat],
    zoom: Math.max(map.getZoom() - 1, 9),
    pitch: 62,
    bearing: -18,
    maxPitch: 85,
    hash: false,
    style: {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        satellite: {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: "Esri World Imagery",
        },
        terrain: {
          type: "raster-dem",
          url: "https://tiles.mapterhorn.com/tilejson.json",
          tileSize: 512,
        },
      },
      layers: [{ id: "satellite", type: "raster", source: "satellite" }],
      terrain: { source: "terrain", exaggeration: 1.25 },
      sky: {
        "sky-color": "#9fc5e8",
        "sky-horizon-blend": 0.35,
        "horizon-color": "#dce8f2",
        "fog-color": "#dce8f2",
      },
    },
  });
  map3d.addControl(
    new maplibregl.NavigationControl({ visualizePitch: true }),
    "top-right",
  );
  map3d.addControl(new maplibregl.FullscreenControl(), "top-right");
  map3d.addControl(
    new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showAccuracyCircle: true,
    }),
    "top-right",
  );
  let measure3dActive = false,
    measure3dPts = [];
  map3d.addControl(
    {
      onAdd() {
        const box = document.createElement("div");
        box.className = "maplibregl-ctrl maplibregl-ctrl-group";
        const b = document.createElement("button");
        b.className = "measure3d-btn";
        b.type = "button";
        b.title = "Misura distanza sul terreno";
        b.textContent = "↔";
        b.onclick = () => {
          measure3dActive = !measure3dActive;
          b.classList.toggle("active", measure3dActive);
          map3d.getCanvas().style.cursor = measure3dActive ? "crosshair" : "";
          if (!measure3dActive) {
            measure3dPts = [];
            map3d
              .getSource("measure3d")
              ?.setData({ type: "FeatureCollection", features: [] });
            document.getElementById("measure-result").classList.add("hidden");
          }
        };
        box.appendChild(b);
        return box;
      },
      onRemove() {},
    },
    "top-right",
  );
  map3d.on("load", () => {
    map3d.addSource("measure3d", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map3d.addLayer({
      id: "measure3d-line",
      type: "line",
      source: "measure3d",
      paint: {
        "line-color": "#ff7700",
        "line-width": 3,
        "line-dasharray": [2, 2],
      },
    });
    map3d.addLayer({
      id: "measure3d-points",
      type: "circle",
      source: "measure3d",
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ff7700",
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2,
      },
    });
    add3dGeoSource("buffer", "linea/buffer_400m.geojson");
    add3dFill("3d-buffer-fill", "buffer", "#ffd400", 0.07);
    add3dLine("3d-buffer-line", "buffer", "#ffd400", 1, [3, 3]);
    add3dGeoSource("axis", "linea/ejes_linea.geojson");
    add3dLine("3d-axis", "axis", "#e63030", 4);
    add3dGeoSource("waits", "linea/vani_attese.geojson");
    add3dLine("3d-waits-line", "waits", "#f4c542", 8);
    map3d.addLayer({id:"3d-waits-label",type:"symbol",source:"waits",layout:{"symbol-placement":"line-center","text-field":["concat",["to-string",["get","numero_sfere"]]," sfere"],"text-size":12,"text-allow-overlap":true},paint:{"text-color":"#111827","text-halo-color":"#f4c542","text-halo-width":4}});
    add3dGeoSource("access", "wbk/accessi_temporanei.geojson");
    add3dLine("3d-access", "access", "#00b7d9", 4);
    add3dGeoSource("temp", "wbk/strade_temporanee_3_5m.geojson");
    add3dFill("3d-temp-fill", "temp", "#00d9ff", 0.45);
    add3dLine("3d-temp-line", "temp", "#007d9b", 1.5);
    add3dGeoSource("machine", "wbk/aree_macchine.geojson");
    add3dFill("3d-machine-fill", "machine", "#e000e0", 0.5);
    add3dLine("3d-machine-line", "machine", "#680068", 2);
    add3dGeoSource("habitat", "environment/habitat_natura2000.geojson");
    add3dFill("3d-habitat-fill", "habitat", "#9b59b6", 0.3);
    add3dLine("3d-habitat-line", "habitat", "#8e44ad", 2);
    add3dGeoSource("flood", "environment/pericolosita_alluvione.geojson");
    add3dFill("3d-flood-fill", "flood", "#3f88c5", 0.3);
    add3dLine("3d-flood-line", "flood", "#1769a6", 1);
    add3dGeoSource("roads", "infrastructure/red_viaria.geojson");
    add3dLine("3d-roads", "roads", "#ff9f1c", 2);
    add3dGeoSource("warehouse", "infrastructure/magazzino_terna.geojson");
    map3d.addLayer({
      id: "3d-warehouse-symbol",
      type: "circle",
      source: "warehouse",
      paint: {
        "circle-radius": 11,
        "circle-color": "#1f2937",
        "circle-stroke-color": "#f59e0b",
        "circle-stroke-width": 3,
      },
    });
    map3d.addLayer({
      id: "3d-warehouse-label",
      type: "symbol",
      source: "warehouse",
      layout: {
        "text-field": "MAGAZZINO TERNA",
        "text-size": 11,
        "text-offset": [0, 1.8],
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#16213e",
        "text-halo-width": 2,
      },
    });
    add3dGeoSource("buildings", "catasto/fabbricati.geojson");
    add3dFill("3d-buildings-fill", "buildings", "#50b5ff", 0.08);
    add3dLine("3d-buildings-line", "buildings", "#50b5ff", 1);
    add3dGeoSource("parcels", "catasto/parcelle.geojson");
    add3dLine("3d-parcels", "parcels", "#f47c00", 1);
    add3dGeoSource("towers", "linea/apoyos.geojson");
    map3d.addLayer({
      id: "3d-tower-symbol",
      type: "symbol",
      source: "towers",
      layout: {
        "text-field": "■",
        "text-size": 18,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": [
          "case",
          ["==", ["get", "tipo"], "AMARRO"],
          "#e11928",
          "#ffffff",
        ],
        "text-halo-color": "#263746",
        "text-halo-width": 1.5,
      },
    });
    map3d.addLayer({
      id: "3d-tower-label",
      type: "symbol",
      source: "towers",
      minzoom: 13,
      layout: {
        "text-field": ["to-string", ["get", "torre_id"]],
        "text-size": 11,
        "text-offset": [0, 1.45],
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "#16213e",
        "text-halo-width": 2,
      },
    });
    Object.entries(MAP3D_LAYER_GROUPS).forEach(([name, ids]) => {
      const checked = document.querySelector(`[data-layer="${name}"]`)?.checked;
      ids.forEach(
        (id) =>
          map3d.getLayer(id) &&
          map3d.setLayoutProperty(
            id,
            "visibility",
            checked ? "visible" : "none",
          ),
      );
    });
    document.getElementById("terrain-status").classList.add("hidden");
  });
  map3d.on("mousemove", (e) => {
    const u = wgs84ToUtm32(e.lngLat.lat, e.lngLat.lng);
    document.getElementById("coords-bar").innerHTML =
      `Lat: ${e.lngLat.lat.toFixed(5)} &nbsp; Lng: ${e.lngLat.lng.toFixed(5)} &nbsp; | &nbsp; UTM32N EPSG:25832 E: ${u.e.toFixed(1)} &nbsp; N: ${u.n.toFixed(1)}`;
  });
  map3d.on("click", (e) => {
    if (!measure3dActive) return;
    if (measure3dPts.length === 2) measure3dPts = [];
    measure3dPts.push([e.lngLat.lng, e.lngLat.lat]);
    const features = measure3dPts.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: p },
      properties: {},
    }));
    if (measure3dPts.length === 2) {
      features.push({
        type: "Feature",
        geometry: { type: "LineString", coordinates: measure3dPts },
        properties: {},
      });
      const a = measure3dPts[0],
        b = measure3dPts[1],
        r = 6371000,
        dlat = ((b[1] - a[1]) * Math.PI) / 180,
        dlon = ((b[0] - a[0]) * Math.PI) / 180,
        q =
          Math.sin(dlat / 2) ** 2 +
          Math.cos((a[1] * Math.PI) / 180) *
            Math.cos((b[1] * Math.PI) / 180) *
            Math.sin(dlon / 2) ** 2,
        d = 2 * r * Math.asin(Math.sqrt(q)),
        el = document.getElementById("measure-result");
      el.textContent =
        d >= 1000 ? `${(d / 1000).toFixed(3)} km` : `${Math.round(d)} m`;
      el.classList.remove("hidden");
    }
    map3d
      .getSource("measure3d")
      .setData({ type: "FeatureCollection", features });
  });
  map3d.on("click", "3d-tower-symbol", (e) => {
    if (measure3dActive) return;
    const f = e.features?.[0];
    if (!f) return;
    new maplibregl.Popup({ maxWidth: "300px" })
      .setLngLat(e.lngLat)
      .setHTML(
        towerPopup(
          { properties: f.properties },
          { lat: e.lngLat.lat, lng: e.lngLat.lng },
        ),
      )
      .addTo(map3d);
  });
  map3d.on("click", "3d-warehouse-symbol", (e) => {
    if (measure3dActive) return;
    const p = e.features?.[0]?.properties || {};
    new maplibregl.Popup({ maxWidth: "310px" })
      .setLngLat(e.lngLat)
      .setHTML(
        `<div class="popup-title">${safe(p.name)}</div><div class="popup-grid"><b>Indirizzo</b><span>${safe(p.address)}</span></div><a class="maps-link" target="_blank" href="${nav(e.lngLat.lat, e.lngLat.lng)}">Apri navigazione</a>`,
      )
      .addTo(map3d);
  });
  map3d.on("mouseenter", "3d-tower-symbol", () => {
    if (!measure3dActive) map3d.getCanvas().style.cursor = "pointer";
  });
  map3d.on("mouseleave", "3d-tower-symbol", () => {
    if (!measure3dActive) map3d.getCanvas().style.cursor = "";
  });
}
function toggle3d() {
  is3d = !is3d;
  const btn = document.getElementById("btn-view-3d");
  btn.classList.toggle("active", is3d);
  btn.innerHTML = is3d ? "<span>▱</span> Vista 2D" : "<span>◭</span> Vista 3D";
  document.getElementById("map").style.display = is3d ? "none" : "";
  document.getElementById("map3d").classList.toggle("map3d-hidden", !is3d);
  if (is3d) {
    init3d();
    setTimeout(() => map3d?.resize(), 50);
  } else {
    if (map3d) {
      const c = map3d.getCenter();
      map.setView([c.lat, c.lng], Math.max(map3d.getZoom() + 1, 8));
    }
    setTimeout(() => map.invalidateSize(), 50);
  }
}
document.getElementById("btn-view-3d").addEventListener("click", toggle3d);
document.getElementById("search-btn").onclick = searchTower;
document.getElementById("tower-search").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchTower();
});
init().then(() => {
  if (new URLSearchParams(location.search).get("view") === "3d") toggle3d();
});
