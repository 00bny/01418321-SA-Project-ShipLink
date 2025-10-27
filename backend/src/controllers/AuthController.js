const bcrypt = require('bcryptjs');
const EmployeeController = require('./EmployeeController');
const CompanyController = require('./CompanyController');

function checkNull(value) {
  if (value === undefined || value === null)
    return false;
  if (typeof value === 'string' && value.trim() === '')
    return false;
  return true;
}

function checkLength(value, min, max) {
  if (typeof value !== 'string')
    return false;
  const len = value.trim().length;
  if (len < min || len > max)
    return false;
  return true;
}

function checkPhoneFormat(phone) {
  if (typeof phone !== 'string')
    return false;
  return /^[0-9]+$/.test(phone.trim());
}

function checkConfirmPassword(password, confirmPassword) {
  return password == confirmPassword;
}

class AuthController {
  static async registerEmployee(req, res) {
    try {
      const { name, phone, password, position = 'Staff', branchId, confirmPassword } = req.body;
      
      if (!checkNull(phone)) {
        return res.status(400).json({ message: 'กรุณากรอกเบอร์โทรศัพท์' });
      }
      if (!checkPhoneFormat(phone)) {
        return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น' });
      }
      if (!checkConfirmPassword(password, confirmPassword)) {
        return res.status(400).json({ message: 'รหัสผ่านไม่ตรงกัน' });
      }
      if (!checkLength(name, 1, 60)) {
        return res.status(400).json({ message: 'ชื่อต้องมีความยาวระหว่าง 1–60 ตัวอักษร' });
      }

      const exists = await EmployeeController.getByPhone(phone);
      if (exists) {
        return res.status(409).json({ message: 'เบอร์โทรศัพท์นี้ถูกลงทะเบียนแล้ว' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const emp = await EmployeeController.create({
        name,
        phone,
        passwordHash: hashed,
        position,
        branchId
      });

      return res.status(201).json(emp);
    } catch (err) {
      console.error('❌ registerEmployee error:', err);
      return res.status(500).json({ message: err.message });
    }
  }

  static async registerCompany(req, res) {
    try {
      const { name, phone, password, shippingRate = 15.00, sharePercent = 10.00, walletId } = req.body;
      if (!name || !phone || !password) {
        return res.status(400).json({ message: 'name/phone/password required' });
      }

      const exists = await CompanyController.getByPhone(phone);
      if (exists) {
        return res.status(409).json({ message: 'เบอร์โทรศัพท์นี้ถูกลงทะเบียนแล้ว' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const comp = await CompanyController.create({
        name,
        phone,
        passwordHash: hashed,
        shippingRate,
        sharePercent,
        walletId
      });

      return res.status(201).json(comp);
    } catch (err) {
      console.error('❌ registerCompany error:', err);
      return res.status(500).json({ message: err.message });
    }
  }

  static async login(req, res) {
    try {
      const { role, phone, password } = req.body;
      if (!role || !phone || !password) {
        return res.status(400).json({ message: 'role/phone/password required' });
      }

      if (role === 'employee') {
        const emp = await EmployeeController.verifyPassword(phone, password);
        if (!emp) return res.status(401).json({ message: 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง' });

        return res.json({
          role: 'employee',
          employee: {
            EmployeeID: emp.EmployeeID,
            EmployeeName: emp.EmployeeName,
            EmployeePosition: emp.EmployeePosition,
            BranchID: emp.BranchID
          }
        });
      }

      if (role === 'company') {
        const comp = await CompanyController.verifyPassword(phone, password);
        if (!comp) return res.status(401).json({ message: 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง' });

        return res.json({
          role: 'company',
          company: {
            CompanyID: comp.CompanyID,
            CompanyName: comp.CompanyName
          }
        });
      }

      return res.status(400).json({ message: 'invalid role' });
    } catch (err) {
      console.error('❌ login error:', err);
      return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AuthController;
