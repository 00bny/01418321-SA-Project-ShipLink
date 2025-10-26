const express = require('express');
const router = express.Router();
const CompanyReturnController = require('../controllers/CompanyReturnController');

// GET /api/company/returns/:companyId
router.get('/returns/:companyId', CompanyReturnController.getReturnOrders);

module.exports = router;
