const DB = require('../config/DBConnector');
const ShippingCompany = require('../models/ShippingCompany');

class ShippingCompanyService {
  static async getByPhone(phone) {
    const rows = await DB.query('SELECT * FROM ShippingCompany WHERE CompanyPhone = ?', [phone]);
    return rows[0] ? new ShippingCompany(rows[0]) : null;
  }

  static async create({ name, phone, passwordHash, shippingRate = 15.00, sharePercent = 10.00, walletId }) {
    const result = await DB.query(
      'INSERT INTO ShippingCompany (CompanyName, CompanyPhone, CompanyPassword, ShippingRate, SharePercent, WalletID) VALUES (?,?,?,?,?,?)',
      [name, phone, passwordHash, shippingRate, sharePercent, walletId]
    );
    const [row] = await DB.query('SELECT * FROM ShippingCompany WHERE CompanyID = ?', [result.insertId]);
    return new ShippingCompany(row);
  }
}
module.exports = ShippingCompanyService;
