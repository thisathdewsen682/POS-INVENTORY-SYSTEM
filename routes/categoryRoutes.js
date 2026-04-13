const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(isAuthenticated);
router.use(requireRole('admin'));

router.get('/', CategoryController.getIndex);
router.get('/create', CategoryController.getCreate);
router.post('/create', CategoryController.postCreate);
router.get('/edit/:id', CategoryController.getEdit);
router.post('/edit/:id', CategoryController.postEdit);
router.post('/delete/:id', CategoryController.postDelete);

module.exports = router;
