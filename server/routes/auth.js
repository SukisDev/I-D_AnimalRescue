// server/routes/auth.js
const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const { verifyToken, requireAdmin } = require("../middlewares/requireAuth");

// Público
router.post("/register", authController.register);
router.post("/login", authController.login);

// Sesión actual (requiere token)
router.get("/me", verifyToken, authController.me);

// ---------- Endpoints de administración (requieren admin o superadmin) ----------

// Crear un admin (lo puede hacer superadmin; si quieres permitir admin, ajusta requireAdmin)
router.post("/admin/users/admin", verifyToken, requireAdmin, authController.createAdmin);

// Listar usuarios (paginable/filtrable si pasas query params)
router.get("/admin/users", verifyToken, requireAdmin, authController.listUsers);

// Cambiar rol (user | admin)  — no permite escalar a superadmin aquí por seguridad
router.patch("/admin/users/:id/role", verifyToken, requireAdmin, authController.updateUserRole);

// Ban / Unban de usuario
router.patch("/admin/users/:id/ban", verifyToken, requireAdmin, authController.setUserBan);

module.exports = router;
