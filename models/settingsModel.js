const db = require('../config/database');

class SettingsModel {
    static get(key) {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
        return row ? row.value : '';
    }

    static set(key, value) {
        db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
    }

    static getAll() {
        const rows = db.prepare('SELECT key, value FROM settings').all();
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        return settings;
    }

    static getMultiple(keys) {
        const placeholders = keys.map(() => '?').join(',');
        const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`).all(...keys);
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        return settings;
    }
}

module.exports = SettingsModel;
