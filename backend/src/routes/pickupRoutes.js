const express = require('express');
const router = express.Router();
const PickupController = require('../controllers/PickupController');

// ✅ โหลดประวัติ pickup
router.get('/history', PickupController.getPickupHistory);

// ✅ สร้าง pickup request
router.post('/request', PickupController.createPickupRequest);

module.exports = router;
