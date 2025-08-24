// client/src/components/admin/AdminMap.jsx
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { fileUrl } from "../../services/api"; // para resolver /uploads/ correctamente

mapboxgl.accessToken =
  "pk.eyJ1Ijoic3VraXBobyIsImEiOiJjbWF4ZXVreGowbnY0MmxteWN2cTZ6NzlsIn0.RyIp8zlJpwlynbUembs95g";

export default function AdminMap({
  reports = [],
  heatmap,                 // opcional (modo controlado)
  onToggleHeatmap,         // opcional (modo controlado)
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // Soporte controlado/no controlado
  const isControlled = typeof onToggleHeatmap === "function";
  const [innerHeat, setInnerHeat] = useState(false);
  const heat = isControlled ? !!heatmap : innerHeat;
  const toggleHeat = isControlled ? onToggleHeatmap : () => setInnerHeat((v) => !v);

  // Init del mapa (una sola vez)
  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-80.9831, 8.1001],
      zoom: 12.5,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      // limpieza total
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map.getLayer("heatmap-layer")) map.removeLayer("heatmap-layer");
      if (map.getSource("heatmap-source")) map.removeSource("heatmap-source");
      map.remove();
    };
  }, []);

  // Render de marcadores / heatmap (esperando a que cargue el estilo)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const render = () => {
      // limpiar estado anterior
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (map.getLayer("heatmap-layer")) map.removeLayer("heatmap-layer");
      if (map.getSource("heatmap-source")) map.removeSource("heatmap-source");

      if (heat) {
        const features = (Array.isArray(reports) ? reports : [])
          .filter(
            (r) =>
              r?.ubicacion &&
              Number.isFinite(r.ubicacion.lng) &&
              Number.isFinite(r.ubicacion.lat)
          )
          .map((r) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [r.ubicacion.lng, r.ubicacion.lat],
            },
          }));

        map.addSource("heatmap-source", {
          type: "geojson",
          data: { type: "FeatureCollection", features },
        });

        map.addLayer({
          id: "heatmap-layer",
          type: "heatmap",
          source: "heatmap-source",
          paint: {
            "heatmap-weight": 1,
            "heatmap-intensity": 1.2,
            "heatmap-radius": 35,
            "heatmap-opacity": 0.85,
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0, "rgba(0,0,0,0)",
              0.2, "rgba(173, 255, 47, 0.4)",
              0.4, "rgba(255, 255, 0, 0.6)",
              0.6, "rgba(255, 165, 0, 0.8)",
              0.9, "rgba(255, 0, 0, 0.95)",
            ],
          },
        });
        return;
      }

      // Marcadores con popup simple
      (Array.isArray(reports) ? reports : []).forEach((r) => {
        const c = r?.ubicacion;
        if (!c || !Number.isFinite(c.lng) || !Number.isFinite(c.lat)) return;

        const html = document.createElement("div");
        html.className = "p-1";
        const foto = Array.isArray(r.fotos) && r.fotos[0] ? fileUrl(r.fotos[0]) : null;
        html.innerHTML = `
          <div class="font-semibold text-blue-900 text-sm mb-1">${r.especie || "Reporte"}</div>
          <div class="mb-1 text-gray-600 text-xs">${(r.comentarios?.[0] || "Sin comentario")
            .toString()
            .slice(0, 200)}</div>
          ${foto ? `<img src="${foto}" class="max-w-[120px] rounded shadow" />` : ""}
        `;

        const popup = new mapboxgl.Popup({ closeButton: true }).setDOMContent(html);

        const marker = new mapboxgl.Marker()
          .setLngLat([c.lng, c.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      });
    };

    if (!map.isStyleLoaded()) {
      map.once("load", render);
    } else {
      render();
    }
  }, [reports, heat]);

  return (
    <div className="relative rounded-2xl overflow-hidden">
      <div ref={mapContainer} className="w-full h-[60vh]" />
      {/* Botón flotante único (dentro del mapa) */}
      <button
        type="button"
        onClick={toggleHeat}
        className={`absolute bottom-4 right-4 z-20 rounded-full shadow-lg px-4 py-3 text-sm font-semibold
          ${heat ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
        title={heat ? "Ver marcadores" : "Ver mapa de calor"}
      >
        {heat ? "Marcadores" : "Mapa de calor"}
      </button>
    </div>
  );
}
