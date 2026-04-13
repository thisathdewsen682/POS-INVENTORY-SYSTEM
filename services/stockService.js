const db = require('../config/database');
const ProductModel = require('../models/productModel');
const StockLogModel = require('../models/stockLogModel');

class StockService {
    static processSale(items, invoiceNumber) {
        const date = new Date().toISOString();
        const transaction = db.transaction(() => {
            for (const item of items) {
                const product = ProductModel.findById(item.product_id);
                if (!product) throw new Error(`Product ID ${item.product_id} not found.`);
                if (product.stock_quantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
                }

                const newQuantity = product.stock_quantity - item.quantity;
                ProductModel.updateStock(item.product_id, newQuantity);

                StockLogModel.create({
                    product_id: item.product_id,
                    change_type: 'SALE',
                    quantity: -item.quantity,
                    date: date,
                    reference_id: invoiceNumber
                });
            }
        });

        transaction();
    }

    static processRestock(productId, addedQuantity, referenceText = '') {
        const product = ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');

        const newQuantity = product.stock_quantity + parseInt(addedQuantity, 10);
        
        db.transaction(() => {
            ProductModel.updateStock(productId, newQuantity);
            StockLogModel.create({
                product_id: productId,
                change_type: 'RESTOCK',
                quantity: addedQuantity,
                date: new Date().toISOString(),
                reference_id: referenceText
            });
        })();
    }

    static processAdjustment(productId, newQuantity, reason = '') {
        const product = ProductModel.findById(productId);
        if (!product) throw new Error('Product not found');

        const diff = newQuantity - product.stock_quantity;
        
        db.transaction(() => {
            ProductModel.updateStock(productId, newQuantity);
            StockLogModel.create({
                product_id: productId,
                change_type: 'ADJUSTMENT',
                quantity: diff,
                date: new Date().toISOString(),
                reference_id: reason
            });
        })();
    }
}

module.exports = StockService;
