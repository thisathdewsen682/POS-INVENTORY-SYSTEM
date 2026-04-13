const db = require('../config/database');

class ProductModel {
    static getAll() {
        return db.prepare(`
            SELECT p.*, c.name as category_name 
            FROM products p 
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.name ASC
        `).all();
    }

    static findById(id) {
        return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    }

    static create({ name, category_id, cost_price, price, stock_quantity, warranty_months, remarks }) {
        const info = db.prepare(`
            INSERT INTO products (name, category_id, cost_price, price, stock_quantity, warranty_months, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(name, category_id, cost_price || 0, price, stock_quantity, warranty_months || 0, remarks);
        return info.lastInsertRowid;
    }

    static update(id, { name, category_id, cost_price, price, warranty_months, remarks }) {
        db.prepare(`
            UPDATE products 
            SET name = ?, category_id = ?, cost_price = ?, price = ?, warranty_months = ?, remarks = ?
            WHERE id = ?
        `).run(name, category_id, cost_price || 0, price, warranty_months || 0, remarks, id);
    }

    static delete(id) {
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
    }

    static getLowStock(threshold) {
        return db.prepare(`
            SELECT p.*, c.name as category_name 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.stock_quantity <= ?
            ORDER BY p.stock_quantity ASC
        `).all(threshold);
    }

    static updateStock(id, newQuantity) {
        db.prepare('UPDATE products SET stock_quantity = ? WHERE id = ?').run(newQuantity, id);
    }

    static search(query) {
        return db.prepare(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.name LIKE ? OR c.name LIKE ?
            ORDER BY p.name ASC
        `).all(`%${query}%`, `%${query}%`);
    }
}

module.exports = ProductModel;
