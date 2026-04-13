const SettingsModel = require('../models/settingsModel');
const path = require('path');
const fs = require('fs');

class SettingsController {
    static getIndex(req, res) {
        const settings = SettingsModel.getAll();
        res.render('settings/index', { title: 'System Settings', settings });
    }

    static postUpdate(req, res) {
        try {
            const fields = ['shop_name', 'shop_address', 'shop_phone', 'invoice_header', 'invoice_footer', 'currency_symbol'];
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

            res.redirect('/settings?success=Settings updated successfully');
        } catch (error) {
            console.error('Settings update error:', error);
            const settings = SettingsModel.getAll();
            res.render('settings/index', { title: 'System Settings', settings, error: error.message });
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
}

module.exports = SettingsController;
