// backend/routes/companyWalletRoutes.js
const router = require('express').Router();
const CompanyWalletController = require('../controllers/CompanyWalletController');

// Balance
router.get('/:companyId', CompanyWalletController.getBalance);

// Withdraw
router.post('/:companyId/withdraw', CompanyWalletController.withdraw);

// History
router.get('/:companyId/history', CompanyWalletController.history);

// ------- Backward-compatible alias (หน้าเก่าเรียกใช้) -------
router.get('/wallet/:companyId', CompanyWalletController.getBalance);

module.exports = router;
