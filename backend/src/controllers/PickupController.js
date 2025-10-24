const DB = require('../config/db');

const PickupController = {

  // ✅ POST /api/pickup/request
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
        WHERE CompanyID = ? AND OrderStatus = 'ชำระเงินแล้ว'
      `, [companyId]);

      if (countRow.totalPaid === 0) {
        return res.status(400).json({ message: 'ไม่มีออร์เดอร์ที่ชำระเงินแล้วสำหรับบริษัทนี้' });
      }

      // 2️⃣ สร้างคำร้อง PickupRequest
      const [result] = await DB.query(`
        INSERT INTO PickupRequest (RequestStatus, CreatedDate, CompanyID, EmployeeID)
        VALUES ('รอเข้ารับ', NOW(), ?, ?)
      `, [companyId, employeeId]);

      if (!result.insertId) throw new Error('Insert failed');

      // 4️⃣ อัปเดตสถานะออร์เดอร์ทั้งหมดที่ชำระเงินแล้วของบริษัทนี้ให้เป็น "รอเข้ารับ"
      await DB.query(`
        UPDATE \`Order\`
        SET OrderStatus = 'รอเข้ารับ'
        WHERE CompanyID = ? AND OrderStatus = 'ชำระเงินแล้ว'
      `, [companyId]);

      // 3️⃣ ตอบกลับ
      res.json({
        message: 'เรียกขนส่งสำเร็จ',
        requestId: result.insertId
      });

    } catch (err) {
      console.error('❌ createPickupRequest error:', err);
      res.status(500).json({ message: 'Failed to create pickup request' });
    }
  },

  // ✅ GET /api/pickup/history
  async getPickupHistory(_req, res) {
    try {
      const [rows] = await DB.query(`
        SELECT 
          pr.RequestID AS RequestNo,
          sc.CompanyName AS ShippingCompany,
          pr.CreatedDate AS DateTime,
          pr.RequestStatus AS Status,
          e.EmployeeName AS Staff
        FROM PickupRequest pr
        JOIN ShippingCompany sc ON pr.CompanyID = sc.CompanyID
        LEFT JOIN Employee e ON pr.EmployeeID = e.EmployeeID
        ORDER BY pr.CreatedDate DESC
      `);
      res.json(rows);
    } catch (err) {
      console.error('❌ getPickupHistory error:', err);
      res.status(500).json({ message: 'Failed to load pickup history' });
    }
  }
};

module.exports = PickupController;
