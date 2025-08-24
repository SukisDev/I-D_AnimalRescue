// client/src/pages/admin/Dashboard.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { getReports } from "../../services/api";
import AdminMap from "../../components/admin/AdminMap";

const normArr = (resp) => (Array.isArray(resp?.data) ? resp.data : []);
const totalOf = (resp) => Number(resp?.pagination?.total || 0);

export default function Dashboard() {
  const [mapFilter, setMapFilter] = useState("pendiente"); // pendiente | resuelto | todos
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [totalsCache, setTotalsCache] = useState({
    total: 0,
    pendientes: 0,
    resueltos: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pend, res, canc] = await Promise.all([
        getReports("pendiente"),
        getReports("resuelto"),
        getReports("cancelado"),
      ]);

      const p = normArr(pend);
      const r = normArr(res);
      const c = normArr(canc);
      setAllReports([...p, ...r, ...c]);

      setTotalsCache({
        total: totalOf(pend) + totalOf(res) + totalOf(canc),
        pendientes: totalOf(pend),
        resueltos: totalOf(res),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const fallbackTotal = allReports.length;
    const fallbackResueltos = allReports.filter((x) => x.estado === "resuelto").length;
    const fallbackPendientes = allReports.filter((x) => x.estado === "pendiente").length;

    return {
      total: totalsCache.total || fallbackTotal,
      pendientes: totalsCache.pendientes || fallbackPendientes,
      resueltos: totalsCache.resueltos || fallbackResueltos,
    };
  }, [allReports, totalsCache]);

  const mapReports = useMemo(() => {
    if (mapFilter === "todos") return allReports;
    if (mapFilter === "resuelto") return allReports.filter((x) => x.estado === "resuelto");
    return allReports.filter((x) => x.estado === "pendiente");
  }, [allReports, mapFilter]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Reportes totales" value={totals.total} />
        <Card title="Pendientes" value={totals.pendientes} />
        <Card title="Resueltos" value={totals.resueltos} />

        {/* Solo el filtro; botón de heatmap se elimina de aquí */}
        <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
          <label className="sr-only" htmlFor="mapFilter">Filtro del mapa</label>
          <select
            id="mapFilter"
            className="rounded-lg border px-3 py-2 w-full"
            value={mapFilter}
            onChange={(e) => setMapFilter(e.target.value)}
            title="Filtro del mapa"
          >
            <option value="pendiente">Pendientes</option>
            <option value="resuelto">Resueltos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-3">
        {/* AdminMap maneja su propio toggle de heatmap dentro del mapa */}
        <AdminMap reports={mapReports} />
        {loading && <div className="p-3 text-sm text-slate-600">Cargando mapa…</div>}
      </div>
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}
