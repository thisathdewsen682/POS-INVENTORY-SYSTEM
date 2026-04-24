const nodemailer = require('nodemailer');
const SettingsModel = require('../models/settingsModel');

class EmailService {
    static async getTransporter() {
        const settings = SettingsModel.getAll();
        
        return nodemailer.createTransport({
            host: settings.smtp_host || 'smtp.gmail.com',
            port: parseInt(settings.smtp_port) || 465,
            secure: parseInt(settings.smtp_port) === 465, // true for 465, false for other ports
            auth: {
                user: settings.smtp_user,
                pass: settings.smtp_pass
            }
        });
    }

    static async sendBackup(filePath) {
        try {
            const settings = SettingsModel.getAll();
            if (settings.cloud_backup_enabled !== '1') return;

            const transporter = await this.getTransporter();
            const recipients = [];
            if (settings.backup_email_client) recipients.push(settings.backup_email_client);
            if (settings.backup_email_support) recipients.push(settings.backup_email_support);

            if (recipients.length === 0) return;

            const mailOptions = {
                from: `"POS System Sync" <${settings.smtp_user}>`,
                to: recipients.join(','),
                subject: `Daily Backup: ${settings.shop_name} - ${new Date().toLocaleDateString()}`,
                text: `Attached is the automated daily backup for ${settings.shop_name}.`,
                attachments: [
                    {
                        path: filePath
                    }
                ]
            };

            await transporter.sendMail(mailOptions);
            console.log(`[EMAIL] Backup successfully sent to ${recipients.join(', ')}`);
        } catch (error) {
            console.error('[EMAIL] Failed to send backup email:', error.message);
        }
    }

    static async testConnection(customSettings) {
        try {
            const transporter = nodemailer.createTransport({
                host: customSettings.smtp_host,
                port: parseInt(customSettings.smtp_port),
                secure: parseInt(customSettings.smtp_port) === 465,
                auth: {
                    user: customSettings.smtp_user,
                    pass: customSettings.smtp_pass
                }
            });

            await transporter.verify();
            
            // Send a test email
            await transporter.sendMail({
                from: `"POS System" <${customSettings.smtp_user}>`,
                to: customSettings.backup_email_support || customSettings.backup_email_client,
                subject: 'POS System: Email Test Connection Successful',
                text: 'This is a test email from your POS system. Your remote cloud backup configuration is working correctly!'
            });

            return { success: true };
        } catch (error) {
            console.error('[EMAIL TEST] Failed:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = EmailService;
