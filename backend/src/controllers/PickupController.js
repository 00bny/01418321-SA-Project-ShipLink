const DB = require('../config/DBConnector');

const PickupController = {
  async createPickupRequest(req, res) {
    let conn;
    try {
      const companyId = Number(req.body.companyId);
      const employeeId = Number(req.body.employeeId);
      const branchId   = Number(req.body.branchId);

      if (!companyId || !employeeId || !branchId) {
        return res.status(400).json({ message: 'CompanyID/EmployeeID/BranchID required' });
      }

      conn = await DB.getConnection();
      await conn.beginTransaction();

      const [countRows] = await conn.query(
        `SELECT COUNT(*) AS totalPaid
           FROM \`Order\`
          WHERE CompanyID = ? AND BranchID = ? AND OrderStatus = 'Paid'`,
        [companyId, branchId]
      );
      const totalPaid = Number(countRows?.[0]?.totalPaid || 0);
      if (totalPaid === 0) {
        await conn.rollback();
        return res.status(400).json({ message: 'ไม่มีออร์เดอร์ที่ชำระเงินแล้วสำหรับบริษัทนี้ในสาขานี้' });
      }

      const [ins] = await conn.query(
        `INSERT INTO PickupRequest (RequestStatus, CreatedDate, CompanyID, EmployeeID, BranchID)
         VALUES ('RequestedPickup', DATE_ADD(NOW(), INTERVAL 7 HOUR), ?, ?, ?)`,
        [companyId, employeeId, branchId]
      );
      const requestId = ins?.insertId;
      if (!requestId) throw new Error('Insert failed');

      await conn.query(
        `UPDATE \`Order\`
            SET OrderStatus = 'RequestedPickup', RequestID = ?
          WHERE CompanyID = ? AND BranchID = ? AND OrderStatus = 'Paid'`,
        [requestId, companyId, branchId]
      );

      await conn.commit();
      return res.json({ message: 'เรียกขนส่งสำเร็จ', requestId });
    } catch (err) {
      if (conn) await conn.rollback();
      console.error('❌ createPickupRequest error:', err);
      res.status(500).json({ message: 'Failed to create pickup request' });
    } finally {
      if (conn) conn.release();
    }
  },

  async getPickupHistory(req, res) {
    try {
      const branchId = Number(req.query.branchId);
      if (!branchId) {
        return res.status(400).json({ message: 'กรุณาระบุ BranchID' });
      }

      const rows = await DB.query(
        `SELECT 
           pr.RequestID             AS RequestNo,
           sc.CompanyName           AS ShippingCompany,
           pr.CreatedDate           AS CreatedTime,
           pr.ScheduledPickupTime   AS ScheduledTime,
           pr.ActualPickupTime      AS ActualTime,
           pr.RequestStatus         AS Status,
           COALESCE(pr.PickupStaffName,  '-') AS PickupStaff,
           COALESCE(pr.PickupStaffPhone, '-') AS PickupStaffPhone
         FROM PickupRequest pr
         JOIN ShippingCompany sc ON pr.CompanyID = sc.CompanyID
         LEFT JOIN Employee e     ON pr.EmployeeID = e.EmployeeID
        WHERE pr.BranchID = ?
        ORDER BY pr.CreatedDate DESC`,
        [branchId]
      );

      res.json(rows);
    } catch (err) {
      console.error('❌ getPickupHistory error:', err);
      res.status(500).json({ message: 'Failed to load pickup history' });
    }
  },

  async getRequestsByCompany(req, res) {
    try {
      const companyId = Number(req.params.id);
      if (!companyId) return res.status(400).json({ message: 'Invalid company id' });

      const rows = await DB.query(
        `SELECT 
          pr.RequestID,
          pr.CreatedDate,
          pr.RequestStatus,
          (
            SELECT COUNT(*) 
              FROM \`Order\` o 
              WHERE o.CompanyID = pr.CompanyID 
                AND o.RequestID = pr.RequestID
          ) AS ParcelCount,
          b.BranchName AS BranchName
        FROM PickupRequest pr
        LEFT JOIN Branch b ON pr.BranchID = b.BranchID
        WHERE pr.CompanyID = ?
        ORDER BY pr.CreatedDate DESC`,
        [companyId]
      );

      res.json(rows);
    } catch (err) {
      console.error('❌ getRequestsByCompany error:', err);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำขอ' });
    }
  },

  async confirmPickup(req, res) {
    try {
      const { requestId, time, name, phone } = req.body;
      if (!requestId || !time || !name || !phone) {
        return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
      }

      await DB.query(
        `UPDATE PickupRequest
            SET ScheduledPickupTime = ?, 
                PickupStaffName     = ?, 
                PickupStaffPhone    = ?, 
                RequestStatus       = 'PickingUp'
          WHERE RequestID = ?`,
        [time, name, phone, requestId]
      );

      res.json({ message: 'ยืนยันคำเรียกเสร็จสิ้น' });
    } catch (err) {
      console.error('❌ confirmPickup error:', err);
      res.status(500).json({ message: 'ไม่สามารถอัปเดตคำขอได้' });
    }
  },

  async completePickup(req, res) {
    let conn;
    try {
      const requestId = Number(req.params.id);
      if (!requestId) return res.status(400).json({ message: 'Invalid request id' });

      conn = await DB.getConnection();
      await conn.beginTransaction();

      await conn.query(
        `UPDATE PickupRequest
            SET RequestStatus   = 'PickedUp',
                ActualPickupTime = DATE_ADD(NOW(), INTERVAL 7 HOUR)
          WHERE RequestID = ?`,
        [requestId]
      );

      await conn.query(
        `UPDATE \`Order\`
            SET OrderStatus = 'Pickup'
          WHERE RequestID = ?`,
        [requestId]
      );

      await conn.commit();
      res.json({ message: 'อัปเดตสถานะเป็น เข้ารับสำเร็จ' });
    } catch (error) {
      if (conn) await conn.rollback();
      console.error('❌ completePickup error:', error);
      res.status(500).json({ message: 'ไม่สามารถอัปเดตสถานะได้' });
    } finally {
      if (conn) conn.release();
    }
  },

  async rejectPickup(req, res) {
    let conn;
    try {
      const requestId = Number(req.params.id);
      if (!requestId) return res.status(400).json({ message: 'Invalid request id' });

      conn = await DB.getConnection();
      await conn.beginTransaction();

      // 1) เปลี่ยนสถานะคำขอเป็น Rejected
      const [prRes] = await conn.query(
        `UPDATE PickupRequest
            SET RequestStatus = 'Rejected'
          WHERE RequestID = ?`,
        [requestId]
      );

      // 2) ย้อนสถานะ Order ทั้งหมดในคำขอนี้กลับเป็น Paid
      const [ordRes] = await conn.query(
        `UPDATE \`Order\`
            SET OrderStatus = 'Paid'
          WHERE RequestID = ?`,
        [requestId]
      );

      await conn.commit();
      res.json({ message: 'อัปเดตสถานะเป็น ปฏิเสธคำเรียก' });
    } catch (error) {
      if (conn) await conn.rollback();
      console.error('❌ rejectPickup error:', error);
      res.status(500).json({ message: 'ไม่สามารถปฏิเสธคำเรียกได้' });
    } finally {
      if (conn) conn.release();
    }
  },

};

module.exports = PickupController;
