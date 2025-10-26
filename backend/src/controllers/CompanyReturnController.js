const DB = require('../config/db');

class CompanyReturnController {
  static async getReturnOrders(req, res) {
    const companyId = req.params.companyId;

    try {
      const [rows] = await DB.query(
        `SELECT 
           o.OrderID,
           c.CustomerName,
           c.CustomerAddress,
           c.CustomerPhone,
           o.FailReason,
           o.OrderStatus,
           o.ReturnCount
         FROM \`Order\` o
         JOIN Customer c ON o.ReceiverID = c.CustomerID
         WHERE o.CompanyID = ?
           AND (o.OrderStatus = 'Fail' OR o.OrderStatus = 'Return') OR o.ReturnCount > 0
         ORDER BY o.OrderID ASC`,
        [companyId]
      );

      res.json(rows);
    } catch (err) {
      console.error('❌ getReturnOrders Error:', err);
      res.status(500).json({ message: 'Failed to load return orders' });
    }
  }
}

module.exports = CompanyReturnController;
