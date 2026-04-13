const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(isAuthenticated);
router.use(requireRole('admin'));

router.get('/', UserController.getIndex);
router.get('/create', UserController.getCreate);
router.post('/create', UserController.postCreate);
router.get('/edit/:id', UserController.getEdit);
router.post('/edit/:id', UserController.postEdit);
router.post('/delete/:id', UserController.postDelete);

module.exports = router;
