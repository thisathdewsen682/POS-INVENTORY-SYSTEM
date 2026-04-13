const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(isAuthenticated);
router.use(requireRole('admin'));

router.get('/', ReportController.getIndex);

module.exports = router;
