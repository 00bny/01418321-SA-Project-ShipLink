const router = require('express').Router();
const BranchWalletController = require('../controllers/BranchWalletController');

// GET /api/branch-wallet/balance?branchId=1
router.get('/balance', BranchWalletController.getBalance);

// POST /api/branch-wallet/topup  { branchId, amount, employeeId }
router.post('/topup', BranchWalletController.topup);

// POST /api/branch-wallet/withdraw  { branchId, amount, employeeId }
router.post('/withdraw', BranchWalletController.withdraw);

// GET /api/branch-wallet/transactions?branchId=1
router.get('/transactions', BranchWalletController.listTransactions);

module.exports = router;