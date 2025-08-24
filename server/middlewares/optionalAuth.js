// server/middlewares/optionalAuth.js
const jwt = require("jsonwebtoken");

module.exports = function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "clave-supersecreta");
    req.user = decoded; // { userId, role }
  } catch (_e) {
    // ignoramos errores de token para no bloquear la petición pública
  }
  next();
};
