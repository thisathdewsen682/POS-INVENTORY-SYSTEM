const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');

router.get('/', AuthController.getLogin);
router.post('/login', AuthController.postLogin);
router.get('/logout', AuthController.logout);

module.exports = router;
