// models/Report.js
const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    especie: {
      type: String,
      required: true, // ¡Asegura que siempre venga!
      enum: ["Perro", "Gato"] // Solo admite estos valores
    },
    comentarios: {
      type: [String],
      required: true,
    },
    fotos: [String],
    ubicacion: {
      lat: Number,
      lng: Number,
    },
    estado: {
      type: String,
      default: "pendiente",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
