import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ReportFormModal from "./ReportFormModal";

mapboxgl.accessToken = "pk.eyJ1Ijoic3VraXBobyIsImEiOiJjbWF4ZXVreGowbnY0MmxteWN2cTZ6NzlsIn0.RyIp8zlJpwlynbUembs95g";

function MapView({ reports, onReportUpdated, onBackToLanding }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-80.9831, 8.1001],
      zoom: 13,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    const geoLocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true,
    });
    map.addControl(geoLocate, "top-right");
    geoLocate.on("geolocate", (e) => {
      map.flyTo({
        center: [e.coords.longitude, e.coords.latitude],
        zoom: 14,
      });
    });
    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    ["heatmap-layer", "heatmap-source"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    if (showHeatmap) {
      const heatmapFeatures = reports
        .filter(
          (r) =>
            r.ubicacion &&
            isFinite(r.ubicacion.lng) &&
            isFinite(r.ubicacion.lat)
        )
        .map((r) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [r.ubicacion.lng, r.ubicacion.lat],
          },
        }));

      const geojson = {
        type: "FeatureCollection",
        features: heatmapFeatures,
      };

      map.addSource("heatmap-source", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "heatmap-layer",
        type: "heatmap",
        source: "heatmap-source",
        paint: {
          "heatmap-weight": 1,
          "heatmap-intensity": 1.2,
          "heatmap-radius": 35,
          "heatmap-opacity": 0.8,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(0, 255, 0, 0)",
            0.2,
            "rgba(173, 255, 47, 0.4)",
            0.4,
            "rgba(255, 255, 0, 0.6)",
            0.6,
            "rgba(255, 165, 0, 0.8)",
            0.9,
            "rgba(255, 0, 0, 0.9)",
          ],
        },
      });
    } else {
      reports.forEach((report) => {
        const coords = report.ubicacion;
        if (
          coords &&
          typeof coords.lng === "number" &&
          typeof coords.lat === "number" &&
          isFinite(coords.lng) &&
          isFinite(coords.lat)
        ) {
          const el = document.createElement("div");
          el.style.cursor = "pointer";
          el.innerHTML = `
            <div class="font-semibold text-blue-900 text-base mb-1">
              ${report.especie}
            </div>
            <div class="mb-2 text-gray-600 text-xs">
              ${report.comentarios?.[0] || "Sin comentario"}
            </div>
            ${
              report.fotos?.[0]
                ? `<img src="http://localhost:5000/uploads/${report.fotos[0]}"
                   class="max-w-[100px] rounded-lg mb-2 shadow" />`
                : ""
            }
            ${
              report.estado === "resuelto"
                ? "<p class='text-green-600 text-xs font-medium flex items-center gap-1 m-0'>✅ Resuelto</p>"
                : ""
            }
          `;
          const popup = new mapboxgl.Popup().setDOMContent(el);

          const marker = new mapboxgl.Marker()
            .setLngLat([coords.lng, coords.lat])
            .setPopup(popup)
            .addTo(map);

          markersRef.current.push(marker);
        }
      });
    }
  }, [reports, showHeatmap, onReportUpdated]);

  // Ajusta aquí la altura del navbar. Si tu navbar es más alto, aumenta el padding-top.
  return (
    <div className="relative flex-1 flex flex-col min-h-screen pt-[90px]">
      {/* Botón de volver */}
      <div className="fixed z-40 left-5 top-[90px] md:top-[90px]">
        <button
          className="px-6 py-3 bg-white rounded-full shadow-md text-blue-700 font-semibold hover:bg-blue-50 border border-blue-100 flex items-center gap-2"
          onClick={onBackToLanding}
        >
          <span className="text-xl">&larr;</span> Volver al inicio
        </button>
      </div>

      {/* Botón mapa de calor */}
      <div className="flex justify-center mt-3 mb-2 z-10">
        <button
          onClick={() => setShowHeatmap((v) => !v)}
          className={`px-7 py-2 rounded-xl font-semibold shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300
            ${showHeatmap
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
        >
          {showHeatmap ? "Mostrar marcadores" : "Mostrar mapa de calor"}
        </button>
      </div>

      {/* Mapa */}
      <main className="flex flex-col items-center justify-center px-2 min-h-[70vh]">
        <section className="w-full max-w-4xl flex flex-col gap-4">
          <div className="rounded-2xl shadow-xl overflow-hidden bg-white/90 border border-blue-100 relative min-h-[60vh]">
            <div
              ref={mapContainer}
              className="w-full h-[60vh] rounded-2xl overflow-hidden"
            />
            {/* Botón flotante para nuevo reporte */}
            <button
              className="absolute z-20 bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-blue-700 to-blue-400 shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-150 active:scale-100 focus:outline-none"
              onClick={() => setShowForm(true)}
              title="Reportar animal vulnerable"
            >
              {/* Icono de patita */}
              <svg
                width="36"
                height="36"
                viewBox="0 0 48.839 48.839"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g>
                  <path
                    style={{ fill: "#fff" }}
                    d="M39.041,36.843c2.054,3.234,3.022,4.951,3.022,6.742c0,3.537-2.627,5.252-6.166,5.252
                    c-1.56,0-2.567-0.002-5.112-1.326c0,0-1.649-1.509-5.508-1.354c-3.895-0.154-5.545,1.373-5.545,1.373
                    c-2.545,1.323-3.516,1.309-5.074,1.309c-3.539,0-6.168-1.713-6.168-5.252c0-1.791,0.971-3.506,3.024-6.742
                    c0,0,3.881-6.445,7.244-9.477c2.43-2.188,5.973-2.18,5.973-2.18h1.093v-0.001c0,0,3.698-0.009,5.976,2.181
                    C35.059,30.51,39.041,36.844,39.041,36.843z M16.631,20.878c3.7,0,6.699-4.674,6.699-10.439S20.331,0,16.631,0
                    S9.932,4.674,9.932,10.439S12.931,20.878,16.631,20.878z M10.211,30.988c2.727-1.259,3.349-5.723,1.388-9.971
                    s-5.761-6.672-8.488-5.414s-3.348,5.723-1.388,9.971C3.684,29.822,7.484,32.245,10.211,30.988z M32.206,20.878
                    c3.7,0,6.7-4.674,6.7-10.439S35.906,0,32.206,0s-6.699,4.674-6.699,10.439C25.507,16.204,28.506,20.878,32.206,20.878z
                    M45.727,15.602c-2.728-1.259-6.527,1.165-8.488,5.414s-1.339,8.713,1.389,9.972c2.728,1.258,6.527-1.166,8.488-5.414
                    S48.455,16.861,45.727,15.602z"
                  />
                </g>
              </svg>
            </button>
          </div>
        </section>
      </main>

      <ReportFormModal
        show={showForm}
        onClose={() => setShowForm(false)}
        onReportCreated={onReportUpdated}
      />
    </div>
  );
}

export default MapView;
