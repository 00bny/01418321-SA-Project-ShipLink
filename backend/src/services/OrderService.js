const DB = require('../config/DBConnector');

function calcShipCost({ width, height, length, weight, rate }) {
  const volumetric = (width * height * length) / 5000; // ตัวอย่างสูตร
  const billWeight = Math.max(weight, volumetric);
  return +(billWeight * rate).toFixed(2);
}

class OrderService {
  static async createDraftOrder({
    senderId, receiverId, employeeId, companyId,
    parcelType, width, height, length, weight, addOnCost = 0
  }) {
    // เอา rate ของบริษัท
    const [sc] = await DB.query('SELECT ShippingRate FROM ShippingCompany WHERE CompanyID=?', [companyId]);
    const shipCost = calcShipCost({ width, height, length, weight, rate: sc.ShippingRate });

    const result = await DB.query(`
      INSERT INTO \`Order\`
      (ParcelType, Width, Height, Length, Weight, ShipCost, AddOnCost,
       SenderID, ReceiverID, EmployeeID, CompanyID)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [parcelType, width, height, length, weight, shipCost, addOnCost,
       senderId, receiverId, employeeId, companyId]
    );
    const [row] = await DB.query('SELECT * FROM `Order` WHERE OrderID=?', [result.insertId]);
    return row;
  }

  static async listUnpaid(employeeId) {
    return DB.query(
      'SELECT * FROM `Order` WHERE OrderStatus="Pending" AND EmployeeID=?',
      [employeeId]
    );
  }
}
module.exports = OrderService;
