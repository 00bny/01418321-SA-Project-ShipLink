const DB = require('../config/DBConnector');
const Employee = require('../models/Employee');

class EmployeeService {
  static async getByPhone(phone) {
    const rows = await DB.query('SELECT * FROM Employee WHERE EmployeePhone = ?', [phone]);
    return rows[0] ? new Employee(rows[0]) : null;
    }

  static async create({ name, phone, passwordHash, position = 'Staff', branchId }) {
    const sql = `INSERT INTO Employee (EmployeeName,EmployeePhone,EmployeePassword,EmployeePosition,BranchID)
                 VALUES (?,?,?,?,?)`;
    const result = await DB.query(sql, [name, phone, passwordHash, position, branchId]);
    const [row] = await DB.query('SELECT * FROM Employee WHERE EmployeeID=?', [result.insertId]);
    return new Employee(row);
  }
}

module.exports = EmployeeService;
