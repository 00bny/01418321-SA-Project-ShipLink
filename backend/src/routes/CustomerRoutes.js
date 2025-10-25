const router = require('express').Router();
const CustomerController = require('../controllers/CustomerController');

// /api/customers/search?phone=...
router.get('/search', CustomerController.searchByPhone);
// /api/customers
router.post('/', CustomerController.create);
// /api/customers/:phone
router.put('/:phone', CustomerController.updateByPhone);
router.get('/:id', CustomerController.getById);

module.exports = router;
