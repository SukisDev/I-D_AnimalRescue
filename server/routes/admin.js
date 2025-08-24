// server/routes/admin.js
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/requireAuth');
const { requireAdmin, requireSuperAdmin } = require('../middlewares/requireRole');
const ctrl = require('../controllers/adminController');

// Listar usuarios (admin o superadmin)
router.get('/users', verifyToken, requireAdmin, ctrl.listUsers);

// Crear admin (solo superadmin)
router.post('/users/admin', verifyToken, requireSuperAdmin, ctrl.createAdmin);

// Cambiar rol (solo superadmin)
router.patch('/users/:id/role', verifyToken, requireSuperAdmin, ctrl.updateUserRole);

module.exports = router;
