const express = require('express');
const router = express.Router();
const SalesHistoryController = require('../controllers/salesHistoryController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
// Assuming only admins can view sales history, if staff needed, remove requireRole
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(isAuthenticated);
router.use(requireRole('admin'));

router.get('/', SalesHistoryController.getIndex);
router.get('/detail/:id', SalesHistoryController.getDetail);

module.exports = router;
