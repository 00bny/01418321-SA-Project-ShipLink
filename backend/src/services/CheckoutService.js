const DB = require('../config/DBConnector');

function genTracking() {
  return 'TH' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

class CheckoutService {
  static async payAll({ employeeId }) {
    const conn = await DB.getConnection();
    try {
      await conn.beginTransaction();

      // 1) รวมยอดรอชำระ (UC-08: step 2-3)
      const [orders] = await conn.execute(
        'SELECT OrderID, ShipCost, AddOnCost, EmployeeID, CompanyID FROM `Order` WHERE OrderStatus="รอชำระเงิน" AND EmployeeID=?',
        [employeeId]
      );
      const total = orders.reduce((s, o) => s + Number(o.ShipCost) + Number(o.AddOnCost), 0);

      // 2) ดูกระเป๋าสาขา (หา branch + wallet จาก employee)
      const [[emp]] = await conn.execute(
        'SELECT E.EmployeeID, B.BranchID, B.WalletID FROM Employee E JOIN Branch B ON E.BranchID=B.BranchID WHERE E.EmployeeID=?',
        [employeeId]
      );
      const [[wal]] = await conn.execute('SELECT Balance FROM Wallet WHERE WalletID=?', [emp.WalletID]);
      if (!wal || Number(wal.Balance) < total) {
        throw new Error('ยอดเงินใน Wallet ไม่พอ');
      }

      // 3) หักเงิน wallet สาขา (UC-08: step 6)
      await conn.execute('UPDATE Wallet SET Balance=Balance-? WHERE WalletID=?', [total, emp.WalletID]);

      // 4) บันทึกประวัติ (UC-08: step 7)
      await conn.execute(
        'INSERT INTO TransactionHist (WalletID, EmployeeID, BranchID, CompanyID, TransactionAmount, TransactionType) VALUES (?,?,?,?,?,"PAYMENT")',
        [emp.WalletID, employeeId, emp.BranchID, null, total]
      );

      // 5) อัปเดตสถานะ + tracking (UC-08: step 8-9)
      for (const o of orders) {
        const tracking = genTracking();
        await conn.execute(
          'UPDATE `Order` SET OrderStatus="ชำระเงินแล้ว", TrackingNumber=? WHERE OrderID=?',
          [tracking, o.OrderID]
        );
      }

      await conn.commit();
      return { total, count: orders.length };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
}
module.exports = CheckoutService;
