const CompanyService = require('../services/CompanyService');
const CompanyController = {
  async list(req, res) {
    try {
      const companies = await CompanyService.list();
      res.json(companies);
    } catch (err) {
      console.error('❌ Error in CompanyController.list:', err);
      res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลบริษัทขนส่งได้' });
    }
  }
};
module.exports = CompanyController;
