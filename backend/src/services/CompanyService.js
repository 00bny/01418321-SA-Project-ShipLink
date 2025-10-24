const DB = require('../config/DBConnector');
class CompanyService {
  static async getByPhone(phone) {
    const rows = await DB.query('SELECT * FROM ShippingCompany WHERE CompanyPhone = ?', [phone]);
    return rows[0] ? new ShippingCompany(rows[0]) : null;
  }

  static async create({ name, phone, passwordHash, shippingRate = 15.0, sharePercent = 10.0, walletId }) {
    // ถ้าไม่ส่ง walletId มา จะสร้าง wallet ใหม่ให้ (ค่าเริ่มต้น 0)
    let wId = walletId;
    if (!wId) {
      const r = await DB.query('INSERT INTO Wallet (Balance) VALUES (0.00)');
      wId = r.insertId;
    }
    const sql = `INSERT INTO ShippingCompany (CompanyName,CompanyPhone,CompanyPassword,ShippingRate,SharePercent,WalletID)
                 VALUES (?,?,?,?,?,?)`;
    const result = await DB.query(sql, [name, phone, passwordHash, shippingRate, sharePercent, wId]);
    const [row] = await DB.query('SELECT * FROM ShippingCompany WHERE CompanyID=?', [result.insertId]);
    return new ShippingCompany(row);
  }

  static async list() {
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
        AND o.OrderStatus = 'ชำระเงินแล้ว'
      GROUP BY c.CompanyID, c.CompanyName, c.ShippingRate, c.SharePercent
      ORDER BY c.CompanyID
    `;
    return DB.query(sql);
  }

}
module.exports = CompanyService;
