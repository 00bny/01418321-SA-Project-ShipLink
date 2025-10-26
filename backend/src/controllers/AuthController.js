const AuthService = require('../services/AuthService');

class AuthController {
  static async registerEmployee(req, res) {
    try {
      const { name, phone, password, position = 'Staff', branchId } = req.body;
      if (!name || !phone || !password || !branchId) {
        return res.status(400).json({ message: 'name/phone/password/branchId required' });
      }
      const emp = await AuthService.registerEmployee({ name, phone, password, position, branchId });
      return res.status(201).json(emp);
    } catch (err) {
      const code = err.code === 'DUP' ? 409 : 500;
      return res.status(code).json({ message: err.message });
    }
  }

  static async registerCompany(req, res) {
    try {
      const { name, phone, password, shippingRate = 15.00, sharePercent = 10.00, walletId } = req.body;
      if (!name || !phone || !password) {
        return res.status(400).json({ message: 'name/phone/password required' });
      }
      const comp = await AuthService.registerCompany({ name, phone, password, shippingRate, sharePercent, walletId });
      return res.status(201).json(comp);
    } catch (err) {
      const code = err.code === 'DUP' ? 409 : 500;
      return res.status(code).json({ message: err.message });
    }
  }

  static async login(req, res) {
    try {
      const { role, phone, password } = req.body;
      if (!role || !phone || !password) {
        return res.status(400).json({ message: 'role/phone/password required' });
      }
      const result = await AuthService.login({ role, phone, password });
      if (!result) return res.status(401).json({ message: 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง' });
        return res.json(result);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
  }
}

module.exports = AuthController;
