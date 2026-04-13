const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = process.env.BACKUPS_DIR || path.resolve('./backups');
const BACKUP_MAX = parseInt(process.env.BACKUP_MAX_COUNT) || 20;

if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

class BackupService {
    static async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.sqlite`;
        const destPath = path.join(BACKUP_DIR, filename);

        // better-sqlite3 db.backup() returns a Promise
        await db.backup(destPath);
        this.autoCleanup();
        
        return filename;
    }

    static listBackups() {
        if (!fs.existsSync(BACKUP_DIR)) return [];
        const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.sqlite'));
        
        return files.map(file => {
            const stats = fs.statSync(path.join(BACKUP_DIR, file));
            return {
                filename: file,
                size: (stats.size / 1024).toFixed(2) + ' KB',
                date: stats.mtime
            };
        }).sort((a, b) => b.date - a.date);
    }

    static deleteBackup(filename) {
        const filePath = path.join(BACKUP_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    static getBackupPath(filename) {
        return path.join(BACKUP_DIR, filename);
    }

    static restoreBackup(filename) {
        const filePath = path.join(BACKUP_DIR, filename);
        if (!fs.existsSync(filePath)) throw new Error('Backup file not found');
        
        const dbPath = process.env.DB_PATH || path.join(__dirname, '..', '..', 'pos_database.sqlite');
        
        // Very simplistic approach: wait for db close, copy file, wait for server restart or re-init
        // A robust restore in same process might be tricky. The safest is to stop db, replace file, and require manual app restart.
        // We'll replace it and hope the OS permits it. If WAL mode is on, it might be tricky.
        db.close();
        
        // Wait briefly just to ensure WAL unlocks
        try {
            // Delete WAL and SHM files to avoid corruption
            if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
            if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
            
            fs.copyFileSync(filePath, dbPath);
            
            // Note: After restore, the server must be restarted since we closed the DB connection.
            // We can gracefully exit the process with code 0 and let nodemon or PM2 restart it.
            setTimeout(() => {
                process.exit(0);
            }, 500);
            
            return true;
        } catch (err) {
            console.error(err);
            throw new Error('Failed to restore. Check server logs.');
        }
    }

    static autoCleanup() {
        const backups = this.listBackups();
        if (backups.length > BACKUP_MAX) {
            const toDelete = backups.slice(BACKUP_MAX);
            for (const backup of toDelete) {
                this.deleteBackup(backup.filename);
            }
        }
    }
}

module.exports = BackupService;
