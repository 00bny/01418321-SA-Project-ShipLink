const CustomerService = require('../services/CustomerService');

class CustomerController {
  static async searchByPhone(req, res) {
    try {
      const phone = (req.query.phone || '').trim();
      if (!phone) return res.status(400).json({ message: 'phone is required' });
      const customer = await CustomerService.getByPhone(phone);
      if (!customer) return res.status(404).json({ message: 'not found' });
      res.json(customer);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }

  static async create(req, res) {
    try {
      const { name, phone, address } = req.body;
      if (!name || !phone || !address) return res.status(400).json({ message: 'name/phone/address required' });
      const created = await CustomerService.create({ name, phone, address });
      res.status(201).json(created);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }

  static async updateByPhone(req, res) {
    try {
      const phone = req.params.phone;
      const { name, address } = req.body;
      if (!name || !address) return res.status(400).json({ message: 'name/address required' });
      const updated = await CustomerService.updateByPhone(phone, { name, address });
      res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }

  static async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const c = await CustomerService.getById(id);
      if (!c) return res.status(404).json({ message: 'not found' });
      res.json(c);
    } catch (err) { res.status(500).json({ message: err.message }); }
  }

}
module.exports = CustomerController;
