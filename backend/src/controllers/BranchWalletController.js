const DB = require('../config/DBConnector');
const Wallet = require('../models/Wallet');

function checkEnoughBalance(balance, withdraw) {
  return Number(balance) >= Number(withdraw);
}

function checkNull(value) {
  if (value === undefined || value === null)
    return false;
  if (typeof value === 'string' && value.trim() === '')
    return false;
  return true;
}

function checkPositiveDec(n) {
  const v = Number(n);
  if (!Number.isFinite(v))
    return false;
  return v > 0;
}

class BranchWalletController {
  static async _getWalletByBranchId(branchId) {
    const rows = await DB.query(
      `SELECT w.WalletID, w.Balance
         FROM Branch b
         JOIN Wallet w ON w.WalletID = b.WalletID
        WHERE b.BranchID = ?`,
      [branchId]
    );
    return rows[0] ? new Wallet(rows[0]) : null;
  }

  static async getBalance(req, res) {
    try {
      const branchId = Number(req.query.branchId || req.params.branchId);

      const w = await BranchWalletController._getWalletByBranchId(branchId);
      if (!w) throw new Error('Branch/Wallet not found');

      res.json({ branchId, walletId: w.WalletID, balance: w.Balance });
    } catch (err) {
      console.error('❌ getBalance error:', err);
      res.status(400).json({ message: err.message });
    }
  }

  static async topup(req, res) {
    let conn;
    try {
      const { branchId, amount, employeeId } = req.body;
      const branchIdNum = Number(branchId);
      const amt = Number(amount);
      const empId = Number(employeeId);

      if (!checkNull(amt)) {
        return res.status(400).json({ message: 'กรุณาระบุจำนวนเงิน' });
      }
      if (!checkPositiveDec(amt)) {
        return res.status(400).json({ message: 'จำนวนเงินต้องมีค่ามากกว่า 0' });
      }

      const w = await BranchWalletController._getWalletByBranchId(branchIdNum);
      if (!w) throw new Error('Branch/Wallet not found');

      conn = await DB.getConnection();
      await conn.beginTransaction();

      await conn.query(
        `UPDATE Wallet SET Balance = Balance + ? WHERE WalletID = ?`,
        [amt, w.WalletID]
      );

      await conn.query(
        `INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, EmployeeID, BranchID)
         VALUES (?,?,?,?,?)`,
        [amt, 'TOPUP', w.WalletID, empId, branchIdNum]
      );

      const [rows] = await conn.query(
        `SELECT WalletID, Balance FROM Wallet WHERE WalletID=?`,
        [w.WalletID]
      );
      const newWallet = new Wallet(rows);

      await conn.commit();
      res.json({
        message: 'TOPUP_OK',
        walletId: newWallet.WalletID,
        balance: newWallet.Balance
      });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error('❌ topup error:', err);
      res.status(400).json({ message: err.message });
    } finally {
      if (conn) conn.release();
    }
  }

  static async withdraw(req, res) {
    let conn;
    try {
      const { branchId, amount, employeeId } = req.body;
      const branchIdNum = Number(branchId);
      const amt = Number(amount);
      const empId = Number(employeeId);

      if (!checkNull(amt)) {
        return res.status(400).json({ message: 'กรุณาระบุจำนวนเงิน' });
      }
      if (!checkPositiveDec(amt)) {
        return res.status(400).json({ message: 'จำนวนเงินต้องมีค่ามากกว่า 0' });
      }

      const w = await BranchWalletController._getWalletByBranchId(branchIdNum);
      if (!w) throw new Error('Branch/Wallet not found');

      if (!checkEnoughBalance(w.Balance, amt)) {
        return res.status(400).json({ message: 'ยอดเงินไม่เพียงพอในกระเป๋า' });
      }

      conn = await DB.getConnection();
      await conn.beginTransaction();

      await conn.query(
        `UPDATE Wallet SET Balance = Balance - ? WHERE WalletID = ?`,
        [amt, w.WalletID]
      );

      await conn.query(
        `INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, EmployeeID, BranchID)
         VALUES (?,?,?,?,?)`,
        [amt, 'WITHDRAW', w.WalletID, empId, branchIdNum]
      );

      const [rows] = await conn.query(
        `SELECT WalletID, Balance FROM Wallet WHERE WalletID=?`,
        [w.WalletID]
      );
      const newWallet = new Wallet(rows);

      await conn.commit();
      res.json({
        message: 'WITHDRAW_OK',
        walletId: newWallet.WalletID,
        balance: newWallet.Balance
      });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error('❌ withdraw error:', err);
      res.status(400).json({ message: err.message });
    } finally {
      if (conn) conn.release();
    }
  }

  static async listTransactions(req, res) {
    try {
      const branchId = Number(req.query.branchId || 1);

      const sql = `
        SELECT 
          t.TransactionID,
          t.TransactionAmount,
          t.TransactionType,
          t.TransactionDateTime,
          DATE_FORMAT(t.TransactionDateTime, '%d/%m/%Y %H:%i') AS TxnDate,
          e.EmployeeName
        FROM TransactionHist t
        LEFT JOIN Employee e ON e.EmployeeID = t.EmployeeID
        WHERE t.BranchID = ?
        ORDER BY t.TransactionDateTime DESC
      `;
      const rows = await DB.query(sql, [branchId]);

      const list = rows.map(r => ({
        txnId: String(r.TransactionID),
        amount: Number(r.TransactionAmount),
        type: r.TransactionType,
        date: r.TxnDate,
        employee: r.EmployeeName || '-'
      }));

      res.json(list);
    } catch (err) {
      console.error('❌ listTransactions error:', err);
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = BranchWalletController;
