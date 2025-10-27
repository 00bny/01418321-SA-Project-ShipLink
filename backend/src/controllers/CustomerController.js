const DB = require('../config/DBConnector');
const Customer = require('../models/Customer');

class CustomerController {
  static checkNull(value) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    return true;
  }

  static checkLength(value, min, max) {
    if (typeof value !== 'string') return false;
    const len = value.trim().length;
    if (len < min || len > max) return false;
    return true;
  }

  static checkPhoneFormat(phone) {
    if (typeof phone !== 'string') return false;
    return /^[0-9]+$/.test(phone.trim());
  }

  static async searchByPhone(req, res) {
    try {
      const phone = (req.query.phone || '').trim();

      if (!CustomerController.checkNull(phone)) {
        return res.status(400).json({ message: 'กรุณากรอกเบอร์โทรศัพท์' });
      }
      if (!CustomerController.checkPhoneFormat(phone)) {
        return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น' });
      }

      const rows = await DB.query('SELECT * FROM Customer WHERE CustomerPhone = ?', [phone]);
      if (!rows.length) {
        return res.status(404).json({ message: 'ไม่พบบัญชีลูกค้า' });
      }

      const customer = new Customer(rows[0]);
      res.json(customer);
    } catch (err) {
      console.error('❌ searchByPhone error:', err);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาลูกค้า' });
    }
  }

  static async create(req, res) {
    try {
      const { name, phone, address } = req.body;

      if (!CustomerController.checkNull(name) || !CustomerController.checkNull(phone) || !CustomerController.checkNull(address)) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบทุกช่อง' });
      }
      if (!CustomerController.checkPhoneFormat(phone)) {
        return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น' });
      }
      if (!CustomerController.checkLength(name, 1, 150)) {
        return res.status(400).json({ message: 'ชื่อต้องมีความยาวระหว่าง 1–150 ตัวอักษร' });
      }
      if (!CustomerController.checkLength(address, 1, 250)) {
        return res.status(400).json({ message: 'ที่อยู่ต้องมีความยาวระหว่าง 1–250 ตัวอักษร' });
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
      res.status(500).json({ message: 'ไม่สามารถเพิ่มข้อมูลลูกค้าได้' });
    }
  }

  static async updateByPhone(req, res) {
    try {
      const phone = req.params.phone?.trim();
      const { name, address } = req.body;

      if (!CustomerController.checkNull(phone) || !CustomerController.checkPhoneFormat(phone)) {
        return res.status(400).json({ message: 'เบอร์โทรศัพท์ไม่ถูกต้อง' });
      }
      if (!CustomerController.checkNull(name) || !CustomerController.checkNull(address)) {
        return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบ' });
      }
      if (!CustomerController.checkLength(name, 1, 150)) {
        return res.status(400).json({ message: 'ชื่อต้องมีความยาวระหว่าง 1–150 ตัวอักษร' });
      }
      if (!CustomerController.checkLength(address, 1, 250)) {
        return res.status(400).json({ message: 'ที่อยู่ต้องมีความยาวระหว่าง 1–250 ตัวอักษร' });
      }
      await DB.query(
        'UPDATE Customer SET CustomerName=?, CustomerAddress=? WHERE CustomerPhone=?',
        [name, address, phone]
      );

      const rows = await DB.query('SELECT * FROM Customer WHERE CustomerPhone=?', [phone]);
      if (!rows.length) {
        return res.status(404).json({ message: 'ไม่พบบัญชีลูกค้า' });
      }

      const updated = new Customer(rows[0]);
      res.json(updated);

    } catch (err) {
      console.error('❌ updateByPhone error:', err);
      res.status(500).json({ message: 'อัปเดตข้อมูลไม่สำเร็จ' });
    }
  }

  static async getById(req, res) {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) {
        return res.status(400).json({ message: 'รหัสลูกค้าไม่ถูกต้อง' });
      }

      const customer = await this.findCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: 'ไม่พบบัญชีลูกค้า' });
      }

      res.json(customer);
    } catch (err) {
      console.error('❌ getById error:', err);
      res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลลูกค้าได้' });
    }
  }
}

module.exports = CustomerController;
