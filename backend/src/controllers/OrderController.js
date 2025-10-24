const OrderService = require('../services/OrderService');

class OrderController {
  static async createDraft(req, res) {
    try {
      const payload = req.body;
      const order = await OrderService.createDraftOrder(payload);
      res.status(201).json(order);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }

  static async listUnpaid(req, res) {
    try {
      // ตอนนี้ fix BranchID = 1 หากไม่ได้ส่งมา
      const branchId = Number(req.query.branchId || 1);
      const rows = await OrderService.listUnpaidByBranch(branchId);
      res.json(rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
}

module.exports = OrderController;
