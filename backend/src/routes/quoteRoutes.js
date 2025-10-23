const router = require('express').Router();
const QuoteController = require('../controllers/QuoteController');
router.post('/', QuoteController.calculate);    // /api/quotes
module.exports = router;
