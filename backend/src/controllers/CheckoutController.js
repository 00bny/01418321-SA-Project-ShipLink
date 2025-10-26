const CheckoutService = require('../services/CheckoutService');

class CheckoutController {
  static async paySelected(req, res) {
    try {
      const { branchId, employeeId, orderIds } = req.body;
      if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ message: 'กรุณาเลือกออร์เดอร์อย่างน้อย 1 รายการ' });
      }

      const result = await CheckoutService.payOrders({ branchId, employeeId, orderIds });
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}
module.exports = CheckoutController;
