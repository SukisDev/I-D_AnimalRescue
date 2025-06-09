const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const vision = require("@google-cloud/vision");
const Report = require("../models/Report");

const router = express.Router();

// --- Google Cloud Vision ---
const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(
    __dirname,
    "../credentials/rescateanimalvision-da677673728c.json"
  ),
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// --- Crear nuevo reporte (con validación de Vision AI) ---
router.post("/", upload.array("fotos"), async (req, res) => {
  try {
    const { especie, comentarios, ubicacion } = req.body;
    const fotos = req.files.map((file) => file.path);

    if (especie !== "Perro" && especie !== "Gato") {
      fotos.forEach(foto => { try { fs.unlinkSync(foto); } catch (e) {} });
      return res.status(400).json({ error: "La especie solo puede ser Perro o Gato." });
    }

    // Validación con Cloud Vision
    const animalLabels = ['dog', 'cat', 'dogs', 'cats'];
    let algunaValida = false;

    for (let fotoPath of fotos) {
      const [result] = await client.labelDetection(fotoPath);
      const labels = result.labelAnnotations
        .filter(label => label.score >= 0.7)
        .map(label => label.description.toLowerCase());

      console.log('Etiquetas detectadas para', fotoPath, labels);

      if (labels.some(label => animalLabels.includes(label))) {
        algunaValida = true;
        break; 
      } 
    }

    if (!algunaValida) {
      fotos.forEach(foto => { try { fs.unlinkSync(foto); } catch (e) {} });
      return res.status(400).json({ error: "La(s) foto(s) no parecen mostrar ni perro ni gato. Por favor, sube una imagen válida." });
    }

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

router.get("/", async (req, res) => {
  try {
    const estado = req.query.estado;
    const query = estado ? { estado } : {};
    const reports = await Report.find(query).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener reportes" });
  }
});

router.patch("/:id/cerrar", async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { estado: "resuelto" },
      { new: true }
    );
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "No se pudo actualizar el reporte" });
  }
});

module.exports = router;
