// backend/services/CompanyWalletService.js
const DB = require('../config/DBConnector');

class Wallet {
  constructor({ WalletID, Balance }) {
    this.WalletID = WalletID;
    this.Balance = Number(Balance);
  }
}

class CompanyWalletService {
  static async getWalletByCompanyId(companyId) {
    const rows = await DB.query(
      `SELECT w.WalletID, w.Balance
         FROM ShippingCompany sc
         JOIN Wallet w ON w.WalletID = sc.WalletID
        WHERE sc.CompanyID = ?`,
      [companyId]
    );
    return rows[0] ? new Wallet(rows[0]) : null;
  }

  static async getBalance(companyId) {
    const w = await this.getWalletByCompanyId(companyId);
    if (!w) throw new Error('Company/Wallet not found');
    return w;
  }

  // ✅ เปลี่ยน TransactionType ที่ INSERT เป็น "ถอนเงิน" (ไทย) เพื่อให้สอดคล้องกับฟิลเตอร์ฝั่งหน้าเว็บ
  static async withdraw({ companyId, amount }) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error('Invalid amount');
    }
    const w = await this.getWalletByCompanyId(companyId);
    if (!w) throw new Error('Company/Wallet not found');

    if (w.Balance < amount) {
      throw new Error('ยอดเงินไม่เพียงพอในกระเป๋า');
    }

    await DB.query(`UPDATE Wallet SET Balance = Balance - ? WHERE WalletID = ?`, [amount, w.WalletID]);

    // EmployeeID, BranchID = NULL | CompanyID ถูกระบุ
    await DB.query(
      `INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, EmployeeID, BranchID, CompanyID)
       VALUES (?,?,?,?,?,?)`,
      [amount, 'ถอนเงิน', w.WalletID, null, null, companyId]
    );

    const [row] = await DB.query(`SELECT WalletID, Balance FROM Wallet WHERE WalletID=?`, [w.WalletID]);
    return new Wallet(row);
  }

  static async listTransactions(companyId) {
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
    return rows.map(r => ({
      txnId: String(r.TransactionID),
      amount: Number(r.TransactionAmount),
      // เก็บและส่งคืนเป็นค่าที่อยู่ในฐานข้อมูลตามจริง เช่น "รับเงินค่าขนส่ง" หรือ "ถอนเงิน"
      type: r.TransactionType,
      date: r.TxnDate
    }));
  }
}

module.exports = CompanyWalletService;
