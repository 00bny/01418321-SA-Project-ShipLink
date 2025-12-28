const router = require('express').Router();
const CheckoutController = require('../controllers/CheckoutController');

// POST /api/checkout/pay
router.post('/pay', CheckoutController.paySelected);

module.exports = router;
