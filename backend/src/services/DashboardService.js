const DB = require('../config/DBConnector');

const STATUS_TH = {
  Pending   : 'รอชำระเงิน',
  Paid      : 'ชำระเงินแล้ว',
  Pickup    : 'เข้ารับพัสดุแล้ว',
  'In Transit': 'อยู่ระหว่างจัดส่ง',
  Success   : 'จัดส่งเสร็จสิ้น',
  Fail      : 'จัดส่งไม่สำเร็จ',
  Return    : 'ตีกลับ'
};

class DashboardService {
  static async getStaffSummary(branchId) {
    const [[today]] = await Promise.all([
      DB.query(
        `SELECT
           SUM(CASE WHEN DATE(OrderDate)=CURDATE() THEN 1 ELSE 0 END) AS todayCount,
           SUM(CASE WHEN YEAR(OrderDate)=YEAR(CURDATE())
                     AND MONTH(OrderDate)=MONTH(CURDATE()) THEN 1 ELSE 0 END) AS monthCount,
           COUNT(*) AS totalCount
         FROM \`Order\`
         WHERE BranchID=?`, [branchId]
      )
    ]);

    const byStatus = await DB.query(
      `SELECT OrderStatus, COUNT(*) AS cnt
         FROM \`Order\`
        WHERE BranchID=?
        GROUP BY OrderStatus`, [branchId]
    );

    const statusCounts = Object.fromEntries(
      byStatus.map(r => [r.OrderStatus, Number(r.cnt)])
    );

    return {
      counts: {
        today: Number(today?.todayCount || 0),
        month: Number(today?.monthCount || 0),
        total: Number(today?.totalCount || 0)
      },
      statusCounts,
      statusTH: STATUS_TH
    };
  }

  static async getReturnPendingContact(branchId) {
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

  static async markReturnContacted(orderId) {
    const [cur] = await DB.query('SELECT OrderID, OrderStatus FROM `Order` WHERE OrderID=?', [orderId]);
    if (!cur) throw new Error('Order not found');
    if (cur.OrderStatus !== 'Return') throw new Error('Not a return order');

    await DB.query(
      'UPDATE `Order` SET IsReturnContacted = TRUE, UpdatedAt = NOW() WHERE OrderID=?',
      [orderId]
    );
    return { updated: true, orderId };
  }
}

module.exports = DashboardService;
