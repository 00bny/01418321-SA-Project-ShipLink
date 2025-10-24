const router = require('express').Router();
const BranchWalletController = require('../controllers/BranchWalletController');

// GET /api/branch-wallet/balance?branchId=1
router.get('/balance', BranchWalletController.getBalance);

// POST /api/branch-wallet/topup  { branchId, amount, employeeId }
router.post('/topup', BranchWalletController.topup);

module.exports = router;