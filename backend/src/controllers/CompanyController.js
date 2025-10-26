const CompanyService = require('../services/CompanyService');
const CompanyController = {
  async list(req, res) {
    try {
      const branchId = req.query.branchId;
      if (!branchId) return res.status(400).json({ message: 'กรุณาระบุ branchId' });

      const companies = await CompanyService.list(branchId);
      res.json(companies);
    } catch (err) {
      console.error('❌ Error in CompanyController.list:', err);
      res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลบริษัทขนส่งได้' });
    }
  }
};
module.exports = CompanyController;
