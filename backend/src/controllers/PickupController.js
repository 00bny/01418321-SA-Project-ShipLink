const PickupService = require('../services/PickupService');

class PickupController {
  static async createRequest(req, res) {
    try {
      const { companyId, employeeId } = req.body;
      if (!companyId || !employeeId) {
        return res.status(400).json({ message: 'companyId/employeeId required' });
      }

      const result = await PickupService.createRequest({ companyId, employeeId });
      res.status(201).json(result);
    } catch (e) {
      console.error('Pickup error:', e);
      res.status(500).json({ message: e.message });
    }
  }

  static async listHistory(req, res) {
    try {
      const { branchId } = req.query;
      const rows = await PickupService.listHistory(branchId);
      res.json(rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
}

module.exports = PickupController;
