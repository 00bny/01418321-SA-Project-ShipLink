const DB = require('../config/DBConnector');
const Customer = require('../models/Customer');

class CustomerService {
  static async getByPhone(phone) {
    const rows = await DB.query(
      'SELECT * FROM Customer WHERE CustomerPhone = ?',
      [phone]
    );
    return rows[0] ? new Customer(rows[0]) : null;
  }

  static async create({ name, phone, address }) {
    const result = await DB.query(
      'INSERT INTO Customer (CustomerName, CustomerPhone, CustomerAddress) VALUES (?,?,?)',
      [name, phone, address]
    );
    const [row] = await DB.query('SELECT * FROM Customer WHERE CustomerID=?', [result.insertId]);
    return new Customer(row);
  }

  static async updateByPhone(phone, { name, address }) {
    await DB.query(
      'UPDATE Customer SET CustomerName=?, CustomerAddress=? WHERE CustomerPhone=?',
      [name, address, phone]
    );
    return this.getByPhone(phone);
  }
}
module.exports = CustomerService;
