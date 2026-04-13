const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const fs = require('fs');
const db = require('./config/database');
const SettingsModel = require('./models/settingsModel');

const app = express();

// Set View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session setup
app.use(session({
    store: new SQLiteStore({ dir: './', db: 'sessions.sqlite' }),
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Setup local variables for views (read from DB settings)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    
    // Load settings from DB
    const settings = SettingsModel.getAll();
    res.locals.shopName = settings.shop_name || process.env.SHOP_NAME || 'POS System';
    res.locals.shopAddress = settings.shop_address || '';
    res.locals.shopPhone = settings.shop_phone || '';
    res.locals.invoiceHeader = settings.invoice_header || '';
    res.locals.invoiceFooter = settings.invoice_footer || '';
    res.locals.logoPath = settings.logo_path || '';
    res.locals.currencySymbol = settings.currency_symbol || '$';
    
    // flash messages placeholder
    res.locals.error = req.query.error || null;
    res.locals.success = req.query.success || null;
    next();
});

// Import Routes
app.use('/', require('./routes/authRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/categories', require('./routes/categoryRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/billing', require('./routes/billingRoutes'));
app.use('/stock', require('./routes/stockRoutes'));
app.use('/invoices', require('./routes/invoiceRoutes'));
app.use('/sales', require('./routes/salesHistoryRoutes'));
app.use('/backup', require('./routes/backupRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));
app.use('/reports', require('./routes/reportRoutes'));

// 404 Handler
app.use((req, res) => {
    res.status(404).send('<h1>404 - Page Not Found</h1><a href="/dashboard">Go to Dashboard</a>');
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

module.exports = app;
