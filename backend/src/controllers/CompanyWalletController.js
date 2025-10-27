const DB = require('../config/DBConnector');
const Wallet = require('../models/Wallet');

// ---------- RULES ----------
function checkEnoughBalance(balance, withdraw) {
  return Number(balance) >= Number(withdraw);
}
function checkNull(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  return true;
}
function checkPositiveDec(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return false;
  return v > 0;
}

class CompanyWalletController {
  // ดึง wallet ของบริษัท
  static async _getWalletByCompanyId(companyId) {
    const rows = await DB.query(
      `SELECT w.WalletID, w.Balance
         FROM ShippingCompany sc
         JOIN Wallet w ON w.WalletID = sc.WalletID
        WHERE sc.CompanyID = ?`,
      [companyId]
    );
    return rows[0] ? new Wallet(rows[0]) : null;
  }

  // GET /api/company-wallet/:companyId
  static async getBalance(req, res) {
    try {
      const companyId = Number(req.params.companyId || req.query.companyId);
      const w = await CompanyWalletController._getWalletByCompanyId(companyId);
      if (!w) throw new Error('Company/Wallet not found');
      res.json({ companyId, walletId: w.WalletID, balance: w.Balance });
    } catch (err) {
      console.error('❌ Company getBalance error:', err);
      res.status(400).json({ message: err.message });
    }
  }

  // POST /api/company-wallet/:companyId/withdraw  { amount }
  static async withdraw(req, res) {
    let conn;
    try {
      const companyId = Number(req.params.companyId || req.body.companyId);
      const amt = Number(req.body.amount);

      if (!checkNull(amt)) {
        return res.status(400).json({ message: 'กรุณาระบุจำนวนเงิน' });
      }
      if (!checkPositiveDec(amt)) {
        return res.status(400).json({ message: 'จำนวนเงินต้องมีค่ามากกว่า 0' });
      }

      const w = await CompanyWalletController._getWalletByCompanyId(companyId);
      if (!w) throw new Error('Company/Wallet not found');

      if (!checkEnoughBalance(w.Balance, amt)) {
        return res.status(400).json({ message: 'ยอดเงินไม่เพียงพอในกระเป๋า' });
      }

      conn = await DB.getConnection();
      await conn.beginTransaction();

      // หักเงิน
      await conn.query(
        `UPDATE Wallet SET Balance = Balance - ? WHERE WalletID = ?`,
        [amt, w.WalletID]
      );

      // บันทึกประวัติ (ให้รูปแบบเหมือน BranchWalletController -> ใช้ WITHDRAW)
      await conn.query(
        `INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, CompanyID)
         VALUES (?,?,?,?)`,
        [amt, 'WITHDRAW', w.WalletID, companyId]
      );

      // อ่านยอดล่าสุด
      const [rows] = await conn.query(
        `SELECT WalletID, Balance FROM Wallet WHERE WalletID=?`,
        [w.WalletID]
      );
      const newWallet = new Wallet(rows[0]);

      await conn.commit();
      res.json({
        message: 'WITHDRAW_OK',
        walletId: newWallet.WalletID,
        balance: newWallet.Balance
      });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error('❌ Company withdraw error:', err);
      res.status(400).json({ message: err.message });
    } finally {
      if (conn) conn.release();
    }
  }

  // GET /api/company-wallet/:companyId/history
  static async history(req, res) {
    try {
      const companyId = Number(req.params.companyId || req.query.companyId);

      const sql = `
        SELECT 
          t.TransactionID,
          t.TransactionAmount,
          t.TransactionType,
          t.TransactionDateTime,
          DATE_FORMAT(t.TransactionDateTime, '%d/%m/%Y %H:%i') AS TxnDate
        FROM TransactionHist t
        WHERE t.CompanyID = ?
        ORDER BY t.TransactionDateTime DESC
      `;
      const rows = await DB.query(sql, [companyId]);

      const list = rows.map(r => ({
        txnId: String(r.TransactionID),
        amount: Number(r.TransactionAmount),
        type: r.TransactionType, // เช่น WITHDRAW / รับเงินค่าขนส่ง (ตามข้อมูลจริง)
        date: r.TxnDate
      }));

      res.json(list);
    } catch (err) {
      console.error('❌ Company history error:', err);
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = CompanyWalletController;
