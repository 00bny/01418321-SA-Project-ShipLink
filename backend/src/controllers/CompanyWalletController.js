// backend/controllers/CompanyWalletController.js
const CompanyWalletService = require('../services/CompanyWalletService');

class CompanyWalletController {
  static async getBalance(req, res) {
    try {
      const companyId = Number(req.params.companyId || req.query.companyId || 1);
      const w = await CompanyWalletService.getBalance(companyId);
      res.json({ companyId, walletId: w.WalletID, balance: w.Balance });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async withdraw(req, res) {
    try {
      const companyId = Number(req.params.companyId || req.body.companyId || 1);
      const amount = Number(req.body.amount);
      const w = await CompanyWalletService.withdraw({ companyId, amount });
      res.json({ message: 'WITHDRAW_OK', walletId: w.WalletID, balance: w.Balance });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async history(req, res) {
    try {
      const companyId = Number(req.params.companyId || req.query.companyId || 1);
      const rows = await CompanyWalletService.listTransactions(companyId);
      res.json(rows);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = CompanyWalletController;
