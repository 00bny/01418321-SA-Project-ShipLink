const DB = require("../config/DBConnector");

class CompanyDashboardController {

  static async getSummary(req, res) {
    try {
      const companyId = req.params.companyId;

      // ✅ พัสดุวันนี้
      const [todayRows] = await DB.query(`
        SELECT COUNT(*) AS cnt
        FROM \`Order\` O
        JOIN PickupRequest PR ON O.RequestID = PR.RequestID
        WHERE PR.CompanyID=?
        AND DATE(PR.CreatedDate)=DATE(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
      `, [companyId]);

      // ✅ พัสดุเดือนนี้
      const [monthRows] = await DB.query(`
        SELECT COUNT(*) AS cnt
        FROM \`Order\` O
        JOIN PickupRequest PR ON O.RequestID = PR.RequestID
        WHERE PR.CompanyID=?
        AND MONTH(PR.CreatedDate)=MONTH(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
        AND YEAR(PR.CreatedDate)=YEAR(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
      `, [companyId]);

      // ✅ พัสดุทั้งหมด
      const [totalRows] = await DB.query(`
        SELECT COUNT(*) AS cnt
        FROM \`Order\` O
        JOIN PickupRequest PR ON O.RequestID = PR.RequestID
        WHERE PR.CompanyID=?
      `, [companyId]);

      return res.json({
        today: todayRows.cnt,
        month: monthRows.cnt,
        total: totalRows.cnt
      });

    } catch (err) {
      console.error("getSummary ERROR:", err);
      res.status(500).json({ message: "Error loading summary" });
    }
  }

  static async getPickupStats(req, res) {
    try {
      const companyId = req.params.companyId;
      const wrap = {};

      const rows = await DB.query(`
        SELECT RequestStatus, COUNT(*) AS cnt
        FROM PickupRequest
        WHERE CompanyID = ?
        GROUP BY RequestStatus
      `, [companyId]);

      rows.forEach(r => wrap[r.RequestStatus] = r.cnt);

      res.json({
        RequestedPickup: wrap["RequestedPickup"] || 0,
        PickingUp: wrap["PickingUp"] || 0,
        PickedUp: wrap["PickedUp"] || 0
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error loading pickup stats" });
    }
  }

  static async getParcelStats(req, res) {
    try {
      const companyId = req.params.companyId;
      const wrap = {};

      const rows = await DB.query(`
        SELECT OrderStatus, COUNT(*) AS cnt
        FROM \`Order\`
        WHERE CompanyID = ?
        GROUP BY OrderStatus
      `, [companyId]);

      rows.forEach(r => wrap[r.OrderStatus] = r.cnt);

      res.json({
        RequestedPickup: wrap["RequestedPickup"] || 0,
        Pickup:          wrap["Pickup"] || 0,
        InTransit:       wrap["In Transit"] || 0,  
        Success:         wrap["Success"] || 0,
        Fail:            wrap["Fail"] || 0,
        Return:          wrap["Return"] || 0
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error loading parcel stats" });
    }
  }

  static async getBranchBreakdown(req, res) {
    try {
        const companyId = req.params.companyId;

        const rows = await DB.query(`
        SELECT
            B.BranchID,
            B.BranchName,
            B.BranchAddress,
            IFNULL(p.PickupCount, 0) AS PickupCount,
            IFNULL(o.ParcelCount, 0) AS ParcelCount
        FROM Branch B
        LEFT JOIN (
            SELECT BranchID, COUNT(*) AS PickupCount
            FROM PickupRequest
            WHERE CompanyID = ?
            GROUP BY BranchID
        ) p ON p.BranchID = B.BranchID
        LEFT JOIN (
            SELECT BranchID, COUNT(*) AS ParcelCount
            FROM \`Order\`
            WHERE CompanyID = ?
            GROUP BY BranchID
        ) o ON o.BranchID = B.BranchID
        WHERE IFNULL(p.PickupCount,0) > 0 AND IFNULL(o.ParcelCount,0) > 0
        `, [companyId, companyId]);

        res.json(rows);
    } catch (err) {
        console.error("🔥 getBranchBreakdown ERROR:", err);
        res.status(500).json({ message: "Error loading branch breakdown" });
    }
  }

}

module.exports = CompanyDashboardController;
