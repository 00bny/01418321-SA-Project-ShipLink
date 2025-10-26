const DB = require('../config/DBConnector');

const STATUS_TH = {
  Pending: 'รอชำระเงิน',
  Paid: 'ชำระเงินแล้ว',
  RequestedPickup: 'รอขนส่งเข้ารับ',
  Pickup: 'เข้ารับพัสดุแล้ว',
  'In Transit': 'อยู่ระหว่างจัดส่ง',
  Success: 'จัดส่งเสร็จสิ้น',
  Fail: 'จัดส่งไม่สำเร็จ',
  Return: 'ตีกลับ',
};

class DashboardController {
  // ---------- helpers ----------
  static async _getStaffCounts(branchId){
    const sql = `
      SELECT
        SUM(CASE WHEN DATE(OrderDate)=CURDATE() THEN 1 ELSE 0 END) AS todayCount,
        SUM(CASE WHEN YEAR(OrderDate)=YEAR(CURDATE())
                  AND MONTH(OrderDate)=MONTH(CURDATE()) THEN 1 ELSE 0 END) AS monthCount,
        COUNT(*) AS totalCount
      FROM \`Order\`
      WHERE BranchID = ?
    `;
    const rows = await DB.query(sql, [branchId]);
    const row = rows[0] || {};
    return {
      today: Number(row.todayCount || 0),
      month: Number(row.monthCount || 0),
      total: Number(row.totalCount || 0),
    };
  }

  static async _getStatusCounts(branchId){
    const sql = `
      SELECT OrderStatus, COUNT(*) AS cnt
      FROM \`Order\`
      WHERE BranchID = ?
      GROUP BY OrderStatus
    `;
    const rows = await DB.query(sql, [branchId]);
    return Object.fromEntries(rows.map(r => [r.OrderStatus, Number(r.cnt || 0)]));
  }

  static async _getReturnPendingContact(branchId){
    const sql = `
      SELECT
        o.OrderID, o.UpdatedAt, o.SenderID,
        c.CustomerName, c.CustomerPhone
      FROM \`Order\` o
      JOIN Customer c ON c.CustomerID = o.SenderID
      WHERE o.BranchID = ?
        AND o.OrderStatus = 'Return'
        AND (o.IsReturnContacted IS NULL OR o.IsReturnContacted = 0)
      ORDER BY o.UpdatedAt DESC, o.OrderID DESC
    `;
    const rows = await DB.query(sql, [branchId]);
    return rows.map(r => ({
      orderId: r.OrderID,
      updatedAt: r.UpdatedAt,
      senderName: r.CustomerName,
      senderPhone: r.CustomerPhone
    }));
  }

  static async _getManagerCompanyCounts(branchId){
    const sql = `
      SELECT s.CompanyName, o.CompanyID, COUNT(*) AS cnt
      FROM \`Order\` o
      JOIN ShippingCompany s ON s.CompanyID = o.CompanyID
      WHERE o.BranchID = ?
      GROUP BY o.CompanyID, s.CompanyName
      ORDER BY cnt DESC, s.CompanyName ASC
    `;
    const rows = await DB.query(sql, [branchId]);
    return rows.map(r => ({
      companyId: r.CompanyID,
      companyName: r.CompanyName,
      count: Number(r.cnt || 0)
    }));
  }

  static async _getManagerEmployees(branchId){
    const sql = `
      SELECT e.EmployeeID, e.EmployeeName, e.EmployeePhone, 
             COUNT(o.OrderID) AS orderCount
      FROM Employee e
      LEFT JOIN \`Order\` o ON o.EmployeeID = e.EmployeeID
      WHERE e.BranchID = ?
      GROUP BY e.EmployeeID, e.EmployeeName, e.EmployeePhone
      ORDER BY orderCount DESC, e.EmployeeID ASC
    `;
    const rows = await DB.query(sql, [branchId]);
    return rows.map(r => ({
      id: r.EmployeeID,
      name: r.EmployeeName,
      phone: r.EmployeePhone,
      orderCount: Number(r.orderCount || 0)
    }));
  }

  // ---------- controllers ----------
  static async staffSummary(req, res){
    try{
      const branchId = Number(req.query.branchId || 1);

      const [counts, statusCounts] = await Promise.all([
        DashboardController._getStaffCounts(branchId),
        DashboardController._getStatusCounts(branchId),
      ]);

      res.json({ counts, statusCounts, statusTH: STATUS_TH });
    }catch(e){
      res.status(500).json({ message: e.message });
    }
  }

  static async listReturnPendingContact(req, res){
    try{
      const branchId = Number(req.query.branchId || 1);
      const rows = await DashboardController._getReturnPendingContact(branchId);
      res.json(rows);
    }catch(e){
      res.status(500).json({ message: e.message });
    }
  }

  static async markReturnContacted(req, res){
    try{
      const orderId = Number(req.params.orderId);

      const curRows = await DB.query('SELECT OrderID, OrderStatus FROM `Order` WHERE OrderID=?', [orderId]);
      const cur = curRows[0];
      if (!cur) throw new Error('Order not found');
      if (cur.OrderStatus !== 'Return') throw new Error('Not a return order');

      await DB.query('UPDATE `Order` SET IsReturnContacted = TRUE, UpdatedAt = NOW() WHERE OrderID=?', [orderId]);
      res.json({ updated: true, orderId });
    }catch(e){
      res.status(400).json({ message: e.message });
    }
  }

  static async managerSummary(req, res){
    try{
      const branchId = Number(req.query.branchId || 1);

      const [counts, statusCounts, companyCounts, employees] = await Promise.all([
        DashboardController._getStaffCounts(branchId),
        DashboardController._getStatusCounts(branchId),
        DashboardController._getManagerCompanyCounts(branchId),
        DashboardController._getManagerEmployees(branchId),
      ]);

      res.json({ counts, statusCounts, statusTH: STATUS_TH, companyCounts, employees });
    }catch(e){
      res.status(500).json({ message: e.message });
    }
  }
}

module.exports = DashboardController;
