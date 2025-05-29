const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  fotos: [String], 
  ubicacion: {
    lat: Number,
    lng: Number
  },
  estado: {
    type: String,
    enum: ['pendiente', 'resuelto'],
    default: 'pendiente'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  comentarios: [String]
});

module.exports = mongoose.model('Report', reportSchema);
