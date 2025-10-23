const router = require('express').Router();
const CustomerController = require('../controllers/CustomerController');

router.get('/search', CustomerController.searchByPhone);   // /api/customers/search?phone=...
router.post('/', CustomerController.create);               // /api/customers
router.put('/:phone', CustomerController.updateByPhone);   // /api/customers/:phone

module.exports = router;
