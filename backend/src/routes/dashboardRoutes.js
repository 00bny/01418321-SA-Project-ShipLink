const router = require('express').Router();
const DashboardController = require('../controllers/DashboardController');

// GET /api/dashboard/staff?branchId=1
router.get('/staff', DashboardController.staffSummary);

// GET /api/dashboard/staff/returns?branchId=1
router.get('/staff/returns', DashboardController.listReturnPendingContact);

// POST /api/dashboard/staff/returns/:orderId/contacted
router.post('/staff/returns/:orderId/contacted', DashboardController.markReturnContacted);

// GET /api/dashboard/manager?branchId=1
router.get('/manager', DashboardController.managerSummary);

module.exports = router;
