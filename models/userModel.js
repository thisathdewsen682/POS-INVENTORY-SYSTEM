const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
    static findByUsername(username) {
        return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    }

    static findById(id) {
        return db.prepare('SELECT id, username, role, permissions FROM users WHERE id = ?').get(id);
    }

    static create({ username, password, role, permissions }) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const perms = permissions ? JSON.stringify(permissions) : '[]';
        const info = db.prepare('INSERT INTO users (username, password, role, permissions) VALUES (?, ?, ?, ?)').run(username, hashedPassword, role, perms);
        return info.lastInsertRowid;
    }

    static getAll() {
        return db.prepare('SELECT id, username, role, permissions FROM users').all();
    }

    static update(id, { role, permissions }) {
        const perms = permissions ? JSON.stringify(permissions) : '[]';
        db.prepare('UPDATE users SET role = ?, permissions = ? WHERE id = ?').run(role, perms, id);
    }

    static updatePassword(id, password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, id);
    }

    static delete(id) {
        // Don't allow deleting if user has sales
        const hasSales = db.prepare('SELECT COUNT(id) as cnt FROM sales WHERE user_id = ?').get(id);
        if (hasSales && hasSales.cnt > 0) {
            throw new Error('Cannot delete user with existing sales records. Deactivate instead.');
        }
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
    }
}

module.exports = UserModel;
