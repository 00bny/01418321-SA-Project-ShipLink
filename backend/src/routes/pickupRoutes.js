// backend/src/routes/pickupRoutes.js
const express = require('express');
const router = express.Router();
const PickupController = require('../controllers/PickupController');

console.log('✅ pickupRoutes.js loaded');

// test route เพื่อตรวจสอบว่า router นี้ถูก mount จริง
router.get('/test', (_req, res) => {
  console.log('📦 /api/pickup/test called');
  res.json({ message: 'Pickup route test success ✅' });
});

// เส้นทางจริง
router.get('/history', PickupController.getPickupHistory);
router.post('/request', PickupController.createPickupRequest);

console.log('📁 pickupRoutes path loaded from:', __filename);
const listEndpoints = require('express-list-endpoints');
console.log('🧾 pickupRoutes endpoints:', listEndpoints(router));

module.exports = router;
