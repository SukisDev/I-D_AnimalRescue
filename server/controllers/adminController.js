// server/controllers/adminController.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /api/admin/users  (admin o superadmin)
exports.listUsers = async (_req, res) => {
  const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
  res.json({ data: users }); // <-- tu frontend espera "data"
};

// POST /api/admin/users/admin  (solo superadmin)
exports.createAdmin = async (req, res) => {
  const { name = '', email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ message: 'El email ya está registrado' });

  const hash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hash, // tu schema usa "password"
    role: 'admin',
  });

  const safe = { _id: user._id, name: user.name, email: user.email, role: user.role };
  res.status(201).json({ data: safe });
};

// PATCH /api/admin/users/:id/role  (solo superadmin)
exports.updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const allowed = ['user', 'admin', 'superadmin'];

  if (!allowed.includes(role)) {
    return res.status(400).json({ message: 'Rol inválido' });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true, projection: { password: 0 } }
  );
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  res.json({ data: user });
};
