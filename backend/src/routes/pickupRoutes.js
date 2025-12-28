const express = require('express');
const router = express.Router();
const PickupController = require('../controllers/PickupController');

// --- ฝั่งสาขา ---
router.get('/history', PickupController.getPickupHistory);
router.post('/request', PickupController.createPickupRequest);

// --- ฝั่งบริษัทขนส่ง ---
router.get('/company/:id', PickupController.getRequestsByCompany);
router.post('/confirm', PickupController.confirmPickup);
router.put('/complete/:id', PickupController.completePickup);
router.put('/reject/:id', PickupController.rejectPickup); 

module.exports = router;
