const router = require('express').Router();
const PickupController = require('../controllers/PickupController');

// POST /api/pickup/request
router.post('/request', PickupController.createRequest);

// GET /api/pickup/history?branchId=1
router.get('/history', PickupController.listHistory);

module.exports = router;
