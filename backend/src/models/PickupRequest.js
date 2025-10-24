const express = require('express');
const router = express.Router();

console.log('✅ pickupRoutes.js loaded (debug)');

// 🔹 ทดสอบ route /api/pickup/test
router.get('/test', (req, res) => {
  console.log('✅ /api/pickup/test called');
  res.json({ message: 'Pickup route test success' });
});

module.exports = router;
