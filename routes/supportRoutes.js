const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.use(isAuthenticated);

router.get('/', (req, res) => {
    res.render('support/index', { title: 'Help & Support' });
});

module.exports = router;
