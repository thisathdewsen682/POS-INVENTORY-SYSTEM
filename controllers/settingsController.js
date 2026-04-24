const SettingsModel = require('../models/settingsModel');
const path = require('path');
const fs = require('fs');
const BackupScheduler = require('../services/backupScheduler');
const EmailService = require('../services/emailService');

class SettingsController {
    static getIndex(req, res) {
        const settings = SettingsModel.getAll();
        res.render('settings/index', { title: 'System Settings', settings });
    }

    static postUpdate(req, res) {
        try {
            const fields = [
                'shop_name', 'shop_address', 'shop_phone', 'invoice_header', 'invoice_footer', 'currency_symbol', 
                'auto_backup_time_1', 'auto_backup_time_2',
                'cloud_backup_enabled', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'backup_email_client', 'backup_email_support'
            ];
            for (const field of fields) {
                if (req.body[field] !== undefined) {
                    SettingsModel.set(field, req.body[field]);
                }
            }

            // Handle logo upload
            if (req.file) {
                const logoPath = '/uploads/' + req.file.filename;
                SettingsModel.set('logo_path', logoPath);
            }

            // Reload backup schedule immediately after saving new times
            BackupScheduler.reload();

            res.redirect('/settings?success=Settings updated successfully');
        } catch (error) {
            console.error('Settings update error:', error);
            const settings = SettingsModel.getAll();
            const errorMessage = error.message.includes('cron') ? 'Failed to update backup schedule: ' + error.message : error.message;
            res.render('settings/index', { title: 'System Settings', settings, error: errorMessage });
        }
    }

    static postRemoveLogo(req, res) {
        try {
            const currentLogo = SettingsModel.get('logo_path');
            if (currentLogo) {
                const fullPath = path.join(__dirname, '..', 'public', currentLogo);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
                SettingsModel.set('logo_path', '');
            }
            res.redirect('/settings');
        } catch (error) {
            console.error('Remove logo error:', error);
            res.redirect('/settings');
        }
    }

    static async postTestEmail(req, res) {
        try {
            const result = await EmailService.testConnection(req.body);
            if (result.success) {
                res.json({ success: true, message: 'Test email sent successfully! Check your inbox.' });
            } else {
                res.json({ success: false, error: result.error });
            }
        } catch (error) {
            res.json({ success: false, error: error.message });
        }
    }
}

module.exports = SettingsController;
