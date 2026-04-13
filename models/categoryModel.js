const db = require('../config/database');

class CategoryModel {
    static getAll() {
        return db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    }

    static findById(id) {
        return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    }

    static create(name) {
        const info = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
        return info.lastInsertRowid;
    }

    static update(id, name) {
        db.prepare('UPDATE categories SET name = ? WHERE id = ?').run(name, id);
    }

    static delete(id) {
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    }
}

module.exports = CategoryModel;
