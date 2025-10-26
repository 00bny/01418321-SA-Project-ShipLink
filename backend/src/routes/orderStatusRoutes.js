const express = require('express');
const router = express.Router();
const OrderStatusController = require('../controllers/OrderStatusController');

router.put('/update/:orderId', OrderStatusController.updateStatus);

module.exports = router;
