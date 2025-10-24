const DB = require('../config/DBConnector');
const Wallet = require('../models/Wallet');

class BranchWalletService {
  static async getWalletByBranchId(branchId) {
    const rows = await DB.query(
      `SELECT w.WalletID, w.Balance
         FROM Branch b
         JOIN Wallet w ON w.WalletID = b.WalletID
        WHERE b.BranchID = ?`,
      [branchId]
    );
    return rows[0] ? new Wallet(rows[0]) : null;
  }

  static async getBalance(branchId) {
    const w = await this.getWalletByBranchId(branchId);
    if (!w) throw new Error('Branch/Wallet not found');
    return w;
  }

  static async topup({ branchId, amount, employeeId }) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Invalid amount');
    }
    // หา wallet ของสาขา
    const w = await this.getWalletByBranchId(branchId);
    if (!w) throw new Error('Branch/Wallet not found');

    // อัปเดตยอด
    await DB.query(`UPDATE Wallet SET Balance = Balance + ? WHERE WalletID = ?`, [amount, w.WalletID]);

    // Log ประวัติ
    await DB.query(
      `INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, EmployeeID, BranchID)
       VALUES (?,?,?,?,?)`,
      [amount, 'TOPUP', w.WalletID, employeeId || 1, branchId]
    );

    // ยอดใหม่
    const [row] = await DB.query(`SELECT WalletID, Balance FROM Wallet WHERE WalletID=?`, [w.WalletID]);
    return new Wallet(row);
  }

    static async withdraw({ branchId, amount, employeeId }) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Invalid amount');
    }

    // หา wallet ของสาขา
    const w = await this.getWalletByBranchId(branchId);
    if (!w) throw new Error('Branch/Wallet not found');

    // ตรวจสอบยอดคงเหลือ
    if (w.Balance < amount) {
      throw new Error('ยอดเงินไม่เพียงพอในกระเป๋า');
    }

    // อัปเดตยอด
    await DB.query(`UPDATE Wallet SET Balance = Balance - ? WHERE WalletID = ?`, [amount, w.WalletID]);

    // บันทึกประวัติธุรกรรม
    await DB.query(
      `INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, EmployeeID, BranchID)
       VALUES (?,?,?,?,?)`,
      [amount, 'WITHDRAW', w.WalletID, employeeId || 1, branchId]
    );

    // คืนยอดใหม่
    const [row] = await DB.query(`SELECT WalletID, Balance FROM Wallet WHERE WalletID=?`, [w.WalletID]);
    return new Wallet(row);
  }

  static async listTransactions(branchId) {
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
    return rows.map(r => ({
      txnId: String(r.TransactionID),
      amount: Number(r.TransactionAmount),
      type: r.TransactionType,         // 'TOPUP' | 'WITHDRAW'
      date: r.TxnDate,                 // 'dd/mm/YYYY HH:MM'
      employee: r.EmployeeName || '-'
    }));
  }

}
module.exports = BranchWalletService;
