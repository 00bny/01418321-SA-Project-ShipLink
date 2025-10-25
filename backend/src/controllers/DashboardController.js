const DashboardService = require('../services/DashboardService');

class DashboardController {
  static async staffSummary(req, res) {
    try {
      const branchId = Number(req.query.branchId || 1);
      const data = await DashboardService.getStaffSummary(branchId);
      res.json(data);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async listReturnPendingContact(req, res) {
    try {
      const branchId = Number(req.query.branchId || 1);
      const rows = await DashboardService.getReturnPendingContact(branchId);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async markReturnContacted(req, res) {
    try {
      const orderId = Number(req.params.orderId);
      const out = await DashboardService.markReturnContacted(orderId);
      res.json(out);
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }

  static async managerSummary(req, res) {
    try {
      const branchId = Number(req.query.branchId || 1);
      const data = await DashboardService.getManagerSummary(branchId);
      res.json(data);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }
}

module.exports = DashboardController;
