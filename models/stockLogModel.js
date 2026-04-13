const db = require('../config/database');

class StockLogModel {
    static create({ product_id, change_type, quantity, date, reference_id }) {
        const info = db.prepare(`
            INSERT INTO stock_logs (product_id, change_type, quantity, date, reference_id)
            VALUES (?, ?, ?, ?, ?)
        `).run(product_id, change_type, quantity, date, reference_id);
        return info.lastInsertRowid;
    }

    static getByProduct(productId) {
        return db.prepare('SELECT * FROM stock_logs WHERE product_id = ? ORDER BY date DESC').all(productId);
    }

    static getAll() {
        return db.prepare(`
            SELECT s.*, p.name as product_name
            FROM stock_logs s
            JOIN products p ON s.product_id = p.id
            ORDER BY s.date DESC
            LIMIT 100
        `).all();
    }
}

module.exports = StockLogModel;
