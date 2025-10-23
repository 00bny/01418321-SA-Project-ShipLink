const router = require('express').Router();
const AuthController = require('../controllers/AuthController');

// Register
router.post('/register/employee', AuthController.registerEmployee);
router.post('/register/company',  AuthController.registerCompany);

// Login
router.post('/login', AuthController.login);

module.exports = router;
