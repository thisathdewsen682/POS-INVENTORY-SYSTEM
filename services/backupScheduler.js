const cron = require('node-cron');
const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const SettingsModel = require('../models/settingsModel');
const EmailService = require('./emailService');

class BackupScheduler {
    static jobs = [];

    static init() {
        this.reload();
    }

    static reload() {
        // Clear existing jobs
        this.jobs.forEach(job => job.stop());
        this.jobs = [];

        const time1 = SettingsModel.get('auto_backup_time_1') || '12:00';
        const time2 = SettingsModel.get('auto_backup_time_2') || '18:00';

        this.scheduleJob(time1);
        this.scheduleJob(time2);
        console.log(`[BACKUP] Scheduled auto-backups for ${time1} and ${time2}`);
    }

    static scheduleJob(timeStr) {
        if (!timeStr) return; // Empty means disabled
        
        const [hour, minute] = timeStr.split(':');
        if (hour === undefined || minute === undefined) return;

        const cronPattern = `${minute} ${hour} * * *`;
        
        const job = cron.schedule(cronPattern, () => {
            console.log(`[BACKUP] Running scheduled backup for ${timeStr}...`);
            const backupsDir = process.env.BACKUPS_DIR || path.join(__dirname, '..', 'backups');
            if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
            
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const timeStrSafe = timeStr.replace(':', '');
            const backupFile = path.join(backupsDir, `backup_${dateStr}_${timeStrSafe}.sqlite`);
            
            db.backup(backupFile)
                .then(() => {
                    console.log(`[BACKUP] Successfully created ${backupFile}`);
                    // Trigger cloud mirroring
                    EmailService.sendBackup(backupFile);
                })
                .catch(err => console.error('[BACKUP] Scheduled backup failed!', err));
        });

        this.jobs.push(job);
    }
}

module.exports = BackupScheduler;
