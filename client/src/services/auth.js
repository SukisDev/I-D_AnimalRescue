// client/src/services/auth.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
});

// Inyectar token automáticamente si existe
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("ar_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Iniciar sesión
export const login = (email, password) =>
  API.post("/auth/login", { email, password }).then((r) => r.data);

// Obtener datos del usuario logueado
export const getMe = () =>
  API.get("/auth/me").then((r) => r.data);

// Crear un nuevo administrador (solo superadmin)
export const createAdmin = (payload) =>
  API.post("/admin/users/admin", payload).then((r) => r.data);

// Listar usuarios (solo admin/superadmin)
export const listUsers = (params = {}) =>
  API.get("/admin/users", { params }).then((r) => r.data);

// Cambiar el rol de un usuario (solo superadmin)
export const updateUserRole = (userId, role) =>
  API.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data);
