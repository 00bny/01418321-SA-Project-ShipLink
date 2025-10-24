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

  static async getById(orderId) {
    const rows = await DB.query('SELECT * FROM `Order` WHERE OrderID=?', [orderId]);
    return rows[0] || null;
  }

  static async createDraftOrder({
    senderId, receiverId, employeeId, companyId,
    parcelType, width, height, length, weight, addOnCost = 0,
    branchId
  }) {
    const [sc] = await DB.query('SELECT ShippingRate, SharePercent FROM ShippingCompany WHERE CompanyID=?', [companyId]);
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

  static async updateDraftOrder(orderId, {
    senderId, receiverId, employeeId, companyId,
    parcelType, width, height, length, weight, addOnCost = 0,
    branchId
  }) {
    // อนุญาตอัปเดตเฉพาะ Pending
    const cur = await this.getById(orderId);
    if (!cur) throw new Error('Order not found');
    if (cur.OrderStatus !== 'Pending') throw new Error('Cannot edit non-pending order');

    const [sc] = await DB.query('SELECT ShippingRate FROM ShippingCompany WHERE CompanyID=?', [companyId]);
    const shipCost = calcShipCost({ width, height, length, weight, rate: sc.ShippingRate });
    const resolvedBranchId = await this.resolveBranchId({ branchId, employeeId });

    await DB.query(`
      UPDATE \`Order\`
      SET ParcelType=?, Width=?, Height=?, Length=?, Weight=?,
          ShipCost=?, AddOnCost=?,
          SenderID=?, ReceiverID=?, EmployeeID=?, CompanyID=?, BranchID=?
      WHERE OrderID=?`,
      [parcelType, width, height, length, weight,
       shipCost, addOnCost,
       senderId, receiverId, employeeId, companyId, resolvedBranchId,
       orderId]
    );
    return this.getById(orderId);
  }

  static async deletePending(orderId) {
    const cur = await this.getById(orderId);
    if (!cur) throw new Error('Order not found');
    if (cur.OrderStatus !== 'Pending') throw new Error('Cannot delete non-pending order');
    await DB.query('DELETE FROM `Order` WHERE OrderID=?', [orderId]);
    return { deleted: true };
  }

  static async listUnpaidByBranch(branchId) {
    return DB.query(
      'SELECT * FROM `Order` WHERE OrderStatus="Pending" AND BranchID=? ORDER BY OrderID DESC',
      [branchId]
    );
  }
}

module.exports = OrderService;
