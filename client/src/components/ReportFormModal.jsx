import { useState, useEffect } from "react";
import { createReport } from "../services/api";
import useDogCatModel from "../ml/useDogCatModel";

const IA_THRESHOLD = 0.7; // confianza mínima para aceptar

function ReportFormModal({ show, onClose, onReportCreated }) {
  const [especie, setEspecie] = useState("");
  const [comentario, setComentario] = useState("");
  const [fotos, setFotos] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [ubicacion, setUbicacion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // IA
  const { ready: iaReady, error: iaError, classifyFile } = useDogCatModel(true);
  const [iaSuggestion, setIaSuggestion] = useState(null); // {label, confidence}
  const [iaChecking, setIaChecking] = useState(false);

  // ----------- Geolocalización ------------
  useEffect(() => {
    if (show) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUbicacion({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => setUbicacion(null)
      );
    }
  }, [show]);

  // ----------- Limpiar previews / IA -----------
  useEffect(() => {
    if (!show) {
      setFotos([]);
      setPreviewUrls([]);
      setIaSuggestion(null);
      setIaChecking(false);
    }
  }, [show]);

  // ----------- ESC para cerrar modal ---------
  useEffect(() => {
    if (!show && !showThankYou && !errorMessage) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (errorMessage) setErrorMessage("");
        else if (showThankYou) setShowThankYou(false);
        else if (show) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, showThankYou, errorMessage, onClose]);

  // ----------- Preview de fotos + IA rápida ------------
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 1);
    setFotos(files);

    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(previews);

    setIaSuggestion(null);
    if (files[0] && iaReady) {
      setIaChecking(true);
      try {
        const res = await classifyFile(files[0]);
        setIaSuggestion(res); // puede ser null si no detecta perro/gato
      } catch (err) {
        console.error("IA classify error:", err);
        setIaSuggestion(null);
      } finally {
        setIaChecking(false);
      }
    }
  };

  // ----------- Envío del formulario ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!especie || !comentario.trim() || fotos.length === 0 || !ubicacion) {
      setErrorMessage(
        "Por favor completa todos los campos y selecciona al menos una foto."
      );
      return;
    }

    // Validación IA (obligatoria si carga OK)
    try {
      if (iaReady) {
        setIaChecking(true);
        const res = iaSuggestion ?? (await classifyFile(fotos[0]));
        setIaSuggestion(res);

        // 1) No detecta perro/gato
        if (!res) {
          setErrorMessage(
            "La IA no detectó perro o gato en la foto. Vuelve a tomar la foto enfocando claramente al animal."
          );
          setIaChecking(false);
          return;
        }

        // 2) Confianza insuficiente
        if ((res.confidence ?? 0) < IA_THRESHOLD) {
          setErrorMessage(
            `Confianza insuficiente (${Math.round((res.confidence ?? 0) * 100)}%). Vuelve a tomar la foto más clara.`
          );
          setIaChecking(false);
          return;
        }

        // 3) La IA no coincide con la especie elegida
        if (res.label !== especie) {
          setErrorMessage(
            `La IA sugiere “${res.label}” con ${Math.round(
              (res.confidence ?? 0) * 100
            )}% de confianza. Corrige la especie para enviar.`
          );
          setIaChecking(false);
          return;
        }
      }
    } catch (err) {
      console.error("Validación IA falló:", err);
      setErrorMessage("No se pudo validar la foto con IA. Intenta nuevamente.");
      setIaChecking(false);
      return;
    }

    setIaChecking(false);
    setLoading(true);

    try {
      await createReport({
        especie,
        comentarios: comentario,
        fotos,
        ubicacion,
      });

      if (onReportCreated) onReportCreated();

      setEspecie("");
      setComentario("");
      setFotos([]);
      setPreviewUrls([]);
      setIaSuggestion(null);
      setShowThankYou(true);

      setTimeout(() => {
        setShowThankYou(false);
        onClose();
      }, 2000);
    } catch (err) {
      if (err?.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage("Error al enviar el reporte.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Si no hay nada que mostrar, return null ---
  if (!show && !showThankYou && !errorMessage) return null;

  return (
    <>
      {/* Fondo y modal principal */}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm"
        style={{ display: show && !showThankYou && !errorMessage ? "flex" : "none" }}
      >
        {/* Modal principal */}
        <form
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 px-6 py-7 animate-fade-in"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
        >
          {/* Cabecera */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-blue-700">Nuevo Reporte</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-red-400 text-2xl font-bold"
              disabled={loading || iaChecking}
              aria-label="Cerrar modal"
            >
              ×
            </button>
          </div>

          {/* Cuerpo */}
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Especie
              </label>
              <select
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none px-3 py-2"
                required
                disabled={loading || iaChecking}
              >
                <option value="">Seleccionar</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario
              </label>
              <textarea
                rows={3}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:outline-none px-3 py-2 resize-none"
                required
                disabled={loading || iaChecking}
                maxLength={300}
                placeholder="Ej: Dónde se encuentra, descripción, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto
              </label>
              <div className="text-xs text-blue-600 mb-2 font-medium">
                *Por favor, toma la foto del animal en este instante.<br />
                *No se permite usar imágenes de la galería.
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="block w-full rounded-lg border border-gray-300 cursor-pointer file:bg-blue-600 file:text-white file:rounded-lg file:px-4 file:py-2 file:mr-3 file:font-semibold hover:file:bg-blue-700"
                required
                disabled={loading || iaChecking}
              />

              {/* Preview */}
              {previewUrls.length > 0 && (
                <div className="flex gap-3 mt-3 flex-wrap items-start">
                  {previewUrls.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`preview-${i}`}
                      className="w-20 h-20 object-cover rounded-lg border border-blue-200 shadow"
                    />
                  ))}
                  {/* Estado IA */}
                  <div className="text-xs text-slate-600">
                    {iaChecking && <span>Analizando imagen…</span>}
                    {!iaChecking && iaSuggestion && (
                      <div className="font-medium">
                        Sugerencia IA:{" "}
                        <span className="text-blue-700">
                          {iaSuggestion.label}
                        </span>{" "}
                        ({Math.round((iaSuggestion.confidence ?? 0) * 100)}%)
                      </div>
                    )}
                    {!iaChecking && iaSuggestion === null && fotos.length > 0 && iaReady && (
                      <div className="text-red-600">
                        No se detectó perro o gato. Toma otra foto más cercana.
                      </div>
                    )}
                    {!iaReady && !iaError && (
                      <div className="opacity-60">Cargando IA…</div>
                    )}
                    {iaError && <div className="text-red-600">{iaError}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 mt-7">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || iaChecking}
              className="px-5 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || iaChecking}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow transition flex items-center gap-2 disabled:opacity-60"
            >
              {(loading || iaChecking) && (
                <svg className="animate-spin w-5 h-5 text-white" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 01-8 8z"
                  />
                </svg>
              )}
              {loading || iaChecking ? "Validando…" : "Enviar Reporte"}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL de error */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-8 max-w-xs w-full mx-4 text-center">
            <div className="mx-auto mb-3">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#e53935" />
                <path
                  d="M8 8l8 8M8 16L16 8"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-red-600 mb-2">
              {errorMessage}
            </div>
            <button
              className="mt-3 px-4 py-2 rounded-lg border border-red-300 text-red-600 font-semibold bg-red-50 hover:bg-red-100 transition"
              onClick={() => setErrorMessage("")}
              type="button"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL de "gracias" */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-8 max-w-xs w-full mx-4 text-center">
            <div className="mx-auto mb-3">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#43a047" />
                <path
                  d="M7 13l3 3 7-7"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-2">
              ¡Gracias por tu reporte!
            </div>
            <div className="text-gray-700">
              Tu ayuda es muy valiosa para los animales vulnerables.
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ReportFormModal;
