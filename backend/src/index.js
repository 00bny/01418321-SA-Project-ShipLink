// backend/src/index.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const listEndpoints = require('express-list-endpoints');
const app = express();

// ------------------------------
// 🔧 Middleware
// ------------------------------
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ------------------------------
// 🗂 Static
// ------------------------------
const frontendPublic = path.join(__dirname, '..', 'frontend', 'public');
app.use('/public', express.static(frontendPublic));
app.use('/frontend/public', express.static(frontendPublic));

// ------------------------------
// ❤️ Health Check
// ------------------------------
app.get('/', (_req, res) => res.send('ShipLink API is running'));
app.get('/api/ping', (_req, res) => res.json({ ok: true }));

// ------------------------------
// 🚏 Mount Routes
// ------------------------------
console.log('📦 Mounting all routers...');

const pickupRouter = require('./routes/pickupRoutes');
const companyRouter = require('./routes/companyRoutes');

app.use('/api/pickup', pickupRouter);
app.use('/api/companies', companyRouter);


// ------------------------------
// ⚠️ 404 Handler
// ------------------------------
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found', path: req.originalUrl });
});


// ------------------------------
// 🚀 Start Server
// ------------------------------
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';  
app.listen(PORT, HOST, () => {
  console.log(`✅ API running on http://${HOST}:${PORT}`);
  try {
    const endpoints = listEndpoints(app);
    console.log('📋 Registered endpoints count:', endpoints.length);
    for (const e of endpoints) {
      console.log(`  • ${e.methods.join(',').padEnd(10)} ${e.path}`);
    }
  } catch (err) {
    console.error('❌ express-list-endpoints error:', err);
  }
});
