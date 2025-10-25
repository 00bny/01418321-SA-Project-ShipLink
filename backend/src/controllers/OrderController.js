const OrderService = require('../services/OrderService');
const DB = require('../config/DBConnector');

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

  static async listPickedUpOrders(req, res) {
    try {
      const companyId = req.params.companyId;

      const rows = await DB.query(`
        SELECT 
          O.OrderID,
          C.CustomerName AS ReceiverName,
          C.CustomerAddress AS ReceiverAddress,
          C.CustomerPhone AS ReceiverPhone,
          O.OrderStatus
        FROM \`Order\` AS O
        INNER JOIN Customer AS C 
          ON O.ReceiverID = C.CustomerID
        WHERE O.CompanyID = ?
          AND (
            O.OrderStatus = 'Pickup'
            OR O.OrderStatus = 'In Transit'
            OR O.OrderStatus = 'Success'
            OR O.OrderStatus = 'Fail'
          )
        ORDER BY O.OrderID
      `, [companyId]);

      res.json(rows);
    } catch (error) {
      console.error("🔥 SQL ERROR:", error);
      res.status(500).json({ message: "โหลดข้อมูลพัสดุไม่สำเร็จ" });
    }
  }

  static async updateStatus(req, res) {
    try {
      const orderId = Number(req.params.id);
      const { status, failReason } = req.body;

      await DB.query(
        "UPDATE `Order` SET OrderStatus=?, FailReason=? WHERE OrderID=?",
        [status, failReason || null, orderId]
      );

      res.json({ message: "อัปเดตสถานะสำเร็จ ✅" });
    } catch (error) {
      console.error("updateStatus error:", error);
      res.status(500).json({ message: "อัปเดตสถานะล้มเหลว ❌" });
    }
  }

}

module.exports = OrderController;
