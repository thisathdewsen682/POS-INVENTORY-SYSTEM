const db = require('../config/database');

class SaleModel {
    static getNextInvoiceNumber() {
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `INV-${todayStr}-`;
        const lastSale = db.prepare(`SELECT invoice_number FROM sales WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`).get(`${prefix}%`);
        
        let seq = 1;
        if (lastSale) {
            const parts = lastSale.invoice_number.split('-');
            const lastSeq = parseInt(parts[2], 10);
            if (!isNaN(lastSeq)) seq = lastSeq + 1;
        }
        return `${prefix}${seq.toString().padStart(4, '0')}`;
    }

    static createWithItems(saleData, items) {
        let saleId;
        const transaction = db.transaction(() => {
            const saleQuery = db.prepare(`
                INSERT INTO sales (invoice_number, user_id, date, subtotal, discount, discount_type, total)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            const saleInfo = saleQuery.run(
                saleData.invoice_number,
                saleData.user_id,
                saleData.date,
                saleData.subtotal,
                saleData.discount,
                saleData.discount_type || 'flat',
                saleData.total
            );
            saleId = saleInfo.lastInsertRowid;

            const itemQuery = db.prepare(`
                INSERT INTO sale_items (sale_id, product_id, quantity, price, discount, total)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            for (const item of items) {
                itemQuery.run(saleId, item.product_id, item.quantity, item.price, item.discount || 0, item.total);
            }
        });

        transaction();
        return saleId;
    }

    static getAll() {
        return db.prepare(`
            SELECT s.*, u.username as staff_name, 
                   (SELECT COUNT(id) FROM sale_items WHERE sale_id = s.id) as item_count
            FROM sales s
            JOIN users u ON s.user_id = u.id
            ORDER BY s.id DESC
        `).all();
    }

    static getWithItems(id) {
        const sale = db.prepare(`
            SELECT s.*, u.username as staff_name 
            FROM sales s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `).get(id);

        if (!sale) return null;

        sale.items = db.prepare(`
            SELECT si.*, p.name as product_name, c.name as category_name, p.warranty_months, p.cost_price
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE si.sale_id = ?
        `).all(id);

        return sale;
    }

    static getByDateRange(startDate, endDate) {
        return db.prepare(`
            SELECT s.*, u.username as staff_name,
                   (SELECT COUNT(id) FROM sale_items WHERE sale_id = s.id) as item_count
            FROM sales s
            JOIN users u ON s.user_id = u.id
            WHERE s.date >= ? AND s.date <= ?
            ORDER BY s.date DESC
        `).all(startDate, endDate + 'T23:59:59');
    }

    static getReportData(startDate, endDate) {
        return db.prepare(`
            SELECT 
                p.id as product_id,
                p.name as product_name,
                c.name as category_name,
                p.cost_price,
                p.price as selling_price,
                SUM(si.quantity) as total_qty_sold,
                SUM(si.total) as total_revenue,
                SUM(si.quantity * p.cost_price) as total_cost,
                SUM(si.total) - SUM(si.quantity * p.cost_price) as total_profit
            FROM sale_items si
            JOIN sales s ON si.sale_id = s.id
            JOIN products p ON si.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE s.date >= ? AND s.date <= ?
            GROUP BY p.id
            ORDER BY total_revenue DESC
        `).all(startDate, endDate + 'T23:59:59');
    }
}

module.exports = SaleModel;
