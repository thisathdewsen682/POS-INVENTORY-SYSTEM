const ProductModel = require('../models/productModel');
const SaleModel = require('../models/saleModel');

class DashboardController {
    static getIndex(req, res) {
        const threshold = parseInt(process.env.LOW_STOCK_THRESHOLD) || 5;
        const lowStockProducts = ProductModel.getLowStock(threshold);
        const allProducts = ProductModel.getAll();
        
        // Calculate today's sales
        const todayStr = new Date().toISOString().slice(0, 10);
        const allSales = SaleModel.getAll();
        const todaysSales = allSales.filter(s => s.date.startsWith(todayStr));
        const todaysRevenue = todaysSales.reduce((sum, s) => sum + s.total, 0);

        res.render('dashboard/index', {
            title: 'Dashboard',
            totalProducts: allProducts.length,
            lowStockCount: lowStockProducts.length,
            lowStockProducts,
            todaysSalesCount: todaysSales.length,
            todaysRevenue
        });
    }
}

module.exports = DashboardController;
