const DB = require('../config/DBConnector');

function calcShipCost({ width, height, length, weight, rate }) {
  const volumetric = (width * height * length) / 5000.00;
  const billWeight = Math.max(weight, volumetric);
  return +(billWeight * rate).toFixed(2);
}

const STATUS_TH = {
  Pending   : 'รอชำระเงิน',
  Paid      : 'ชำระเงินแล้ว',
  Pickup    : 'เข้ารับพัสดุแล้ว',
  RequestedPickup : 'รอเข้ารับ',
  'In Transit': 'อยู่ระหว่างจัดส่ง',
  Success   : 'จัดส่งเสร็จสิ้น',
  Fail      : 'จัดส่งไม่สำเร็จ',
  Return    : 'ตีกลับ'
};

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

  static async listByBranch(branchId) {
    const sql = `
      SELECT
        o.OrderID, o.OrderStatus, o.OrderDate, o.UpdatedAt,
        c.CustomerName AS SenderName,
        e.EmployeeName,
        s.CompanyName
      FROM \`Order\` o
      JOIN Customer c ON c.CustomerID = o.SenderID
      LEFT JOIN Employee e ON e.EmployeeID = o.EmployeeID
      LEFT JOIN ShippingCompany s ON s.CompanyID = o.CompanyID
      WHERE o.BranchID = ?
      ORDER BY o.OrderID DESC
    `;
    const rows = await DB.query(sql, [branchId]);

    return rows.map(r => ({
      orderId: r.OrderID,
      status: r.OrderStatus,
      statusTH: STATUS_TH[r.OrderStatus] || r.OrderStatus,
      senderName: r.SenderName || '-',
      employeeName: r.EmployeeName || '-',
      companyName: r.CompanyName || '-',
      orderDate: r.OrderDate ? new Date(r.OrderDate) : null,
      updatedAt: r.UpdatedAt ? new Date(r.UpdatedAt) : null
    }));
  }

}

module.exports = OrderService;
