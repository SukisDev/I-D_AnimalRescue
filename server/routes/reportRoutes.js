const express = require("express");
const multer = require("multer");
const path = require("path");
const Report = require("../models/Report");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

router.post("/", upload.array("fotos"), async (req, res) => {
  try {
    console.log("POST recibido:", req.body);
    const { especie, comentarios, ubicacion } = req.body;
    const fotos = req.files.map((file) => file.path);

    const newReport = new Report({
      especie,
      comentarios: JSON.parse(comentarios),
      fotos,
      ubicacion: JSON.parse(ubicacion),
      estado: "pendiente",
    });

    await newReport.save();
    res.status(201).json(newReport);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Error al guardar el reporte" });
  }
});

router.get('/', async (req, res) => {
  try {
    const estado = req.query.estado;
    const query = estado ? { estado } : {};
    const reports = await Report.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reportes' });
  }
});

router.patch('/:id/cerrar', async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { estado: 'resuelto' },
      { new: true }
    );
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'No se pudo actualizar el reporte' });
  }
});

module.exports = router;
