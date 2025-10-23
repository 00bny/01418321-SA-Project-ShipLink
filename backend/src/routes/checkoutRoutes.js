const router = require('express').Router();
const CheckoutController = require('../controllers/CheckoutController');

router.post('/pay-all', CheckoutController.payAll);   // /api/checkout/pay-all

module.exports = router;
