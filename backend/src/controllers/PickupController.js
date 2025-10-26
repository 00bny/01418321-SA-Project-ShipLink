const DB = require('../config/db');
const PickupService = require('../services/PickupService');

const PickupController = {

  // ======================================================
  // ✅ (11.x) POST /api/pickup/request — ฝั่งพนักงานสาขา
  // ======================================================
  async createPickupRequest(req, res) {
    try {
      const { companyId, employeeId } = req.body;
      if (!companyId) {
        return res.status(400).json({ message: 'Company ID required' });
      }

      // 1️⃣ ตรวจสอบว่ามีออร์เดอร์ที่ชำระเงินแล้วหรือไม่
      const [[countRow]] = await DB.query(`
        SELECT COUNT(*) AS totalPaid
        FROM \`Order\`
        WHERE CompanyID = ? AND OrderStatus = 'Paid'
      `, [companyId]);

      if (countRow.totalPaid === 0) {
        return res.status(400).json({ message: 'ไม่มีออร์เดอร์ที่ชำระเงินแล้วสำหรับบริษัทนี้' });
      }

      // 2️⃣ สร้างคำร้อง PickupRequest
      const [result] = await DB.query(`
        INSERT INTO PickupRequest (RequestStatus, CreatedDate, CompanyID, EmployeeID)
        VALUES ('RequestedPickup', DATE_ADD(NOW(), INTERVAL 7 HOUR), ?, ?)
      `, [companyId, employeeId]);

      if (!result.insertId) throw new Error('Insert failed');

      // 3️⃣ อัปเดตสถานะออร์เดอร์ของบริษัทนี้เป็น “รอเข้ารับ”
      await DB.query(`
        UPDATE \`Order\`
        SET OrderStatus = 'RequestedPickup', RequestID = ?
        WHERE CompanyID = ? AND OrderStatus = 'Paid'
      `, [result.insertId, companyId]);

      // 4️⃣ ตอบกลับสำเร็จ
      res.json({
        message: 'เรียกขนส่งสำเร็จ',
        requestId: result.insertId
      });

    } catch (err) {
      console.error('❌ createPickupRequest error:', err);
      res.status(500).json({ message: 'Failed to create pickup request' });
    }
  },

  // ======================================================
  // ✅ (11.x) GET /api/pickup/history — ฝั่งพนักงานสาขา
  // ======================================================
  async getPickupHistory(req, res) {
    try {
      const branchId = req.query.branchId;
      if (!branchId) {
        return res.status(400).json({ message: 'กรุณาระบุ BranchID' });
      }

      const [rows] = await DB.query(`
        SELECT 
          pr.RequestID AS RequestNo,
          sc.CompanyName AS ShippingCompany,
          pr.CreatedDate AS DateTime,
          pr.RequestStatus AS Status,
          e.EmployeeName AS Staff,
          b.BranchName
        FROM PickupRequest pr
        JOIN ShippingCompany sc ON pr.CompanyID = sc.CompanyID
        LEFT JOIN Employee e ON pr.EmployeeID = e.EmployeeID
        LEFT JOIN Branch b ON e.BranchID = b.BranchID
        WHERE b.BranchID = ?
        ORDER BY pr.CreatedDate DESC
      `, [branchId]);

      res.json(rows);
    } catch (err) {
      console.error('❌ getPickupHistory error:', err);
      res.status(500).json({ message: 'Failed to load pickup history' });
    }
  },

  // ======================================================
  // ✅ (12.1 + 12.2) GET /api/pickup/company/:id — ฝั่งบริษัทขนส่ง
  // ======================================================
  async getRequestsByCompany(req, res) {
    const companyId = req.params.id;
    try {
      const [requests] = await DB.query(`
        SELECT RequestID, CreatedDate, RequestStatus
        FROM PickupRequest
        WHERE CompanyID = ?
        ORDER BY CreatedDate DESC
      `, [companyId]);

      // ✅ ดึงจำนวนพัสดุของแต่ละคำขอ (query 12.2)
      for (let r of requests) {
        const [[countRow]] = await DB.query(`
          SELECT COUNT(*) AS ParcelCount
          FROM \`Order\`
          WHERE CompanyID = ? AND RequestID = ?
        `, [companyId, r.RequestID]);
        r.ParcelCount = countRow?.ParcelCount || 0;
      }

      res.json(requests);
    } catch (err) {
      console.error('❌ getRequestsByCompany error:', err);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอ' });
    }
  },

  // ======================================================
  // ✅ (12.3) POST /api/pickup/confirm — ฝั่งบริษัทขนส่ง
  // ======================================================
  async confirmPickup(req, res) {
    const { requestId, time, name, phone } = req.body;

    if (!requestId || !time || !name || !phone)
      return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });

    try {
      // 1️⃣ อัปเดตข้อมูลคำขอ PickupRequest
      await DB.query(`
        UPDATE PickupRequest
        SET ScheduledPickupTime = ?, PickupStaffName = ?, 
            PickupStaffPhone = ?, RequestStatus = 'PickingUp'
        WHERE RequestID = ?
      `, [time, name, phone, requestId]);

    //   // 2️⃣ อัปเดตสถานะของออร์เดอร์ที่อยู่ในคำขอนี้
    //   await DB.query(`
    //     UPDATE \`Order\`
    //     SET OrderStatus = 'กำลังเข้ารับ'
    //     WHERE RequestID = ?
    //   `, [requestId]);

      res.json({ message: 'ยืนยันคำเรียกเสร็จสิ้น' });
    } catch (err) {
      console.error('❌ confirmPickup error:', err);
      res.status(500).json({ message: 'ไม่สามารถอัปเดตคำขอได้' });
    }
  },

  async completePickup(req, res) {
    try {
        const requestId = req.params.id;
        await PickupService.completePickup(requestId);

        // 2️⃣ อัปเดตสถานะของออร์เดอร์ที่อยู่ในคำขอนี้
        await DB.query(`
            UPDATE \`Order\`
            SET OrderStatus = 'Pickup'
            WHERE RequestID = ?
        `, [requestId]);

        res.json({ message: 'อัปเดตสถานะเป็น เข้ารับสำเร็จ' });
    } catch (error) {
        console.error("completePickup Error:", error);
        res.status(500).json({ message: 'ไม่สามารถอัปเดตสถานะได้' });
    }
}

};

module.exports = PickupController;
