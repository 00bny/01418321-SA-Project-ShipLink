const CheckoutService = require('../services/CheckoutService');

class CheckoutController {
  static async payAll(req, res) {
    try {
      const { employeeId } = req.body;
      const result = await CheckoutService.payAll({ employeeId });
      res.json({ message: 'ชำระเงินเสร็จสิ้น', ...result });
    } catch (e) { res.status(400).json({ message: e.message }); }
  }
}
module.exports = CheckoutController;
