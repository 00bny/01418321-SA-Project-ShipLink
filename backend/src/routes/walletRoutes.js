const router = require('express').Router();
const WalletController = require('../controllers/WalletController');

router.get('/balance', WalletController.getBalance);
router.post('/withdraw', WalletController.withdraw);
router.get('/history', WalletController.getHistory);

module.exports = router;
