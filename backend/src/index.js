// ----------------------------------------------
// 🌐 ShipLink Backend Entry Point
// ----------------------------------------------
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();

// ----------------------------------------------
// 🔧 Middleware
// ----------------------------------------------
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----------------------------------------------
// 🗂 Static Files (Frontend Public Assets)
// ----------------------------------------------
const frontendPublic = path.join(__dirname, '..', 'frontend', 'public');
app.use('/public', express.static(frontendPublic));
app.use('/frontend/public', express.static(frontendPublic));

// ----------------------------------------------
// ❤️ Health Check Routes
// ----------------------------------------------
app.get('/', (_req, res) => res.send('ShipLink API is running'));
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// ----------------------------------------------
// 🚏 API Routes
// ----------------------------------------------
const pickupRouter = require('./routes/pickupRoutes');
const companyRouter = require('./routes/companyRoutes');

app.use('/api/pickup', pickupRouter);
app.use('/api/companies', companyRouter);

// ----------------------------------------------
// ⚠️ 404 Handler
// ----------------------------------------------
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found', path: req.originalUrl });
});

// ----------------------------------------------
// 🚀 Start Server
// ----------------------------------------------
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ ShipLink API server is running on http://${HOST}:${PORT}`);
});
