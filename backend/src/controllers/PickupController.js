// backend/src/controllers/PickupController.js
const db = require('../config/db');

exports.getPickupHistory = async (req, res) => {
  try {
    const branchId = req.query.branchId;
    if (!branchId) {
      return res.status(400).json({ message: 'branchId is required' });
    }

    // 🔹 อย่ามี indent หน้าบรรทัดใน template string
    const sql = `
SELECT 
  pr.RequestID AS RequestNo,
  sc.CompanyName AS ShippingCompany,
  pr.ActualPickupTime AS DateTime,
  pr.RequestStatus AS Status,
  pr.PickupStaffName AS Staff
FROM PickupRequest pr
JOIN ShippingCompany sc ON pr.CompanyID = sc.CompanyID
JOIN Employee e ON pr.EmployeeID = e.EmployeeID
WHERE e.BranchID = ?
ORDER BY pr.RequestID;
`;

    const [rows] = await db.query(sql, [branchId]);

    res.json(rows);
  } catch (err) {
    console.error('❌ getPickupHistory error:', err);
    res.status(500).json({ message: 'Error fetching pickup history', error: err.message });
  }
};


exports.createPickupRequest = async (req, res) => {
  try {
    const { companyId, employeeId } = req.body;
    if (!companyId || !employeeId) {
      return res.status(400).json({ message: 'companyId and employeeId are required' });
    }

    const [insert] = await db.query(
      `INSERT INTO PickupRequest (RequestStatus, EmployeeID, CompanyID)
       VALUES ('รอดำเนินการ', ?, ?)`,
      [employeeId, companyId]
    );

    res.json({
      success: true,
      message: 'สร้างคำร้องขอเข้ารับพัสดุสำเร็จ',
      requestId: insert.insertId
    });
  } catch (err) {
    console.error('❌ createPickupRequest error:', err);
    res.status(500).json({ message: 'Error creating pickup request' });
  }
};
