const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/invoiceController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.use(isAuthenticated);
router.get('/print/:id', InvoiceController.getPrint);

module.exports = router;
