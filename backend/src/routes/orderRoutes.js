const router = require('express').Router();
const OrderController = require('../controllers/OrderController');

router.get('/company/pickup/:companyId', OrderController.listPickedUpOrders);

// /api/orders
router.post('/', OrderController.createDraft);
// /api/orders/unpaid?employeeId=1
router.get('/unpaid', OrderController.listUnpaid);
// /api/orders?branchId=1
router.get('/', OrderController.listByBranch);

router.get('/:id', OrderController.getOne);
router.put('/:id', OrderController.updateDraft);
router.delete('/:id', OrderController.removePending);

router.put('/status/:id', OrderController.updateStatus);

router.post('/:id/deliver-success', OrderController.deliverSuccess);

router.post('/quotes', OrderController.calculateQuote);

module.exports = router;
