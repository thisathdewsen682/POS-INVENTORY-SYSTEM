const ProductModel = require('../models/productModel');
const StockLogModel = require('../models/stockLogModel');
const StockService = require('../services/stockService');

class StockController {
    static getOverview(req, res) {
        const products = ProductModel.getAll();
        res.render('stock/overview', { title: 'Current Stock Overview', products });
    }

    static getIndex(req, res) {
        const products = ProductModel.getAll();
        const logs = StockLogModel.getAll();
        res.render('stock/index', { title: 'Stock Management', products, logs });
    }

    static postUpdate(req, res) {
        try {
            const { product_id, action_type, quantity, reason } = req.body;
            
            if (action_type === 'restock') {
                StockService.processRestock(product_id, quantity, reason);
            } else if (action_type === 'set') {
                StockService.processAdjustment(product_id, quantity, reason);
            }

            res.redirect('/stock');
        } catch (error) {
            console.error('Stock Update Error:', error);
            // Quick workaround: re-render index with error
            const products = ProductModel.getAll();
            const logs = StockLogModel.getAll();
            res.render('stock/index', { title: 'Stock Management', products, logs, error: error.message });
        }
    }
}

module.exports = StockController;
