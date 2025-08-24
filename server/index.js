// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin'); // 👈 NUEVO

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

const uploadsCors = cors({
  origin: ['http://localhost:3000'],
  credentials: true,
});
app.use('/uploads', uploadsCors, express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes); // 👈 NUEVO

app.get('/api', (_req, res) => res.send('API de Rescate Animal funcionando'));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Conectado a MongoDB');
  app.listen(PORT, '0.0.0.0', () => console.log(`Servidor en puerto ${PORT}`));
}).catch(err => console.error('❌ Error en conexión:', err));
