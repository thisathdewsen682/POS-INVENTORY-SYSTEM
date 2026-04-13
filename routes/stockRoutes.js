const express = require('express');
const router = express.Router();
const StockController = require('../controllers/stockController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireRole, requirePermission } = require('../middlewares/roleMiddleware');

router.use(isAuthenticated);

// All users or those with 'view_stock' permission can see the stock overview
router.get('/overview', requirePermission('view_stock'), StockController.getOverview);

// Only admins can see and update stock logs
router.get('/', requireRole('admin'), StockController.getIndex);
router.post('/update', requireRole('admin'), StockController.postUpdate);

module.exports = router;
