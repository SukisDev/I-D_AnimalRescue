// server/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "clave-supersecreta";
const TOKEN_EXPIRES = "8h";

function signToken(user) {
  return jwt.sign(
    { userId: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES }
  );
}

// ------------------------------------------------------------------
// Público
// ------------------------------------------------------------------
exports.register = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }
    email = email.toLowerCase();

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "El email ya está registrado" });

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hash, role: "user" });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ message: "Error al registrar usuario" });
  }
};

exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    email = (email || "").toLowerCase();

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Usuario no encontrado" });

    if (user.banned) return res.status(403).json({ message: "Cuenta suspendida" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Credenciales inválidas" });

    const token = signToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ message: "Error en el servidor" });
  }
};

exports.me = async (req, res) => {
  try {
    const u = await User.findById(req.user.userId).select("name email role banned");
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ user: { id: u._id, name: u.name, email: u.email, role: u.role, banned: u.banned } });
  } catch (_e) {
    res.status(500).json({ message: "Error al obtener perfil" });
  }
};

// ------------------------------------------------------------------
// Administración
// ------------------------------------------------------------------

// Crear admin (recomendado permitir solo SUPERADMIN; aquí usamos requireAdmin en la ruta)
exports.createAdmin = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nombre, email y contraseña son requeridos" });
    }
    email = email.toLowerCase();

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "El email ya está registrado" });

    const hash = await bcrypt.hash(password, 12);
    const admin = await User.create({ name, email, password: hash, role: "admin" });

    res.status(201).json({
      message: "Admin creado",
      user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (e) {
    res.status(500).json({ message: "Error al crear admin" });
  }
};

exports.listUsers = async (req, res) => {
  try {
    const { q, role, banned, page = 1, limit = 50 } = req.query;
    const find = {};
    if (role) find.role = role;
    if (typeof banned !== "undefined") find.banned = banned === "true";

    if (q) {
      find.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      User.find(find).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).select("name email role banned"),
      User.countDocuments(find),
    ]);

    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (_e) {
    res.status(500).json({ message: "Error al listar usuarios" });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body; // "user" | "admin"
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Rol inválido" });
    }
    const u = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("name email role banned");
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ user: u });
  } catch (_e) {
    res.status(400).json({ message: "No se pudo actualizar el rol" });
  }
};

exports.setUserBan = async (req, res) => {
  try {
    const { banned } = req.body; // true | false
    const u = await User.findByIdAndUpdate(req.params.id, { banned: !!banned }, { new: true }).select("name email role banned");
    if (!u) return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ user: u });
  } catch (_e) {
    res.status(400).json({ message: "No se pudo actualizar el estado" });
  }
};
