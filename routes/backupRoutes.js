const express = require('express');
const router = express.Router();
const BackupController = require('../controllers/backupController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(isAuthenticated);
router.use(requireRole('admin'));

router.get('/', BackupController.getIndex);
router.post('/create', BackupController.postCreate);
router.post('/restore', BackupController.postRestore);
router.post('/delete', BackupController.postDelete);
router.get('/download/:filename', BackupController.getDownload);

module.exports = router;
