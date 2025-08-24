// client/src/services/api.js
import axios from "axios";
import { useEffect } from "react";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Inyectar token si existe
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("ar_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Reportes ---
export const getReports = (estado) =>
  API.get("/reports", { params: { estado } }).then((r) => r.data || []);

export const createReport = ({ especie, comentarios, fotos, ubicacion }) => {
  const formData = new FormData();
  formData.append("especie", especie);
  formData.append("comentarios", JSON.stringify([comentarios]));
  formData.append("ubicacion", JSON.stringify(ubicacion));
  fotos.forEach((foto) => formData.append("fotos", foto));
  return API.post("/reports", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// Permite enviar comentario / motivo y el backend decidirá si cierra o cancela
export const patchReport = (id, body = {}) =>
  API.patch(`/reports/${id}/cerrar`, body).then((r) => r.data);

// Si tienes un endpoint separado para cancelar:
export const cancelReport = (id, body = {}) =>
  API.patch(`/reports/${id}/cancelar`, body).then((r) => r.data);

// Custom hook to fetch reports data
// Custom hook to fetch reports data
export const useFetchReports = (setRows) => {
  useEffect(() => {
    API.get("/reports")
      .then((res) => {
        const arr = Array.isArray(res.data?.data) ? res.data.data : [];
        setRows(arr);
      })
      .catch(() => setRows([]));
  }, [setRows]);
};

// --- Helpers para URLs de archivos (uploads) ---
const BASE = API.defaults.baseURL || ""; // p.ej. http://localhost:5000/api
// Quita el sufijo /api para obtener el origen real del server
export const API_ORIGIN = BASE.replace(/\/api\/?$/, "");
export const fileUrl = (name) => {
  if (!name) return "";
  if (/^https?:\/\//i.test(name)) return name; // ya es URL absoluta
  return `${API_ORIGIN}/uploads/${name}`;      // filename -> URL pública
};

// Registro de usuario
export const register = ({ name, email, password }) =>
  API.post("/auth/register", { name, email, password }).then((r) => r.data);
