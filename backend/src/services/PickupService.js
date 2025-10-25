const DB = require('../config/DBConnector');

class PickupService {
  static async createRequest({ companyId, employeeId }) {
    const conn = await DB.getConnection();
    try {
      await conn.beginTransaction();

      // Step 2: Query branch info (query 10.1)
      const [[branch]] = await conn.execute(`
        SELECT B.BranchID, B.BranchName, B.BranchAddress 
        FROM Branch B
        JOIN Employee E ON E.BranchID = B.BranchID
        WHERE E.EmployeeID = ?
      `, [employeeId]);
      if (!branch) throw new Error('Branch not found');

      // Step 3: Count orders ready for pickup (query 10.2)
      const [[{ count }]] = await conn.execute(`
        SELECT COUNT(*) AS count
        FROM \`Order\`
        WHERE CompanyID = ? AND OrderStatus = 'Paid'
      `, [companyId]);

      if (count === 0) throw new Error('ไม่มีออเดอร์ที่รอเข้ารับ');

      // Step 6: Insert pickup request (query 10.3)
      const [result] = await conn.execute(`
        INSERT INTO PickupRequest (RequestStatus, CreatedDate, CompanyID, BranchID, EmployeeID)
        VALUES ('Pending', NOW(), ?, ?, ?)
      `, [companyId, branch.BranchID, employeeId]);

      await conn.commit();

      return {
        message: 'เรียกขนส่งสำเร็จ',
        requestId: result.insertId,
        branchName: branch.BranchName,
        branchAddress: branch.BranchAddress,
        totalOrders: count
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }

  static async listHistory(branchId) {
    const sql = `
      SELECT PR.RequestID, PR.CreatedDate, PR.RequestStatus, 
             SC.CompanyName, E.EmployeeName
      FROM PickupRequest PR
      LEFT JOIN ShippingCompany SC ON PR.CompanyID = SC.CompanyID
      LEFT JOIN Employee E ON PR.EmployeeID = E.EmployeeID
      WHERE PR.BranchID = ?
      ORDER BY PR.CreatedDate DESC
    `;
    return DB.query(sql, [branchId]);
  }


  static async getRequestsByCompany(companyId) {
    const reqs = await DB.query(
      `SELECT RequestID, CreatedDate, RequestStatus
       FROM PickupRequest WHERE CompanyID = ? ORDER BY CreatedDate DESC`,
      [companyId]
    );

    for (const r of reqs) {
      const [countRow] = await DB.query(
        `SELECT COUNT(*) AS cnt FROM \`Order\` WHERE CompanyID=? AND RequestID=?`,
        [companyId, r.RequestID]
      );
      r.ParcelCount = countRow.cnt;
    }
    return reqs;
  }

  static async confirmPickup({ requestId, time, name, phone }) {
    await DB.query(
      `UPDATE PickupRequest
       SET ScheduledPickupTime=?, PickupStaffName=?, PickupStaffPhone=?, RequestStatus='กำลังเข้ารับ'
       WHERE RequestID=?`,
      [time, name, phone, requestId]
    );
  }  

  static async completePickup(requestId) {
    await DB.query(`
        UPDATE PickupRequest
        SET RequestStatus = 'เข้ารับสำเร็จ',
            ActualPickupTime = NOW()
        WHERE RequestID = ?
    `, [requestId]);
  }

}

module.exports = PickupService;
