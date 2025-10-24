const DB = require('../config/DBConnector');

function calcShipCost({ width, height, length, weight, rate }) {
  const volumetric = (width * height * length) / 5000;
  const billWeight = Math.max(weight, volumetric);
  return +(billWeight * rate).toFixed(2);
}

class OrderService {
  static async resolveBranchId({ branchId, employeeId }) {
    if (branchId) return branchId;
    const rows = await DB.query('SELECT BranchID FROM Employee WHERE EmployeeID=?', [employeeId]);
    return rows[0]?.BranchID || 1;
  }

  static async createDraftOrder({
    senderId, receiverId, employeeId, companyId,
    parcelType, width, height, length, weight, addOnCost = 0,
    branchId
  }) {
    const [sc] = await DB.query('SELECT ShippingRate FROM ShippingCompany WHERE CompanyID=?', [companyId]);
    const shipCost = calcShipCost({ width, height, length, weight, rate: sc.ShippingRate });

    const resolvedBranchId = await this.resolveBranchId({ branchId, employeeId });

    const result = await DB.query(`
      INSERT INTO \`Order\`
      (ParcelType, Width, Height, Length, Weight, ShipCost, AddOnCost,
       SenderID, ReceiverID, EmployeeID, CompanyID, BranchID)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [parcelType, width, height, length, weight, shipCost, addOnCost,
       senderId, receiverId, employeeId, companyId, resolvedBranchId]
    );
    const [row] = await DB.query('SELECT * FROM \`Order\` WHERE OrderID=?', [result.insertId]);
    return row;
  }

  static async listUnpaidByBranch(branchId) {
    return DB.query(
      'SELECT * FROM `Order` WHERE OrderStatus="Pending" AND BranchID=? ORDER BY OrderID DESC',
      [branchId]
    );
  }
}

module.exports = OrderService;
