const DB = require('../config/DBConnector');
const Customer = require('../models/Customer');

class CustomerController {
  static async searchByPhone(req, res) {
    try {
      const phone = (req.query.phone || '').trim();
      if (!phone) {
        return res.status(400).json({ message: 'phone is required' });
      }

      const rows = await DB.query('SELECT * FROM Customer WHERE CustomerPhone = ?', [phone]);
      if (!rows.length) {
        return res.status(404).json({ message: 'not found' });
      }

      const customer = new Customer(rows[0]);
      res.json(customer);
    } catch (err) {
      console.error('❌ searchByPhone error:', err);
      res.status(500).json({ message: err.message });
    }
  }

  static async create(req, res) {
    try {
      const { name, phone, address } = req.body;
      if (!name || !phone || !address) {
        return res.status(400).json({ message: 'name/phone/address required' });
      }

      const result = await DB.query(
        'INSERT INTO Customer (CustomerName, CustomerPhone, CustomerAddress) VALUES (?,?,?)',
        [name, phone, address]
      );

      const newRows = await DB.query('SELECT * FROM Customer WHERE CustomerID=?', [result.insertId]);
      const created = new Customer(newRows[0]);
      res.status(201).json(created);
    } catch (err) {
      console.error('❌ create customer error:', err);
      res.status(500).json({ message: err.message });
    }
  }

  static async updateByPhone(req, res) {
    try {
      const phone = req.params.phone;
      const { name, address } = req.body;
      if (!name || !address) {
        return res.status(400).json({ message: 'name/address required' });
      }

      await DB.query(
        'UPDATE Customer SET CustomerName=?, CustomerAddress=? WHERE CustomerPhone=?',
        [name, address, phone]
      );

      const rows = await DB.query('SELECT * FROM Customer WHERE CustomerPhone=?', [phone]);
      if (!rows.length) {
        return res.status(404).json({ message: 'not found' });
      }

      const updated = new Customer(rows[0]);
      res.json(updated);
    } catch (err) {
      console.error('❌ updateByPhone error:', err);
      res.status(500).json({ message: err.message });
    }
  }

  static async getById(req, res) {
    try {
      const id = Number(req.params.id);
      if (!id) return res.status(400).json({ message: 'invalid id' });

      const rows = await DB.query('SELECT * FROM Customer WHERE CustomerID=?', [id]);
      if (!rows.length) {
        return res.status(404).json({ message: 'not found' });
      }

      const customer = new Customer(rows[0]);
      res.json(customer);
    } catch (err) {
      console.error('❌ getById error:', err);
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = CustomerController;
