const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.use(isAuthenticated);
router.get('/', DashboardController.getIndex);

module.exports = router;
