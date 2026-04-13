const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.use(isAuthenticated);
router.get('/', BillingController.getIndex);
router.post('/checkout', BillingController.postCheckout);

module.exports = router;
