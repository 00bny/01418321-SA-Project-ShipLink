const router = require('express').Router();
const OrderController = require('../controllers/OrderController');

router.post('/', OrderController.createDraft);        // /api/orders
router.get('/unpaid', OrderController.listUnpaid);    // /api/orders/unpaid?employeeId=1

router.get('/:id', OrderController.getOne);
router.put('/:id', OrderController.updateDraft);
router.delete('/:id', OrderController.removePending);

module.exports = router;
