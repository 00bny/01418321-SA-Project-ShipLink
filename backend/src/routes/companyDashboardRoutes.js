// backend/src/routes/companyDashboardRoutes.js
const router = require("express").Router();
const CompanyDashboardController = require("../controllers/CompanyDashboardController");

router.get("/company/summary/:companyId", CompanyDashboardController.getSummary);
router.get("/company/pickups/:companyId", CompanyDashboardController.getPickupStats);
router.get("/company/parcels/:companyId", CompanyDashboardController.getParcelStats);
router.get("/company/branch/:companyId", CompanyDashboardController.getBranchBreakdown);

module.exports = router;
