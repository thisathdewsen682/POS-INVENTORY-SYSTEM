const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const SettingsController = require('../controllers/settingsController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Multer setup for logo upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const dest = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'public', 'uploads');
        cb(null, dest);
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'logo' + ext);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: function(req, file, cb) {
        const allowed = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error('Only image files allowed'));
    }
});

router.use(isAuthenticated);
router.use(requireRole('admin'));

router.get('/', SettingsController.getIndex);
router.post('/update', upload.single('logo'), SettingsController.postUpdate);
router.post('/remove-logo', SettingsController.postRemoveLogo);

module.exports = router;
