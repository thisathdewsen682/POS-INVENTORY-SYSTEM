const ProductModel = require('../models/productModel');
const SaleModel = require('../models/saleModel');
const StockService = require('../services/stockService');

class BillingController {
    static getIndex(req, res) {
        const products = ProductModel.getAll();
        res.render('billing/index', { title: 'Billing', products });
    }

    static postCheckout(req, res) {
        try {
            const { items, subtotal, discount, discount_type, total } = req.body;
            
            if (!items || items.length === 0) {
                return res.status(400).json({ success: false, message: 'Cart is empty' });
            }

            const invoiceNumber = SaleModel.getNextInvoiceNumber();
            
            const saleData = {
                invoice_number: invoiceNumber,
                user_id: req.session.user.id,
                date: new Date().toISOString(),
                subtotal: parseFloat(subtotal),
                discount: parseFloat(discount) || 0,
                discount_type: discount_type || 'flat',
                total: parseFloat(total)
            };

            // Format items with proper numbers
            const formattedItems = items.map(item => ({
                product_id: parseInt(item.product_id),
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price),
                discount: parseFloat(item.discount) || 0,
                total: parseFloat(item.total)
            }));

            // 1. Process Stock
            StockService.processSale(formattedItems, invoiceNumber);

            // 2. Save Sale
            const saleId = SaleModel.createWithItems(saleData, formattedItems);

            res.json({ success: true, saleId });
        } catch (error) {
            console.error('Checkout Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = BillingController;
