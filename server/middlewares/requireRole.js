// server/middlewares/requireRole.js
exports.requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ message: 'Acceso solo para administradores' });
  }
  next();
};

exports.requireSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Acceso solo para superadministradores' });
  }
  next();
};