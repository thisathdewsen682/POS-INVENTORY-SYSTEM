const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

router.use(isAuthenticated);

// View is open to all authenticated users (staff can search/view)
router.get('/', ProductController.getIndex);

// Create requires admin OR staff with 'add_product' permission
router.get('/create', requirePermission('add_product'), ProductController.getCreate);
router.post('/create', requirePermission('add_product'), ProductController.postCreate);

// Edit requires admin OR staff with 'edit_product' permission
router.get('/edit/:id', requirePermission('edit_product'), ProductController.getEdit);
router.post('/edit/:id', requirePermission('edit_product'), ProductController.postEdit);

// Delete is admin only
router.post('/delete/:id', requirePermission('edit_product'), ProductController.postDelete);

module.exports = router;
