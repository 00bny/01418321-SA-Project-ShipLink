const router = require('express').Router();
const OrderController = require('../controllers/OrderController');

// /api/orders
router.post('/', OrderController.createDraft);
// /api/orders/unpaid?employeeId=1
router.get('/unpaid', OrderController.listUnpaid);
// /api/orders?branchId=1
router.get('/', OrderController.listByBranch);

router.get('/:id', OrderController.getOne);
router.put('/:id', OrderController.updateDraft);
router.delete('/:id', OrderController.removePending);

module.exports = router;
