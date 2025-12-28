const DB = require('../config/db');

const WalletController = {

  async getBalance(req, res) {
    try {
      const { companyId } = req.query;
      const [[row]] = await DB.query(`
        SELECT w.Balance
        FROM Wallet w
        JOIN ShippingCompany sc ON w.WalletID = sc.WalletID
        WHERE sc.CompanyID = ?
      `, [companyId]);

      if (!row) return res.status(404).json({ message: 'ไม่พบข้อมูล Wallet' });

      res.json({ balance: row.Balance });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'โหลดยอดเงินไม่สำเร็จ' });
    }
  },

  async withdraw(req, res) {
    try {
      const { companyId, amount } = req.body;

      
      if (!amount || amount <= 0)
        return res.status(400).json({ message: 'จำนวนเงินไม่ถูกต้อง' });

      const [[wallet]] = await DB.query(`
        SELECT w.WalletID, w.Balance
        FROM Wallet w
        JOIN ShippingCompany sc ON w.WalletID = sc.WalletID
        WHERE sc.CompanyID = ?
      `, [companyId]);

      if (!wallet) return res.status(404).json({ message: 'ไม่พบ Wallet' });
      if (wallet.Balance < amount)
        return res.status(400).json({ message: 'ยอดเงินไม่เพียงพอ' });

      await DB.query(`
        UPDATE Wallet SET Balance = Balance - ?
        WHERE WalletID = ?
      `, [amount, wallet.WalletID]);

      await DB.query(`
        INSERT INTO TransactionHist (WalletID, TransactionAmount, TransactionType)
        VALUES (?, ?, 'WITHDRAW')
      `, [wallet.WalletID, amount]);

      res.json({
        message: 'ถอนเงินสำเร็จ',
        balance: wallet.Balance - amount
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'ถอนเงินไม่สำเร็จ' });
    }
  },

  async getHistory(req, res) {
    try {
      const { companyId } = req.query;
      const [rows] = await DB.query(`
        SELECT th.TransactionID, th.TransactionAmount, th.TransactionType, th.TransactionDateTime
        FROM TransactionHist th
        JOIN Wallet w ON th.WalletID = w.WalletID
        JOIN ShippingCompany sc ON w.WalletID = sc.WalletID
        WHERE sc.CompanyID = ?
        ORDER BY th.TransactionDateTime DESC
      `, [companyId]);

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'โหลดประวัติไม่สำเร็จ' });
    }
  }
};

module.exports = WalletController;
