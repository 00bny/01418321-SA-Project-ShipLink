const DB = require('../config/DBConnector');

function genTracking(orderId) {
  const ts = Date.now().toString().slice(-6);
  return `TH${ts}${orderId}`;
}

class CheckoutController {
  static async paySelected(req, res) {
    try {
      const { branchId, employeeId, orderIds } = req.body;
      const branchIdNum = Number(branchId);
      const employeeIdNum = Number(employeeId);
      const ids = Array.isArray(orderIds)
        ? orderIds.map(Number).filter(n => Number.isFinite(n))
        : [];

      if (!ids.length) {
        return res.status(400).json({ message: 'กรุณาเลือกออร์เดอร์อย่างน้อย 1 รายการ' });
      }

      // ------------------- เริ่ม transaction -------------------
      const conn = await DB.getConnection();
      try {
        await conn.beginTransaction();

        const [orders] = await conn.query(
          `SELECT OrderID, ShipCost, AddOnCost, CompanyID
             FROM \`Order\`
            WHERE OrderID IN (?) AND BranchID=? AND OrderStatus='Pending'`,
          [ids, branchIdNum]
        );

        if (!orders.length) {
          throw new Error('ไม่พบออร์เดอร์ที่รอชำระเงิน');
        }

        const [[w]] = await conn.query(
          `SELECT w.WalletID, w.Balance, b.BranchName
             FROM Branch b 
             JOIN Wallet w ON w.WalletID=b.WalletID
            WHERE b.BranchID=?`,
          [branchIdNum]
        );

        if (!w) throw new Error('ไม่พบกระเป๋าเงินของสาขา');

        let totalCut = 0;
        const updates = [];

        for (const o of orders) {
          const [[comp]] = await conn.query(
            `SELECT SharePercent FROM ShippingCompany WHERE CompanyID=?`,
            [o.CompanyID]
          );
          const share = Number(comp?.SharePercent ?? 0);
          const ship = Number(o.ShipCost ?? 0);
          const addOn = Number(o.AddOnCost ?? 0);

          const profit = +(ship * (share / 100)).toFixed(2);
          const cut = +(ship - profit + addOn).toFixed(2); // เงินที่ตัดจากสาขา
          totalCut = +(totalCut + cut).toFixed(2);

          updates.push({
            orderId: o.OrderID,
            cut,
            chargeCustomer: +(ship + addOn).toFixed(2)
          });
        }

        if (Number(w.Balance) < totalCut) {
          throw new Error(`ยอดเงินในกระเป๋าไม่เพียงพอ (ต้องใช้ ${totalCut.toFixed(2)} บาท)`);
        }

        await conn.query(
          `UPDATE Wallet SET Balance = Balance - ? WHERE WalletID = ?`,
          [totalCut, w.WalletID]
        );

        await conn.query(
          `INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, EmployeeID, BranchID)
           VALUES (?,?,?,?,?)`,
          [totalCut, 'WITHDRAW', w.WalletID, employeeIdNum || null, branchIdNum || null]
        );

        for (const u of updates) {
          const tracking = genTracking(u.orderId);
          await conn.query(
            `UPDATE \`Order\` 
                SET OrderStatus='Paid', TrackingNumber=? 
              WHERE OrderID=?`,
            [tracking, u.orderId]
          );
        }

        await conn.commit();
        res.json({
          message: 'PAY_OK',
          totalCut: totalCut.toFixed(2),
          paidOrders: updates.length,
          orders: updates
        });
      } catch (err) {
        await conn.rollback();
        res.status(400).json({ message: err.message });
      } finally {
        conn.release();
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = CheckoutController;
