// server/routes/reportRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const Report = require("../models/Report");
const { verifyToken } = require("../middlewares/requireAuth");

const router = express.Router();

// --- Multer (subida de imágenes) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

// 🔹 Auth opcional: si hay Authorization => usamos verifyToken, si no, seguimos anónimo
const maybeAuth = (req, res, next) => {
  const hasAuth = typeof req.headers.authorization === "string" && req.headers.authorization.startsWith("Bearer ");
  if (!hasAuth) return next();
  // Si hay token, delegamos a verifyToken; si es inválido, devolverá 401 (correcto)
  return verifyToken(req, res, next);
};

// Crear reporte (público o con cuenta si trae token)
router.post(
  "/",
  maybeAuth, // ⬅️ aquí
  (req, res, next) => {
    upload.array("fotos")(req, res, (err) => {
      if (err) {
        const msg =
          err.code === "LIMIT_FILE_SIZE"
            ? "La imagen supera el tamaño máximo permitido (15 MB)"
            : "Error al subir la imagen";
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const { especie, comentarios, ubicacion, creadoPor } = req.body;
      const fotos = (req.files || []).map((f) => f.filename);

      const report = await Report.create({
        especie,
        comentarios: JSON.parse(comentarios),
        fotos,
        ubicacion: JSON.parse(ubicacion),
        estado: "pendiente",
        // 🔹 preferimos el usuario del token si existe; si no, el que venga en body; si no, null
        creadoPor: (req.user && req.user.userId) || creadoPor || null,
      });

      res.status(201).json(report);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al guardar el reporte" });
    }
  }
);

// Listar reportes (con paginación y filtro por estado)
router.get("/", async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;
    const query = estado ? { estado } : {};

    const [items, total] = await Promise.all([
      Report.find(query)
        .populate("creadoPor", "name email")
        .populate("resueltoPor", "name email")
        .populate("canceladoPor", "name email")
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Report.countDocuments(query),
    ]);

    res.json({
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.max(1, Math.ceil(total / Number(limit))),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

// Marcar como resuelto
router.patch("/:id/cerrar", verifyToken, async (req, res) => {
  try {
    const { comentario = "" } = req.body || {};
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        estado: "resuelto",
        resueltoPor: req.user.userId,
        resueltoComentario: comentario,
        resueltoEn: new Date(),
      },
      { new: true }
    )
      .populate("creadoPor", "name email")
      .populate("resueltoPor", "name email")
      .populate("canceladoPor", "name email");

    if (!report) return res.status(404).json({ error: "Reporte no encontrado" });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "No se pudo actualizar el reporte" });
  }
});

// Cancelar reporte
router.patch("/:id/cancelar", verifyToken, async (req, res) => {
  try {
    const { comentario = "" } = req.body || {};
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      {
        estado: "cancelado",
        canceladoPor: req.user.userId,
        canceladoComentario: comentario,
        canceladoEn: new Date(),
      },
      { new: true }
    )
      .populate("creadoPor", "name email")
      .populate("resueltoPor", "name email")
      .populate("canceladoPor", "name email");

    if (!report) return res.status(404).json({ error: "Reporte no encontrado" });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "No se pudo cancelar el reporte" });
  }
});

module.exports = router;
