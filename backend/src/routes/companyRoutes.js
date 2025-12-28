const router = require('express').Router();
const CompanyController = require('../controllers/CompanyController');
router.get('/', CompanyController.list);   // /api/companies
module.exports = router;
