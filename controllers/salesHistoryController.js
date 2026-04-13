const SaleModel = require('../models/saleModel');

class SalesHistoryController {
    static getIndex(req, res) {
        const sales = SaleModel.getAll();
        res.render('sales/index', { title: 'Sales History', sales });
    }

    static getDetail(req, res) {
        const sale = SaleModel.getWithItems(req.params.id);
        if (!sale) return res.redirect('/sales');
        
        res.render('sales/detail', { title: 'Sale Detail', sale });
    }
}

module.exports = SalesHistoryController;
