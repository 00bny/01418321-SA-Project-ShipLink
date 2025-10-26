const DB = require('../config/db');

class OrderStatusController {
  static async updateStatus(req, res) {
    const orderId = req.params.orderId;
    const { action } = req.body; // "retry" | "return"

    try {
      const [[order]] = await DB.query(
        `SELECT OrderStatus, ReturnCount FROM \`Order\` WHERE OrderID=?`,
        [orderId]
      );
      if (!order) return res.status(404).json({ message: 'Order not found' });

      let newStatus = order.OrderStatus;
      let newCount = order.ReturnCount || 0;

      if (action === 'retry' && order.OrderStatus === 'Fail' && newCount === 0) {
        newStatus = 'Pickup';
        newCount += 1;
      }
      else if (action === 'return' && order.OrderStatus === 'Fail') {
        newStatus = 'Return';
      }
      else {
        return res.status(400).json({ message: 'Action not allowed' });
      }

      await DB.query(
        `UPDATE \`Order\`
         SET OrderStatus=?, ReturnCount=?
         WHERE OrderID=?`,
        [newStatus, newCount, orderId]
      );

      res.json({ message: 'Order updated', newStatus, newCount });
    } catch (err) {
      console.error("updateStatus Error:", err);
      res.status(500).json({ message: 'Failed to update status' });
    }
  }
}

module.exports = OrderStatusController;
