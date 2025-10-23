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
      const { employeeId } = req.query;
      const rows = await OrderService.listUnpaid(employeeId);
      res.json(rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
}
module.exports = OrderController;
