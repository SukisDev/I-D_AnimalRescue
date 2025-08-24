// client/src/pages/admin/Reports.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { getReports, patchReport, cancelReport } from "../../services/api";
import { fileUrl } from "../../services/api"; // helper para construir /uploads/...

const PAGE_SIZE = 10;
const normRows = (resp) => (Array.isArray(resp?.data) ? resp.data : []);

export default function Reports() {
  const [estado, setEstado] = useState("pendiente"); // pendiente | resuelto | cancelado | todos
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: 'resolver'|'cancelar', id }
  const [imgPreview, setImgPreview] = useState(null); // URL imagen ampliada

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const estadoParam = estado === "todos" ? "" : estado;
      const resp = await getReports(estadoParam); // <- devuelve { data, pagination }
      setRows(normRows(resp));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [estado]);

  useEffect(() => {
    setPage(1); // reset al cambiar filtro
    load();
  }, [estado, load]);

  // Memo para evitar warning del useMemo siguiente
  const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);
  const totalPages = Math.max(1, Math.ceil(safeRows.length / PAGE_SIZE));

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return safeRows.slice(start, start + PAGE_SIZE);
  }, [safeRows, page]);

  const refresh = async () => {
    await load();
  };

  const onResolver = async (id, comentario) => {
    await patchReport(id, { comentario });
    setModal(null);
    await refresh();
  };

  const onCancelar = async (id, comentario) => {
    await cancelReport(id, { comentario });
    setModal(null);
    await refresh();
  };

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow p-4 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-700">Estado:</label>
          <select
            className="rounded-lg border px-3 py-2 w-full sm:w-52"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="pendiente">Pendientes</option>
            <option value="resuelto">Resueltos</option>
            <option value="cancelado">Cancelados</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Mostrando {pageRows.length} de {safeRows.length} registros
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow p-3">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <Th>Especie</Th>
                <Th>Comentario</Th>
                <Th>Foto</Th>
                <Th>Ubicación</Th>
                <Th>Fecha</Th>
                <Th>Reportado por</Th>
                <Th>Resuelto/Cancelado por</Th>
                <Th>Comentario de cierre</Th>
                <Th>Acciones</Th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-4" colSpan={9}>Cargando…</td>
                </tr>
              ) : pageRows.length === 0 ? (
                <tr>
                  <td className="p-4" colSpan={9}>Sin datos</td>
                </tr>
              ) : (
                pageRows.map((r) => {
                  const primerComentario = Array.isArray(r.comentarios)
                    ? r.comentarios[0]
                    : r.comentarios;

                  const hasCoords =
                    r?.ubicacion &&
                    typeof r.ubicacion.lat === "number" &&
                    typeof r.ubicacion.lng === "number";

                  const loc = hasCoords
                    ? `${r.ubicacion.lat.toFixed(5)}, ${r.ubicacion.lng.toFixed(5)}`
                    : "-";

                  const creado = r?.createdAt ? formatDate(r.createdAt) : "-";
                  const creador = r?.creadoPor?.email || r?.creadoPor?.name || "-";

                  const cerradoPor =
                    r.estado === "resuelto"
                      ? r?.resueltoPor?.email || r?.resueltoPor?.name || "-"
                      : r.estado === "cancelado"
                      ? r?.canceladoPor?.email || r?.canceladoPor?.name || "-"
                      : "-";

                  const comentarioCierre =
                    r.estado === "resuelto"
                      ? r?.resueltoComentario || "-"
                      : r.estado === "cancelado"
                      ? r?.canceladoComentario || "-"
                      : "-";

                  const hasFoto = Array.isArray(r.fotos) && r.fotos.length > 0;
                  const fotoSrc = hasFoto ? fileUrl(r.fotos[0]) : "";

                  return (
                    <tr key={r._id} className="border-t align-top">
                      <Td>{r.especie || "-"}</Td>

                      {/* Comentario: legible, sin truncar */}
                      <Td className="max-w-[60ch] whitespace-pre-wrap break-words">
                        {primerComentario || "-"}
                      </Td>

                      {/* Foto: miniatura clickeable */}
                      <Td>
                        {hasFoto ? (
                          <button
                            type="button"
                            title="Ver imagen"
                            onClick={() => setImgPreview(fotoSrc)}
                            className="block"
                          >
                            <img
                              src={fotoSrc}
                              alt="foto del reporte"
                              className="h-14 w-14 rounded border object-cover"
                            />
                          </button>
                        ) : (
                          "-"
                        )}
                      </Td>

                      {/* Ubicación */}
                      <Td className="whitespace-nowrap">{loc}</Td>

                      <Td>{creado}</Td>
                      <Td>{creador}</Td>

                      {/* ⬇️ aquí se USA 'cerradoPor' (se va el warning) */}
                      <Td className="max-w-[40ch] break-words">{cerradoPor}</Td>

                      <Td className="max-w-[40ch] whitespace-pre-wrap break-words">
                        {comentarioCierre}
                      </Td>

                      <Td>
                        {r.estado === "pendiente" ? (
                          <div className="flex gap-2">
                            <button
                              className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setModal({ type: "resolver", id: r._id })}
                            >
                              Resolver
                            </button>
                            <button
                              className="px-2 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => setModal({ type: "cancelar", id: r._id })}
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="mt-4 flex items-center gap-2 justify-center">
          <button
            className="px-3 py-1.5 rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </button>
          <span className="text-sm">Página {page} de {totalPages}</span>
          <button
            className="px-3 py-1.5 rounded border bg-white hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal resolver/cancelar */}
      {modal && (
        <ComentarioModal
          title={modal.type === "resolver" ? "Resolver reporte" : "Cancelar reporte"}
          onClose={() => setModal(null)}
          onConfirm={async (texto) => {
            if (modal.type === "resolver") await onResolver(modal.id, texto);
            else await onCancelar(modal.id, texto);
          }}
        />
      )}

      {/* Modal de previsualización de imagen */}
      {imgPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"
          onClick={() => setImgPreview(null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="bg-white rounded-xl shadow max-w-3xl w-full p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                type="button"
                className="px-2 py-1 text-sm rounded bg-slate-100 hover:bg-slate-200"
                onClick={() => setImgPreview(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="mt-2">
              <img src={imgPreview} alt="Vista ampliada" className="w-full h-auto rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th className="text-left p-3 whitespace-nowrap font-semibold text-slate-700">{children}</th>;
}

function Td({ children, className = "" }) {
  return <td className={`p-3 ${className}`}>{children}</td>;
}

function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "-";
  }
}

function ComentarioModal({ title, onClose, onConfirm }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow max-w-md w-full overflow-hidden">
        <div className="p-4 border-b font-semibold">{title}</div>
        <div className="p-4 space-y-2">
          <label className="text-sm text-slate-600">Comentario (opcional)</label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border rounded p-2 min-h-[120px]"
            placeholder="Escribe un comentario de cierre…"
          />
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button
            className="px-3 py-1.5 rounded border bg-white hover:bg-slate-50"
            onClick={onClose}
            disabled={busy}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm(value);
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            type="button"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
