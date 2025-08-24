const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // tu modelo existente
const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name = "", email = "", password = "" } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Correo y contraseña son requeridos" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Ese correo ya está registrado" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: passwordHash,
      role: "user", // por defecto
    });

    res.status(201).json({
      message: "Usuario creado",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al crear la cuenta" });
  }
});

module.exports = router;
