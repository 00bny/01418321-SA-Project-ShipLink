const DB = require('../config/DBConnector');
const Order = require('../models/Order');

function calcVolumetric({ width, height, length }) {
  return (Number(width) * Number(height) * Number(length)) / 5000.0;
}

function calcBillWeight({ weight, volumetric }) {
  return Math.max(Number(weight), Number(volumetric));
}

function calcShipCost(width, height, length, weight, rate) {
  const vol = calcVolumetric({ width, height, length });
  const bill = calcBillWeight({ weight, volumetric: vol });
  return +(bill * Number(rate)).toFixed(2);
}

function checkNull(value) {
  if (value === undefined || value === null)
    return false;
  if (typeof value === 'string' && value.trim() === '')
    return false;
  return true;
  }

function checkPositiveInt(n, { allowZero = false } = {}) {
  const v = Number(n);
  if (!Number.isInteger(v))
    return false;
  return allowZero ? v >= 0 : v > 0;
}

function checkPositiveDec(n, { allowZero = false } = {}) {
  const v = Number(n);
  if (!Number.isFinite(v))
    return false;
  return allowZero ? v >= 0 : v > 0;
}

function checkParcelDims({ width, length, height, weight }) {
  if (!checkPositiveInt(width) || !checkPositiveInt(length) || !checkPositiveInt(height))
    return false;
  if (!checkPositiveDec(weight))
    return false;
  if (width > 100 || length > 100 || height > 100)
    return false;
  if ((width + length + height) > 180)
    return false;
  if (weight > 20)
    return false;
  return true;
}

function calProfit(ship , share) {
  return +(ship * (share / 100)).toFixed(2);
}

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

class OrderController {
  static async calculateQuote(req, res) {
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
        const shipCost = calcShipCost(w, h, l, wt, c.ShippingRate);
        const profit   = calProfit(shipCost , c.ShippingRate);
        return {
          companyId: c.CompanyID,
          companyName: c.CompanyName,
          shipCostCustomer: shipCost,
          profit
        };
      });

      res.json({ size: { w, h, l, weight: wt }, quotes });
    } catch (e) { res.status(500).json({ message: e.message }); }
  }

  static async createDraft(req, res) {
    const conn = await DB.getConnection();
    try {
      await conn.beginTransaction();
      const {
        senderId, receiverId, employeeId, companyId,
        parcelType, width, height, length, weight, addOnCost = 0, branchId,
      } = req.body;

      if (!checkParcelDims({ width, length, height, weight })) {
        await conn.rollback();
        return res.status(400).json({ message: 'ขนาด/น้ำหนักพัสดุไม่ผ่านเกณฑ์' });
      }

      if (!checkNull(parcelType)) {
        await conn.rollback();
        return res.status(400).json({ message: 'ประเภทพัสดุไม่ถูกต้อง' });
      }

      if (!checkPositiveDec(addOnCost, { allowZero: true })) {
        await conn.rollback();
        return res.status(400).json({ message: 'ค่า Add-on ไม่ถูกต้อง' });
      }

      const [[sc]] = await conn.query('SELECT ShippingRate, SharePercent FROM ShippingCompany WHERE CompanyID=?', [companyId]);
      if (!sc) throw new Error('ไม่พบบริษัทขนส่ง');

      const shipCost = calcShipCost(width, height, length, weight, sc.ShippingRate);

      const [result] = await conn.query(`
        INSERT INTO \`Order\`
        (ParcelType, Width, Height, Length, Weight, ShipCost, AddOnCost,
         SenderID, ReceiverID, EmployeeID, CompanyID, BranchID)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [parcelType, width, height, length, weight, shipCost, addOnCost,
         senderId, receiverId, employeeId, companyId, branchId]
      );

      const [[order]] = await conn.query('SELECT * FROM `Order` WHERE OrderID=?', [result.insertId]);
      await conn.commit();
      res.status(201).json(order);
    } catch (e) {
      if (conn) await conn.rollback();
      res.status(500).json({ message: e.message });
    } finally {
      if (conn) conn.release();
    }
  }

  static async updateDraft(req, res) {
    const conn = await DB.getConnection();
    try {
      await conn.beginTransaction();
      const orderId = Number(req.params.id);
      const payload = req.body;

      const [[cur]] = await conn.query('SELECT * FROM `Order` WHERE OrderID=?', [orderId]);
      if (!cur)
        throw new Error('Order not found');
      if (cur.OrderStatus !== 'Pending')
        throw new Error('Cannot edit non-pending order');

      if (!checkParcelDims({ width, length, height, weight })) {
        await conn.rollback();
        return res.status(400).json({ message: 'ขนาด/น้ำหนักพัสดุไม่ผ่านเกณฑ์' });
      }

      if (!checkNull(parcelType)) {
        await conn.rollback();
        return res.status(400).json({ message: 'ประเภทพัสดุไม่ถูกต้อง' });
      }

      if (!checkPositiveDec(addOnCost, { allowZero: true })) {
        await conn.rollback();
        return res.status(400).json({ message: 'ค่า Add-on ไม่ถูกต้อง' });
      }

      const [[sc]] = await conn.query('SELECT ShippingRate FROM ShippingCompany WHERE CompanyID=?', [payload.companyId]);
      if (!sc) {
        await conn.rollback();
        return res.status(400).json({ message: 'ไม่พบบริษัทขนส่ง' });
      }

      const shipCost = calcShipCost(width, height, length, weight, sc.ShippingRate);

      await conn.query(`
        UPDATE \`Order\`
        SET ParcelType=?, Width=?, Height=?, Length=?, Weight=?,
            ShipCost=?, AddOnCost=?,
            SenderID=?, ReceiverID=?, EmployeeID=?, CompanyID=?, BranchID=?
        WHERE OrderID=?`,
        [
          payload.parcelType, payload.width, payload.height, payload.length, payload.weight,
          shipCost, payload.addOnCost || 0,
          payload.senderId, payload.receiverId, payload.employeeId, payload.companyId, payload.branchId,
          orderId,
        ]
      );

      const [[updated]] = await conn.query('SELECT * FROM `Order` WHERE OrderID=?', [orderId]);
      await conn.commit();
      res.json(updated);
    } catch (e) {
      if (conn) await conn.rollback();
      res.status(400).json({ message: e.message });
    } finally {
      if (conn) conn.release();
    }
  }

  static async getOne(req, res) {
    try {
      const [[row]] = await DB.query('SELECT * FROM `Order` WHERE OrderID=?', [req.params.id]);
      if (!row) return res.status(404).json({ message: 'not found' });
      res.json(row);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async removePending(req, res) {
    try {
      const orderId = Number(req.params.id);
      const [[cur]] = await DB.query('SELECT * FROM `Order` WHERE OrderID=?', [orderId]);
      if (!cur)
        throw new Error('Order not found');
      if (cur.OrderStatus !== 'Pending')
        throw new Error('Cannot delete non-pending order');

      await DB.query('DELETE FROM `Order` WHERE OrderID=?', [orderId]);
      res.json({ message: 'deleted', deleted: true });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  }

  static async listUnpaid(req, res) {
    try {
      const branchId = Number(req.query.branchId);
      const rows = await DB.query('SELECT * FROM `Order` WHERE OrderStatus="Pending" AND BranchID=? ORDER BY OrderID DESC', [branchId]);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async listByBranch(req, res) {
    try {
      const branchId = Number(req.query.branchId);
      const sql = `
        SELECT o.OrderID, o.OrderStatus, o.OrderDate, o.UpdatedAt,
               c.CustomerName AS SenderName,
               e.EmployeeName,
               s.CompanyName
        FROM \`Order\` o
        JOIN Customer c ON c.CustomerID = o.SenderID
        LEFT JOIN Employee e ON e.EmployeeID = o.EmployeeID
        LEFT JOIN ShippingCompany s ON s.CompanyID = o.CompanyID
        WHERE o.BranchID = ?
        ORDER BY o.OrderID DESC`;
      const rows = await DB.query(sql, [branchId]);
      const result = rows.map(r => ({
        orderId: r.OrderID,
        status: r.OrderStatus,
        statusTH: STATUS_TH[r.OrderStatus] || r.OrderStatus,
        senderName: r.SenderName || '-',
        employeeName: r.EmployeeName || '-',
        companyName: r.CompanyName || '-',
        orderDate: r.OrderDate ? new Date(r.OrderDate) : null,
        updatedAt: r.UpdatedAt ? new Date(r.UpdatedAt) : null,
      }));
      res.json(result);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  }

  static async listPickedUpOrders(req, res) {
    try {
      const companyId = req.params.companyId;
      const rows = await DB.query(`
        SELECT 
          O.OrderID,
          C.CustomerName AS ReceiverName,
          C.CustomerAddress AS ReceiverAddress,
          C.CustomerPhone AS ReceiverPhone,
          O.OrderStatus
        FROM \`Order\` AS O
        INNER JOIN Customer AS C ON O.ReceiverID = C.CustomerID
        WHERE O.CompanyID = ?
          AND O.OrderStatus IN ('Pickup','In Transit','Success','Fail')
        ORDER BY O.OrderID DESC
      `, [companyId]);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ message: "โหลดข้อมูลพัสดุไม่สำเร็จ" });
    }
  }

  static async updateStatus(req, res) {
    try {
      const { status, failReason } = req.body;
      await DB.query("UPDATE `Order` SET OrderStatus=?, FailReason=? WHERE OrderID=?", [status, failReason || null, req.params.id]);
      res.json({ message: "อัปเดตสถานะสำเร็จ ✅" });
    } catch (error) {
      res.status(500).json({ message: "อัปเดตสถานะล้มเหลว ❌" });
    }
  }

  static async deliverSuccess(req, res) {
    const conn = await DB.getConnection();
    try {
      await conn.beginTransaction();
      const orderId = Number(req.params.id);

      const [orders] = await conn.query(`
        SELECT O.*, B.WalletID AS BranchWalletID, S.WalletID AS CompanyWalletID, S.SharePercent
        FROM \`Order\` O
        JOIN Branch B ON O.BranchID = B.BranchID
        JOIN ShippingCompany S ON O.CompanyID = S.CompanyID
        WHERE O.OrderID = ? FOR UPDATE`, [orderId]);

      if (!orders.length) throw new Error("Order not found");
      const order = orders[0];
      const shipCost = Number(order.ShipCost || 0);
      const share = Number(order.SharePercent || 0);
      const branchEarn = shipCost * (share / 100);
      const companyEarn = shipCost - branchEarn;

      await conn.query(`UPDATE Wallet SET Balance = Balance + ? WHERE WalletID=?`, [companyEarn, order.CompanyWalletID]);
      await conn.query(`UPDATE Wallet SET Balance = Balance + ? WHERE WalletID=?`, [branchEarn, order.BranchWalletID]);
      await conn.query(`UPDATE \`Order\` SET OrderStatus='Success' WHERE OrderID=?`, [orderId]);

      await conn.query(`
        INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, CompanyID)
        VALUES (?, 'รับเงินค่าขนส่ง', ?, ?)`, [companyEarn, order.CompanyWalletID, order.CompanyID]);

      await conn.query(`
        INSERT INTO TransactionHist (TransactionAmount, TransactionType, WalletID, BranchID)
        VALUES (?, 'รับเงินค่าขนส่ง', ?, ?)`, [branchEarn, order.BranchWalletID, order.BranchID]);

      await conn.commit();
      res.json({ message: 'จัดส่งสำเร็จและอัปเดตรายได้แล้ว ✅', branchEarn, companyEarn });
    } catch (err) {
      if (conn) await conn.rollback();
      res.status(500).json({ message: err.message });
    } finally {
      if (conn) conn.release();
    }
  }
}

module.exports = OrderController;
