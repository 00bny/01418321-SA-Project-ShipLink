const DB = require("../config/DBConnector");

class CompanyDashboardController {

  static async getSummary(req, res) {
    try {
      const companyId = req.params.companyId;

      const [todayRows] = await DB.query(`
        SELECT COUNT(*) AS cnt
        FROM \`Order\`
        WHERE CompanyID=? AND DATE(UpdatedAt)=CURDATE()
        `, [companyId]);

      const [monthRows] = await DB.query(`
        SELECT COUNT(*) AS cnt
        FROM \`Order\`
        WHERE CompanyID=?
            AND MONTH(UpdatedAt)=MONTH(CURDATE())
            AND YEAR(UpdatedAt)=YEAR(CURDATE())
        `, [companyId]);

      const [totalRows] = await DB.query(`
        SELECT COUNT(*) AS cnt
        FROM \`Order\`
        WHERE CompanyID=?
        `, [companyId]);

      res.json({
        today: todayRows.cnt,
        month: monthRows.cnt,
        total: totalRows.cnt
     });

    } catch (err) {
      console.error(err);
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
            SUM(CASE WHEN O.OrderID IS NOT NULL THEN 1 ELSE 0 END) AS ParcelCount,
            SUM(CASE WHEN PR.RequestID IS NOT NULL THEN 1 ELSE 0 END) AS PickupCount
        FROM Branch B
        LEFT JOIN \`Order\` O 
            ON O.BranchID = B.BranchID AND O.CompanyID = ?
        LEFT JOIN PickupRequest PR 
            ON PR.BranchID = B.BranchID AND PR.CompanyID = ?
        GROUP BY B.BranchID
        HAVING ParcelCount > 0 AND PickupCount > 0
    `, [companyId, companyId]);

        return res.json(rows);

    } catch (err) {
        console.error("🔥 getBranchBreakdown ERROR:", err);
        return res.status(500).json({ message: "Error loading branch breakdown" });
    }
  }

}

module.exports = CompanyDashboardController;
