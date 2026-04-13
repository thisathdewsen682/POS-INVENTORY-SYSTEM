const SaleModel = require('../models/saleModel');

class InvoiceController {
    static getPrint(req, res) {
        const saleId = req.params.id;
        const sale = SaleModel.getWithItems(saleId);
        
        if (!sale) return res.redirect('/sales');

        // Calculate warranty dates
        sale.items.forEach(item => {
            if (item.warranty_months > 0) {
                const startDate = new Date(sale.date);
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + item.warranty_months);
                item.warranty_end = endDate.toISOString().slice(0, 10);
            } else {
                item.warranty_end = 'N/A';
            }
        });

        res.render('invoices/print', { title: 'Invoice', sale });
    }
}

module.exports = InvoiceController;
