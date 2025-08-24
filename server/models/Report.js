// server/models/Report.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReportSchema = new Schema(
  {
    especie: { type: String, required: true, enum: ["Perro", "Gato"] },
    comentarios: { type: [String], required: true },
    fotos: [String],
    ubicacion: { lat: Number, lng: Number },

    // estado: pendiente | resuelto | cancelado
    estado: { type: String, default: "pendiente", enum: ["pendiente", "resuelto", "cancelado"] },

    // Quién creó el reporte (usuario público)
    creadoPor: { type: Schema.Types.ObjectId, ref: "User", default: null },

    // Resolución
    resueltoPor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    resueltoComentario: { type: String, default: "" },
    resueltoEn: { type: Date, default: null },

    // Cancelación
    canceladoPor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    canceladoComentario: { type: String, default: "" },
    canceladoEn: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", ReportSchema);
