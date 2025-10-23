const DB = require('../config/DBConnector');

function volumetricKg({ w, h, l }) {
  const vol = (w * h * l) / 5000;                // สูตรตัวอย่าง
  return Math.max(vol, 0);
}
function calcFor(rate, w, h, l, weight) {
  const bill = Math.max(Number(weight), volumetricKg({ w, h, l }));
  return +(bill * Number(rate)).toFixed(2);
}

class QuoteController {
  static async calculate(req, res) {
    try {
      const { width, height, length, weight } = req.body;
      const w = Math.round(Number(width)||0);
      const h = Math.round(Number(height)||0);
      const l = Math.round(Number(length)||0);
      const wt = +(Number(weight)||0).toFixed(2);

      const companies = await DB.query(
        'SELECT CompanyID, CompanyName, ShippingRate, SharePercent FROM ShippingCompany'
      );

      const quotes = companies.map(c => {
        const shipCost = calcFor(c.ShippingRate, w, h, l, wt); // ค่าที่ลูกค้าจ่าย
        const profit   = +(shipCost * (Number(c.SharePercent)/100)).toFixed(2); // กำไรร้าน
        return {
          companyId: c.CompanyID,
          companyName: c.CompanyName,
          shipCostCustomer: shipCost,
          profit,
          etaDays: '1 - 2'
        };
      });

      res.json({ size: { w, h, l, weight: wt }, quotes });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }
}
module.exports = QuoteController;
