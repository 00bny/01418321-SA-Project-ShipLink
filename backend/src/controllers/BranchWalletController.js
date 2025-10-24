const BranchWalletService = require('../services/BranchWalletService');

class BranchWalletController {
  static async getBalance(req, res) {
    try {
      const branchId = Number(req.query.branchId || req.params.branchId || 1);
      const w = await BranchWalletService.getBalance(branchId);
      res.json({ branchId, walletId: w.WalletID, balance: w.Balance });
    } catch (err) { res.status(400).json({ message: err.message }); }
  }

  static async topup(req, res) {
    try {
      const { branchId, amount, employeeId } = req.body;
      const w = await BranchWalletService.topup({
        branchId: Number(branchId || 1),
        amount: Number(amount),
        employeeId: Number(employeeId || 1)
      });
      res.json({ message: 'TOPUP_OK', walletId: w.WalletID, balance: w.Balance });
    } catch (err) { res.status(400).json({ message: err.message }); }
  }

    static async withdraw(req, res) {
    try {
      const { branchId, amount, employeeId } = req.body;
      const w = await BranchWalletService.withdraw({
        branchId: Number(branchId || 1),
        amount: Number(amount),
        employeeId: Number(employeeId || 1)
      });
      res.json({ message: 'WITHDRAW_OK', walletId: w.WalletID, balance: w.Balance });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

    static async listTransactions(req, res) {
    try {
      const branchId = Number(req.query.branchId || 1);
      const rows = await BranchWalletService.listTransactions(branchId);
      res.json(rows);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}
module.exports = BranchWalletController;
