const bcrypt = require('bcryptjs');
const EmployeeService = require('./EmployeeService');
const CompanyService  = require('./CompanyService');

class AuthService {
  // --- Register ---
  static async registerEmployee({ name, phone, password, position, branchId }) {
    const exists = await EmployeeService.getByPhone(phone);
    if (exists) { const e = new Error('employee phone already exists'); e.code = 'DUP'; throw e; }
    const hashed = await bcrypt.hash(password, 10);
    return EmployeeService.create({ name, phone, passwordHash: hashed, position, branchId });
  }

  static async registerCompany({ name, phone, password, shippingRate, sharePercent, walletId }) {
    const exists = await CompanyService.getByPhone(phone);
    if (exists) { const e = new Error('company phone already exists'); e.code = 'DUP'; throw e; }
    const hashed = await bcrypt.hash(password, 10);
    return CompanyService.create({ name, phone, passwordHash: hashed, shippingRate, sharePercent, walletId });
  }

  // --- Login ---
  static async login({ role, phone, password }) {
    if (role === 'employee') {
      const emp = await EmployeeService.getByPhone(phone);
      if (!emp) return null;
      const ok = await bcrypt.compare(password, emp.EmployeePassword);
      if (!ok) return null;
      return {
        role: 'employee',
        employee: {
          EmployeeID: emp.EmployeeID,
          EmployeeName: emp.EmployeeName,
          EmployeePosition: emp.EmployeePosition,
          BranchID: emp.BranchID
        },
        // อนาคต: สามารถ map path ตามตำแหน่ง (Manager/Staff) ได้ที่นี่
      };
    } else if (role === 'company') {
      const comp = await CompanyService.getByPhone(phone);
      if (!comp) return null;
      const ok = await bcrypt.compare(password, comp.CompanyPassword);
      if (!ok) return null;
      return {
        role: 'company',
        company: {
          CompanyID: comp.CompanyID,
          CompanyName: comp.CompanyName
        }
      };
    }
    return null;
  }
}

module.exports = AuthService;
