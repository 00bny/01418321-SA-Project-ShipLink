const CompanyService = require('../services/CompanyService');
class CompanyController {
  static async list(req, res) {
    try {
      const rows = await CompanyService.list();
      res.json(rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
}
module.exports = CompanyController;
