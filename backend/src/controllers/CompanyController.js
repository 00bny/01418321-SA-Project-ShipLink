const DB = require('../config/DBConnector');
const bcrypt = require('bcryptjs');

class CompanyController {
  static async getByPhone(phone) {
    const [rows] = await DB.query('SELECT * FROM ShippingCompany WHERE CompanyPhone = ?', [phone]);
    return rows?.length ? rows[0] : null;
  }

  static async create({ name, phone, passwordHash, shippingRate, sharePercent, walletId }) {
    const conn = await DB.getConnection();
    try {
      await conn.beginTransaction();
      let wId = walletId;

      if (!wId) {
        const [walletRes] = await conn.query('INSERT INTO Wallet (Balance) VALUES (0.00)');
        wId = walletRes.insertId;
      }

      const sql = `
        INSERT INTO ShippingCompany 
        (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, SharePercent, WalletID)
        VALUES (?,?,?,?,?,?)`;
      const [result] = await conn.query(sql, [name, phone, passwordHash, shippingRate, sharePercent, wId]);

      const [rows] = await conn.query('SELECT * FROM ShippingCompany WHERE CompanyID=?', [result.insertId]);
      await conn.commit();
      return rows[0];
    } catch (err) {
      if (conn) await conn.rollback();
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  static async list(req, res) {
    try {
      const branchId = req.query.branchId;
      if (!branchId) return res.status(400).json({ message: 'กรุณาระบุ branchId' });

      const sql = `
        SELECT 
          c.CompanyID,
          c.CompanyName,
          c.ShippingRate,
          c.SharePercent,
          COUNT(o.OrderID) AS TotalOrdersPaid
        FROM ShippingCompany AS c
        LEFT JOIN \`Order\` AS o 
          ON o.CompanyID = c.CompanyID
          AND o.OrderStatus = 'Paid'
          AND o.BranchID = ?
        GROUP BY c.CompanyID, c.CompanyName, c.ShippingRate, c.SharePercent
        ORDER BY c.CompanyID`;
      const rows = await DB.query(sql, [branchId]);
      res.json(rows);
    } catch (err) {
      console.error('❌ Error in CompanyController.list:', err);
      res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลบริษัทขนส่งได้' });
    }
  }

  static async verifyPassword(phone, password) {
    const comp = await CompanyController.getByPhone(phone);
    if (!comp) return null;
    const ok = await bcrypt.compare(password, comp.CompanyPassword);
    return ok ? comp : null;
  }
}

module.exports = CompanyController;
