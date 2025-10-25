const OrderService = require('../services/OrderService');

class OrderController {
  static async createDraft(req, res) {
    try {
      const payload = req.body;
      const order = await OrderService.createDraftOrder(payload);
      res.status(201).json(order);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }

  static async updateDraft(req, res) {
    try {
      const orderId = Number(req.params.id);
      const payload = req.body;
      const order = await OrderService.updateDraftOrder(orderId, payload);
      res.json(order);
    } catch (e) { res.status(400).json({ message: e.message }); }
  }

  static async getOne(req, res) {
    try {
      const orderId = Number(req.params.id);
      const row = await OrderService.getById(orderId);
      if (!row) return res.status(404).json({ message: 'not found' });
      res.json(row);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }

  static async removePending(req, res) {
    try {
      const orderId = Number(req.params.id);
      const out = await OrderService.deletePending(orderId);
      res.json({ message: 'deleted', ...out });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }

  static async listUnpaid(req, res) {
    try {
      const branchId = Number(req.query.branchId || 1);
      const rows = await OrderService.listUnpaidByBranch(branchId);
      res.json(rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }

  static async listByBranch(req, res) {
    try {
      const branchId = Number(req.query.branchId || 1);
      const rows = await OrderService.listByBranch(branchId);
      res.json(rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
}

module.exports = OrderController;
