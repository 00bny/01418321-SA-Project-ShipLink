const DB = require('../config/DBConnector');
const bcrypt = require('bcryptjs');
const Employee = require('../models/Employee');

class EmployeeController {
  static async getByPhone(phone) {
    const rows = await DB.query('SELECT * FROM Employee WHERE EmployeePhone = ?', [phone]);
    return rows[0] ? new Employee(rows[0]) : null;
  }

  static async create({ name, phone, passwordHash, position = 'Staff', branchId }) {
    const conn = await DB.getConnection();
    try {
      await conn.beginTransaction();
      const sql = `INSERT INTO Employee (EmployeeName,EmployeePhone,EmployeePassword,EmployeePosition,BranchID)
                   VALUES (?,?,?,?,?)`;
      const [result] = await conn.query(sql, [name, phone, passwordHash, position, branchId]);
      const [rows] = await conn.query('SELECT * FROM Employee WHERE EmployeeID=?', [result.insertId]);
      await conn.commit();
      return new Employee(rows[0]);
    } catch (err) {
      if (conn) await conn.rollback();
      throw err;
    } finally {
      if (conn) conn.release();
    }
  }

  static async verifyPassword(phone, password) {
    const emp = await EmployeeController.getByPhone(phone);
    if (!emp) return null;
    const ok = await bcrypt.compare(password, emp.EmployeePassword);
    if (!ok) return null;
    return emp;
  }
}

module.exports = EmployeeController;
